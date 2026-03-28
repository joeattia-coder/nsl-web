require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { Client } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection URL is not set.");
}

const client = new Client({
  connectionString,
});

async function main() {
  const mode = process.argv[2] || "count";

  await client.connect();

  if (mode === "columns") {
    const result = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'MatchLiveSession' ORDER BY ordinal_position"
    );
    console.log(JSON.stringify(result.rows, null, 2));
    return;
  }

  if (mode === "count") {
    const result = await client.query('SELECT COUNT(*)::int AS "liveSessionCount" FROM "MatchLiveSession"');
    console.log(JSON.stringify(result.rows[0], null, 2));
    return;
  }

  if (mode === "sample") {
    const result = await client.query(
      'SELECT "id", "matchId", "status", "homeStartedAt", "awayStartedAt", "finalizedAt", "updatedAt" FROM "MatchLiveSession" ORDER BY "updatedAt" DESC LIMIT 5'
    );
    console.log(JSON.stringify(result.rows, null, 2));
    return;
  }

  if (mode === "smoke") {
    await client.query("BEGIN");

    try {
      const matchResult = await client.query('SELECT "id" FROM "Match" ORDER BY "createdAt" DESC LIMIT 1');
      const userResult = await client.query('SELECT "id" FROM "User" ORDER BY "createdAt" DESC LIMIT 1');

      if (!matchResult.rows[0]?.id || !userResult.rows[0]?.id) {
        throw new Error("Missing match or user rows for smoke test.");
      }

      const sessionResult = await client.query(
        'INSERT INTO "MatchLiveSession" ("id", "matchId", "status", "version", "scoringState", "homeFramesWon", "awayFramesWon", "currentFrameNumber", "currentFrameHomePoints", "currentFrameAwayPoints", "activeSide", "lastSyncedAt", "createdByUserId", "updatedByUserId", "createdAt", "updatedAt") VALUES (gen_random_uuid()::text, $1, $2, 1, $3::jsonb, 0, 0, 1, 0, 0, $4, NOW(), $5, $5, NOW(), NOW()) RETURNING "id"',
        [
          matchResult.rows[0].id,
          "ACTIVE",
          JSON.stringify({ matchId: matchResult.rows[0].id, bestOfFrames: 5, startedAt: new Date().toISOString(), frames: [], currentFrameIndex: 0 }),
          "home",
          userResult.rows[0].id,
        ]
      );

      await client.query(
        'INSERT INTO "MatchLiveEvent" ("id", "sessionId", "version", "eventType", "payload", "createdByUserId", "createdAt") VALUES (gen_random_uuid()::text, $1, 1, $2, $3::jsonb, $4, NOW())',
        [
          sessionResult.rows[0].id,
          "SESSION_CREATED",
          JSON.stringify({ side: "home" }),
          userResult.rows[0].id,
        ]
      );

      console.log(JSON.stringify({ ok: true, sessionId: sessionResult.rows[0].id }, null, 2));
    } finally {
      await client.query("ROLLBACK");
    }

    return;
  }

  throw new Error(`Unknown mode: ${mode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });