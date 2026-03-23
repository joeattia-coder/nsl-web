import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureAllFound,
  loadPermissions,
  parseOptionalString,
  parseRequiredString,
} from "../_utils";

function canManageRoles(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return hasAdminPermission(currentUser, "roles.manage");
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageRoles(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await request.json();
    const roleKey = parseRequiredString(body.roleKey, "Role key").toUpperCase();
    const roleName = parseRequiredString(body.roleName, "Role name");
    const description = parseOptionalString(body.description);
    const permissionIds: string[] = Array.isArray(body.permissionIds)
      ? Array.from(
          new Set(
            body.permissionIds
              .map((value: unknown) => String(value).trim())
              .filter((value: string): value is string => value.length > 0)
          )
        )
      : [];

    const [existingRole, permissions] = await Promise.all([
      prisma.role.findUnique({
        where: { roleKey },
        select: { id: true },
      }),
      loadPermissions(permissionIds),
    ]);

    if (existingRole) {
      return NextResponse.json(
        { error: "A role with that key already exists." },
        { status: 409 }
      );
    }

    ensureAllFound(permissions.length, permissionIds.length, "permissions");

    const createdRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          roleKey,
          roleName,
          description,
          isSystemRole: false,
        },
        select: { id: true },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({
        where: { id: role.id },
        select: {
          id: true,
          roleKey: true,
          roleName: true,
        },
      });
    });

    return NextResponse.json(createdRole, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/security/roles error:", error);

    return NextResponse.json(
      {
        error: "Failed to create role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}