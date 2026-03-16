import { NextResponse } from "next/server";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { GLOBAL_ADMIN_ROLE_KEY } from "@/lib/admin-user-access";
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
    },
  },
  roleAssignments: {
    select: {
      scopeType: true,
      scopeId: true,
      role: {
        select: {
          roleKey: true,
        },
      },
    },
  },
  userRoles: {
    select: {
      role: {
        select: {
          roleKey: true,
        },
      },
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
}) {
  return (
    user.roleAssignments.some(
      (assignment) =>
        assignment.scopeType === "GLOBAL" &&
        assignment.scopeId === "" &&
        assignment.role.roleKey === GLOBAL_ADMIN_ROLE_KEY
    ) || user.userRoles.some((userRole) => userRole.role.roleKey === GLOBAL_ADMIN_ROLE_KEY)
  );
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

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!hasAdminPermission(currentUser, "users.create")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
    const isGlobalAdmin = Boolean(body.isGlobalAdmin);

    if (!username && !email) {
      return NextResponse.json(
        { error: "A username or email address is required." },
        { status: 400 }
      );
    }

    if (isLoginEnabled && !password) {
      return NextResponse.json(
        { error: "A password is required when login is enabled." },
        { status: 400 }
      );
    }

    if (isGlobalAdmin && !currentUser.isGlobalAdmin) {
      return NextResponse.json(
        { error: "Only global administrators can create global admin users." },
        { status: 403 }
      );
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);

    const existingUser = await prisma.user.findFirst({
      where: {
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

    if (existingUser) {
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

      if (linkedPlayer.userId) {
        return NextResponse.json(
          { error: "Selected player is already linked to another user." },
          { status: 409 }
        );
      }
    }

    const administratorRole = isGlobalAdmin ? await findAdministratorRole() : null;

    if (isGlobalAdmin && !administratorRole) {
      return NextResponse.json(
        { error: "Administrator role is not configured." },
        { status: 500 }
      );
    }

    const now = new Date();
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username,
          normalizedUsername,
          email,
          normalizedEmail,
          phoneNumber,
          registrationStatus,
          isLoginEnabled,
          emailVerifiedAt: email && emailVerified ? now : null,
          passwordHash: password ? hashPassword(password) : null,
          passwordSetAt: password ? now : null,
        },
        select: { id: true },
      });

      if (linkedPlayerId) {
        await tx.player.update({
          where: { id: linkedPlayerId },
          data: { userId: user.id },
        });
      }

      if (administratorRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: administratorRole.id,
          },
        });

        await tx.userRoleAssignment.create({
          data: {
            userId: user.id,
            roleId: administratorRole.id,
            scopeType: "GLOBAL",
            scopeId: "",
            grantedByUserId: currentUser.id,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: editableUserSelect,
      });
    });

    return NextResponse.json(
      {
        ...createdUser,
        linkedPlayerId: createdUser?.player?.id ?? null,
        isGlobalAdmin: createdUser ? isGlobalAdminTarget(createdUser) : false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/users error:", error);

    return NextResponse.json(
      {
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}