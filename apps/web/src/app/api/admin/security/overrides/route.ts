import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureAllFound,
  loadPermissions,
  loadVisibleUsers,
  parseOptionalDate,
  parseOptionalString,
  parseRequiredString,
  parseScopeValue,
} from "../_utils";

function canManageOverrides(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return (
    hasAdminPermission(currentUser, "users.edit") &&
    hasAdminPermission(currentUser, "permissions.manage")
  );
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageOverrides(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const userId = parseRequiredString(body.userId, "User");
    const permissionId = parseRequiredString(body.permissionId, "Permission");
    const effect = String(body.effect ?? "ALLOW").trim().toUpperCase();
    const reason = parseOptionalString(body.reason);
    const { scopeType, scopeId } = parseScopeValue(body.scopeType, body.scopeId);
    const expiresAt = parseOptionalDate(body.expiresAt);

    if (effect !== "ALLOW" && effect !== "DENY") {
      return NextResponse.json({ error: "Invalid override effect." }, { status: 400 });
    }

    const [users, permissions, existingOverride] = await Promise.all([
      loadVisibleUsers(currentUser, [userId]),
      loadPermissions([permissionId]),
      prisma.userPermissionOverride.findFirst({
        where: {
          userId,
          permissionId,
          scopeType: scopeType as never,
          scopeId,
        },
        select: { id: true },
      }),
    ]);

    ensureAllFound(users.length, 1, "users");
    ensureAllFound(permissions.length, 1, "permissions");

    if (existingOverride) {
      return NextResponse.json(
        { error: "That override already exists." },
        { status: 409 }
      );
    }

    const createdOverride = await prisma.userPermissionOverride.create({
      data: {
        userId,
        permissionId,
        effect: effect as never,
        reason,
        scopeType: scopeType as never,
        scopeId,
        expiresAt,
        grantedByUserId: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(createdOverride, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/security/overrides error:", error);

    return NextResponse.json(
      {
        error: "Failed to create override",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}