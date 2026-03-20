import { NextResponse } from "next/server";
import { resolveCurrentUser } from "@/lib/admin-auth";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

function readPassword(value: unknown) {
  return String(value ?? "");
}

export async function POST(request: Request) {
  try {
    const currentUser = await resolveCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const currentPassword = readPassword(body?.currentPassword);
    const nextPassword = readPassword(body?.newPassword);

    if (!nextPassword) {
      return NextResponse.json(
        { error: "A new password is required." },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(nextPassword);

    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Your current password is required." },
          { status: 400 }
        );
      }

      if (!verifyPassword(currentPassword, user.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        passwordHash: hashPassword(nextPassword),
        passwordSetAt: new Date(),
        isLoginEnabled: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/change-password error:", error);

    return NextResponse.json(
      { error: "Failed to change password." },
      { status: 500 }
    );
  }
}
