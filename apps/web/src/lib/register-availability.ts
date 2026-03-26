import "server-only";

import { prisma } from "@/lib/prisma";

type ExistingUserSummary = {
  id: string;
  isLoginEnabled: boolean;
  registrationStatus: string;
  emailVerifiedAt: Date | null;
  player: { id: string } | null;
  authAccounts: Array<{ id: string }>;
};

export function normalizeRegistrationEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeRegistrationUsername(value: string) {
  return value.trim().toLowerCase();
}

function isStaleRegistrationUser(user: ExistingUserSummary) {
  return (
    !user.player &&
    !user.isLoginEnabled &&
    user.registrationStatus === "INACTIVE" &&
    !user.emailVerifiedAt &&
    user.authAccounts.length === 0
  );
}

async function removeStaleRegistrationUser(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.deleteMany({
      where: { userId },
    });

    await tx.passwordResetToken.deleteMany({
      where: { userId },
    });

    await tx.player.deleteMany({
      where: { userId },
    });

    await tx.user.delete({
      where: { id: userId },
    });
  });
}

async function clearStaleUsers(email: string | null, normalizedUsername: string | null) {
  const orClauses = [
    ...(email ? [{ email }, { normalizedEmail: email }] : []),
    ...(normalizedUsername ? [{ normalizedUsername }] : []),
  ];

  if (orClauses.length === 0) {
    return;
  }

  const existingUsers = await prisma.user.findMany({
    where: {
      OR: orClauses,
    },
    select: {
      id: true,
      isLoginEnabled: true,
      registrationStatus: true,
      emailVerifiedAt: true,
      player: {
        select: {
          id: true,
        },
      },
      authAccounts: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  for (const existingUser of existingUsers) {
    if (isStaleRegistrationUser(existingUser)) {
      await removeStaleRegistrationUser(existingUser.id);
    }
  }
}

export async function getRegistrationAvailability(input: {
  email?: string | null;
  username?: string | null;
}) {
  const email = input.email ? normalizeRegistrationEmail(input.email) : null;
  const normalizedUsername = input.username
    ? normalizeRegistrationUsername(input.username)
    : null;

  await clearStaleUsers(email, normalizedUsername);

  const [emailUser, usernameUser] = await Promise.all([
    email
      ? prisma.user.findFirst({
          where: {
            OR: [{ email }, { normalizedEmail: email }],
          },
          select: {
            id: true,
          },
        })
      : null,
    normalizedUsername
      ? prisma.user.findFirst({
          where: {
            normalizedUsername,
          },
          select: {
            id: true,
          },
        })
      : null,
  ]);

  return {
    emailTaken: Boolean(emailUser),
    usernameTaken: Boolean(usernameUser),
    normalizedEmail: email,
    normalizedUsername,
  };
}