import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
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
} from "../_utils";

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

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!canManageGroups(currentUser)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

    const [existingGroup, visibleUsers, roles] = await Promise.all([
      prisma.accessGroup.findUnique({
        where: { groupName },
        select: { id: true },
      }),
      loadVisibleUsers(currentUser, membershipUserIds),
      loadRoles(parsedAssignments.map((assignment) => assignment.roleId)),
    ]);

    if (existingGroup) {
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
      parsedAssignments.map((assignment) => ({
        roleKey: roleKeyById.get(assignment.roleId) ?? "",
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
      }))
    );

    const createdGroup = await prisma.$transaction(async (tx) => {
      const group = await tx.accessGroup.create({
        data: {
          groupName,
          description,
          isActive,
        },
        select: { id: true },
      });

      if (membershipUserIds.length > 0) {
        await tx.accessGroupMembership.createMany({
          data: membershipUserIds.map((userId) => ({
            groupId: group.id,
            userId,
          })),
          skipDuplicates: true,
        });
      }

      if (parsedAssignments.length > 0) {
        await tx.accessGroupRoleAssignment.createMany({
          data: parsedAssignments.map((assignment) => ({
            groupId: group.id,
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
        where: { id: group.id },
        select: {
          id: true,
          groupName: true,
        },
      });
    });

    return NextResponse.json(createdGroup, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/security/groups error:", error);

    return NextResponse.json(
      {
        error: "Failed to create group",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}