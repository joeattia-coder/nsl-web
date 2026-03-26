import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getRoleConfig } from "../config/roles";
import { useAppSession } from "../state/app-session";
import { appTheme } from "../theme";
import type { TabRouteName } from "../types/app";
import { TabBarIcon } from "./TabBarIcon";

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { currentRole } = useAppSession();
  const config = getRoleConfig(currentRole);
  const activeRouteName = state.routes[state.index]?.name as TabRouteName | undefined;
  const activeTabRouteName = getVisibleActiveRouteName(activeRouteName, currentRole);

  return (
    <LinearGradient
      colors={[appTheme.colors.tabBarTop, appTheme.colors.tabBarBottom]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.outerWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.topRule} />
      <View style={styles.bar}>
        {config.tabs.map((tab) => {
          const route = state.routes.find((entry) => entry.name === tab.routeName);
          const isFocused = tab.routeName === activeTabRouteName;

          const onPress = () => {
            const event = route
              ? navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                })
              : { defaultPrevented: false };

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(tab.routeName);
            }
          };

          return (
            <Pressable key={tab.routeName} onPress={onPress} style={styles.tabPressable}>
              <View style={styles.iconStack}>
                <TabBarIcon
                  routeName={tab.routeName}
                  size={22}
                  color={isFocused ? appTheme.colors.orange : appTheme.colors.textMuted}
                  strokeWidth={isFocused ? 1.85 : 1.35}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    backgroundColor: "transparent",
    paddingHorizontal: appTheme.spacing.md,
    paddingTop: 8,
  },
  topRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginHorizontal: -appTheme.spacing.md,
    marginBottom: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 2,
  },
  tabPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconStack: {
    height: 50,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    width: "100%",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 11,
    textAlign: "center",
    includeFontPadding: false,
  },
  labelActive: {
    color: appTheme.colors.orange,
  },
  labelInactive: {
    opacity: 0,
  },
});

function getVisibleActiveRouteName(routeName: TabRouteName | undefined, role: ReturnType<typeof useAppSession>["currentRole"]): TabRouteName | undefined {
  if (!routeName) {
    return undefined;
  }

  if (routeName === "TournamentDetail") {
    return "Tournaments";
  }

  if (routeName === "ChangePassword") {
    return "Profile";
  }

  if (routeName === "LeagueContent") {
    return role === "league_admin" ? "League" : role === "tournament_manager" ? "Overview" : "Tournaments";
  }

  return routeName;
}