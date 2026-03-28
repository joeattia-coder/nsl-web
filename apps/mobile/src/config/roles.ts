import type { RoleConfig, UserRole } from "../types/app";

export const roleConfigs: Record<UserRole, RoleConfig> = {
  player: {
    defaultTab: "Dashboard",
    tabs: [
      { routeName: "Home", label: "Home", icon: "home-outline" },
      { routeName: "Dashboard", label: "Dashboard", icon: "view-dashboard-outline" },
      { routeName: "Tournaments", label: "My Tournaments", icon: "trophy-outline" },
      { routeName: "Matches", label: "My Matches", icon: "calendar-clock-outline" },
      { routeName: "Profile", label: "Profile", icon: "account-circle-outline" },
    ],
  },
  tournament_manager: {
    defaultTab: "Overview",
    tabs: [
      { routeName: "Overview", label: "Overview", icon: "shield-star-outline" },
      { routeName: "Tournaments", label: "Tournaments", icon: "trophy-award" },
      { routeName: "Matches", label: "Matches", icon: "calendar-multiselect" },
      { routeName: "Profile", label: "Profile", icon: "account-cog-outline" },
    ],
  },
  league_admin: {
    defaultTab: "Overview",
    tabs: [
      { routeName: "Overview", label: "Overview", icon: "shield-crown-outline" },
      { routeName: "League", label: "League", icon: "sitemap-outline" },
      { routeName: "Matches", label: "Matches", icon: "calendar-check-outline" },
      { routeName: "Profile", label: "Profile", icon: "account-star-outline" },
    ],
  },
};

export function getRoleConfig(role: UserRole) {
  return roleConfigs[role];
}