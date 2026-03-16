export type CurrentAdminUserSummary = {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string;
  linkedPlayerId: string | null;
  isGlobalAdmin: boolean;
  permissions: string[];
  source: "session";
};