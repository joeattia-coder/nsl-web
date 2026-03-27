import { useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { BallSelector } from "../../components/scoring/BallSelector";
import { BreakSection } from "../../components/scoring/BreakSection";
import { ControlsRow } from "../../components/scoring/ControlsRow";
import { FrameScore } from "../../components/scoring/FrameScore";
import { MainScore } from "../../components/scoring/MainScore";
import { PlayerHeader } from "../../components/scoring/PlayerHeader";
import { freeBallOptions, getTotalReds, snookerBallMeta, snookerBallOrder } from "../../components/scoring/ball-config";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { applyScoringAction, buildInitialScoringState, getFramesNeededToWin, summarizeScoringState } from "../../lib/scoring";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { MainTabParamList } from "../../types/app";
import type { MatchScoringState, ScoringAction, SnookerBall } from "../../types/scoring";
import type { RouteProp } from "@react-navigation/native";

const foulOptions = [4, 5, 6, 7];
const SHOT_CLOCK_ENABLED = false;
const SHOT_CLOCK_SECONDS = 18;
const clearanceOrder: SnookerBall[] = ["yellow", "green", "brown", "blue", "pink", "black"];

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
}

function getDisplayPlayer(entry: Awaited<ReturnType<typeof mobileApi.getMyMatch>>["match"]["homeEntry"]) {
  const member = entry.members[0];

  return {
    name: member?.fullName ?? entry.label,
    initials: member?.initials ?? getInitials(entry.label),
    photoUrl: member?.photoUrl ?? null,
  };
}

function getFrameBalls(frame: MatchScoringState["frames"][number]) {
  return [...frame.breaks.flatMap((entry) => entry.balls), ...(frame.currentBreak?.balls ?? [])];
}

function getRemainingCounts(frameBalls: SnookerBall[], totalReds: number) {
  const redsRemaining = Math.max(totalReds - frameBalls.filter((ball) => ball === "red").length, 0);

  if (redsRemaining > 0) {
    return {
      redsRemaining,
      ballsRemaining: clearanceOrder.length,
    };
  }

  const colorsPhaseBalls = frameBalls.slice(frameBalls.lastIndexOf("red") + 1);
  let cleared = 0;

  for (const ball of colorsPhaseBalls) {
    if (ball === clearanceOrder[cleared]) {
      cleared += 1;
    }

    if (cleared === clearanceOrder.length) {
      break;
    }
  }

  return {
    redsRemaining: 0,
    ballsRemaining: Math.max(clearanceOrder.length - cleared, 0),
  };
}

export function ScoreScreen() {
  const { currentUser } = useAppSession();
  const route = useRoute<RouteProp<MainTabParamList, "Score">>();
  const { width, height } = useWindowDimensions();
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof mobileApi.getMyMatches>>["matches"]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Awaited<ReturnType<typeof mobileApi.getMyMatch>>["match"] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, MatchScoringState>>({});
  const [history, setHistory] = useState<Record<string, MatchScoringState[]>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isLoadingMatch, setIsLoadingMatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFreeBallMode, setIsFreeBallMode] = useState(false);
  const [freeBallColor, setFreeBallColor] = useState<SnookerBall | null>(null);
  const [showFoulPicker, setShowFoulPicker] = useState(false);

  const isLandscape = width > height;
  const isCompact = isLandscape || height < 740;

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

  useEffect(() => {
    setIsFreeBallMode(false);
    setFreeBallColor(null);
    setShowFoulPicker(false);
  }, [selectedMatchId, currentFrame?.frameNumber]);

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

  const homePlayer = selectedMatch ? getDisplayPlayer(selectedMatch.homeEntry) : null;
  const awayPlayer = selectedMatch ? getDisplayPlayer(selectedMatch.awayEntry) : null;
  const frameBalls = currentFrame ? getFrameBalls(currentFrame) : [];
  const remainingCounts = selectedMatch ? getRemainingCounts(frameBalls, getTotalReds(selectedMatch.snookerFormat)) : null;
  const visibleBreak = currentFrame?.currentBreak ?? (currentFrame ? currentFrame.breaks[currentFrame.breaks.length - 1] ?? null : null);
  const canSubmitResult = Boolean(scoringSummary?.isComplete);

  const applyActions = (actions: ScoringAction[]) => {
    if (!selectedMatchId || !scoringState) {
      return;
    }

    setHistory((current) => ({
      ...current,
      [selectedMatchId]: [...(current[selectedMatchId] ?? []), scoringState],
    }));
    setDrafts((current) => ({
      ...current,
      [selectedMatchId]: actions.reduce((nextState, action) => applyScoringAction(nextState, action), current[selectedMatchId] ?? scoringState),
    }));
  };

  const applyAction = (action: ScoringAction) => {
    applyActions([action]);
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

    setIsFreeBallMode(false);
    setFreeBallColor(null);
    setShowFoulPicker(false);
  };

  const handleSelectActiveSide = (side: "home" | "away") => {
    if (!currentFrame || side === currentFrame.activeSide) {
      return;
    }

    applyAction({ type: "endTurn" });
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
        summaryNote: null,
      });

      Alert.alert("Scoring", "Result submitted for opponent approval.");
    } catch (submitError) {
      Alert.alert("Scoring", submitError instanceof Error ? submitError.message : "Unable to submit the result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePot = (ball: SnookerBall) => {
    if (!currentFrame) {
      return;
    }

    applyAction({ type: "pot", side: currentFrame.activeSide, ball });

    if (isFreeBallMode) {
      setIsFreeBallMode(false);
      setFreeBallColor(null);
    }
  };

  const handleToggleFreeBall = () => {
    setShowFoulPicker(false);
    setIsFreeBallMode((current) => {
      if (current) {
        setFreeBallColor(null);
      }

      return !current;
    });
  };

  const handleFoul = (points: number) => {
    if (!currentFrame) {
      return;
    }

    applyAction({ type: "foul", side: currentFrame.activeSide, points });
    setShowFoulPicker(false);
    setIsFreeBallMode(false);
    setFreeBallColor(null);
  };

  const handleEndFrame = () => {
    if (!currentFrame) {
      return;
    }

    if (currentFrame.homePoints === currentFrame.awayPoints) {
      Alert.alert("Scoring", "The frame is tied. Record a deciding score before ending the frame.");
      return;
    }

    applyActions([
      { type: "awardFrame", side: currentFrame.homePoints > currentFrame.awayPoints ? "home" : "away" },
      { type: "startNextFrame" },
    ]);
    setShowFoulPicker(false);
    setIsFreeBallMode(false);
    setFreeBallColor(null);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.screenContent}>
      <View style={styles.screenHeader}>
        <View style={styles.screenHeaderCopy}>
          <Text style={styles.screenEyebrow}>Live Scoring</Text>
          <Text style={styles.screenTitle}>Snooker Match Control</Text>
          <Text style={styles.screenSubtitle}>Fast live scoring built for portrait and landscape play.</Text>
        </View>
        <View style={styles.screenBadge}>
          <Text style={styles.screenBadgeText}>{currentUser.initials}</Text>
        </View>
      </View>

      {isLoadingMatches ? (
        <LoadingSkeleton lines={4} height={16} />
      ) : error ? (
        <EmptyState title="Scoring feed unavailable" description={error} icon="alert-circle-outline" />
      ) : matches.length === 0 ? (
        <EmptyState title="No active matches" description="There are no scheduled or in-progress matches available for live score entry." icon="scoreboard-outline" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchPickerRow}>
          {matches.map((match) => (
            <Pressable key={match.id} style={[styles.matchChip, selectedMatchId === match.id && styles.matchChipActive]} onPress={() => setSelectedMatchId(match.id)}>
              <Text style={styles.matchChipTitle}>{match.homePlayer.name} - {match.awayPlayer.name}</Text>
              <Text style={styles.matchChipMeta}>{match.tournamentName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {isLoadingMatch ? <LoadingSkeleton lines={6} height={16} /> : null}

      {selectedMatch && scoringState && currentFrame && matchSummary && homePlayer && awayPlayer && remainingCounts ? (
        <View style={[styles.surface, isLandscape && styles.surfaceLandscape]}>
          <View style={[styles.matchMetaBar, isLandscape && styles.matchMetaBarLandscape]}>
            <View style={styles.matchMetaGroup}>
              <Text style={styles.matchMetaPrimary}>{selectedMatch.tournamentName}</Text>
              <Text style={styles.matchMetaSecondary}>{selectedMatch.venue} - {selectedMatch.stage}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>Frame {currentFrame.frameNumber} / {selectedMatch.bestOfFrames}</Text>
            </View>
          </View>

          <View style={[styles.topSection, isLandscape && styles.topSectionLandscape]}>
            <PlayerHeader
              name={homePlayer.name}
              initials={homePlayer.initials}
              photoUrl={homePlayer.photoUrl}
              active={currentFrame.activeSide === "home"}
              onPress={() => handleSelectActiveSide("home")}
              align="left"
              compact={isCompact}
            />
            <View style={styles.topCenter}>
              <FrameScore leftScore={matchSummary.homeFramesWon} rightScore={matchSummary.awayFramesWon} compact={isCompact} />
              <Text style={styles.targetText}>First to {matchSummary.framesNeededToWin}</Text>
            </View>
            <PlayerHeader
              name={awayPlayer.name}
              initials={awayPlayer.initials}
              photoUrl={awayPlayer.photoUrl}
              active={currentFrame.activeSide === "away"}
              onPress={() => handleSelectActiveSide("away")}
              align="right"
              compact={isCompact}
            />
          </View>

          <View style={styles.centerStack}>
            <MainScore leftPoints={currentFrame.homePoints} rightPoints={currentFrame.awayPoints} compact={isCompact} />
            {SHOT_CLOCK_ENABLED ? (
              <View style={styles.shotClockCard}>
                <Text style={styles.shotClockLabel}>Shot Clock</Text>
                <Text style={styles.shotClockValue}>{SHOT_CLOCK_SECONDS}</Text>
              </View>
            ) : null}
            <BreakSection
              breakValue={visibleBreak?.points ?? 0}
              sequence={visibleBreak?.balls ?? []}
              compact={isCompact}
            />
          </View>

          {isFreeBallMode ? (
            <View style={styles.inlinePanel}>
              <Text style={styles.inlinePanelTitle}>Free Ball</Text>
              <BallSelector
                balls={freeBallOptions}
                onSelect={setFreeBallColor}
                activeBall={freeBallColor}
                compact={isCompact}
                singleRow={isLandscape}
              />
            </View>
          ) : null}

          {showFoulPicker ? (
            <View style={styles.inlinePanel}>
              <Text style={styles.inlinePanelTitle}>Foul Points</Text>
              <View style={styles.foulPickerRow}>
                {foulOptions.map((points) => (
                  <Pressable key={points} style={styles.foulOption} onPress={() => handleFoul(points)}>
                    <Text style={styles.foulOptionText}>+{points}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.bottomStack}>
            <BallSelector balls={snookerBallOrder} onSelect={handlePot} compact={isCompact} singleRow={isLandscape} />
            <ControlsRow
              compact={isCompact}
              actions={[
                { key: "undo", label: "Undo", onPress: handleUndo },
                { key: "free-ball", label: "Free Ball", tone: isFreeBallMode ? "active" : "neutral", onPress: handleToggleFreeBall },
                {
                  key: "foul",
                  label: "Foul",
                  tone: showFoulPicker ? "active" : "danger",
                  onPress: () => {
                    setIsFreeBallMode(false);
                    setFreeBallColor(null);
                    setShowFoulPicker((current) => !current);
                  },
                },
                { key: "end-frame", label: "End Frame", tone: "emphasis", onPress: handleEndFrame },
              ]}
            />
            {canSubmitResult ? (
              <Pressable style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
                <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting Result..." : "Submit Match Result"}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    gap: 18,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  screenHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  screenEyebrow: {
    color: appTheme.colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  screenTitle: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  screenSubtitle: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  screenBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  screenBadgeText: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  matchPickerRow: {
    gap: 12,
    paddingRight: 20,
  },
  matchChip: {
    minWidth: 220,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "rgba(14, 20, 28, 0.92)",
    gap: 4,
  },
  matchChipActive: {
    borderColor: appTheme.colors.borderStrong,
    backgroundColor: "rgba(22, 31, 43, 0.98)",
  },
  matchChipTitle: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  matchChipMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  surface: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "rgba(7, 11, 16, 0.92)",
    padding: 20,
    gap: 20,
    ...appTheme.shadows.card,
  },
  surfaceLandscape: {
    padding: 18,
    gap: 16,
  },
  matchMetaBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  matchMetaBarLandscape: {
    alignItems: "flex-start",
  },
  matchMetaGroup: {
    flex: 1,
    gap: 2,
  },
  matchMetaPrimary: {
    color: appTheme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  matchMetaSecondary: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  metaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  metaPillText: {
    color: appTheme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  topSectionLandscape: {
    alignItems: "flex-start",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  targetText: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  centerStack: {
    gap: 16,
  },
  shotClockCard: {
    alignSelf: "center",
    minWidth: 112,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    alignItems: "center",
    gap: 2,
  },
  shotClockLabel: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  shotClockValue: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  inlinePanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "rgba(17, 24, 33, 0.94)",
    padding: 14,
    gap: 12,
  },
  inlinePanelTitle: {
    color: appTheme.colors.textSoft,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  foulPickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  foulOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(240, 93, 108, 0.42)",
    backgroundColor: "rgba(121, 24, 36, 0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  foulOptionText: {
    color: "#ffd7db",
    fontSize: 15,
    fontWeight: "800",
  },
  bottomStack: {
    gap: 14,
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: appTheme.colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#17110a",
    fontSize: 15,
    fontWeight: "900",
  },
});