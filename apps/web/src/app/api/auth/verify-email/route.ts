import { NextResponse } from "next/server";
import { hashOpaqueToken } from "@/lib/auth-tokens";
import { prisma } from "@/lib/prisma";

function buildLoginUrl(request: Request, status: "success" | "invalid") {
  const url = new URL("/login", request.url);
  url.searchParams.set("verified", status);
  return url;
}

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";

    if (!token) {
      return NextResponse.redirect(buildLoginUrl(request, "invalid"));
    }

    const verification = await prisma.emailVerificationToken.findFirst({
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
        normalizedEmail: true,
      },
    });

    if (!verification) {
      return NextResponse.redirect(buildLoginUrl(request, "invalid"));
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const user = verification.userId
        ? await tx.user.findUnique({
            where: { id: verification.userId },
            select: { id: true },
          })
        : await tx.user.findFirst({
            where: {
              OR: [
                { normalizedEmail: verification.normalizedEmail },
                { email: verification.normalizedEmail },
              ],
            },
            select: { id: true },
          });

      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: now,
            registrationStatus: "ACTIVE",
            isLoginEnabled: true,
          },
        });

        await tx.emailVerificationToken.updateMany({
          where: {
            userId: user.id,
            consumedAt: null,
          },
          data: { consumedAt: now },
        });
      } else {
        await tx.emailVerificationToken.update({
          where: { id: verification.id },
          data: { consumedAt: now },
        });
      }
    });

    return NextResponse.redirect(buildLoginUrl(request, "success"));
  } catch (error) {
    console.error("GET /api/auth/verify-email error:", error);
    return NextResponse.redirect(buildLoginUrl(request, "invalid"));
  }
}
