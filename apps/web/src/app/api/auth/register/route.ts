import { NextResponse } from "next/server";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  createExpiryDate,
  createOpaqueToken,
  hashOpaqueToken,
} from "@/lib/auth-tokens";
import { isEmailDeliveryConfigured, sendPlayerRegistrationVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { validateHumanVerification } from "@/lib/human-verification";

function parseString(value: unknown) {
  return String(value ?? "").trim();
}

function parseOptionalString(value: unknown) {
  const parsed = parseString(value);
  return parsed || null;
}

function parseOptionalDate(value: unknown) {
  const parsed = parseString(value);

  if (!parsed) {
    return null;
  }

  const date = new Date(parsed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
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
  try {
    const body = await request.json().catch(() => null);

    const firstName = parseString(body?.firstName);
    const lastName = parseString(body?.lastName);
    const dateOfBirth = parseOptionalDate(body?.dateOfBirth);
    const rawDateOfBirth = parseString(body?.dateOfBirth);
    const phoneNumber = parseOptionalString(body?.phoneNumber);
    const email = normalizeEmail(parseString(body?.email));
    const password = String(body?.password ?? "");
    const verificationToken = parseString(body?.verificationToken);
    const verificationAnswer = parseString(body?.verificationAnswer);
    const website = parseString(body?.website);

    if (website) {
      return NextResponse.json({ error: "Registration could not be completed." }, { status: 400 });
    }

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      );
    }

    if (rawDateOfBirth && !dateOfBirth) {
      return NextResponse.json(
        { error: "Date of birth must be a valid date." },
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

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { normalizedEmail: email }],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in instead." },
        { status: 409 }
      );
    }

    const rawToken = createOpaqueToken();
    const tokenHash = hashOpaqueToken(rawToken);
    const expiresAt = createExpiryDate(EMAIL_VERIFICATION_TOKEN_TTL_MS);
    const passwordHash = hashPassword(password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
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

      await tx.player.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          dateOfBirth,
          phoneNumber,
          emailAddress: email,
        },
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

      return user;
    });

    const verificationLink = `${getRequestOrigin(request)}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
    const emailConfigured = isEmailDeliveryConfigured();

    if (emailConfigured) {
      await sendPlayerRegistrationVerificationEmail({
        to: email,
        verificationLink,
        expiresAt,
        firstName,
      });
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
    console.error("POST /api/auth/register error:", error);

    return NextResponse.json(
      {
        error: "Failed to register account.",
      },
      { status: 500 }
    );
  }
}
