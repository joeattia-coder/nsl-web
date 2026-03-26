import { NextResponse } from "next/server";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  createExpiryDate,
  createOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth-tokens";
import { isEmailDeliveryConfigured, sendPlayerRegistrationVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  getRegistrationAvailability,
  normalizeRegistrationEmail,
  normalizeRegistrationUsername,
} from "@/lib/register-availability";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { validateHumanVerification } from "@/lib/human-verification";

const PLAYER_ROLE_KEY = "PLAYER";

class RegistrationConflictError extends Error {
  status: number;
  field: "email" | "username" | null;

  constructor(message: string, status = 409, field: "email" | "username" | null = null) {
    super(message);
    this.name = "RegistrationConflictError";
    this.status = status;
    this.field = field;
  }
}

function parseString(value: unknown) {
  return String(value ?? "").trim();
}

function parseOptionalString(value: unknown) {
  const parsed = parseString(value);
  return parsed || null;
}

function parseMiddleInitial(value: unknown) {
  const parsed = parseString(value).replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase();
  return parsed || null;
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

export async function POST(request: Request) {
  let createdUserId: string | null = null;
  let createdPlayerId: string | null = null;
  let linkedExistingPlayerId: string | null = null;

  async function rollbackCreatedRegistration(userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.deleteMany({
        where: {
          userId,
        },
      });

      if (createdPlayerId) {
        await tx.player.deleteMany({
          where: {
            id: createdPlayerId,
            userId,
          },
        });
      }

      if (linkedExistingPlayerId) {
        await tx.player.updateMany({
          where: {
            id: linkedExistingPlayerId,
            userId,
          },
          data: {
            userId: null,
          },
        });
      }

      await tx.user.deleteMany({
        where: {
          id: userId,
        },
      });
    });
  }

  try {
    const body = await request.json().catch(() => null);

    const firstName = parseString(body?.firstName);
    const middleInitial = parseMiddleInitial(body?.middleInitial);
    const lastName = parseString(body?.lastName);
    const phoneNumber = parseOptionalString(body?.phoneNumber);
    const country = parseString(body?.country);
    const username = parseString(body?.username);
    const normalizedUsername = normalizeRegistrationUsername(username);
    const email = normalizeRegistrationEmail(parseString(body?.email));
    const password = String(body?.password ?? "");
    const verificationToken = parseString(body?.verificationToken);
    const verificationAnswer = parseString(body?.verificationAnswer);
    const website = parseString(body?.website);

    if (website) {
      return NextResponse.json({ error: "Registration could not be completed." }, { status: 400 });
    }

    if (!firstName || !lastName || !country || !username || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, country, username, email, and password are required." },
        { status: 400 }
      );
    }

    const usernamePattern = /^[a-zA-Z0-9._-]{3,30}$/;

    if (!usernamePattern.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters and can only include letters, numbers, periods, underscores, and hyphens." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(password);

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const verificationError = validateHumanVerification(verificationToken, verificationAnswer);

    if (verificationError) {
      return NextResponse.json({ error: verificationError }, { status: 400 });
    }

    const availability = await getRegistrationAvailability({ email, username });

    if (availability.emailTaken) {
      throw new RegistrationConflictError(
        "An account with this email address already exists. Try signing in instead.",
        409,
        "email"
      );
    }

    if (availability.usernameTaken) {
      throw new RegistrationConflictError(
        "That username is already in use. Choose another username.",
        409,
        "username"
      );
    }

    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = createExpiryDate(EMAIL_VERIFICATION_TOKEN_TTL_MS);
    const passwordHash = hashPassword(password);

    const created = await prisma.$transaction(async (tx) => {
      const playerRole = await tx.role.findUnique({
        where: { roleKey: PLAYER_ROLE_KEY },
        select: { id: true },
      });

      if (!playerRole) {
        throw new Error("The Player role is not configured.");
      }

      const matchingPlayers = await tx.player.findMany({
        where: {
          firstName: {
            equals: firstName,
            mode: "insensitive",
          },
          lastName: {
            equals: lastName,
            mode: "insensitive",
          },
          OR: [{ emailAddress: null }, { emailAddress: "" }],
        },
        select: {
          id: true,
          userId: true,
        },
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      });

      const unlinkedMatchingPlayers = matchingPlayers.filter((player) => !player.userId);

      if (unlinkedMatchingPlayers.length > 1) {
        throw new RegistrationConflictError(
          "Multiple player profiles match this name without an email address. Contact an administrator to complete account setup."
        );
      }

      const user = await tx.user.create({
        data: {
          username,
          normalizedUsername,
          email,
          normalizedEmail: email,
          passwordHash,
          passwordSetAt: new Date(),
          registrationStatus: "INACTIVE",
          isLoginEnabled: false,
          emailVerifiedAt: null,
        },
        select: { id: true },
      });

      const existingPlayer = unlinkedMatchingPlayers[0] ?? null;

      if (existingPlayer) {
        await tx.player.update({
          where: { id: existingPlayer.id },
          data: {
            userId: user.id,
            middleInitial,
            emailAddress: email,
            phoneNumber,
            country,
          },
        });
      } else {
        const player = await tx.player.create({
          data: {
            userId: user.id,
            firstName,
            middleInitial,
            lastName,
            phoneNumber,
            country,
            emailAddress: email,
          },
          select: {
            id: true,
          },
        });

        createdPlayerId = player.id;
      }

      await tx.userRoleAssignment.createMany({
        data: [
          {
            userId: user.id,
            roleId: playerRole.id,
            scopeType: "GLOBAL",
            scopeId: "",
          },
        ],
        skipDuplicates: true,
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          email,
          normalizedEmail: email,
          tokenHash,
          expiresAt,
        },
      });

      return {
        id: user.id,
        linkedExistingPlayerId: existingPlayer?.id ?? null,
      };
    });

    createdUserId = created.id;
    linkedExistingPlayerId = created.linkedExistingPlayerId;

    const verificationLink = `${getRequestOrigin(request)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    const emailConfigured = isEmailDeliveryConfigured();

    if (emailConfigured) {
      try {
        await sendPlayerRegistrationVerificationEmail({
          to: email,
          verificationLink,
          expiresAt,
          firstName,
        });
      } catch (deliveryError) {
        await rollbackCreatedRegistration(created.id);
        createdUserId = null;

        throw new Error(
          deliveryError instanceof Error
            ? deliveryError.message
            : "Failed to deliver verification email."
        );
      }
    } else {
      console.info(`Registration verification link for ${email}: ${verificationLink}`);
    }

    return NextResponse.json({
      ok: true,
      userId: created.id,
      message:
        emailConfigured
          ? "Registration submitted. Check your email to verify and activate your account."
          : "Registration submitted. Verification link generated for development.",
      verificationLink:
        !emailConfigured && process.env.NODE_ENV !== "production" ? verificationLink : null,
      delivery: emailConfigured ? "email" : "development-link",
    });
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: error.status }
      );
    }
    console.error("POST /api/auth/register error:", error);

    if (createdUserId) {
      try {
        await rollbackCreatedRegistration(createdUserId);
      } catch (rollbackError) {
        console.error("POST /api/auth/register rollback error:", rollbackError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to register account.",
      },
      { status: 500 }
    );
  }
}
