import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import {
  GLOBAL_ADMIN_ROLE_KEY,
  isAccessGroupTablesMissingError,
  isGlobalAdminUserRecord,
} from "@/lib/admin-user-access";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

const editableUserSelect = {
  id: true,
  username: true,
  email: true,
  phoneNumber: true,
  registrationStatus: true,
  isLoginEnabled: true,
  emailVerifiedAt: true,
  passwordSetAt: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      userId: true,
    },
  },
  roleAssignments: {
    select: {
      createdAt: true,
      expiresAt: true,
      scopeType: true,
      scopeId: true,
      role: {
        select: {
          roleKey: true,
          roleName: true,
        },
      },
    },
  },
  userRoles: {
    select: {
      createdAt: true,
      role: {
        select: {
          roleKey: true,
          roleName: true,
        },
      },
    },
  },
  accessGroupMemberships: {
    select: {
      id: true,
      createdAt: true,
      group: {
        select: {
          id: true,
          groupName: true,
          description: true,
          isActive: true,
          roleAssignments: {
            select: {
              createdAt: true,
              expiresAt: true,
              scopeType: true,
              scopeId: true,
              role: {
                select: {
                  roleKey: true,
                  roleName: true,
                },
              },
            },
          },
        },
      },
    },
  },
  permissionOverrides: {
    select: {
      createdAt: true,
      expiresAt: true,
      scopeType: true,
      scopeId: true,
      effect: true,
      reason: true,
      permission: {
        select: {
          permissionKey: true,
          permissionName: true,
        },
      },
    },
  },
  _count: {
    select: {
      approvedMatches: true,
      enteredMatches: true,
      updatedMatches: true,
      createdInvitations: true,
    },
  },
} as const;

const legacyEditableUserSelect = {
  id: true,
  username: true,
  email: true,
  phoneNumber: true,
  registrationStatus: true,
  isLoginEnabled: true,
  emailVerifiedAt: true,
  passwordSetAt: true,
  player: {
    select: {
      id: true,
      firstName: true,
      middleInitial: true,
      lastName: true,
      userId: true,
    },
  },
  roleAssignments: {
    select: {
      createdAt: true,
      expiresAt: true,
      scopeType: true,
      scopeId: true,
      role: {
        select: {
          roleKey: true,
          roleName: true,
        },
      },
    },
  },
  userRoles: {
    select: {
      createdAt: true,
      role: {
        select: {
          roleKey: true,
          roleName: true,
        },
      },
    },
  },
  permissionOverrides: {
    select: {
      createdAt: true,
      expiresAt: true,
      scopeType: true,
      scopeId: true,
      effect: true,
      reason: true,
      permission: {
        select: {
          permissionKey: true,
          permissionName: true,
        },
      },
    },
  },
  _count: {
    select: {
      approvedMatches: true,
      enteredMatches: true,
      updatedMatches: true,
      createdInvitations: true,
    },
  },
} as const;

function parseOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function normalizeEmail(email: string | null) {
  return email ? email.toLowerCase() : null;
}

function normalizeUsername(username: string | null) {
  return username ? username.toLowerCase() : null;
}

function isGlobalAdminTarget(user: {
  roleAssignments: Array<{ scopeType: string; scopeId: string; role: { roleKey: string } }>;
  userRoles: Array<{ role: { roleKey: string } }>;
  accessGroupMemberships?: Array<{
    group: {
      isActive?: boolean;
      roleAssignments?: Array<{ scopeType: string; scopeId: string; role: { roleKey: string } }>;
    };
  }>;
}) {
  return isGlobalAdminUserRecord(user);
}

async function findAdministratorRole() {
  return prisma.role.findUnique({
    where: {
      roleKey: GLOBAL_ADMIN_ROLE_KEY,
    },
    select: {
      id: true,
    },
  });
}

async function loadEditableUser(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: editableUserSelect,
    });
  } catch (error) {
    if (!isAccessGroupTablesMissingError(error)) {
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: legacyEditableUserSelect,
    });

    return user
      ? {
          ...user,
          accessGroupMemberships: [],
        }
      : null;
  }
}

function buildEditableUserPayload(user: NonNullable<Awaited<ReturnType<typeof loadEditableUser>>>) {
  const assignedRoles = [
    ...user.roleAssignments.map((assignment) => ({
      source: "DIRECT_ASSIGNMENT" as const,
      sourceLabel: "Direct assignment",
      sourceGroupName: null,
      roleKey: assignment.role.roleKey,
      roleName: assignment.role.roleName,
      scopeType: assignment.scopeType,
      scopeId: assignment.scopeId,
      createdAt: assignment.createdAt,
      expiresAt: assignment.expiresAt,
    })),
    ...user.userRoles.map((userRole) => ({
      source: "LEGACY_LINK" as const,
      sourceLabel: "Legacy direct role",
      sourceGroupName: null,
      roleKey: userRole.role.roleKey,
      roleName: userRole.role.roleName,
      scopeType: "GLOBAL",
      scopeId: "",
      createdAt: userRole.createdAt,
      expiresAt: null,
    })),
    ...user.accessGroupMemberships.flatMap((membership) =>
      membership.group.roleAssignments.map((assignment) => ({
        source: "GROUP_INHERITED" as const,
        sourceLabel: "Inherited from group",
        sourceGroupName: membership.group.groupName,
        roleKey: assignment.role.roleKey,
        roleName: assignment.role.roleName,
        scopeType: assignment.scopeType,
        scopeId: assignment.scopeId,
        createdAt: assignment.createdAt,
        expiresAt: assignment.expiresAt,
      }))
    ),
  ].sort((left, right) => {
    if (left.roleName !== right.roleName) {
      return left.roleName.localeCompare(right.roleName);
    }

    if (left.scopeType !== right.scopeType) {
      return left.scopeType.localeCompare(right.scopeType);
    }

    return (left.sourceGroupName ?? "").localeCompare(right.sourceGroupName ?? "");
  });

  const groupMemberships = user.accessGroupMemberships
    .map((membership) => ({
      id: membership.id,
      groupId: membership.group.id,
      groupName: membership.group.groupName,
      description: membership.group.description,
      isActive: membership.group.isActive,
      joinedAt: membership.createdAt,
      inheritedRoles: membership.group.roleAssignments
        .map((assignment) => ({
          roleKey: assignment.role.roleKey,
          roleName: assignment.role.roleName,
          scopeType: assignment.scopeType,
          scopeId: assignment.scopeId,
          createdAt: assignment.createdAt,
          expiresAt: assignment.expiresAt,
        }))
        .sort((left, right) => left.roleName.localeCompare(right.roleName)),
    }))
    .sort((left, right) => left.groupName.localeCompare(right.groupName));

  const permissionOverrides = user.permissionOverrides
    .map((override) => ({
      permissionKey: override.permission.permissionKey,
      permissionName: override.permission.permissionName,
      effect: override.effect,
      scopeType: override.scopeType,
      scopeId: override.scopeId,
      reason: override.reason,
      createdAt: override.createdAt,
      expiresAt: override.expiresAt,
    }))
    .sort((left, right) => left.permissionKey.localeCompare(right.permissionKey));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phoneNumber: user.phoneNumber,
    registrationStatus: user.registrationStatus,
    isLoginEnabled: user.isLoginEnabled,
    emailVerifiedAt: user.emailVerifiedAt,
    passwordSetAt: user.passwordSetAt,
    linkedPlayerId: user.player?.id ?? null,
    isGlobalAdmin: isGlobalAdminTarget(user),
    groupMemberships,
    assignedRoles,
    permissionOverrides,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "users.view")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const user = await loadEditableUser(id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isGlobalAdminTarget(user) && !currentUser.isGlobalAdmin) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(buildEditableUserPayload(user));
  } catch (error) {
    console.error("GET /api/admin/users/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
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

    if (!hasAdminPermission(currentUser, "users.edit")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;
    const existingUser = await loadEditableUser(id);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const existingIsGlobalAdmin = isGlobalAdminTarget(existingUser);

    if (existingIsGlobalAdmin && !currentUser.isGlobalAdmin) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const username = parseOptionalString(body.username);
    const email = parseOptionalString(body.email);
    const phoneNumber = parseOptionalString(body.phoneNumber);
    const registrationStatus = body.registrationStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    const isLoginEnabled = Boolean(body.isLoginEnabled);
    const emailVerified = Boolean(body.emailVerified);
    const linkedPlayerId = parseOptionalString(body.linkedPlayerId);
    const password = String(body.password ?? "").trim();
    const nextIsGlobalAdmin =
      body.isGlobalAdmin === undefined ? existingIsGlobalAdmin : Boolean(body.isGlobalAdmin);

    if (!username && !email) {
      return NextResponse.json(
        { error: "A username or email address is required." },
        { status: 400 }
      );
    }

    if (!currentUser.isGlobalAdmin && body.isGlobalAdmin !== undefined) {
      return NextResponse.json(
        { error: "Only global administrators can change global admin access." },
        { status: 403 }
      );
    }

    if (currentUser.id === id && existingIsGlobalAdmin && !nextIsGlobalAdmin) {
      return NextResponse.json(
        { error: "You cannot remove your own global admin access." },
        { status: 400 }
      );
    }

    if (isLoginEnabled && !password && !existingUser.passwordSetAt) {
      return NextResponse.json(
        { error: "A password is required before enabling login for this user." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    const conflictingUser = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(email
            ? [{ email }, { normalizedEmail }]
            : []),
          ...(username
            ? [{ username }, { normalizedUsername }]
            : []),
        ],
      },
      select: { id: true },
    });

    if (conflictingUser) {
      return NextResponse.json(
        { error: "A user with that email or username already exists." },
        { status: 409 }
      );
    }

    if (linkedPlayerId) {
      const linkedPlayer = await prisma.player.findUnique({
        where: { id: linkedPlayerId },
        select: { id: true, userId: true },
      });

      if (!linkedPlayer) {
        return NextResponse.json({ error: "Selected player was not found." }, { status: 400 });
      }

      if (linkedPlayer.userId && linkedPlayer.userId !== id) {
        return NextResponse.json(
          { error: "Selected player is already linked to another user." },
          { status: 409 }
        );
      }
    }

    const administratorRole = nextIsGlobalAdmin || existingIsGlobalAdmin
      ? await findAdministratorRole()
      : null;

    if ((nextIsGlobalAdmin || existingIsGlobalAdmin) && !administratorRole) {
      return NextResponse.json(
        { error: "Administrator role is not configured." },
        { status: 500 }
      );
    }

    const now = new Date();
    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          username,
          normalizedUsername,
          email,
          normalizedEmail,
          phoneNumber,
          registrationStatus,
          isLoginEnabled,
          emailVerifiedAt: email && emailVerified ? existingUser.emailVerifiedAt ?? now : null,
          ...(password
            ? {
                passwordHash: hashPassword(password),
                passwordSetAt: now,
              }
            : {}),
        },
      });

      const currentLinkedPlayerId = existingUser.player?.id ?? null;

      if (currentLinkedPlayerId && currentLinkedPlayerId !== linkedPlayerId) {
        await tx.player.update({
          where: { id: currentLinkedPlayerId },
          data: { userId: null },
        });
      }

      if (linkedPlayerId && currentLinkedPlayerId !== linkedPlayerId) {
        await tx.player.update({
          where: { id: linkedPlayerId },
          data: { userId: id },
        });
      }

      if (administratorRole) {
        if (nextIsGlobalAdmin) {
          await tx.userRole.upsert({
            where: {
              userId_roleId: {
                userId: id,
                roleId: administratorRole.id,
              },
            },
            update: {},
            create: {
              userId: id,
              roleId: administratorRole.id,
            },
          });

          await tx.userRoleAssignment.upsert({
            where: {
              userId_roleId_scopeType_scopeId: {
                userId: id,
                roleId: administratorRole.id,
                scopeType: "GLOBAL",
                scopeId: "",
              },
            },
            update: {
              expiresAt: null,
            },
            create: {
              userId: id,
              roleId: administratorRole.id,
              scopeType: "GLOBAL",
              scopeId: "",
              grantedByUserId: currentUser.id,
            },
          });
        } else {
          await tx.userRoleAssignment.deleteMany({
            where: {
              userId: id,
              roleId: administratorRole.id,
              scopeType: "GLOBAL",
              scopeId: "",
            },
          });

          await tx.userRole.deleteMany({
            where: {
              userId: id,
              roleId: administratorRole.id,
            },
          });
        }
      }

      return tx.user.findUnique({
        where: { id },
        select: editableUserSelect,
      });
    });

    return NextResponse.json(updatedUser ? buildEditableUserPayload(updatedUser) : null);
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to update user",
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

    if (!hasAdminPermission(currentUser, "users.disable")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const user = await loadEditableUser(id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isGlobalAdminTarget(user) && !currentUser.isGlobalAdmin) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (
      user._count.approvedMatches > 0 ||
      user._count.enteredMatches > 0 ||
      user._count.updatedMatches > 0 ||
      user._count.createdInvitations > 0
    ) {
      return NextResponse.json(
        {
          error:
            "This user has match activity or created invitations and cannot be deleted safely. Disable login instead.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.player.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      await tx.user.delete({
        where: { id },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}