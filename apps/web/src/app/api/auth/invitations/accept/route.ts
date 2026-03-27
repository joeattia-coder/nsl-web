import { NextResponse } from "next/server";
import { hashOpaqueToken } from "@/lib/auth-tokens";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

const PLAYER_ROLE_KEY = "PLAYER";

function normalizeOptionalString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function readPassword(value: unknown) {
  return String(value ?? "");
}

async function findPendingInvitationByToken(rawToken: string) {
  return prisma.invitation.findFirst({
    where: {
      tokenHash: hashOpaqueToken(rawToken),
      status: "PENDING",
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userId: true,
      playerId: true,
      email: true,
      normalizedEmail: true,
      expiresAt: true,
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = String(searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json({ error: "Invitation token is required." }, { status: 400 });
    }

    const invitation = await findPendingInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "That invitation link is invalid or has expired." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      invitation: {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        playerName: invitation.player
          ? `${invitation.player.firstName} ${invitation.player.lastName}`
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/invitations/accept error:", error);
    return NextResponse.json(
      { error: "Failed to load invitation." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = normalizeOptionalString(body?.token);
    const password = readPassword(body?.password);

    if (!token || !password) {
      return NextResponse.json(
        { error: "Invitation token and password are required." },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const invitation = await findPendingInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "That invitation link is invalid or has expired." },
        { status: 400 }
      );
    }

    const now = new Date();
    const nextPasswordHash = hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      let user = invitation.userId
        ? await tx.user.findUnique({
            where: { id: invitation.userId },
            select: {
              id: true,
              player: {
                select: {
                  id: true,
                },
              },
            },
          })
        : null;

      let linkedPlayerId: string | null = null;

      if (invitation.playerId) {
        const player = await tx.player.findUnique({
          where: { id: invitation.playerId },
          select: { id: true, userId: true },
        });

        if (!player) {
          throw new Error("Linked player record no longer exists.");
        }

        linkedPlayerId = player.id;

        if (player.userId && invitation.userId && player.userId !== invitation.userId) {
          throw new Error("This invitation is already linked to another user account.");
        }

        if (!user && player.userId) {
          user = await tx.user.findUnique({
            where: { id: player.userId },
            select: {
              id: true,
              player: {
                select: {
                  id: true,
                },
              },
            },
          });
        }
      }

      if (!user && !linkedPlayerId) {
        user = await tx.user.findFirst({
          where: {
            normalizedEmail: invitation.normalizedEmail,
          },
          select: {
            id: true,
            player: {
              select: {
                id: true,
              },
            },
          },
        });
      }

      if (linkedPlayerId && user?.player && user.player.id !== linkedPlayerId) {
        throw new Error("This account is linked to a different player profile.");
      }

      let userId = user?.id ?? null;

      if (!userId) {
        const created = await tx.user.create({
          data: {
            email: invitation.email,
            normalizedEmail: invitation.normalizedEmail,
            registrationStatus: "ACTIVE",
            isLoginEnabled: true,
            emailVerifiedAt: now,
            passwordHash: nextPasswordHash,
            passwordSetAt: now,
          },
          select: { id: true },
        });

        userId = created.id;
      } else {
        await tx.user.update({
          where: { id: userId },
          data: {
            email: invitation.email,
            normalizedEmail: invitation.normalizedEmail,
            registrationStatus: "ACTIVE",
            isLoginEnabled: true,
            emailVerifiedAt: now,
            passwordHash: nextPasswordHash,
            passwordSetAt: now,
          },
        });
      }

      if (linkedPlayerId) {
        const playerRole = await tx.role.findUnique({
          where: { roleKey: PLAYER_ROLE_KEY },
          select: { id: true },
        });

        if (!playerRole) {
          throw new Error("The Player role is not configured.");
        }

        await tx.player.update({
          where: { id: linkedPlayerId },
          data: { userId },
        });

        await tx.userRoleAssignment.createMany({
          data: [
            {
              userId,
              roleId: playerRole.id,
              scopeType: "GLOBAL",
              scopeId: "",
            },
          ],
          skipDuplicates: true,
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          userId,
          status: "ACCEPTED",
          acceptedAt: now,
          acceptedByUserId: userId,
        },
      });

      return { userId };
    });

    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (error) {
    console.error("POST /api/auth/invitations/accept error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to accept invitation.",
      },
      { status: 500 }
    );
  }
}
