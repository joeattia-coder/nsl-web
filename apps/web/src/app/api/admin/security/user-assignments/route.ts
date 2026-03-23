import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureAllFound,
  ensureCanManageGlobalAdminGrant,
  loadRoles,
  loadVisibleUsers,
  parseOptionalDate,
  parseRequiredString,
  parseScopeValue,
} from "../_utils";

function canManageAssignments(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return (
    hasAdminPermission(currentUser, "users.edit") &&
    hasAdminPermission(currentUser, "roles.manage")
  );
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageAssignments(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const userId = parseRequiredString(body.userId, "User");
    const roleId = parseRequiredString(body.roleId, "Role");
    const { scopeType, scopeId } = parseScopeValue(body.scopeType, body.scopeId);
    const expiresAt = parseOptionalDate(body.expiresAt);

    const [users, roles, existingAssignment] = await Promise.all([
      loadVisibleUsers(currentUser, [userId]),
      loadRoles([roleId]),
      prisma.userRoleAssignment.findFirst({
        where: {
          userId,
          roleId,
          scopeType: scopeType as never,
          scopeId,
        },
        select: { id: true },
      }),
    ]);

    ensureAllFound(users.length, 1, "users");
    ensureAllFound(roles.length, 1, "roles");

    if (existingAssignment) {
      return NextResponse.json(
        { error: "That assignment already exists." },
        { status: 409 }
      );
    }

    ensureCanManageGlobalAdminGrant(currentUser, [
      {
        roleKey: roles[0].roleKey,
        scopeType,
        scopeId,
      },
    ]);

    const createdAssignment = await prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId,
        scopeType: scopeType as never,
        scopeId,
        expiresAt,
        grantedByUserId: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(createdAssignment, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/security/user-assignments error:", error);

    return NextResponse.json(
      {
        error: "Failed to create assignment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}