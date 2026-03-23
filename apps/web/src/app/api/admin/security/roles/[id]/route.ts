import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  ensureAllFound,
  loadPermissions,
  parseOptionalString,
  parseRequiredString,
} from "../../_utils";

const LOCKED_SYSTEM_ROLE_KEY = "ADMINISTRATOR";

function isLockedSystemRole(role: { roleKey: string; isSystemRole: boolean }) {
  return role.isSystemRole && role.roleKey === LOCKED_SYSTEM_ROLE_KEY;
}

function canManageRoles(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return hasAdminPermission(currentUser, "roles.manage");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageRoles(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingRole = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        roleKey: true,
        isSystemRole: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    if (isLockedSystemRole(existingRole)) {
      return NextResponse.json(
        { error: "The Administrator role is locked and cannot be edited." },
        { status: 400 }
      );
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

    if (existingRole.isSystemRole && roleKey !== existingRole.roleKey) {
      return NextResponse.json(
        { error: "System role keys cannot be changed." },
        { status: 400 }
      );
    }

    const [conflictingRole, permissions] = await Promise.all([
      prisma.role.findFirst({
        where: {
          id: { not: id },
          roleKey,
        },
        select: { id: true },
      }),
      loadPermissions(permissionIds),
    ]);

    if (conflictingRole) {
      return NextResponse.json(
        { error: "A role with that key already exists." },
        { status: 409 }
      );
    }

    ensureAllFound(permissions.length, permissionIds.length, "permissions");

    const updatedRole = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          roleKey: existingRole.isSystemRole ? existingRole.roleKey : roleKey,
          roleName: existingRole.isSystemRole ? undefined : roleName,
          description,
        },
      });

      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({
        where: { id },
        select: {
          id: true,
          roleKey: true,
          roleName: true,
        },
      });
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("PATCH /api/admin/security/roles/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageRoles(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingRole = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        roleKey: true,
        isSystemRole: true,
        _count: {
          select: {
            userRoleAssignments: true,
            userRoles: true,
            accessGroupRoleAssignments: true,
          },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found." }, { status: 404 });
    }

    if (isLockedSystemRole(existingRole)) {
      return NextResponse.json(
        { error: "The Administrator role is locked and cannot be deleted." },
        { status: 400 }
      );
    }

    if (existingRole.isSystemRole) {
      return NextResponse.json(
        { error: "System roles cannot be deleted." },
        { status: 400 }
      );
    }

    if (
      existingRole._count.userRoleAssignments > 0 ||
      existingRole._count.userRoles > 0 ||
      existingRole._count.accessGroupRoleAssignments > 0
    ) {
      return NextResponse.json(
        { error: "Remove existing assignments before deleting this role." },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/security/roles/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}