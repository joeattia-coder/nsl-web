CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

CREATE TYPE "InvitationPurpose" AS ENUM ('ACCOUNT_SETUP', 'PASSWORDLESS_LOGIN');

CREATE TYPE "AssignmentScopeType" AS ENUM ('GLOBAL', 'LEAGUE', 'SEASON', 'TOURNAMENT', 'PLAYER');

CREATE TYPE "PermissionEffect" AS ENUM ('ALLOW', 'DENY');

ALTER TABLE "User"
  ADD COLUMN "username" TEXT,
  ADD COLUMN "normalizedUsername" TEXT,
  ADD COLUMN "normalizedEmail" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "passwordSetAt" TIMESTAMP(3);

UPDATE "User"
SET "normalizedEmail" = LOWER("email")
WHERE "email" IS NOT NULL AND "normalizedEmail" IS NULL;

UPDATE "User"
SET "normalizedUsername" = LOWER("username")
WHERE "username" IS NOT NULL AND "normalizedUsername" IS NULL;

ALTER TABLE "Role"
  ADD COLUMN "roleKey" TEXT,
  ADD COLUMN "isSystemRole" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Role"
SET "roleKey" = CASE
  WHEN "roleName" = 'Admin' THEN 'ADMINISTRATOR'
  WHEN "roleName" = 'Administrator' THEN 'ADMINISTRATOR'
  WHEN "roleName" = 'League Manager' THEN 'LEAGUE_ADMIN'
  WHEN "roleName" = 'League Administrator' THEN 'LEAGUE_ADMIN'
  WHEN "roleName" = 'League Operator' THEN 'LEAGUE_OPERATOR'
  WHEN "roleName" = 'Tournament Administrator' THEN 'TOURNAMENT_ADMIN'
  WHEN "roleName" = 'Tournament Operator' THEN 'TOURNAMENT_OPERATOR'
  WHEN "roleName" = 'Player' THEN 'PLAYER'
  ELSE UPPER(REGEXP_REPLACE("roleName", '[^A-Za-z0-9]+', '_', 'g'))
END
WHERE "roleKey" IS NULL;

ALTER TABLE "Role"
  ALTER COLUMN "roleKey" SET NOT NULL;

CREATE UNIQUE INDEX "User_normalizedUsername_key" ON "User"("normalizedUsername");

CREATE UNIQUE INDEX "User_normalizedEmail_key" ON "User"("normalizedEmail");

CREATE UNIQUE INDEX "Role_roleKey_key" ON "Role"("roleKey");

CREATE TABLE "AuthAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "providerEmail" TEXT,
  "providerEmailNormalized" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AuthAccount_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AuthAccount_provider_providerAccountId_key" ON "AuthAccount"("provider", "providerAccountId");

CREATE INDEX "AuthAccount_userId_idx" ON "AuthAccount"("userId");

CREATE INDEX "AuthAccount_providerEmailNormalized_idx" ON "AuthAccount"("providerEmailNormalized");

CREATE TABLE "Invitation" (
  "id" TEXT NOT NULL,
  "playerId" TEXT,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "purpose" "InvitationPurpose" NOT NULL DEFAULT 'ACCOUNT_SETUP',
  "tokenHash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "acceptedByUserId" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Invitation_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invitation_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Invitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

CREATE INDEX "Invitation_playerId_idx" ON "Invitation"("playerId");

CREATE INDEX "Invitation_userId_idx" ON "Invitation"("userId");

CREATE INDEX "Invitation_normalizedEmail_idx" ON "Invitation"("normalizedEmail");

CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

CREATE INDEX "Invitation_expiresAt_idx" ON "Invitation"("expiresAt");

CREATE TABLE "EmailVerificationToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT NOT NULL,
  "normalizedEmail" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");

CREATE INDEX "EmailVerificationToken_normalizedEmail_idx" ON "EmailVerificationToken"("normalizedEmail");

CREATE INDEX "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

CREATE TABLE "PasswordResetToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "permissionKey" TEXT NOT NULL,
  "permissionName" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Permission_permissionKey_key" ON "Permission"("permissionKey");

CREATE INDEX "Permission_category_idx" ON "Permission"("category");

CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

CREATE TABLE "UserRoleAssignment" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "scopeType" "AssignmentScopeType" NOT NULL,
  "scopeId" TEXT NOT NULL DEFAULT '',
  "grantedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserRoleAssignment_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserRoleAssignment_userId_roleId_scopeType_scopeId_key" ON "UserRoleAssignment"("userId", "roleId", "scopeType", "scopeId");

CREATE INDEX "UserRoleAssignment_userId_idx" ON "UserRoleAssignment"("userId");

CREATE INDEX "UserRoleAssignment_roleId_idx" ON "UserRoleAssignment"("roleId");

CREATE INDEX "UserRoleAssignment_scopeType_scopeId_idx" ON "UserRoleAssignment"("scopeType", "scopeId");

CREATE TABLE "UserPermissionOverride" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "scopeType" "AssignmentScopeType" NOT NULL,
  "scopeId" TEXT NOT NULL DEFAULT '',
  "effect" "PermissionEffect" NOT NULL,
  "reason" TEXT,
  "grantedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "UserPermissionOverride_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPermissionOverride_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPermissionOverride_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPermissionOverride_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserPermissionOverride_userId_permissionId_scopeType_scopeId_key" ON "UserPermissionOverride"("userId", "permissionId", "scopeType", "scopeId");

CREATE INDEX "UserPermissionOverride_userId_idx" ON "UserPermissionOverride"("userId");

CREATE INDEX "UserPermissionOverride_permissionId_idx" ON "UserPermissionOverride"("permissionId");

CREATE INDEX "UserPermissionOverride_scopeType_scopeId_idx" ON "UserPermissionOverride"("scopeType", "scopeId");