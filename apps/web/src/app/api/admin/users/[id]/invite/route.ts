import { NextResponse } from "next/server";
import { createExpiryDate, createOpaqueToken, hashOpaqueToken } from "@/lib/auth-tokens";
import { hasAdminPermission, resolveCurrentAdminUser } from "@/lib/admin-auth";
import { isEmailDeliveryConfigured, sendAccountInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const INVITATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const currentUser = await resolveCurrentAdminUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (
      !hasAdminPermission(currentUser, "users.invite") &&
      !hasAdminPermission(currentUser, "users.edit")
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await context.params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        normalizedEmail: true,
        registrationStatus: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!targetUser.email || !targetUser.normalizedEmail) {
      return NextResponse.json(
        { error: "This user needs an email address before sending an invitation." },
        { status: 400 }
      );
    }

    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = createExpiryDate(INVITATION_TOKEN_TTL_MS);

    await prisma.invitation.updateMany({
      where: {
        userId: targetUser.id,
        status: "PENDING",
      },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    await prisma.invitation.create({
      data: {
        playerId: targetUser.player?.id ?? null,
        userId: targetUser.id,
        email: targetUser.email,
        normalizedEmail: targetUser.normalizedEmail,
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
        to: targetUser.email,
        inviteLink,
        expiresAt,
        playerName: targetUser.player
          ? `${targetUser.player.firstName} ${targetUser.player.lastName}`
          : null,
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
    console.error("POST /api/admin/users/[id]/invite error:", error);

    return NextResponse.json(
      {
        error: "Failed to send invitation.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
