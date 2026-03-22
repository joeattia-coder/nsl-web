import { config } from "dotenv";

let prismaClient: Awaited<typeof import("../src/lib/prisma")>["prisma"] | null = null;

async function main() {
  config({ path: ".env.local" });
  config({ path: ".env" });

  const [{ prisma }, { recalculateAndPersistPlayerElo }] = await Promise.all([
    import("../src/lib/prisma"),
    import("../src/lib/player-elo"),
  ]);

  prismaClient = prisma;

  await recalculateAndPersistPlayerElo(prisma);
  console.log("Player Elo ratings recalculated and persisted.");
}

main()
  .catch((error) => {
    console.error("Failed to recalculate Elo ratings:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prismaClient?.$disconnect();
  });