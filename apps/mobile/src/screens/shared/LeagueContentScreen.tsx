import type { RouteProp } from "@react-navigation/native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SegmentedControl } from "../../components/SegmentedControl";
import { SectionHeader } from "../../components/SectionHeader";
import { leagueGroups, leagueRankings, leagueResults, tournaments } from "../../data/mock-data";
import { appTheme } from "../../theme";
import type { LeagueBrowseSection, RootStackParamList } from "../../types/app";

const items = [
  { key: "tournaments", label: "Tournaments" },
  { key: "results", label: "Results" },
  { key: "rankings", label: "Rankings" },
  { key: "groups", label: "Groups" },
];

type LeagueContentScreenProps = {
  route?: RouteProp<RootStackParamList, "LeagueContent">;
};

export function LeagueContentScreen({ route }: LeagueContentScreenProps) {
  const [section, setSection] = useState<LeagueBrowseSection>(route?.params?.initialSection ?? "tournaments");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>League Browser</Text>
          <Text style={styles.title}>All Competition Content</Text>
          <Text style={styles.copy}>One mobile route for all tournaments, results, rankings, and divisions without forcing users through desktop-style tables.</Text>
        </View>

        <SegmentedControl items={items} value={section} onChange={(value) => setSection(value as LeagueBrowseSection)} />

        {section === "tournaments" ? (
          <>
            <SectionHeader title="All Tournaments" subtitle="League-wide events available to browse." />
            <View style={styles.stack}>
              {tournaments.map((tournament) => (
                <View key={tournament.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{tournament.name}</Text>
                  <Text style={styles.cardMeta}>{tournament.division}</Text>
                  <Text style={styles.cardBody}>{tournament.shortDescription}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {section === "results" ? (
          <>
            <SectionHeader title="Match Results" subtitle="Freshly published result cards for the current window." />
            <View style={styles.stack}>
              {leagueResults.map((result) => (
                <View key={result.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{result.title}</Text>
                  <Text style={styles.cardMeta}>{result.meta} • {result.status}</Text>
                  <Text style={styles.cardBody}>{result.summary}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {section === "rankings" ? (
          <>
            <SectionHeader title="League Rankings" subtitle="Compact ladder cards tuned for phones." />
            <View style={styles.stack}>
              {leagueRankings.map((ranking) => (
                <View key={ranking.id} style={styles.rankingCard}>
                  <Text style={styles.rank}>{ranking.position}</Text>
                  <View style={styles.rankCopy}>
                    <Text style={styles.cardTitle}>{ranking.player}</Text>
                    <Text style={styles.cardMeta}>{ranking.points} points</Text>
                  </View>
                  <Text style={styles.movement}>{ranking.movement}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {section === "groups" ? (
          <>
            <SectionHeader title="Divisions & Groups" subtitle="Mobile-friendly group snapshots instead of a cramped standings table." />
            <View style={styles.stack}>
              {leagueGroups.map((group) => (
                <View key={group.id} style={styles.card}>
                  <Text style={styles.cardTitle}>{group.title}</Text>
                  <Text style={styles.cardMeta}>{group.venue}</Text>
                  <Text style={styles.cardBody}>Leader: {group.leader}</Text>
                  <Text style={styles.cardMeta}>{group.update}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.lg,
    paddingBottom: 120,
  },
  heroCard: {
    padding: appTheme.spacing.xl,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 8,
  },
  eyebrow: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  copy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  stack: {
    gap: 12,
  },
  card: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 8,
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cardMeta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  cardBody: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  rankingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  rank: {
    width: 28,
    color: appTheme.colors.gold,
    fontSize: 22,
    fontWeight: "900",
  },
  rankCopy: {
    flex: 1,
    gap: 4,
  },
  movement: {
    color: appTheme.colors.teal,
    fontSize: 14,
    fontWeight: "800",
  },
});