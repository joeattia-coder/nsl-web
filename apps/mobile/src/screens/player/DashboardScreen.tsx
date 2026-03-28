import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { EmptyState } from "../../components/EmptyState";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { StatCard } from "../../components/StatCard";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";

const quickActions = [
  { key: "Tournaments", label: "My Tournaments", icon: "trophy-outline" },
  { key: "Matches", label: "My Matches", icon: "calendar-clock-outline" },
];

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAppSession();
  const { width } = useWindowDimensions();
  const [dashboard, setDashboard] = useState<Awaited<ReturnType<typeof mobileApi.getDashboard>>["dashboard"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mobileApi.getDashboard();

        if (isMounted) {
          setDashboard(response.dashboard);
        }
      } catch (loadError) {
        if (isMounted) {
          setDashboard(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load the dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = useMemo(() => {
    if (!dashboard?.stats) {
      return [];
    }

    return [
      { id: "ranking", label: "Ranking", value: `#${dashboard.rankingPosition ?? "-"}`, tone: "accent" as const },
      { id: "elo", label: "Elo Rating", value: String(dashboard.player.eloRating), helper: "Current live rating", tone: "gold" as const },
      { id: "win-rate", label: "Win Rate", value: `${dashboard.winPercentage}%`, helper: `${dashboard.stats.matchesWon} wins from ${dashboard.stats.matchesPlayed} matches`, tone: "accent" as const },
      { id: "high-break", label: "High Break", value: String(dashboard.stats.highBreak), helper: `Cumulative ${dashboard.stats.highBreakCumulative}`, tone: "gold" as const },
    ];
  }, [dashboard]);

  const performanceMetrics = useMemo(() => {
    if (!dashboard?.stats) {
      return [];
    }

    const matchesPlayed = Math.max(dashboard.stats.matchesPlayed, 1);
    const totalFrames = Math.max(dashboard.stats.framesWon + dashboard.stats.framesLost, 1);

    return [
      {
        id: "points",
        label: "League Points",
        value: String(dashboard.stats.points),
        helper: `${dashboard.stats.matchesWon}-${dashboard.stats.matchesLost} match record`,
        progress: Math.min(1, dashboard.stats.points / matchesPlayed),
      },
      {
        id: "frame-diff",
        label: "Frame Differential",
        value: `${dashboard.stats.frameDifferential >= 0 ? "+" : ""}${dashboard.stats.frameDifferential}`,
        helper: `${dashboard.stats.framesWon} won, ${dashboard.stats.framesLost} lost`,
        progress: Math.min(1, dashboard.stats.framesWon / totalFrames),
      },
      {
        id: "match-volume",
        label: "Match Volume",
        value: String(dashboard.stats.matchesPlayed),
        helper: "Completed matches on record",
        progress: Math.min(1, dashboard.stats.matchesPlayed / 12),
      },
    ];
  }, [dashboard]);

  const statColumns = width >= 720 ? 4 : 2;

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow="Player Dashboard"
        title={dashboard?.player.fullName ?? currentUser.fullName}
        subtitle={currentUser.subtitle}
        initials={currentUser.initials}
        badge={dashboard?.rankingPosition ? `Rank #${dashboard.rankingPosition}` : "NSL Player"}
        tone="gold"
      />

      <SectionHeader title="Season Snapshot" subtitle="Premium at-a-glance player metrics." />
      {isLoading ? (
        <LoadingSkeleton lines={4} height={18} />
      ) : error ? (
        <EmptyState title="Dashboard unavailable" description={error} icon="alert-circle-outline" />
      ) : (
        <View style={styles.statGrid}>
          {statCards.map((item) => (
            <View key={item.id} style={[styles.statCardWrap, statColumns === 4 ? styles.statCardWrapQuarter : styles.statCardWrapHalf]}>
              <StatCard label={item.label} value={item.value} helper={item.helper} tone={item.tone} compact />
            </View>
          ))}
        </View>
      )}

      <SectionHeader title="Performance Snapshot" subtitle="Current trend lines before the next match block." />
      {isLoading ? (
        <LoadingSkeleton lines={3} height={16} />
      ) : error ? null : (
        <View style={styles.panel}>
          {performanceMetrics.map((metric) => (
            <View key={metric.id} style={styles.metricRow}>
              <View style={styles.metricCopy}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
                <Text style={styles.metricHelper}>{metric.helper}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${metric.progress * 100}%` }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      <SectionHeader title="Quick Actions" subtitle="Jump straight into the most-used matchday flows." />
      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <Pressable key={action.key} style={styles.quickActionCard} onPress={() => navigation.navigate(action.key)}>
            <MaterialCommunityIcons name={action.icon as never} size={20} color={appTheme.colors.teal} />
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCardWrap: {
    minWidth: 0,
  },
  statCardWrapHalf: {
    width: "48%",
  },
  statCardWrapQuarter: {
    width: "23%",
  },
  panel: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: appTheme.spacing.lg,
  },
  metricRow: {
    gap: 10,
  },
  metricCopy: {
    gap: 4,
  },
  metricLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  metricValue: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metricHelper: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: appTheme.radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.teal,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  quickActionCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minHeight: 108,
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 12,
    justifyContent: "space-between",
  },
  quickActionLabel: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
});