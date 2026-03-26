import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../../components/EmptyState";
import { HeroHeaderCard } from "../../components/HeroHeaderCard";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { applyScoringAction, buildInitialScoringState, getFramesNeededToWin, summarizeScoringState } from "../../lib/scoring";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { MainTabParamList } from "../../types/app";
import type { MatchScoringState, SnookerBall } from "../../types/scoring";
import type { RouteProp } from "@react-navigation/native";

const potBalls: Array<{ key: SnookerBall; label: string; points: number }> = [
  { key: "red", label: "Red", points: 1 },
  { key: "yellow", label: "Yellow", points: 2 },
  { key: "green", label: "Green", points: 3 },
  { key: "brown", label: "Brown", points: 4 },
  { key: "blue", label: "Blue", points: 5 },
  { key: "pink", label: "Pink", points: 6 },
  { key: "black", label: "Black", points: 7 },
];

const foulOptions = [4, 5, 6, 7];

export function ScoreScreen() {
  const { currentUser } = useAppSession();
  const route = useRoute<RouteProp<MainTabParamList, "Score">>();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof mobileApi.getMyMatches>>["matches"]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Awaited<ReturnType<typeof mobileApi.getMyMatch>>["match"] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, MatchScoringState>>({});
  const [history, setHistory] = useState<Record<string, MatchScoringState[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.matchId) {
      setSelectedMatchId(route.params.matchId);
    }
  }, [route.params?.matchId]);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        setIsLoadingMatches(true);
        setError(null);
        const response = await mobileApi.getMyMatches();
        const availableMatches = response.matches.filter((match) => match.status !== "Completed");

        if (!isMounted) {
          return;
        }

        setMatches(availableMatches);

        if (route.params?.matchId) {
          const requestedMatch = availableMatches.find((match) => match.id === route.params?.matchId);

          if (requestedMatch) {
            setSelectedMatchId(requestedMatch.id);
            return;
          }
        }

        if (!selectedMatchId && availableMatches[0]) {
          setSelectedMatchId(availableMatches[0].id);
        }
      } catch (loadError) {
        if (isMounted) {
          setMatches([]);
          setError(loadError instanceof Error ? loadError.message : "Unable to load scoreable matches.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingMatches(false);
        }
      }
    };

    void loadMatches();

    return () => {
      isMounted = false;
    };
  }, [route.params?.matchId, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) {
      return;
    }

    let isMounted = true;

    const loadMatch = async () => {
      try {
        setIsLoadingMatch(true);
        const response = await mobileApi.getMyMatch(selectedMatchId);

        if (!isMounted) {
          return;
        }

        setSelectedMatch(response.match);
        setDrafts((current) =>
          current[selectedMatchId]
            ? current
            : { ...current, [selectedMatchId]: buildInitialScoringState(response.match) }
        );
      } catch (loadError) {
        if (isMounted) {
          setSelectedMatch(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load this match.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingMatch(false);
        }
      }
    };

    void loadMatch();

    return () => {
      isMounted = false;
    };
  }, [selectedMatchId]);

  const scoringState = selectedMatchId ? drafts[selectedMatchId] : null;
  const scoringSummary = scoringState ? summarizeScoringState(scoringState) : null;
  const currentFrame = scoringState ? scoringState.frames[scoringState.currentFrameIndex] : null;

  const matchSummary = useMemo(() => {
    if (!selectedMatch || !scoringSummary) {
      return null;
    }

    return {
      framesNeededToWin: getFramesNeededToWin(selectedMatch.bestOfFrames),
      homeFramesWon: scoringSummary.homeScore,
      awayFramesWon: scoringSummary.awayScore,
    };
  }, [scoringSummary, selectedMatch]);

  const applyAction = (action: Parameters<typeof applyScoringAction>[1]) => {
    if (!selectedMatchId || !scoringState) {
      return;
    }

    setHistory((current) => ({
      ...current,
      [selectedMatchId]: [...(current[selectedMatchId] ?? []), scoringState],
    }));
    setDrafts((current) => ({
      ...current,
      [selectedMatchId]: applyScoringAction(scoringState, action),
    }));
  };

  const handleUndo = () => {
    if (!selectedMatchId) {
      return;
    }

    setHistory((current) => {
      const stack = [...(current[selectedMatchId] ?? [])];
      const previous = stack.pop();

      if (previous) {
        setDrafts((draftState) => ({
          ...draftState,
          [selectedMatchId]: previous,
        }));
      }

      return {
        ...current,
        [selectedMatchId]: stack,
      };
    });
  };

  const handleReset = () => {
    if (!selectedMatchId || !selectedMatch) {
      return;
    }

    const freshState = buildInitialScoringState(selectedMatch);
    setDrafts((current) => ({ ...current, [selectedMatchId]: freshState }));
    setHistory((current) => ({ ...current, [selectedMatchId]: [] }));
  };

  const handleSubmit = async () => {
    if (!selectedMatchId || !selectedMatch || !scoringState || !scoringSummary?.isComplete) {
      Alert.alert("Scoring", "Complete the match before submitting the result.");
      return;
    }

    setIsSubmitting(true);

    try {
      const winnerEntryId = scoringSummary.homeScore > scoringSummary.awayScore ? selectedMatch.homeEntry.id : selectedMatch.awayEntry.id;

      await mobileApi.submitMatchResult(selectedMatchId, {
        startDateTime: scoringState.startedAt,
        endDateTime: new Date().toISOString(),
        homeScore: scoringSummary.homeScore,
        awayScore: scoringSummary.awayScore,
        winnerEntryId,
        homeHighBreaks: scoringSummary.homeHighBreaks,
        awayHighBreaks: scoringSummary.awayHighBreaks,
        summaryNote: notes[selectedMatchId]?.trim() || null,
      });

      Alert.alert("Scoring", "Result submitted for opponent approval.");
    } catch (submitError) {
      Alert.alert("Scoring", submitError instanceof Error ? submitError.message : "Unable to submit the result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <HeroHeaderCard
        eyebrow="Scoring App"
        title="Frame-by-Frame Control"
        subtitle="This route now captures live frame flow, break tracking, fouls, and match submission against the real player result workflow."
        initials={currentUser.initials}
        badge={`${matches.length} scoreable matches`}
      />

      <SectionHeader title="Scoreable Matches" subtitle="Select a current fixture and record the match frame by frame." />
      {isLoadingMatches ? (
        <LoadingSkeleton lines={4} height={16} />
      ) : error ? (
        <EmptyState title="Scoring feed unavailable" description={error} icon="alert-circle-outline" />
      ) : matches.length === 0 ? (
        <EmptyState title="No active matches" description="There are no scheduled or in-progress matches available for live score entry." icon="scoreboard-outline" />
      ) : (
        <View style={styles.stack}>
          {matches.map((match) => (
            <Pressable key={match.id} style={[styles.matchSelectCard, selectedMatchId === match.id && styles.matchSelectCardActive]} onPress={() => setSelectedMatchId(match.id)}>
              <Text style={styles.sessionOpponent}>{match.homePlayer.name} vs {match.awayPlayer.name}</Text>
              <Text style={styles.sessionMeta}>{match.tournamentName} • {match.stage}</Text>
              <Text style={styles.sessionStatus}>{match.pendingMode === "submittedByYou" ? "Submission pending" : match.status}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {isLoadingMatch ? <LoadingSkeleton lines={6} height={16} /> : null}

      {selectedMatch && scoringState && currentFrame && matchSummary ? (
        <>
          <SectionHeader title="Live Frame Engine" subtitle={`${selectedMatch.homeEntry.label} vs ${selectedMatch.awayEntry.label}`} />
          <View style={styles.sessionCard}>
            <Text style={styles.sessionOpponent}>{selectedMatch.tournamentName}</Text>
            <Text style={styles.sessionMeta}>{selectedMatch.venue} • {selectedMatch.stage}</Text>
            <Text style={styles.sessionStatus}>Frame {currentFrame.frameNumber} of {selectedMatch.bestOfFrames}</Text>
          </View>

          <View style={styles.scoreboardCard}>
            <View style={styles.scoreboardRow}>
              <View style={styles.scoreboardSide}>
                <Text style={styles.scoreboardLabel}>{selectedMatch.homeEntry.label}</Text>
                <Text style={styles.scoreboardValue}>{matchSummary.homeFramesWon}</Text>
                <Text style={styles.scoreboardSubvalue}>{currentFrame.homePoints} pts</Text>
              </View>
              <View style={styles.scoreboardCenter}>
                <Text style={styles.scoreboardTarget}>First to {matchSummary.framesNeededToWin}</Text>
                <Text style={styles.scoreboardSubvalue}>Active: {currentFrame.activeSide === "home" ? selectedMatch.homeEntry.label : selectedMatch.awayEntry.label}</Text>
              </View>
              <View style={styles.scoreboardSide}>
                <Text style={styles.scoreboardLabel}>{selectedMatch.awayEntry.label}</Text>
                <Text style={styles.scoreboardValue}>{matchSummary.awayFramesWon}</Text>
                <Text style={styles.scoreboardSubvalue}>{currentFrame.awayPoints} pts</Text>
              </View>
            </View>
            <Text style={styles.currentBreakText}>Current break: {currentFrame.currentBreak ? `${currentFrame.currentBreak.points} (${currentFrame.currentBreak.side})` : "No active break"}</Text>
          </View>

          <SectionHeader title="Pots" subtitle="Apply scoring to the current active breaker." />
          <View style={styles.ballGrid}>
            {potBalls.map((ball) => (
              <Pressable key={ball.key} style={styles.ballButton} onPress={() => applyAction({ type: "pot", side: currentFrame.activeSide, ball: ball.key })}>
                <Text style={styles.ballButtonLabel}>{ball.label}</Text>
                <Text style={styles.ballButtonValue}>{ball.points}</Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader title="Fouls" subtitle="Award foul points to the opponent and end the current break." />
          <View style={styles.foulRow}>
            {foulOptions.map((points) => (
              <Pressable key={points} style={styles.foulButton} onPress={() => applyAction({ type: "foul", side: currentFrame.activeSide, points })}>
                <Text style={styles.foulButtonText}>+{points}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actionStack}>
            <PrimaryButton label="End Turn" variant="ghost" onPress={() => applyAction({ type: "endTurn" })} icon={<MaterialCommunityIcons name="swap-horizontal" size={18} color={appTheme.colors.text} />} />
            <PrimaryButton label="Undo" variant="ghost" onPress={handleUndo} icon={<MaterialCommunityIcons name="undo" size={18} color={appTheme.colors.text} />} />
          </View>

          <View style={styles.actionStack}>
            <PrimaryButton label="Award Home Frame" onPress={() => applyAction({ type: "awardFrame", side: "home" })} />
            <PrimaryButton label="Award Away Frame" variant="ghost" onPress={() => applyAction({ type: "awardFrame", side: "away" })} />
          </View>

          <View style={styles.actionStack}>
            <PrimaryButton label="Next Frame" variant="ghost" onPress={() => applyAction({ type: "startNextFrame" })} />
            <PrimaryButton label="Reset Match" variant="ghost" onPress={handleReset} />
          </View>

          <SectionHeader title="Recorded Breaks" subtitle="Highest breaks are derived from the recorded break list for each frame." />
          <View style={styles.stack}>
            {currentFrame.breaks.length === 0 ? (
              <EmptyState title="No breaks yet" description="Pots and fouls will populate the live frame log as you score the match." icon="chart-timeline-variant" />
            ) : (
              currentFrame.breaks.map((entry) => (
                <View key={entry.id} style={styles.breakCard}>
                  <Text style={styles.breakTitle}>{entry.side === "home" ? selectedMatch.homeEntry.label : selectedMatch.awayEntry.label}</Text>
                  <Text style={styles.breakValue}>{entry.points}</Text>
                </View>
              ))
            )}
          </View>

          <SectionHeader title="Submission Note" subtitle="Optional context sent with the real match result submission." />
          <FormField
            label="Summary Note"
            value={notes[selectedMatch.id] ?? ""}
            onChangeText={(value) => setNotes((current) => ({ ...current, [selectedMatch.id]: value }))}
            multiline
            numberOfLines={4}
            style={styles.noteInput}
          />

          <PrimaryButton
            label={isSubmitting ? "Submitting Result..." : "Submit Match Result"}
            onPress={handleSubmit}
            disabled={isSubmitting || !scoringSummary?.isComplete}
            icon={<MaterialCommunityIcons name="check-circle-outline" size={18} color="#17110a" />}
          />
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    gap: 12,
  },
  stack: {
    gap: 12,
  },
  matchSelectCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 6,
  },
  matchSelectCardActive: {
    borderColor: appTheme.colors.borderStrong,
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  sessionCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 6,
  },
  sessionOpponent: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  sessionMeta: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  sessionStatus: {
    color: appTheme.colors.gold,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
  },
  scoreboardCard: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 14,
  },
  scoreboardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  scoreboardSide: {
    flex: 1,
    gap: 4,
  },
  scoreboardCenter: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  scoreboardLabel: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  scoreboardValue: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  scoreboardSubvalue: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
  },
  scoreboardTarget: {
    color: appTheme.colors.gold,
    fontSize: 14,
    fontWeight: "800",
  },
  currentBreakText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
  },
  ballGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  ballButton: {
    width: "30%",
    minHeight: 76,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    justifyContent: "space-between",
  },
  ballButtonLabel: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  ballButtonValue: {
    color: appTheme.colors.gold,
    fontSize: 18,
    fontWeight: "900",
  },
  foulRow: {
    flexDirection: "row",
    gap: 12,
  },
  foulButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
    backgroundColor: appTheme.colors.tealSoft,
  },
  foulButtonText: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  breakCard: {
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakTitle: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  breakValue: {
    color: appTheme.colors.gold,
    fontSize: 20,
    fontWeight: "900",
  },
  noteInput: {
    minHeight: 110,
    textAlignVertical: "top",
    paddingTop: 14,
  },
});