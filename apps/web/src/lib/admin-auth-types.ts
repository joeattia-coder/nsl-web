export type CurrentAdminUserSummary = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  linkedPlayerId: string | null;
  isGlobalAdmin: boolean;
  isAdmin: boolean;
  permissions: string[];
  source: "session";
};