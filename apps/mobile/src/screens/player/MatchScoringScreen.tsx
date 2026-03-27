import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, Pressable, SafeAreaView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { BallSelector } from "../../components/scoring/BallSelector";
import { Ball } from "../../components/scoring/Ball";
import { BreakSection } from "../../components/scoring/BreakSection";
import { CompositeFoulBall } from "../../components/scoring/CompositeFoulBall";
import { ControlsRow } from "../../components/scoring/ControlsRow";
import { FrameScore } from "../../components/scoring/FrameScore";
import { PlayerHeader } from "../../components/scoring/PlayerHeader";
import { ScoringModal } from "../../components/scoring/ScoringModal";
import { snookerBallMeta, snookerBallOrder } from "../../components/scoring/ball-config";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { applyScoringAction, buildInitialScoringState, getFramesNeededToWin, getFreeBallScoreTarget, getLegalPots, getPossiblePointsRemaining, summarizeScoringState } from "../../lib/scoring";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { RootStackParamList } from "../../types/app";
import type { MatchScoringState, ScoringAction, SnookerBall } from "../../types/scoring";
import type { RouteProp } from "@react-navigation/native";

const foulChoices = [
  { key: "four", points: 4, label: "Red / Yellow / Green / Brown" },
  { key: "blue", points: 5, ball: "blue" as SnookerBall },
  { key: "pink", points: 6, ball: "pink" as SnookerBall },
  { key: "black", points: 7, ball: "black" as SnookerBall },
];

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

export function MatchScoringScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "MatchScoring">>();
  const { currentUser } = useAppSession();
  const { width, height } = useWindowDimensions();
  const [match, setMatch] = useState<Awaited<ReturnType<typeof mobileApi.getMyMatch>>["match"] | null>(null);
  const [scoringState, setScoringState] = useState<MatchScoringState | null>(null);
  const [history, setHistory] = useState<MatchScoringState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showFoulModal, setShowFoulModal] = useState(false);
  const [showFreeBallModal, setShowFreeBallModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const isCompact = height < 760 || width < 420;
  const useSingleRowBalls = width >= 680;

  useFocusEffect(
    useCallback(() => {
      const handleBack = () => {
        setShowExitConfirm(true);
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    const loadMatch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mobileApi.getMyMatch(route.params.matchId);

        if (!isMounted) {
          return;
        }

        setMatch(response.match);
        setScoringState(buildInitialScoringState(response.match));
        setHistory([]);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load this match.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMatch();

    return () => {
      isMounted = false;
    };
  }, [route.params.matchId]);

  const scoringSummary = useMemo(() => (scoringState ? summarizeScoringState(scoringState) : null), [scoringState]);
  const currentFrame = scoringState ? scoringState.frames[scoringState.currentFrameIndex] : null;
  const visibleBreak = currentFrame?.currentBreak ?? null;
  const legalPots = currentFrame ? getLegalPots(currentFrame) : [];
  const possiblePointsRemaining = currentFrame ? getPossiblePointsRemaining(currentFrame) : 0;
  const framesNeededToWin = match ? getFramesNeededToWin(match.bestOfFrames) : 0;
  const homePlayer = match ? getDisplayPlayer(match.homeEntry) : null;
  const awayPlayer = match ? getDisplayPlayer(match.awayEntry) : null;

  const pushAction = (action: ScoringAction) => {
    if (!scoringState) {
      return;
    }

    setHistory((current) => [...current, scoringState]);
    setScoringState((current) => (current ? applyScoringAction(current, action) : current));
  };

  const pushActions = (actions: ScoringAction[]) => {
    if (!scoringState) {
      return;
    }

    setHistory((current) => [...current, scoringState]);
    setScoringState((current) => (current ? actions.reduce((nextState, action) => applyScoringAction(nextState, action), current) : current));
  };

  const resetTransientUI = () => {
    setShowOverflowMenu(false);
    setShowFoulModal(false);
    setShowFreeBallModal(false);
  };

  const handleUndo = () => {
    setHistory((current) => {
      if (current.length === 0) {
        return current;
      }

      const nextHistory = [...current];
      const previous = nextHistory.pop() ?? null;

      if (previous) {
        setScoringState(previous);
      }

      return nextHistory;
    });
    resetTransientUI();
  };

  const handleActiveSidePress = (side: "home" | "away") => {
    if (!currentFrame || currentFrame.activeSide === side) {
      return;
    }

    pushAction({ type: "endTurn" });
    resetTransientUI();
  };

  const handlePot = (ball: SnookerBall) => {
    if (!currentFrame || !legalPots.includes(ball)) {
      return;
    }

    pushAction({ type: "pot", side: currentFrame.activeSide, ball });
  };

  const handleFreeBallSelect = (ball: SnookerBall) => {
    if (!currentFrame) {
      return;
    }

    const scoredAs = getFreeBallScoreTarget(currentFrame, ball);

    if (!scoredAs) {
      Alert.alert("Free Ball", "That ball cannot be nominated for the current shot.");
      return;
    }

    pushAction({ type: "pot", side: currentFrame.activeSide, ball, scoredAs, isFreeBall: true });
    setShowFreeBallModal(false);
  };

  const handleFoul = (points: number) => {
    if (!currentFrame) {
      return;
    }

    pushAction({ type: "foul", side: currentFrame.activeSide, points });
    setShowFoulModal(false);
  };

  const handleEndFrame = () => {
    if (!currentFrame) {
      return;
    }

    if (currentFrame.homePoints === currentFrame.awayPoints) {
      Alert.alert("End Frame", "Record a deciding score before ending a tied frame.");
      return;
    }

    pushActions([
      { type: "awardFrame", side: currentFrame.homePoints > currentFrame.awayPoints ? "home" : "away" },
      { type: "startNextFrame" },
    ]);
    resetTransientUI();
  };

  const handleExit = () => {
    setScoringState(null);
    setHistory([]);
    setShowExitConfirm(false);
    setShowOverflowMenu(false);
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.backgroundGlowLeft} />
        <View style={styles.backgroundGlowRight} />
        <View style={styles.loadingWrap}>
          <LoadingSkeleton lines={7} height={18} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !match || !scoringState || !currentFrame || !homePlayer || !awayPlayer || !scoringSummary) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.backgroundGlowLeft} />
        <View style={styles.backgroundGlowRight} />
        <View style={styles.errorWrap}>
          <EmptyState title="Scoring unavailable" description={error ?? "Unable to start this match."} icon="alert-circle-outline" />
        </View>
      </SafeAreaView>
    );
  }

  const disabledBalls = snookerBallOrder.filter((ball) => !legalPots.includes(ball));
  const stateSummary = (
    <View style={styles.stateRow}>
      <Text style={styles.stateText}>Reds remaining {currentFrame.redsRemaining}</Text>
      <Text style={styles.stateDivider}>•</Text>
      <Text style={styles.stateText}>Possible points remaining {possiblePointsRemaining}</Text>
    </View>
  );
  const ballAndControls = (
    <View style={styles.bottomSection}>
      <BallSelector balls={snookerBallOrder} disabledBalls={disabledBalls} onSelect={handlePot} compact={isCompact} singleRow={useSingleRowBalls} />
      {stateSummary}
      <ControlsRow
        compact={isCompact}
        actions={[
          { key: "undo", label: "Undo", onPress: handleUndo },
          { key: "free-ball", label: "Free Ball", tone: "active", onPress: () => { setShowFoulModal(false); setShowFreeBallModal(true); } },
          { key: "foul", label: "Foul", tone: "danger", onPress: () => { setShowFreeBallModal(false); setShowFoulModal(true); } },
          { key: "end-frame", label: "End Frame", tone: "emphasis", onPress: handleEndFrame },
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.backgroundGlowLeft} />
      <View style={styles.backgroundGlowRight} />
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.topBarCopy}>
            <Text numberOfLines={1} style={styles.eyebrow}>{match.tournamentName}</Text>
            <Text numberOfLines={1} style={styles.metaLine}>{match.venue} • {match.stage}</Text>
          </View>
          <View style={styles.topBarActions}>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>{currentUser.initials}</Text>
            </View>
            <Pressable onPress={() => setShowOverflowMenu(true)} style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Match options">
              <MaterialCommunityIcons name="dots-horizontal" size={22} color={appTheme.colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.surface, isCompact && styles.surfaceCompact]}>
          <View style={styles.playerStrip}>
            <View style={styles.playerColumn}>
              <PlayerHeader
                name={homePlayer.name}
                initials={homePlayer.initials}
                photoUrl={homePlayer.photoUrl}
                active={currentFrame.activeSide === "home"}
                onPress={() => handleActiveSidePress("home")}
                align="left"
                compact={isCompact}
              />
              <Text style={[styles.playerPoints, styles.playerPointsLeft, isCompact && styles.playerPointsCompact]}>{currentFrame.homePoints}</Text>
            </View>
            <View style={styles.scoreCenter}>
              <FrameScore leftScore={scoringSummary.homeScore} rightScore={scoringSummary.awayScore} targetScore={framesNeededToWin} compact={isCompact} />
              <Text style={styles.frameMeta}>Frame {currentFrame.frameNumber} of {match.bestOfFrames}</Text>
            </View>
            <View style={[styles.playerColumn, styles.playerColumnRight]}>
              <PlayerHeader
                name={awayPlayer.name}
                initials={awayPlayer.initials}
                photoUrl={awayPlayer.photoUrl}
                active={currentFrame.activeSide === "away"}
                onPress={() => handleActiveSidePress("away")}
                align="right"
                compact={isCompact}
              />
              <Text style={[styles.playerPoints, styles.playerPointsRight, isCompact && styles.playerPointsCompact]}>{currentFrame.awayPoints}</Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            {visibleBreak ? <BreakSection breakValue={visibleBreak.points} sequence={visibleBreak.balls} compact={isCompact} /> : <View style={styles.breakSpacer} />}
          </View>

          {ballAndControls}
        </View>
      </View>

      <ScoringModal
        visible={showFoulModal}
        title="Record foul"
        subtitle="Keep the offending player active, pick the foul value, and the points are awarded to the opponent automatically."
        onClose={() => setShowFoulModal(false)}
      >
        <View style={styles.modalOptionsRow}>
          {foulChoices.map((choice) => (
            <Pressable key={choice.key} style={styles.foulChoice} onPress={() => handleFoul(choice.points)}>
              {choice.ball ? <Ball ball={choice.ball} size={56} /> : <CompositeFoulBall size={56} />}
              <Text style={styles.foulPoints}>{choice.points}</Text>
              <Text style={styles.foulLabel}>{choice.ball ? snookerBallMeta[choice.ball].label : choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScoringModal>

      <ScoringModal
        visible={showFreeBallModal}
        title="Nominate free ball"
        subtitle="Choose the ball that was potted. The scorer applies the correct value based on what is currently on."
        onClose={() => setShowFreeBallModal(false)}
      >
        <BallSelector
          balls={snookerBallOrder}
          disabledBalls={snookerBallOrder.filter((ball) => !getFreeBallScoreTarget(currentFrame, ball))}
          onSelect={handleFreeBallSelect}
          compact={false}
        />
      </ScoringModal>

      <ScoringModal visible={showOverflowMenu} title="Match options" onClose={() => setShowOverflowMenu(false)}>
        <View style={styles.menuList}>
          <Pressable style={styles.menuItem} onPress={() => Alert.alert("Coin Toss", "Coin toss controls can be added here next.") }>
            <Text style={styles.menuItemText}>Coin Toss</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={appTheme.colors.textMuted} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => { setShowOverflowMenu(false); setShowExitConfirm(true); }}>
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Exit</Text>
            <MaterialCommunityIcons name="exit-to-app" size={18} color={appTheme.colors.danger} />
          </Pressable>
        </View>
      </ScoringModal>

      <ScoringModal
        visible={showExitConfirm}
        title="Exit match scoring?"
        subtitle="This discards the current unsubmitted scoring draft for this session and returns to My Matches."
        onClose={() => setShowExitConfirm(false)}
        footer={(
          <>
            <Pressable style={[styles.footerButton, styles.footerButtonNeutral]} onPress={() => setShowExitConfirm(false)}>
              <Text style={styles.footerButtonNeutralText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.footerButton, styles.footerButtonDanger]} onPress={handleExit}>
              <Text style={styles.footerButtonDangerText}>Exit Without Saving</Text>
            </Pressable>
          </>
        )}
      >
        <Text style={styles.exitBody}>No scores are committed in this screen-only flow. Exiting simply clears the local draft.</Text>
      </ScoringModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  backgroundGlowLeft: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: appTheme.colors.tealGlow,
    opacity: 0.08,
    top: -70,
    left: -120,
  },
  backgroundGlowRight: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: appTheme.colors.goldSoft,
    opacity: 0.12,
    bottom: -120,
    right: -150,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 14,
  },
  loadingWrap: {
    flex: 1,
    padding: 20,
  },
  errorWrap: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  topBarCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  metaLine: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  userBadgeText: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  surface: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: "rgba(8, 12, 18, 0.95)",
    padding: 18,
    justifyContent: "space-between",
    gap: 16,
    ...appTheme.shadows.card,
  },
  surfaceCompact: {
    padding: 16,
    gap: 12,
  },
  playerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  playerColumn: {
    width: 110,
    gap: 8,
  },
  playerColumnRight: {
    alignItems: "flex-end",
  },
  scoreCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  playerPoints: {
    color: appTheme.colors.text,
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 44,
  },
  playerPointsCompact: {
    fontSize: 34,
    lineHeight: 36,
  },
  playerPointsLeft: {
    textAlign: "left",
  },
  playerPointsRight: {
    textAlign: "right",
  },
  frameMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  middleSection: {
    gap: 12,
  },
  breakSpacer: {
    minHeight: 12,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  stateText: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  stateDivider: {
    color: appTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  bottomSection: {
    gap: 14,
  },
  modalOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  foulChoice: {
    width: "47%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  foulPoints: {
    color: appTheme.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  foulLabel: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuItemText: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  menuItemTextDanger: {
    color: appTheme.colors.danger,
  },
  footerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  footerButtonNeutral: {
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  footerButtonDanger: {
    backgroundColor: "rgba(121, 24, 36, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(240, 93, 108, 0.42)",
  },
  footerButtonNeutralText: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  footerButtonDangerText: {
    color: "#ffd7db",
    fontSize: 14,
    fontWeight: "900",
  },
  exitBody: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});