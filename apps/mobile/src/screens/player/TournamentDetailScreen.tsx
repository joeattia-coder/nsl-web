import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { mobileApi } from "../../lib/mobile-api";
import { appTheme } from "../../theme";
import type { RootStackParamList } from "../../types/app";

type Props = NativeStackScreenProps<RootStackParamList, "TournamentDetail">;

const tabs = [
  { key: "groups", label: "Groups" },
  { key: "rankings", label: "Rankings" },
];

export function TournamentDetailScreen({ navigation, route }: Props) {
  const [view, setView] = useState("groups");
  const [tournament, setTournament] = useState<Awaited<ReturnType<typeof mobileApi.getPublicTournaments>>["tournaments"][number] | null>(null);
  const [standings, setStandings] = useState<Awaited<ReturnType<typeof mobileApi.getTournamentStandings>> | null>(null);
  const [rankings, setRankings] = useState<Awaited<ReturnType<typeof mobileApi.getTournamentRankings>>["players"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadTournament = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [registeredResponse, publicResponse, standingsResponse, rankingsResponse] = await Promise.all([
          mobileApi.getMyTournaments().catch(() => ({ tournaments: [] })),
          mobileApi.getPublicTournaments(),
          mobileApi.getTournamentStandings(route.params.tournamentId),
          mobileApi.getTournamentRankings(route.params.tournamentId),
        ]);

        if (!isMounted) {
          return;
        }

        const foundTournament = [...registeredResponse.tournaments, ...publicResponse.tournaments].find(
          (entry) => entry.id === route.params.tournamentId
        ) || null;

        setTournament(foundTournament);
        setStandings(standingsResponse);
        setRankings(rankingsResponse.players);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load this tournament.");
          setTournament(null);
          setStandings(null);
          setRankings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadTournament();

    return () => {
      isMounted = false;
    };
  }, [route.params.tournamentId]);

  const formattedStatus = useMemo(() => {
    if (!tournament) {
      return null;
    }

    return tournament.status
      .toLowerCase()
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }, [tournament]);

  if (!tournament && !isLoading && !error) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
        <EmptyState title="Tournament not found" description="This tournament is not visible to your current player session." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={appTheme.colors.text} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate("LeagueContent", { initialSection: view === "groups" ? "groups" : "rankings" })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>League View</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <LoadingSkeleton lines={5} height={20} />
        ) : error ? (
          <EmptyState title="Tournament unavailable" description={error} icon="alert-circle-outline" />
        ) : tournament ? (
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>{tournament.seasonName ?? tournament.participantType}</Text>
            <Text style={styles.title}>{tournament.tournamentName}</Text>
            <Text style={styles.subtitle}>{tournament.description?.trim() || "Live standings and rankings for your selected tournament."}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{tournament.venueName ?? "Venue TBC"}</Text>
              <Text style={styles.meta}>{formattedStatus}</Text>
            </View>
          </View>
        ) : null}

        <SegmentedControl items={tabs} value={view} onChange={setView} />

        {view === "groups" ? (
          isLoading ? (
            <LoadingSkeleton lines={6} height={16} />
          ) : standings && standings.groups.length > 0 ? (
          <View style={styles.stack}>
            {standings.groups.map((group) => (
              <View key={group.standingsDesc} style={styles.groupCard}>
                <Text style={styles.groupTitle}>{group.standingsDesc}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableWrap}>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      <Text style={[styles.tableHeaderCell, styles.rankCell]}>#</Text>
                      <Text style={[styles.tableHeaderCell, styles.playerCell]}>Player</Text>
                      <Text style={[styles.tableHeaderCell, styles.numberCell]}>P</Text>
                      <Text style={[styles.tableHeaderCell, styles.numberCell]}>W</Text>
                      <Text style={[styles.tableHeaderCell, styles.numberCell]}>L</Text>
                      <Text style={[styles.tableHeaderCell, styles.numberCell]}>+/-</Text>
                      <Text style={[styles.tableHeaderCell, styles.pointsCell]}>Pts</Text>
                    </View>
                    {group.rows.map((row, index) => (
                      <View key={`${group.standingsDesc}-${row.playerId ?? row.teamName}-${index}`} style={[styles.tableRow, index < group.rows.length - 1 && styles.tableRowBorder]}>
                        <Text style={[styles.tableCell, styles.rankCell, styles.position]}>{row.rank}</Text>
                        <Text style={[styles.tableCell, styles.playerCell, styles.player]} numberOfLines={1}>{row.teamName}</Text>
                        <Text style={[styles.tableCell, styles.numberCell]}>{row.played}</Text>
                        <Text style={[styles.tableCell, styles.numberCell]}>{row.won}</Text>
                        <Text style={[styles.tableCell, styles.numberCell]}>{row.lost}</Text>
                        <Text style={[styles.tableCell, styles.numberCell]}>{row.diff >= 0 ? `+${row.diff}` : row.diff}</Text>
                        <Text style={[styles.tableCell, styles.pointsCell, styles.points]}>{row.points}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </View>
          ) : (
            <EmptyState title="No group standings yet" description="Group tables will appear here once fixtures are in play." />
          )
        ) : (
          isLoading ? (
            <LoadingSkeleton lines={6} height={16} />
          ) : rankings.length > 0 ? (
          <View style={styles.stack}>
            {rankings.map((row) => (
              <View key={row.id} style={styles.rankingCard}>
                <Text style={styles.rank}>{rankings.findIndex((entry) => entry.id === row.id) + 1}</Text>
                <View style={styles.rankingCopy}>
                  <Text style={styles.player}>{row.fullName}</Text>
                  <Text style={styles.stat}>Wins {row.matchesWon}</Text>
                </View>
                <View style={styles.rankingRight}>
                  <Text style={styles.elo}>Elo {row.eloRating ?? "-"}</Text>
                  <Text style={styles.movement}>{row.points} pts</Text>
                </View>
              </View>
            ))}
          </View>
          ) : (
            <EmptyState title="No rankings yet" description="Player rankings will appear once tournament results are recorded." />
          )
        )}
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
    paddingBottom: appTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  linkButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: appTheme.radii.md,
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  linkButtonText: {
    color: appTheme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  heroCard: {
    gap: 8,
    padding: appTheme.spacing.xl,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  eyebrow: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 25,
    fontWeight: "900",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  metaRow: {
    gap: 4,
  },
  meta: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
  },
  stack: {
    gap: 12,
  },
  groupCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 10,
  },
  groupTitle: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  tableWrap: {
    minWidth: 520,
  },
  tableHeaderRow: {
    backgroundColor: appTheme.colors.surfaceStrong,
    borderRadius: appTheme.radii.md,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: appTheme.colors.border,
  },
  tableHeaderCell: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tableCell: {
    color: appTheme.colors.textSoft,
    fontSize: 13,
  },
  rankCell: {
    width: 40,
  },
  playerCell: {
    flex: 1,
    minWidth: 180,
  },
  numberCell: {
    width: 48,
    textAlign: "center",
  },
  pointsCell: {
    width: 56,
    textAlign: "right",
  },
  position: {
    color: appTheme.colors.gold,
    fontSize: 15,
    fontWeight: "900",
  },
  player: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  points: {
    color: appTheme.colors.orange,
    fontSize: 14,
    fontWeight: "800",
  },
  stat: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  form: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
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
    width: 26,
    color: appTheme.colors.gold,
    fontSize: 20,
    fontWeight: "900",
  },
  rankingCopy: {
    flex: 1,
    gap: 4,
  },
  rankingRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  elo: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  movement: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
  },
});