import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { getRoleConfig } from "../../config/roles";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { roleOverviewMetrics } from "../../data/mock-data";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";

export function OverviewScreen() {
  const navigation = useNavigation<any>();
  const { currentRole, currentUser } = useAppSession();
  const metrics = roleOverviewMetrics[currentRole];
  const roleConfig = getRoleConfig(currentRole);

  const actions = useMemo(() => {
    const availableTabs = new Set(roleConfig.tabs.map((tab) => tab.routeName));
    const nextActions: Array<{ key: string; label: string; target: () => void }> = [];

    if (availableTabs.has("Tournaments")) {
      nextActions.push({
        key: "Tournaments",
        label: "Open Tournaments",
        target: () => navigation.navigate("Tournaments"),
      });
    } else {
      nextActions.push({
        key: "LeagueContentTournaments",
        label: "Browse Tournaments",
        target: () => navigation.navigate("LeagueContent", { initialSection: "tournaments" }),
      });
    }

    if (availableTabs.has("Matches")) {
      nextActions.push({
        key: "Matches",
        label: "Review Matches",
        target: () => navigation.navigate("Matches"),
      });
    }

    nextActions.push({
      key: "LeagueContent",
      label: "League Browser",
      target: () => navigation.navigate("LeagueContent", { initialSection: "tournaments" }),
    });

    return nextActions;
  }, [navigation, roleConfig.tabs]);

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow={currentRole === "tournament_manager" ? "Tournament Manager" : "League Admin"}
        title="Operations Overview"
        subtitle="Role-aware landing screen for non-player sessions so navigation and actions remain driven by the same config system."
        initials={currentUser.initials}
        badge="Role aware shell"
      />

      <SectionHeader title="Control Metrics" subtitle="Mock operational signals for this signed-in role." />
      <View style={styles.metricStack}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricHelper}>{metric.helper}</Text>
          </View>
        ))}
      </View>

      <SectionHeader title="Quick Actions" subtitle="Open core league workflows from the role-aware shell." />
      <View style={styles.actionStack}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={styles.actionCard}
            onPress={action.target}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionCopy}>Role-specific actions can branch further once live permissions land.</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  metricStack: {
    gap: 12,
  },
  metricCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 6,
  },
  metricLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  metricValue: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  metricHelper: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 20,
  },
  actionStack: {
    gap: 12,
  },
  actionCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 6,
  },
  actionLabel: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  actionCopy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 20,
  },
});