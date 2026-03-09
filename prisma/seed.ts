import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { roleName: "Admin" },
    update: {},
    create: {
      roleName: "Admin",
      description: "Full access to manage the site",
    },
  });

  const leagueManagerRole = await prisma.role.upsert({
    where: { roleName: "League Manager" },
    update: {},
    create: {
      roleName: "League Manager",
      description: "Can manage seasons, fixtures, standings, and tournaments",
    },
  });

  const playerRole = await prisma.role.upsert({
    where: { roleName: "Player" },
    update: {},
    create: {
      roleName: "Player",
      description: "Can manage personal profile and player-related data",
    },
  });

  const season = await prisma.season.upsert({
    where: { seasonName: "2025-2026 Season 1" },
    update: {
      isActive: true,
    },
    create: {
      seasonName: "2025-2026 Season 1",
      isActive: true,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      isLoginEnabled: true,
      registrationStatus: "ACTIVE",
    },
    create: {
      email: "admin@example.com",
      isLoginEnabled: true,
      registrationStatus: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log("Seed complete");
  console.log({
    adminRole: adminRole.roleName,
    leagueManagerRole: leagueManagerRole.roleName,
    playerRole: playerRole.roleName,
    season: season.seasonName,
    adminUser: adminUser.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });