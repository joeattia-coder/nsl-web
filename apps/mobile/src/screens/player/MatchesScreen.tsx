import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { EmptyState } from "../../components/EmptyState";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { MatchCard } from "../../components/MatchCard";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { SegmentedControl } from "../../components/SegmentedControl";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { MatchItem } from "../../types/app";

const filters = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
];

export function MatchesScreen() {
  const navigation = useNavigation<any>();
  const { currentUser } = useAppSession();
  const [filter, setFilter] = useState("all");
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await mobileApi.getMyMatches();
      setMatches(response.matches);
    } catch (loadError) {
      setMatches([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load matches.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, []);

  const visibleMatches = useMemo(() => matches.filter((match) => {
    if (filter === "scheduled") {
      return match.status !== "Completed";
    }

    if (filter === "completed") {
      return match.status === "Completed";
    }

    return true;
  }), [filter, matches]);

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow="My Matches"
        title="My Matches"
        subtitle="Premium mobile match cards with fast access to match hub workflows and result submission actions."
        initials={currentUser.initials}
        badge={`${matches.length} live match records`}
      />

      <SegmentedControl items={filters} value={filter} onChange={setFilter} />

      <SectionHeader title="Matchday Feed" subtitle="Upcoming, live, and completed matches tied to your session." />
      {isLoading ? (
        <LoadingSkeleton lines={4} height={18} />
      ) : error ? (
        <EmptyState title="Match feed unavailable" description={error} icon="alert-circle-outline" />
      ) : visibleMatches.length === 0 ? (
        <EmptyState title="No matches yet" description="No fixtures are currently assigned to your player profile." icon="calendar-blank-outline" />
      ) : (
        <View style={styles.stack}>
          {visibleMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onViewHub={() => Alert.alert("Match Hub", `${match.tournamentName}\n${match.stage}\n${match.venue}`)}
              onStartMatch={() => navigation.getParent()?.navigate("MatchScoring", { matchId: match.id })}
              onOpenMenu={() => Alert.alert("Match Actions", "Additional actions will live here.", [{ text: "Coin Toss", onPress: () => Alert.alert("Coin Toss", "Coin toss controls can be added here next.") }, { text: "Cancel", style: "cancel" }])}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 12,
  },
  infoText: {
    color: appTheme.colors.textMuted,
  },
});