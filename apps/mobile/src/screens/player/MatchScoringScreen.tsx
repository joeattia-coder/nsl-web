import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { applyScoringAction, buildInitialScoringState, getFramesNeededToWin, getFreeBallOptions, getFreeBallScoreTarget, getLegalPots, getPossiblePointsRemaining, summarizeScoringState } from "../../lib/scoring";
import { ApiRequestError, mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { RootStackParamList } from "../../types/app";
import type { LiveMatchSessionRecord } from "../../types/api";
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

function buildLiveSessionDraft(state: MatchScoringState) {
  const summary = summarizeScoringState(state);
  const currentLiveFrame = state.frames[state.currentFrameIndex];

  return {
    summary: {
      homeScore: summary.homeScore,
      awayScore: summary.awayScore,
      currentFrameNumber: currentLiveFrame.frameNumber,
      currentFrameHomePoints: currentLiveFrame.homePoints,
      currentFrameAwayPoints: currentLiveFrame.awayPoints,
      activeSide: currentLiveFrame.activeSide,
      isComplete: summary.isComplete,
    },
    status: summary.isComplete ? ("COMPLETED" as const) : ("ACTIVE" as const),
  };
}

export function MatchScoringScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "MatchScoring">>();
  const { currentRole, currentUser } = useAppSession();
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
  const [showEndFrameConfirm, setShowEndFrameConfirm] = useState(false);
  const [showEndMatchConfirm, setShowEndMatchConfirm] = useState(false);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [isCancellingStartedMatch, setIsCancellingStartedMatch] = useState(false);
  const [liveSyncError, setLiveSyncError] = useState<string | null>(null);
  const [isLiveSessionConnected, setIsLiveSessionConnected] = useState(false);
  const [liveSession, setLiveSession] = useState<LiveMatchSessionRecord | null>(null);
  const liveSessionVersionRef = useRef(0);
  const lastSyncedStateRef = useRef<string | null>(null);
  const applyingRemoteStateRef = useRef(false);
  const syncInFlightRef = useRef(false);
  const finalizedAlertShownRef = useRef(false);

  const isCompact = height < 760 || width < 420;
  const useSingleRowBalls = width >= 680;
  const usesAdminOverride = currentRole === "league_admin" && currentUser.isAdmin;

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

  const applyRemoteSessionState = useCallback((nextState: MatchScoringState, version: number) => {
    applyingRemoteStateRef.current = true;
    liveSessionVersionRef.current = version;
    lastSyncedStateRef.current = JSON.stringify(nextState);
    setScoringState(nextState);
    setHistory([]);
    setLiveSyncError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadMatch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLiveSyncError(null);
        setIsLiveSessionConnected(false);
        setLiveSession(null);
        const response = await mobileApi.getMyMatch(route.params.matchId);
        const initialState = buildInitialScoringState(response.match);
        const liveDraft = buildLiveSessionDraft(initialState);
        const liveSessionResponse = await mobileApi.ensureLiveMatchSession(route.params.matchId, {
          initialState,
          summary: liveDraft.summary,
          status: liveDraft.status,
          adminOverride: usesAdminOverride,
        });
        const connectedSession = liveSessionResponse.session;

        if (!connectedSession || connectedSession.scoringState?.matchId !== response.match.id) {
          throw new Error("Unable to connect to the live match session. Close the scorer and try again.");
        }

        if (!isMounted) {
          return;
        }

        setLiveSession(connectedSession);
        setIsLiveSessionConnected(true);
        setMatch(response.match);
        applyRemoteSessionState(connectedSession.scoringState, connectedSession.version);
      } catch (loadError) {
        if (isMounted) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load this match.";
          setLiveSyncError(message);
          setError(message);
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
  }, [applyRemoteSessionState, route.params.matchId, usesAdminOverride]);

  useEffect(() => {
    if (!match || !isLiveSessionConnected) {
      return;
    }

    const intervalId = setInterval(() => {
      if (syncInFlightRef.current) {
        return;
      }

      void mobileApi.getLiveMatchSession(match.id)
        .then((response) => {
          const session = response.session;

          setLiveSession(session ?? null);

          if (!session?.scoringState || session.scoringState.matchId !== match.id) {
            return;
          }

          if (session.version <= liveSessionVersionRef.current) {
            return;
          }

          applyRemoteSessionState(session.scoringState, session.version);
        })
        .catch(() => {
          // Keep the local draft usable even if polling drops temporarily.
        });
    }, 1500);

    return () => {
      clearInterval(intervalId);
    };
  }, [applyRemoteSessionState, isLiveSessionConnected, match]);

  useEffect(() => {
    if (!match || !scoringState || !isLiveSessionConnected || liveSessionVersionRef.current < 1) {
      return;
    }

    const serializedState = JSON.stringify(scoringState);

    if (applyingRemoteStateRef.current) {
      applyingRemoteStateRef.current = false;
      return;
    }

    if (serializedState === lastSyncedStateRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (syncInFlightRef.current) {
        return;
      }

      syncInFlightRef.current = true;

      const liveDraft = buildLiveSessionDraft(scoringState);

      void mobileApi.syncLiveMatchSession(match.id, {
        baseVersion: liveSessionVersionRef.current,
        scoringState,
        summary: liveDraft.summary,
        status: liveDraft.status,
        adminOverride: usesAdminOverride,
      })
        .then((response) => {
          if (!response.session) {
            return;
          }

          setLiveSession(response.session);
          liveSessionVersionRef.current = response.session.version;
          lastSyncedStateRef.current = serializedState;
          setLiveSyncError(null);
        })
        .catch(async (syncError) => {
          if (syncError instanceof ApiRequestError && syncError.status === 409) {
            try {
              const latest = await mobileApi.getLiveMatchSession(match.id);

              setLiveSession(latest.session ?? null);

              if (latest.session?.scoringState?.matchId === match.id) {
                applyRemoteSessionState(latest.session.scoringState, latest.session.version);
              }
            } catch {
              setLiveSyncError("Live sync conflict detected.");
            }

            return;
          }

          setLiveSyncError(syncError instanceof Error ? syncError.message : "Live sync is retrying.");
        })
        .finally(() => {
          syncInFlightRef.current = false;
        });
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [applyRemoteSessionState, isLiveSessionConnected, match, scoringState, usesAdminOverride]);

  const scoringSummary = useMemo(() => (scoringState ? summarizeScoringState(scoringState) : null), [scoringState]);
  const currentFrame = scoringState ? scoringState.frames[scoringState.currentFrameIndex] : null;
  const visibleBreak = currentFrame?.currentBreak ?? null;
  const legalPots = currentFrame ? getLegalPots(currentFrame) : [];
  const freeBallOptions = currentFrame ? getFreeBallOptions(currentFrame) : [];
  const possiblePointsRemaining = currentFrame ? getPossiblePointsRemaining(currentFrame) : 0;
  const framesNeededToWin = match ? getFramesNeededToWin(match.bestOfFrames) : 0;
  const homePlayer = match ? getDisplayPlayer(match.homeEntry) : null;
  const awayPlayer = match ? getDisplayPlayer(match.awayEntry) : null;
  const projectedFrameWinner = currentFrame
    ? currentFrame.homePoints === currentFrame.awayPoints
      ? null
      : currentFrame.homePoints > currentFrame.awayPoints
        ? "home"
        : "away"
    : null;
  const projectedHomeFrames = scoringSummary
    ? scoringSummary.homeScore + (projectedFrameWinner === "home" ? 1 : 0)
    : 0;
  const projectedAwayFrames = scoringSummary
    ? scoringSummary.awayScore + (projectedFrameWinner === "away" ? 1 : 0)
    : 0;
  const opponentSide = match?.currentSide === "home" ? "away" : "home";
  const currentParticipantState = match ? liveSession?.participants[match.currentSide] ?? null : null;
  const opponentParticipantState = match && opponentSide ? liveSession?.participants[opponentSide] ?? null : null;
  const bothPlayersStarted = Boolean(liveSession?.participants.home.startedAt && liveSession?.participants.away.startedAt);
  const currentPlayerStarted = Boolean(currentParticipantState?.startedAt);
  const currentPlayerCompleted = Boolean(currentParticipantState?.completedAt);
  const opponentPlayerCompleted = Boolean(opponentParticipantState?.completedAt);
  const liveMatchFinalized = Boolean(liveSession?.finalizedAt);
  const startRequirementSatisfied = usesAdminOverride ? currentPlayerStarted : bothPlayersStarted;
  const waitingForStartHandshake = Boolean(match && liveSession && !startRequirementSatisfied && !currentPlayerCompleted && !liveMatchFinalized);
  const interactionLocked = waitingForStartHandshake || currentPlayerCompleted || liveMatchFinalized;
  const willFrameEndMatch = Boolean(
    projectedFrameWinner &&
    (projectedHomeFrames >= framesNeededToWin || projectedAwayFrames >= framesNeededToWin)
  );
  const endFrameActionLabel = "End Frame";
  const canConfirmLiveResult = Boolean(
    match &&
    scoringSummary?.isComplete &&
    startRequirementSatisfied &&
    !liveMatchFinalized &&
    !currentPlayerCompleted
  );
  const opponentDisplayName = match?.currentSide === "home" ? awayPlayer?.name ?? "opponent" : homePlayer?.name ?? "opponent";
  const showWaitingForStartModal = waitingForStartHandshake;
  const showWaitingForCompletionModal = Boolean(
    scoringSummary?.isComplete &&
    currentPlayerCompleted &&
    !usesAdminOverride &&
    !opponentPlayerCompleted &&
    !liveMatchFinalized
  );

  useEffect(() => {
    if (!liveMatchFinalized || finalizedAlertShownRef.current) {
      return;
    }

    finalizedAlertShownRef.current = true;
    Alert.alert("Match completed", usesAdminOverride ? "The result has been finalized from admin view and recorded." : "The scorer result has been recorded and written to the official match record.", [
      {
        text: "OK",
        onPress: () => navigation.goBack(),
      },
    ]);
  }, [liveMatchFinalized, navigation, usesAdminOverride]);

  const pushAction = (action: ScoringAction) => {
    if (!scoringState || interactionLocked) {
      return;
    }

    setHistory((current) => [...current, scoringState]);
    setScoringState((current) => (current ? applyScoringAction(current, action) : current));
  };

  const pushActions = (actions: ScoringAction[]) => {
    if (!scoringState || interactionLocked) {
      return;
    }

    setHistory((current) => [...current, scoringState]);
    setScoringState((current) => (current ? actions.reduce((nextState, action) => applyScoringAction(nextState, action), current) : current));
  };

  const resetTransientUI = () => {
    setShowOverflowMenu(false);
    setShowFoulModal(false);
    setShowFreeBallModal(false);
    setShowEndFrameConfirm(false);
    setShowEndMatchConfirm(false);
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

    if (!getFreeBallScoreTarget(currentFrame, ball)) {
      Alert.alert("Free Ball", "That ball cannot be nominated for the current shot.");
      return;
    }

    pushAction({ type: "pot", side: currentFrame.activeSide, ball, isFreeBall: true });
    setShowFreeBallModal(false);
  };

  const handleFoul = (points: number) => {
    if (!currentFrame) {
      return;
    }

    pushAction({ type: "foul", side: currentFrame.activeSide, points });
    setShowFoulModal(false);
  };

  const handleCloseFreeBallModal = () => {
    if (currentFrame?.freeBallAvailable) {
      pushAction({ type: "declineFreeBall" });
    }

    setShowFreeBallModal(false);
  };

  const getProjectedFrameWinner = useCallback(() => {
    if (!currentFrame || !scoringSummary || currentFrame.homePoints === currentFrame.awayPoints) {
      return null;
    }

    return currentFrame.homePoints > currentFrame.awayPoints ? "home" : "away";
  }, [currentFrame, scoringSummary]);

  const handleEndFramePress = () => {
    if (!currentFrame || !scoringSummary) {
      return;
    }

    if (!getProjectedFrameWinner()) {
      Alert.alert(endFrameActionLabel, "Record a deciding score before ending a tied frame.");
      return;
    }

    setShowEndFrameConfirm(true);
  };

  const handleConfirmEndFrame = () => {
    const winnerSide = getProjectedFrameWinner();

    if (!winnerSide || !scoringSummary || !scoringState) {
      return;
    }

    const awardedState = applyScoringAction(scoringState, { type: "awardFrame", side: winnerSide });
    const awardedSummary = summarizeScoringState(awardedState);

    setHistory((current) => [...current, scoringState]);
    setScoringState(
      awardedSummary.isComplete
        ? awardedState
        : applyScoringAction(awardedState, { type: "startNextFrame" })
    );
    setShowOverflowMenu(false);
    setShowFoulModal(false);
    setShowFreeBallModal(false);
    setShowEndFrameConfirm(false);

    if (awardedSummary.isComplete) {
      setShowEndMatchConfirm(true);
    }
  };

  const buildCompletedScoringState = useCallback(() => {
    if (!scoringState) {
      return null;
    }

    const liveSummary = summarizeScoringState(scoringState);

    if (liveSummary.isComplete) {
      return {
        ...scoringState,
        completedAt: new Date().toISOString(),
      } satisfies MatchScoringState;
    }

    const winnerSide = getProjectedFrameWinner();

    if (!winnerSide) {
      return null;
    }

    return {
      ...applyScoringAction(scoringState, { type: "awardFrame", side: winnerSide }),
      completedAt: new Date().toISOString(),
    } satisfies MatchScoringState;
  }, [getProjectedFrameWinner, scoringState]);

  const handleExit = () => {
    setScoringState(null);
    setHistory([]);
    setShowExitConfirm(false);
    setShowOverflowMenu(false);
    navigation.goBack();
  };

  const handleCancelStartedMatch = useCallback(() => {
    if (!match || !showWaitingForStartModal || isCancellingStartedMatch) {
      return;
    }

    Alert.alert(
      "Close match?",
      "This will cancel your match start, remove it from live view, and let you open a different match instead.",
      [
        {
          text: "Keep Waiting",
          style: "cancel",
        },
        {
          text: "Close Match",
          style: "destructive",
          onPress: () => {
            setIsCancellingStartedMatch(true);

            void mobileApi.resetLiveMatchSession(match.id)
              .then(() => {
                navigation.goBack();
              })
              .catch((cancelError) => {
                Alert.alert(
                  "Unable to close match",
                  cancelError instanceof Error ? cancelError.message : "Unable to close this live match right now."
                );
              })
              .finally(() => {
                setIsCancellingStartedMatch(false);
              });
          },
        },
      ]
    );
  }, [isCancellingStartedMatch, match, navigation, showWaitingForStartModal]);

  const handleAdminResetLiveMatch = () => {
    if (!match || !currentUser.isAdmin) {
      return;
    }

    Alert.alert(
      "Reset live match?",
      "This will discard the active live scoring session so the match can be started again from scratch.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset Match",
          style: "destructive",
          onPress: () => {
            setShowOverflowMenu(false);

            void mobileApi.adminResetLiveMatchSession(match.id)
              .then(() => {
                Alert.alert("Live match reset", "The live scoring session has been cleared. You can reopen the scorer to start the match again.", [
                  {
                    text: "OK",
                    onPress: () => navigation.goBack(),
                  },
                ]);
              })
              .catch((resetError) => {
                Alert.alert("Unable to reset live match", resetError instanceof Error ? resetError.message : "Unable to reset the live scoring session right now.");
              });
          },
        },
      ]
    );
  };

  const finalizeCompletedMatch = useCallback((completedState: MatchScoringState, successMessage: string) => {
    if (!match) {
      return;
    }

    setIsSubmittingResult(true);
    resetTransientUI();

    void mobileApi.completeLiveMatchSession(match.id, {
      ...(usesAdminOverride ? { adminOverride: true } : {}),
      scoringState: completedState,
    })
      .then((response) => {
        if (response.session) {
          setLiveSession(response.session);
        }

        if (response.finalized || response.session?.finalizedAt) {
          finalizedAlertShownRef.current = true;
          Alert.alert("Match completed", successMessage, [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      })
      .catch((submitError) => {
        Alert.alert("Unable to complete match", submitError instanceof Error ? submitError.message : "Unable to complete the match right now.");
      })
      .finally(() => {
        setIsSubmittingResult(false);
      });
  }, [match, navigation, usesAdminOverride]);

  const handleConfirmLiveResult = () => {
    if (!match || !canConfirmLiveResult || isSubmittingResult) {
      return;
    }

    Alert.alert(
      "Confirm match end?",
      usesAdminOverride
        ? "This will finalize the live-scored result immediately from admin view."
        : "This will finalize the scorer result and write it into the official match record.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm End",
          onPress: () => {
            const completedState = buildCompletedScoringState() ?? scoringState;

            if (!completedState) {
              Alert.alert("Confirm match end", "A completed scoring state is required before the match can be confirmed.");
              return;
            }

            finalizeCompletedMatch(
              completedState,
              usesAdminOverride
                ? "The result has been finalized from admin view and recorded."
                : "The result has been recorded from the scorer and written to the official match record."
            );
          },
        },
      ]
    );
  };

  const handleConfirmEndMatch = () => {
    const completedState = buildCompletedScoringState();

    if (!completedState) {
      Alert.alert("End Match", "Record a deciding score before ending a tied frame.");
      return;
    }

    finalizeCompletedMatch(
      completedState,
      usesAdminOverride
        ? "The result has been finalized from admin view and recorded."
        : "The result has been recorded from the scorer and written to the official match record."
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.root}>
        <StatusBar style="light" />
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
      <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.backgroundGlowLeft} />
        <View style={styles.backgroundGlowRight} />
        <View style={styles.errorWrap}>
          <EmptyState title="Scoring unavailable" description={error ?? "Unable to start this match."} icon="alert-circle-outline" />
        </View>
      </SafeAreaView>
    );
  }

  const disabledBalls = interactionLocked ? [...snookerBallOrder] : snookerBallOrder.filter((ball) => !legalPots.includes(ball));
  const stateSummary = (
    <View style={styles.stateRow}>
      <Text style={styles.stateText}>Reds remaining {currentFrame.redsRemaining}</Text>
      <Text style={styles.stateDivider}>•</Text>
      <Text style={styles.stateText}>Possible points remaining {possiblePointsRemaining}</Text>
      {isLiveSessionConnected ? <Text style={styles.stateDivider}>•</Text> : null}
      {isLiveSessionConnected ? (
        <Text style={[styles.stateText, liveSyncError ? styles.syncStateError : styles.syncStateActive]}>
          {liveSyncError ? "Live sync retrying" : "Live sync active"}
        </Text>
      ) : null}
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
          {
            key: "free-ball",
            label: "Free Ball",
            tone: currentFrame.freeBallAvailable ? "active" : "neutral",
            onPress: () => {
              if (!currentFrame.freeBallAvailable) {
                return;
              }

              setShowFoulModal(false);
              setShowFreeBallModal(true);
            },
          },
          { key: "foul", label: "Foul", tone: "danger", onPress: () => { setShowFreeBallModal(false); setShowFoulModal(true); } },
          { key: "end-frame", label: endFrameActionLabel, tone: "emphasis", onPress: handleEndFramePress },
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.root}>
      <StatusBar style="light" />
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
              <FrameScore leftScore={scoringSummary.homeScore} rightScore={scoringSummary.awayScore} bestOfFrames={match.bestOfFrames} compact={isCompact} />
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
        onClose={handleCloseFreeBallModal}
        closeOnBackdropPress={false}
        footer={(
          <Pressable style={[styles.footerButton, styles.footerButtonNeutral]} onPress={handleCloseFreeBallModal}>
            <Text style={styles.footerButtonNeutralText}>Cancel Free Ball</Text>
          </Pressable>
        )}
      >
        <BallSelector
          balls={freeBallOptions}
          onSelect={handleFreeBallSelect}
          compact={false}
        />
      </ScoringModal>

      <ScoringModal visible={showOverflowMenu} title="Match options" onClose={() => setShowOverflowMenu(false)}>
        <View style={styles.menuList}>
          {canConfirmLiveResult ? (
            <Pressable style={styles.menuItem} onPress={handleConfirmLiveResult}>
              <Text style={styles.menuItemText}>{isSubmittingResult ? "Confirming end..." : "Confirm Match End"}</Text>
              <MaterialCommunityIcons name="send-check-outline" size={18} color={appTheme.colors.success} />
            </Pressable>
          ) : null}
          {currentUser.isAdmin && !liveMatchFinalized ? (
            <Pressable style={styles.menuItem} onPress={handleAdminResetLiveMatch}>
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Reset Live Match</Text>
              <MaterialCommunityIcons name="restart" size={18} color={appTheme.colors.danger} />
            </Pressable>
          ) : null}
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
        title="Close match scoring?"
        subtitle="Closing keeps the live scoring session attached to the match. Only an admin or official can reset it."
        onClose={() => setShowExitConfirm(false)}
        footer={(
          <>
            <Pressable style={[styles.footerButton, styles.footerButtonNeutral]} onPress={() => setShowExitConfirm(false)}>
              <Text style={styles.footerButtonNeutralText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.footerButton, styles.footerButtonDanger]} onPress={handleExit}>
              <Text style={styles.footerButtonDangerText}>Exit Scorer</Text>
            </Pressable>
          </>
        )}
      >
        <Text style={styles.exitBody}>Exiting closes this device view only. The live scoring session stays active so the match can continue on this device or another authorized device.</Text>
      </ScoringModal>

      <ScoringModal
        visible={showEndFrameConfirm}
        title="End frame?"
        subtitle={willFrameEndMatch ? "This will award the current frame. Because it is the deciding frame, you will then be asked to confirm ending the match." : "This will award the current frame using the score currently shown and move the scorer to the next frame."}
        onClose={() => setShowEndFrameConfirm(false)}
        footer={(
          <>
            <Pressable style={[styles.footerButton, styles.footerButtonNeutral]} onPress={() => setShowEndFrameConfirm(false)}>
              <Text style={styles.footerButtonNeutralText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.footerButton, styles.footerButtonDanger]} onPress={handleConfirmEndFrame}>
              <Text style={styles.footerButtonDangerText}>End Frame</Text>
            </Pressable>
          </>
        )}
      >
        <Text style={styles.exitBody}>Cancel keeps the current frame active so scoring can continue.</Text>
      </ScoringModal>

      <ScoringModal
        visible={showEndMatchConfirm}
        title="End match?"
        subtitle="This will award the current frame, complete the match, and write the scorer result into the official match record."
        onClose={() => setShowEndMatchConfirm(false)}
        closeOnBackdropPress={!isSubmittingResult}
        showCloseButton={!isSubmittingResult}
        footer={(
          <>
            <Pressable style={[styles.footerButton, styles.footerButtonNeutral]} onPress={() => setShowEndMatchConfirm(false)} disabled={isSubmittingResult}>
              <Text style={styles.footerButtonNeutralText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.footerButton, styles.footerButtonDanger]} onPress={handleConfirmEndMatch} disabled={isSubmittingResult}>
              <Text style={styles.footerButtonDangerText}>{isSubmittingResult ? "Ending Match..." : "End Match"}</Text>
            </Pressable>
          </>
        )}
      >
        <Text style={styles.exitBody}>Cancel keeps the current frame active so you can continue scoring.</Text>
      </ScoringModal>

      <ScoringModal
        visible={showWaitingForStartModal || showWaitingForCompletionModal}
        title={showWaitingForStartModal ? `Waiting for ${opponentDisplayName} to start match` : `Waiting for ${opponentDisplayName} to confirm match end`}
        subtitle={showWaitingForStartModal ? "Scoring will unlock automatically as soon as they start the match on their device." : "The result is being finalized from the scorer."}
        onClose={showWaitingForStartModal ? handleCancelStartedMatch : () => {}}
        closeOnBackdropPress={false}
        showCloseButton={showWaitingForStartModal}
        footer={showWaitingForStartModal ? (
          <Pressable style={[styles.footerButton, styles.footerButtonDanger]} onPress={handleCancelStartedMatch}>
            <Text style={styles.footerButtonDangerText}>{isCancellingStartedMatch ? "Closing match..." : "Close Match"}</Text>
          </Pressable>
        ) : undefined}
      >
        <Text style={styles.exitBody}>
          {showWaitingForStartModal
            ? `${opponentDisplayName} has not started the match yet. Close this match if you opened the wrong scorer by accident.`
            : "The official match result is being written from the scorer workflow."}
        </Text>
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
    paddingTop: 16,
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
  syncStateActive: {
    color: appTheme.colors.success,
  },
  syncStateError: {
    color: appTheme.colors.warning,
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