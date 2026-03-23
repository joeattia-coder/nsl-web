CREATE TABLE "AccessGroup" (
  "id" TEXT NOT NULL,
  "groupName" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccessGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccessGroup_groupName_key" ON "AccessGroup"("groupName");

CREATE INDEX "AccessGroup_isActive_idx" ON "AccessGroup"("isActive");

CREATE TABLE "AccessGroupMembership" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccessGroupMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccessGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccessGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessGroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AccessGroupMembership_groupId_userId_key" ON "AccessGroupMembership"("groupId", "userId");

CREATE INDEX "AccessGroupMembership_groupId_idx" ON "AccessGroupMembership"("groupId");

CREATE INDEX "AccessGroupMembership_userId_idx" ON "AccessGroupMembership"("userId");

CREATE TABLE "AccessGroupRoleAssignment" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "scopeType" "AssignmentScopeType" NOT NULL,
  "scopeId" TEXT NOT NULL DEFAULT '',
  "grantedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),

  CONSTRAINT "AccessGroupRoleAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AccessGroupRoleAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccessGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessGroupRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AccessGroupRoleAssignment_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "AccessGroupRoleAssignment_groupId_roleId_scopeType_scopeId_key"
ON "AccessGroupRoleAssignment"("groupId", "roleId", "scopeType", "scopeId");

CREATE INDEX "AccessGroupRoleAssignment_groupId_idx" ON "AccessGroupRoleAssignment"("groupId");

CREATE INDEX "AccessGroupRoleAssignment_roleId_idx" ON "AccessGroupRoleAssignment"("roleId");

CREATE INDEX "AccessGroupRoleAssignment_scopeType_scopeId_idx" ON "AccessGroupRoleAssignment"("scopeType", "scopeId");