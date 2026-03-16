import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  createExpiryDate,
  createOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth-tokens";
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from "@/lib/email";

function normalizeIdentifier(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

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

function getAdminUserWhere() {
  return {
    OR: [
      {
        roleAssignments: {
          some: {
            scopeType: "GLOBAL" as const,
            scopeId: "",
            role: { roleKey: "ADMINISTRATOR" },
          },
        },
      },
      {
        userRoles: {
          some: {
            role: { roleKey: "ADMINISTRATOR" },
          },
        },
      },
    ],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const identifier = normalizeIdentifier(body?.identifier);

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or username is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { isLoginEnabled: true },
          getAdminUserWhere(),
          {
            OR: [
              { email: identifier },
              { normalizedEmail: identifier },
              { username: identifier },
              { normalizedUsername: identifier },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
      },
    });

    const emailConfigured = isEmailDeliveryConfigured();
    let resetLink: string | null = null;

    if (user) {
      const rawToken = createOpaqueToken();
      const tokenHash = hashOpaqueToken(rawToken);
      const expiresAt = createExpiryDate(PASSWORD_RESET_TOKEN_TTL_MS);

      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id,
          consumedAt: null,
        },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const origin = getRequestOrigin(request);
      resetLink = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

      if (emailConfigured && user.email) {
        await sendPasswordResetEmail({
          to: user.email,
          resetLink,
          expiresAt,
        });
      } else {
        console.info(`Password reset requested for ${user.email ?? user.id}: ${resetLink}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message:
        user && emailConfigured && user.email
          ? "If that account exists, a password reset email has been sent."
          : "If that account exists, a password reset link has been generated.",
      resetLink:
        !emailConfigured && process.env.NODE_ENV !== "production" ? resetLink : null,
      delivery: user && emailConfigured && user.email ? "email" : "development-link",
    });
  } catch (error) {
    console.error("POST /api/auth/password-reset/request error:", error);
    return NextResponse.json(
      {
        error: "Failed to process password reset request.",
      },
      { status: 500 }
    );
  }
}