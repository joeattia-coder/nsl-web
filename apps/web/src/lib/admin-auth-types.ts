export type AdminPermissionScopeType =
  | "GLOBAL"
  | "LEAGUE"
  | "SEASON"
  | "TOURNAMENT"
  | "PLAYER";

export type AdminPermissionScope = {
  scopeType: AdminPermissionScopeType;
  scopeId: string;
};

export type AdminPermissionGrant = AdminPermissionScope & {
  permissionKey: string;
};

export type AdminPermissionOverride = AdminPermissionScope & {
  permissionKey: string;
  effect: "ALLOW" | "DENY";
};

export type CurrentAdminUserSummary = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  linkedPlayerId: string | null;
  isGlobalAdmin: boolean;
  isAdmin: boolean;
  isPlayer: boolean;
  permissions: string[];
  permissionGrants: AdminPermissionGrant[];
  permissionOverrides: AdminPermissionOverride[];
  source: "session";
};