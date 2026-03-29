import type { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { SegmentedControl } from "../../components/SegmentedControl";
import { SectionHeader } from "../../components/SectionHeader";
import { TournamentCard } from "../../components/TournamentCard";
import { mobileApi } from "../../lib/mobile-api";
import { mapTournamentSummary } from "../../lib/tournaments";
import { appTheme } from "../../theme";
import type { PublicFixtureGroupRecord, RankingsResponse, StandingsResponse } from "../../types/api";
import type { LeagueBrowseSection, RootStackParamList, TournamentSummary } from "../../types/app";

const items = [
  { key: "tournaments", label: "Tournaments" },
  { key: "results", label: "Results" },
  { key: "rankings", label: "Rankings" },
  { key: "groups", label: "Groups" },
];

type LeagueContentScreenProps = {
  route?: RouteProp<RootStackParamList, "LeagueContent">;
};

type LeagueResultItem = {
  id: string;
  title: string;
  meta: string;
  status: string;
  summary: string;
};

type LeagueRankingItem = {
  id: string;
  position: number;
  player: string;
  pointsLabel: string;
  statLabel: string;
};

type LeagueGroupItem = {
  id: string;
  title: string;
  meta: string;
  leaderLabel: string;
  update: string;
};

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMatchStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function mapLeagueResults(fixtures: Awaited<ReturnType<typeof mobileApi.getPublicFixtures>>["fixtures"]): LeagueResultItem[] {
  return fixtures
    .filter((fixture) => ["COMPLETED", "FORFEIT", "ABANDONED"].includes(fixture.matchStatus))
    .sort((left, right) => new Date(right.fixtureDateTime).getTime() - new Date(left.fixtureDateTime).getTime())
    .slice(0, 12)
    .map((fixture) => ({
      id: fixture.id,
      title: `${fixture.fixtureGroupDesc} - ${fixture.roundDesc}`,
      meta: fixture.seasonDesc,
      status: formatDateLabel(fixture.fixtureDateTime),
      summary: `${fixture.homeTeamName} ${fixture.homeScore ?? "-"}-${fixture.roadScore ?? "-"} ${fixture.roadTeamName} • ${formatMatchStatus(fixture.matchStatus)}`,
    }));
}

function mapLeagueRankings(players: RankingsResponse["players"]): LeagueRankingItem[] {
  return players.slice(0, 20).map((player, index) => ({
    id: player.id,
    position: index + 1,
    player: player.fullName,
    pointsLabel: `${player.points} pts`,
    statLabel: `Elo ${player.eloRating ?? "-"}`,
  }));
}

function mapLeagueGroups(
  fixtureGroup: PublicFixtureGroupRecord,
  standingsGroups: StandingsResponse["groups"]
): LeagueGroupItem[] {
  return standingsGroups.map((group) => {
    const leader = group.rows[0];

    return {
      id: `${fixtureGroup.fixtureGroupIdentifier}:${group.standingsDesc}`,
      title: group.standingsDesc,
      meta: fixtureGroup.fixtureGroupDesc,
      leaderLabel: leader ? leader.teamName : "TBD",
      update: leader ? `${leader.points} pts • ${group.rows.length} entries` : "Standings pending",
    };
  });
}

export function LeagueContentScreen({ route }: LeagueContentScreenProps) {
  const navigation = useNavigation<any>();
  const [section, setSection] = useState<LeagueBrowseSection>(route?.params?.initialSection ?? "tournaments");
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [results, setResults] = useState<LeagueResultItem[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<LeagueRankingItem[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(false);
  const [rankingsError, setRankingsError] = useState<string | null>(null);
  const [groups, setGroups] = useState<LeagueGroupItem[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLeagueContent = async () => {
      setIsLoadingTournaments(true);
      setIsLoadingResults(true);
      setIsLoadingRankings(true);
      setIsLoadingGroups(true);
      setTournamentsError(null);
      setResultsError(null);
      setRankingsError(null);
      setGroupsError(null);

      const [tournamentsResult, fixturesResult, rankingsResult, fixtureGroupsResult] = await Promise.allSettled([
        mobileApi.getPublicTournaments(),
        mobileApi.getPublicFixtures(),
        mobileApi.getPublicPlayerRankings(),
        mobileApi.getPublicFixtureGroups(),
      ]);

      if (!isMounted) {
        return;
      }

      if (tournamentsResult.status === "fulfilled") {
        setTournaments(tournamentsResult.value.tournaments.map((record) => mapTournamentSummary(record, false)));
      } else {
        setTournaments([]);
        setTournamentsError(tournamentsResult.reason instanceof Error ? tournamentsResult.reason.message : "Unable to load tournaments.");
      }
      setIsLoadingTournaments(false);

      if (fixturesResult.status === "fulfilled") {
        setResults(mapLeagueResults(fixturesResult.value.fixtures));
      } else {
        setResults([]);
        setResultsError(fixturesResult.reason instanceof Error ? fixturesResult.reason.message : "Unable to load results.");
      }
      setIsLoadingResults(false);

      if (rankingsResult.status === "fulfilled") {
        setRankings(mapLeagueRankings(rankingsResult.value.players));
      } else {
        setRankings([]);
        setRankingsError(rankingsResult.reason instanceof Error ? rankingsResult.reason.message : "Unable to load rankings.");
      }
      setIsLoadingRankings(false);

      if (fixtureGroupsResult.status === "fulfilled") {
        const standingsResults = await Promise.allSettled(
          fixtureGroupsResult.value.fixtureGroups.map(async (fixtureGroup) => ({
            fixtureGroup,
            standings: await mobileApi.getTournamentStandings(fixtureGroup.fixtureGroupIdentifier),
          }))
        );

        if (!isMounted) {
          return;
        }

        const mappedGroups = standingsResults.flatMap((result) => {
          if (result.status !== "fulfilled") {
            return [];
          }

          return mapLeagueGroups(result.value.fixtureGroup, result.value.standings.groups);
        });

        setGroups(mappedGroups);

        const successfulGroupLoads = standingsResults.filter((result) => result.status === "fulfilled").length;
        if (fixtureGroupsResult.value.fixtureGroups.length > 0 && successfulGroupLoads === 0) {
          setGroupsError("Unable to load groups.");
        }
      } else {
        setGroups([]);
        setGroupsError(fixtureGroupsResult.reason instanceof Error ? fixtureGroupsResult.reason.message : "Unable to load groups.");
      }
      setIsLoadingGroups(false);
    };

    void loadLeagueContent();

    return () => {
      isMounted = false;
    };
  }, []);

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
              {isLoadingTournaments ? (
                <LoadingSkeleton lines={4} height={18} />
              ) : tournamentsError ? (
                <EmptyState title="Tournament feed unavailable" description={tournamentsError} icon="alert-circle-outline" />
              ) : tournaments.length === 0 ? (
                <EmptyState title="No tournaments published" description="Tournament cards will appear here as soon as events are available in the database." />
              ) : (
                tournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    onPress={() => navigation.navigate("TournamentDetail", { tournamentId: tournament.id })}
                  />
                ))
              )}
            </View>
          </>
        ) : null}

        {section === "results" ? (
          <>
            <SectionHeader title="Match Results" subtitle="Freshly published result cards for the current window." />
            <View style={styles.stack}>
              {isLoadingResults ? (
                <LoadingSkeleton lines={4} height={18} />
              ) : resultsError ? (
                <EmptyState title="Results unavailable" description={resultsError} icon="alert-circle-outline" />
              ) : results.length === 0 ? (
                <EmptyState title="No published results" description="Completed match cards will appear here once published from the database." />
              ) : (
                results.map((result) => (
                  <View key={result.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{result.title}</Text>
                    <Text style={styles.cardMeta}>{result.meta} • {result.status}</Text>
                    <Text style={styles.cardBody}>{result.summary}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {section === "rankings" ? (
          <>
            <SectionHeader title="League Rankings" subtitle="Compact ladder cards tuned for phones." />
            <View style={styles.stack}>
              {isLoadingRankings ? (
                <LoadingSkeleton lines={5} height={18} />
              ) : rankingsError ? (
                <EmptyState title="Rankings unavailable" description={rankingsError} icon="alert-circle-outline" />
              ) : rankings.length === 0 ? (
                <EmptyState title="No rankings published" description="League rankings will appear here once player stats are available from the database." />
              ) : (
                rankings.map((ranking) => (
                  <View key={ranking.id} style={styles.rankingCard}>
                    <Text style={styles.rank}>{ranking.position}</Text>
                    <View style={styles.rankCopy}>
                      <Text style={styles.cardTitle}>{ranking.player}</Text>
                      <Text style={styles.cardMeta}>{ranking.pointsLabel}</Text>
                    </View>
                    <Text style={styles.movement}>{ranking.statLabel}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {section === "groups" ? (
          <>
            <SectionHeader title="Divisions & Groups" subtitle="Mobile-friendly group snapshots instead of a cramped standings table." />
            <View style={styles.stack}>
              {isLoadingGroups ? (
                <LoadingSkeleton lines={5} height={18} />
              ) : groupsError ? (
                <EmptyState title="Groups unavailable" description={groupsError} icon="alert-circle-outline" />
              ) : groups.length === 0 ? (
                <EmptyState title="No group standings yet" description="Group standings will appear here when tournament tables are available in the database." />
              ) : (
                groups.map((group) => (
                  <View key={group.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{group.title}</Text>
                    <Text style={styles.cardMeta}>{group.meta}</Text>
                    <Text style={styles.cardBody}>Leader: {group.leaderLabel}</Text>
                    <Text style={styles.cardMeta}>{group.update}</Text>
                  </View>
                ))
              )}
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