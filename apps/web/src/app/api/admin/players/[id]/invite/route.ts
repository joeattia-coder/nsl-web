import { NextResponse } from "next/server";
import { createExpiryDate, createOpaqueToken, hashOpaqueToken } from "@/lib/auth-tokens";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { isEmailDeliveryConfigured, sendAccountInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const INVITATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getRequestOrigin(request: Request) {
  const explicitOrigin =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_ORIGIN;

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (
      !hasAdminPermission(currentUser, "players.edit") &&
      !hasAdminPermission(currentUser, "players.invite") &&
      !hasAdminPermission(currentUser, "users.invite")
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    const player = await prisma.player.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        emailAddress: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            normalizedEmail: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    const preferredEmail = (player.user?.email ?? player.emailAddress ?? "").trim();
    const normalizedEmail = preferredEmail.toLowerCase();

    if (!preferredEmail) {
      return NextResponse.json(
        { error: "Player must have an email address before sending an invitation." },
        { status: 400 }
      );
    }

    if (!player.userId) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: preferredEmail }, { normalizedEmail }],
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

      if (existingUser && existingUser.player?.id !== player.id) {
        return NextResponse.json(
          {
            error:
              "A user account already exists for this email. Link this player to that user first, then resend the invite.",
          },
          { status: 409 }
        );
      }
    }

    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = createExpiryDate(INVITATION_TOKEN_TTL_MS);

    await prisma.invitation.updateMany({
      where: {
        OR: [{ playerId: player.id }, ...(player.userId ? [{ userId: player.userId }] : [])],
        status: "PENDING",
      },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    await prisma.invitation.create({
      data: {
        playerId: player.id,
        userId: player.userId,
        email: preferredEmail,
        normalizedEmail,
        purpose: "ACCOUNT_SETUP",
        tokenHash,
        status: "PENDING",
        expiresAt,
        createdByUserId: currentUser.id,
      },
    });

    const inviteLink = `${getRequestOrigin(request)}/accept-invitation?token=${encodeURIComponent(rawToken)}`;
    const emailConfigured = isEmailDeliveryConfigured();

    if (emailConfigured) {
      await sendAccountInvitationEmail({
        to: preferredEmail,
        inviteLink,
        expiresAt,
        playerName: `${player.firstName} ${player.lastName}`.trim(),
      });
    }

    return NextResponse.json({
      ok: true,
      message: emailConfigured
        ? "Invitation email sent successfully."
        : "SMTP is not configured. Invitation link generated for development use.",
      inviteLink: !emailConfigured && process.env.NODE_ENV !== "production" ? inviteLink : null,
      delivery: emailConfigured ? "email" : "development-link",
    });
  } catch (error) {
    console.error("POST /api/admin/players/[id]/invite error:", error);

    return NextResponse.json(
      {
        error: "Failed to send invitation.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
