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
  const adminRole = await prisma.roles.upsert({
    where: { role_name: "Admin" },
    update: {},
    create: {
      role_name: "Admin",
      role_description: "Full access to manage the site",
    },
  });

  await prisma.roles.upsert({
    where: { role_name: "League Manager" },
    update: {},
    create: {
      role_name: "League Manager",
      role_description: "Can manage seasons, fixtures, standings, and tournaments",
    },
  });

  await prisma.roles.upsert({
    where: { role_name: "Player" },
    update: {},
    create: {
      role_name: "Player",
      role_description: "Can manage personal profile and player-related data",
    },
  });

  await prisma.seasons.upsert({
    where: { seasonID: 1n },
    update: {
      seasonName: "2025-2026 Season 1",
      currentSeason: true,
    },
    create: {
      seasonID: 1n,
      seasonName: "2025-2026 Season 1",
      currentSeason: true,
    },
  });

  await prisma.users.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      display_name: "Site Admin",
      role_id: adminRole.role_id,
      is_login_enabled: true,
      is_active: true,
    },
  });

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });