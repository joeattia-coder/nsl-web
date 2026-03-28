import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ComponentType } from "react";

import { getRoleConfig } from "../config/roles";
import { BottomTabBar } from "../components/BottomTabBar";
import { ProfileScreen } from "../screens/player/ProfileScreen";
import { DashboardScreen } from "../screens/player/DashboardScreen";
import { HomeScreen } from "../screens/player/HomeScreen";
import { MatchesScreen } from "../screens/player/MatchesScreen";
import { TournamentDetailScreen } from "../screens/player/TournamentDetailScreen";
import { TournamentsScreen } from "../screens/player/TournamentsScreen";
import { ChangePasswordScreen } from "../screens/shared/ChangePasswordScreen";
import { LeagueContentScreen } from "../screens/shared/LeagueContentScreen";
import { OverviewScreen } from "../screens/shared/OverviewScreen";
import { useAppSession } from "../state/app-session";
import type { MainTabParamList, TabRouteName } from "../types/app";

const Tab = createBottomTabNavigator<MainTabParamList>();

const screenRegistry: Record<TabRouteName, ComponentType<any>> = {
  Home: HomeScreen,
  Dashboard: DashboardScreen,
  Tournaments: TournamentsScreen,
  Matches: MatchesScreen,
  Profile: ProfileScreen,
  Overview: OverviewScreen,
  League: LeagueContentScreen,
  TournamentDetail: TournamentDetailScreen,
  LeagueContent: LeagueContentScreen,
  ChangePassword: ChangePasswordScreen,
};

export function RoleTabs() {
  const { currentRole } = useAppSession();
  const config = getRoleConfig(currentRole);

  return (
    <Tab.Navigator
      key={currentRole}
      initialRouteName={config.defaultTab}
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        animation: "shift",
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      {config.tabs.map((tab) => {
        const Component = screenRegistry[tab.routeName];

        return <Tab.Screen key={tab.routeName} name={tab.routeName} component={Component} />;
      })}
      <Tab.Screen name="TournamentDetail" component={TournamentDetailScreen} />
      <Tab.Screen name="LeagueContent" component={LeagueContentScreen} />
      <Tab.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Tab.Navigator>
  );
}