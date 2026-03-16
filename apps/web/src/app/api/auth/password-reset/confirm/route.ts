import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashOpaqueToken } from "@/lib/auth-tokens";
import { hashPassword } from "@/lib/passwords";

function readPassword(value: unknown) {
  return String(value ?? "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = String(body?.token ?? "").trim();
    const password = readPassword(body?.password);

    if (!token || !password) {
      return NextResponse.json(
        { error: "Reset token and new password are required." },
        { status: 400 }
      );
    }

    if (password.length < 10) {
      return NextResponse.json(
        { error: "Use a password that is at least 10 characters long." },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashOpaqueToken(token),
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "That reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const nextPasswordHash = hashPassword(password);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: nextPasswordHash,
          passwordSetAt: now,
          isLoginEnabled: true,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: now },
      }),
      prisma.passwordResetToken.updateMany({
        where: {
          userId: resetToken.userId,
          consumedAt: null,
          id: {
            not: resetToken.id,
          },
        },
        data: { consumedAt: now },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/password-reset/confirm error:", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}