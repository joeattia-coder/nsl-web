import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { MatchLiveEventType, MatchLiveSessionStatus, PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection URL is not set.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  const match = await prisma.match.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  const user = await prisma.user.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
    },
  });

  if (!match?.id || !user?.id) {
    throw new Error("Missing match or user rows for Prisma smoke test.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const session = await tx.matchLiveSession.create({
        data: {
          matchId: match.id,
          status: MatchLiveSessionStatus.ACTIVE,
          version: 1,
          scoringState: {
            matchId: match.id,
            bestOfFrames: 5,
            startedAt: new Date().toISOString(),
            frames: [],
            currentFrameIndex: 0,
          },
          homeFramesWon: 0,
          awayFramesWon: 0,
          currentFrameNumber: 1,
          currentFrameHomePoints: 0,
          currentFrameAwayPoints: 0,
          activeSide: "home",
          createdByUserId: user.id,
          updatedByUserId: user.id,
          events: {
            create: {
              version: 1,
              eventType: MatchLiveEventType.SESSION_CREATED,
              payload: {
                side: "home",
              },
              createdByUserId: user.id,
            },
          },
        },
        select: {
          id: true,
        },
      });

      console.log(JSON.stringify({ ok: true, sessionId: session.id }, null, 2));
      throw new Error("__ROLLBACK__");
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "__ROLLBACK__") {
      throw error;
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });