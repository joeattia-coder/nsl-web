import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { GLOBAL_ADMIN_ROLE_KEY } from "@/lib/admin-user-access";
import { prisma } from "@/lib/prisma";
import {
  ensureAllFound,
  ensureCanManageGlobalAdminGrant,
  loadRoles,
  loadVisibleUsers,
  parseOptionalDate,
  parseOptionalString,
  parseRequiredString,
  parseScopeValue,
} from "../../_utils";

type IncomingRoleAssignment = {
  roleId: string;
  scopeType: string;
  scopeId: string;
  expiresAt: Date | null;
};

function canManageGroups(currentUser: NonNullable<Awaited<ReturnType<typeof resolveCurrentAdminUser>>>) {
  return (
    hasAdminPermission(currentUser, "users.edit") &&
    hasAdminPermission(currentUser, "roles.manage")
  );
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

    if (!canManageGroups(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingGroup = await prisma.accessGroup.findUnique({
      where: { id },
      select: {
        id: true,
        groupName: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                roleKey: true,
              },
            },
            scopeType: true,
            scopeId: true,
          },
        },
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const body = await request.json();
    const groupName = parseRequiredString(body.groupName, "Group name");
    const description = parseOptionalString(body.description);
    const isActive = body.isActive !== false;
    const membershipUserIds: string[] = Array.isArray(body.membershipUserIds)
      ? Array.from(
          new Set(
            body.membershipUserIds
              .map((value: unknown) => String(value).trim())
              .filter((value: string): value is string => value.length > 0)
          )
        )
      : [];
    const incomingAssignments = Array.isArray(body.roleAssignments)
      ? body.roleAssignments
      : [];

    const parsedAssignments: IncomingRoleAssignment[] = incomingAssignments.map((assignment: unknown) => {
      const record = assignment as Record<string, unknown>;
      const { scopeType, scopeId } = parseScopeValue(record.scopeType, record.scopeId);

      return {
        roleId: parseRequiredString(record.roleId, "Role"),
        scopeType,
        scopeId,
        expiresAt: parseOptionalDate(record.expiresAt),
      };
    });

    const [conflictingGroup, visibleUsers, roles] = await Promise.all([
      prisma.accessGroup.findFirst({
        where: {
          id: { not: id },
          groupName,
        },
        select: { id: true },
      }),
      loadVisibleUsers(currentUser, membershipUserIds),
      loadRoles(parsedAssignments.map((assignment) => assignment.roleId)),
    ]);

    if (conflictingGroup) {
      return NextResponse.json(
        { error: "A group with that name already exists." },
        { status: 409 }
      );
    }

    ensureAllFound(visibleUsers.length, membershipUserIds.length, "users");
    ensureAllFound(roles.length, new Set(parsedAssignments.map((assignment) => assignment.roleId)).size, "roles");

    const roleKeyById = new Map(roles.map((role) => [role.id, role.roleKey]));

    ensureCanManageGlobalAdminGrant(
      currentUser,
      existingGroup.roleAssignments.map((assignment) => ({
        roleKey: assignment.role.roleKey,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      }))
    );

    ensureCanManageGlobalAdminGrant(
      currentUser,
      parsedAssignments.map((assignment) => ({
        roleKey: roleKeyById.get(assignment.roleId) ?? "",
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      }))
    );

    const updatedGroup = await prisma.$transaction(async (tx) => {
      await tx.accessGroup.update({
        where: { id },
        data: {
          groupName,
          description,
          isActive,
        },
      });

      await tx.accessGroupMembership.deleteMany({
        where: { groupId: id },
      });

      if (membershipUserIds.length > 0) {
        await tx.accessGroupMembership.createMany({
          data: membershipUserIds.map((userId) => ({
            groupId: id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      await tx.accessGroupRoleAssignment.deleteMany({
        where: { groupId: id },
      });

      if (parsedAssignments.length > 0) {
        await tx.accessGroupRoleAssignment.createMany({
          data: parsedAssignments.map((assignment) => ({
            groupId: id,
            roleId: assignment.roleId,
            scopeType: assignment.scopeType as never,
            scopeId: assignment.scopeId,
            expiresAt: assignment.expiresAt,
            grantedByUserId: currentUser.id,
          })),
          skipDuplicates: true,
        });
      }

      return tx.accessGroup.findUnique({
        where: { id },
        select: {
          id: true,
          groupName: true,
        },
      });
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("PATCH /api/admin/security/groups/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update group",
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

    if (!canManageGroups(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingGroup = await prisma.accessGroup.findUnique({
      where: { id },
      select: {
        id: true,
        roleAssignments: {
          select: {
            role: {
              select: {
                roleKey: true,
              },
            },
            scopeType: true,
            scopeId: true,
          },
        },
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found." }, { status: 404 });
    }

    const includesGlobalAdminGrant = existingGroup.roleAssignments.some(
      (assignment) =>
        assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY &&
        assignment.scopeType === "GLOBAL" &&
        assignment.scopeId === ""
    );

    if (includesGlobalAdminGrant && !currentUser.isGlobalAdmin) {
      return NextResponse.json(
        { error: "Only global administrators can delete groups with global admin grants." },
        { status: 403 }
      );
    }

    await prisma.accessGroup.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/security/groups/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}