import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection URL is not set. Expected DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({ adapter });

const ROLE_DEFINITIONS = [
  {
    roleKey: "ADMINISTRATOR",
    roleName: "Administrator",
    description: "Full system access across all leagues, tournaments, users, and content.",
  },
  {
    roleKey: "LEAGUE_ADMIN",
    roleName: "League Administrator",
    description: "Can manage assigned leagues and the seasons, tournaments, players, and operations within them.",
  },
  {
    roleKey: "LEAGUE_OPERATOR",
    roleName: "League Operator",
    description: "Can operate assigned leagues day to day without full administrative control.",
  },
  {
    roleKey: "TOURNAMENT_ADMIN",
    roleName: "Tournament Administrator",
    description: "Can fully manage assigned tournaments, structures, entries, and matches.",
  },
  {
    roleKey: "TOURNAMENT_OPERATOR",
    roleName: "Tournament Operator",
    description: "Can operate assigned tournaments day to day without system-wide access.",
  },
  {
    roleKey: "PLAYER",
    roleName: "Player",
    description: "Can manage personal profile and account settings.",
  },
];

const PERMISSION_DEFINITIONS = [
  { permissionKey: "dashboard.view", permissionName: "View dashboard", category: "System", description: "View an admin dashboard for the current scope." },
  { permissionKey: "users.view", permissionName: "View users", category: "System", description: "View user accounts." },
  { permissionKey: "users.create", permissionName: "Create users", category: "System", description: "Create user accounts." },
  { permissionKey: "users.edit", permissionName: "Edit users", category: "System", description: "Edit user account details." },
  { permissionKey: "users.invite", permissionName: "Invite users", category: "System", description: "Send account setup invitations." },
  { permissionKey: "users.disable", permissionName: "Disable users", category: "System", description: "Disable user accounts." },
  { permissionKey: "roles.view", permissionName: "View roles", category: "System", description: "View role definitions." },
  { permissionKey: "roles.manage", permissionName: "Manage roles", category: "System", description: "Create and edit role definitions." },
  { permissionKey: "permissions.view", permissionName: "View permissions", category: "System", description: "View permission definitions." },
  { permissionKey: "permissions.manage", permissionName: "Manage permissions", category: "System", description: "Create and edit permission definitions." },
  { permissionKey: "leagues.view", permissionName: "View leagues", category: "Leagues", description: "View leagues." },
  { permissionKey: "leagues.create", permissionName: "Create leagues", category: "Leagues", description: "Create leagues." },
  { permissionKey: "leagues.edit", permissionName: "Edit leagues", category: "Leagues", description: "Edit leagues." },
  { permissionKey: "leagues.delete", permissionName: "Delete leagues", category: "Leagues", description: "Delete leagues." },
  { permissionKey: "seasons.view", permissionName: "View seasons", category: "Leagues", description: "View seasons." },
  { permissionKey: "seasons.create", permissionName: "Create seasons", category: "Leagues", description: "Create seasons." },
  { permissionKey: "seasons.edit", permissionName: "Edit seasons", category: "Leagues", description: "Edit seasons." },
  { permissionKey: "seasons.delete", permissionName: "Delete seasons", category: "Leagues", description: "Delete seasons." },
  { permissionKey: "tournaments.view", permissionName: "View tournaments", category: "Tournaments", description: "View tournaments." },
  { permissionKey: "tournaments.create", permissionName: "Create tournaments", category: "Tournaments", description: "Create tournaments." },
  { permissionKey: "tournaments.edit", permissionName: "Edit tournaments", category: "Tournaments", description: "Edit tournaments." },
  { permissionKey: "tournaments.delete", permissionName: "Delete tournaments", category: "Tournaments", description: "Delete tournaments." },
  { permissionKey: "tournaments.publish", permissionName: "Publish tournaments", category: "Tournaments", description: "Publish tournaments to public pages." },
  { permissionKey: "stages.view", permissionName: "View stages", category: "Tournaments", description: "View tournament stages." },
  { permissionKey: "stages.create", permissionName: "Create stages", category: "Tournaments", description: "Create tournament stages." },
  { permissionKey: "stages.edit", permissionName: "Edit stages", category: "Tournaments", description: "Edit tournament stages." },
  { permissionKey: "stages.delete", permissionName: "Delete stages", category: "Tournaments", description: "Delete tournament stages." },
  { permissionKey: "rounds.view", permissionName: "View rounds", category: "Tournaments", description: "View stage rounds." },
  { permissionKey: "rounds.create", permissionName: "Create rounds", category: "Tournaments", description: "Create stage rounds." },
  { permissionKey: "rounds.edit", permissionName: "Edit rounds", category: "Tournaments", description: "Edit stage rounds." },
  { permissionKey: "rounds.delete", permissionName: "Delete rounds", category: "Tournaments", description: "Delete stage rounds." },
  { permissionKey: "groups.view", permissionName: "View groups", category: "Tournaments", description: "View groups within rounds." },
  { permissionKey: "groups.create", permissionName: "Create groups", category: "Tournaments", description: "Create groups within rounds." },
  { permissionKey: "groups.edit", permissionName: "Edit groups", category: "Tournaments", description: "Edit groups within rounds." },
  { permissionKey: "groups.delete", permissionName: "Delete groups", category: "Tournaments", description: "Delete groups within rounds." },
  { permissionKey: "entries.view", permissionName: "View entries", category: "Tournaments", description: "View tournament entries." },
  { permissionKey: "entries.create", permissionName: "Create entries", category: "Tournaments", description: "Create tournament entries." },
  { permissionKey: "entries.edit", permissionName: "Edit entries", category: "Tournaments", description: "Edit tournament entries." },
  { permissionKey: "entries.delete", permissionName: "Delete entries", category: "Tournaments", description: "Delete tournament entries." },
  { permissionKey: "matches.view", permissionName: "View matches", category: "Tournaments", description: "View matches." },
  { permissionKey: "matches.create", permissionName: "Create matches", category: "Tournaments", description: "Create matches." },
  { permissionKey: "matches.edit", permissionName: "Edit matches", category: "Tournaments", description: "Edit matches and results." },
  { permissionKey: "matches.delete", permissionName: "Delete matches", category: "Tournaments", description: "Delete matches." },
  { permissionKey: "matches.approve", permissionName: "Approve matches", category: "Tournaments", description: "Approve submitted match results." },
  { permissionKey: "players.view", permissionName: "View players", category: "Players", description: "View player profiles." },
  { permissionKey: "players.create", permissionName: "Create players", category: "Players", description: "Create player profiles." },
  { permissionKey: "players.edit", permissionName: "Edit players", category: "Players", description: "Edit player profiles." },
  { permissionKey: "players.delete", permissionName: "Delete players", category: "Players", description: "Delete player profiles." },
  { permissionKey: "players.invite", permissionName: "Invite players", category: "Players", description: "Send player account setup invitations." },
  { permissionKey: "venues.view", permissionName: "View venues", category: "Venues", description: "View venues." },
  { permissionKey: "venues.create", permissionName: "Create venues", category: "Venues", description: "Create venues." },
  { permissionKey: "venues.edit", permissionName: "Edit venues", category: "Venues", description: "Edit venues." },
  { permissionKey: "venues.delete", permissionName: "Delete venues", category: "Venues", description: "Delete venues." },
  { permissionKey: "news.view", permissionName: "View news", category: "Content", description: "View news management pages." },
  { permissionKey: "news.create", permissionName: "Create news", category: "Content", description: "Create news articles." },
  { permissionKey: "news.edit", permissionName: "Edit news", category: "Content", description: "Edit news articles." },
  { permissionKey: "news.delete", permissionName: "Delete news", category: "Content", description: "Delete news articles." },
  { permissionKey: "news.publish", permissionName: "Publish news", category: "Content", description: "Publish news articles." },
  { permissionKey: "videos.view", permissionName: "View videos", category: "Content", description: "View video highlight management pages." },
  { permissionKey: "videos.create", permissionName: "Create videos", category: "Content", description: "Create video highlights." },
  { permissionKey: "videos.edit", permissionName: "Edit videos", category: "Content", description: "Edit video highlights." },
  { permissionKey: "videos.delete", permissionName: "Delete videos", category: "Content", description: "Delete video highlights." },
  { permissionKey: "faqs.view", permissionName: "View FAQs", category: "Content", description: "View FAQ management pages." },
  { permissionKey: "faqs.create", permissionName: "Create FAQs", category: "Content", description: "Create FAQ entries." },
  { permissionKey: "faqs.edit", permissionName: "Edit FAQs", category: "Content", description: "Edit FAQ entries." },
  { permissionKey: "faqs.delete", permissionName: "Delete FAQs", category: "Content", description: "Delete FAQ entries." },
  { permissionKey: "faqs.publish", permissionName: "Publish FAQs", category: "Content", description: "Publish FAQ entries." },
  { permissionKey: "profile.self.view", permissionName: "View own profile", category: "Self Service", description: "View the signed-in player's profile." },
  { permissionKey: "profile.self.edit", permissionName: "Edit own profile", category: "Self Service", description: "Edit the signed-in player's profile." },
  { permissionKey: "account.self.manage", permissionName: "Manage own account", category: "Self Service", description: "Manage the signed-in user's username, password, and connected login methods." },
];

const ALL_PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((permission) => permission.permissionKey);

const ROLE_PERMISSION_MAP = {
  ADMINISTRATOR: ALL_PERMISSION_KEYS,
  LEAGUE_ADMIN: [
    "dashboard.view",
    "leagues.view",
    "leagues.edit",
    "seasons.view",
    "seasons.create",
    "seasons.edit",
    "seasons.delete",
    "tournaments.view",
    "tournaments.create",
    "tournaments.edit",
    "tournaments.delete",
    "tournaments.publish",
    "stages.view",
    "stages.create",
    "stages.edit",
    "stages.delete",
    "rounds.view",
    "rounds.create",
    "rounds.edit",
    "rounds.delete",
    "groups.view",
    "groups.create",
    "groups.edit",
    "groups.delete",
    "entries.view",
    "entries.create",
    "entries.edit",
    "entries.delete",
    "matches.view",
    "matches.create",
    "matches.edit",
    "matches.delete",
    "matches.approve",
    "players.view",
    "players.create",
    "players.edit",
    "players.invite",
    "venues.view",
    "venues.create",
    "venues.edit",
  ],
  LEAGUE_OPERATOR: [
    "dashboard.view",
    "leagues.view",
    "seasons.view",
    "tournaments.view",
    "stages.view",
    "rounds.view",
    "groups.view",
    "entries.view",
    "entries.create",
    "entries.edit",
    "entries.delete",
    "matches.view",
    "matches.create",
    "matches.edit",
    "players.view",
    "venues.view",
  ],
  TOURNAMENT_ADMIN: [
    "dashboard.view",
    "tournaments.view",
    "tournaments.edit",
    "tournaments.delete",
    "tournaments.publish",
    "stages.view",
    "stages.create",
    "stages.edit",
    "stages.delete",
    "rounds.view",
    "rounds.create",
    "rounds.edit",
    "rounds.delete",
    "groups.view",
    "groups.create",
    "groups.edit",
    "groups.delete",
    "entries.view",
    "entries.create",
    "entries.edit",
    "entries.delete",
    "matches.view",
    "matches.create",
    "matches.edit",
    "matches.delete",
    "matches.approve",
    "players.view",
    "players.create",
    "players.edit",
    "players.invite",
    "venues.view",
  ],
  TOURNAMENT_OPERATOR: [
    "dashboard.view",
    "tournaments.view",
    "stages.view",
    "rounds.view",
    "groups.view",
    "entries.view",
    "entries.create",
    "entries.edit",
    "entries.delete",
    "matches.view",
    "matches.create",
    "matches.edit",
    "players.view",
    "venues.view",
  ],
  PLAYER: [
    "profile.self.view",
    "profile.self.edit",
    "account.self.manage",
  ],
};

async function main() {
  const now = new Date();

  const league = await prisma.league.upsert({
    where: { leagueName: "National Snooker League" },
    update: {
      description: "Default league",
      isActive: true,
      updatedAt: now,
    },
    create: {
      id: "nsl-league",
      leagueName: "National Snooker League",
      description: "Default league",
      isActive: true,
      updatedAt: now,
      createdAt: now,
    },
  });

  const rolesByKey: Record<string, { id: string; roleName: string }> = {};
  for (const roleDefinition of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { roleKey: roleDefinition.roleKey },
      update: {
        roleName: roleDefinition.roleName,
        description: roleDefinition.description,
        isSystemRole: true,
      },
      create: {
        roleKey: roleDefinition.roleKey,
        roleName: roleDefinition.roleName,
        description: roleDefinition.description,
        isSystemRole: true,
      },
    });

    rolesByKey[roleDefinition.roleKey] = role;
  }

  const permissionsByKey: Record<string, { id: string }> = {};
  for (const permissionDefinition of PERMISSION_DEFINITIONS) {
    const permission = await prisma.permission.upsert({
      where: { permissionKey: permissionDefinition.permissionKey },
      update: {
        permissionName: permissionDefinition.permissionName,
        description: permissionDefinition.description,
        category: permissionDefinition.category,
      },
      create: permissionDefinition,
    });

    permissionsByKey[permissionDefinition.permissionKey] = permission;
  }

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = rolesByKey[roleKey];
    if (!role) continue;

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    await prisma.rolePermission.createMany({
      data: permissionKeys.map((permissionKey) => ({
        roleId: role.id,
        permissionId: permissionsByKey[permissionKey].id,
      })),
      skipDuplicates: true,
    });
  }

  const season = await prisma.season.upsert({
    where: { seasonName: "2025-2026 Season 1" },
    update: {
      isActive: true,
      leagueId: league.id,
    },
    create: {
      seasonName: "2025-2026 Season 1",
      isActive: true,
      leagueId: league.id,
    },
  });

  await prisma.season.updateMany({
    where: { leagueId: null },
    data: { leagueId: league.id },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      username: "admin",
      normalizedUsername: "admin",
      normalizedEmail: "admin@example.com",
      emailVerifiedAt: now,
      isLoginEnabled: true,
      registrationStatus: "ACTIVE",
    },
    create: {
      username: "admin",
      normalizedUsername: "admin",
      email: "admin@example.com",
      normalizedEmail: "admin@example.com",
      emailVerifiedAt: now,
      isLoginEnabled: true,
      registrationStatus: "ACTIVE",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: rolesByKey.ADMINISTRATOR.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: rolesByKey.ADMINISTRATOR.id,
    },
  });

  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId_scopeType_scopeId: {
        userId: adminUser.id,
        roleId: rolesByKey.ADMINISTRATOR.id,
        scopeType: "GLOBAL",
        scopeId: "",
      },
    },
    update: {
      expiresAt: null,
    },
    create: {
      userId: adminUser.id,
      roleId: rolesByKey.ADMINISTRATOR.id,
      scopeType: "GLOBAL",
      scopeId: "",
    },
  });

  console.log("Seed complete");
  console.log({
    league: league.leagueName,
    roles: ROLE_DEFINITIONS.map((role) => role.roleName),
    permissions: PERMISSION_DEFINITIONS.length,
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