import type { MatchDetailResponse } from "../types/api";
import type { MatchScoringState, PlayerSide, RecordedBreak, ScoringAction, SnookerBall } from "../types/scoring";

const BALL_POINTS: Record<SnookerBall, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};

function createEmptyFrame(frameNumber: number) {
  return {
    frameNumber,
    homePoints: 0,
    awayPoints: 0,
    breaks: [] as RecordedBreak[],
    currentBreak: null,
    activeSide: "home" as PlayerSide,
    winnerSide: null,
    isComplete: false,
  };
}

function deepCloneState(state: MatchScoringState): MatchScoringState {
  return {
    ...state,
    frames: state.frames.map((frame) => ({
      ...frame,
      currentBreak: frame.currentBreak ? { ...frame.currentBreak } : null,
      breaks: frame.breaks.map((entry) => ({ ...entry })),
    })),
  };
}

export function getFramesNeededToWin(bestOfFrames: number) {
  return Math.floor(bestOfFrames / 2) + 1;
}

export function buildInitialScoringState(match: MatchDetailResponse["match"]) {
  const officialFrames = match.pendingSubmission?.frames.length
    ? match.pendingSubmission.frames
    : match.frames.map((frame) => ({
        frameNumber: frame.frameNumber,
        homeHighBreak: frame.homeHighBreak,
        awayHighBreak: frame.awayHighBreak,
      }));

  const frames = Array.from({ length: match.bestOfFrames }, (_, index) => {
    const frame = createEmptyFrame(index + 1);
    const officialFrame = match.frames.find((entry) => entry.frameNumber === index + 1);
    const pendingFrame = officialFrames.find((entry) => entry.frameNumber === index + 1);
    const winnerSide: PlayerSide | null = officialFrame?.winnerEntryId
      ? officialFrame.winnerEntryId === match.homeEntry.id
        ? "home"
        : "away"
      : null;
    const breaks: RecordedBreak[] = [];

    if (officialFrame) {
      for (const entry of officialFrame.breaks) {
        breaks.push({
          id: entry.id,
          side: entry.side,
          points: entry.breakValue,
        });
      }
    } else if (pendingFrame?.homeHighBreak) {
      breaks.push({
        id: `pending-home-${index + 1}`,
        side: "home",
        points: pendingFrame.homeHighBreak,
      });
    }

    if (!officialFrame && pendingFrame?.awayHighBreak) {
      breaks.push({
        id: `pending-away-${index + 1}`,
        side: "away",
        points: pendingFrame.awayHighBreak,
      });
    }

    return {
      ...frame,
      homePoints: officialFrame?.homePoints ?? 0,
      awayPoints: officialFrame?.awayPoints ?? 0,
      breaks,
      winnerSide,
      isComplete: Boolean(winnerSide),
      activeSide: match.currentSide,
    };
  });

  const currentFrameIndex = frames.findIndex((frame) => !frame.isComplete);

  return {
    matchId: match.id,
    bestOfFrames: match.bestOfFrames,
    snookerFormat: match.snookerFormat,
    startedAt: new Date().toISOString(),
    frames,
    currentFrameIndex: currentFrameIndex === -1 ? frames.length - 1 : currentFrameIndex,
  } satisfies MatchScoringState;
}

export function applyScoringAction(state: MatchScoringState, action: ScoringAction) {
  if (action.type === "resetMatch") {
    return deepCloneState(action.nextState);
  }

  const nextState = deepCloneState(state);
  const frame = nextState.frames[nextState.currentFrameIndex];

  if (!frame || frame.isComplete) {
    return nextState;
  }

  if (action.type === "pot") {
    const points = BALL_POINTS[action.ball];
    const nextBreakPoints = frame.currentBreak?.side === action.side ? frame.currentBreak.points + points : points;
    frame.currentBreak = {
      side: action.side,
      points: nextBreakPoints,
    };
    frame.activeSide = action.side;

    if (action.side === "home") {
      frame.homePoints += points;
    } else {
      frame.awayPoints += points;
    }

    return nextState;
  }

  if (action.type === "foul") {
    const opponent = action.side === "home" ? "away" : "home";

    if (opponent === "home") {
      frame.homePoints += action.points;
    } else {
      frame.awayPoints += action.points;
    }

    if (frame.currentBreak) {
      frame.breaks.push({
        id: `${frame.frameNumber}-${frame.breaks.length + 1}`,
        side: frame.currentBreak.side,
        points: frame.currentBreak.points,
      });
    }

    frame.currentBreak = null;
    frame.activeSide = opponent;
    return nextState;
  }

  if (action.type === "endTurn") {
    if (frame.currentBreak) {
      frame.breaks.push({
        id: `${frame.frameNumber}-${frame.breaks.length + 1}`,
        side: frame.currentBreak.side,
        points: frame.currentBreak.points,
      });
    }

    frame.currentBreak = null;
    frame.activeSide = frame.activeSide === "home" ? "away" : "home";
    return nextState;
  }

  if (action.type === "awardFrame") {
    if (frame.currentBreak) {
      frame.breaks.push({
        id: `${frame.frameNumber}-${frame.breaks.length + 1}`,
        side: frame.currentBreak.side,
        points: frame.currentBreak.points,
      });
    }

    frame.currentBreak = null;
    frame.winnerSide = action.side;
    frame.isComplete = true;
    return nextState;
  }

  if (action.type === "startNextFrame") {
    const nextFrameIndex = nextState.frames.findIndex((entry, index) => index > nextState.currentFrameIndex && !entry.isComplete);

    if (nextFrameIndex !== -1) {
      nextState.currentFrameIndex = nextFrameIndex;
    }

    return nextState;
  }

  return nextState;
}

export function summarizeScoringState(state: MatchScoringState) {
  const homeScore = state.frames.filter((frame) => frame.winnerSide === "home").length;
  const awayScore = state.frames.filter((frame) => frame.winnerSide === "away").length;
  const homeHighBreaks = state.frames.map((frame) => {
    const values = frame.breaks.filter((entry) => entry.side === "home").map((entry) => entry.points);
    return values.length > 0 ? Math.max(...values) : null;
  });
  const awayHighBreaks = state.frames.map((frame) => {
    const values = frame.breaks.filter((entry) => entry.side === "away").map((entry) => entry.points);
    return values.length > 0 ? Math.max(...values) : null;
  });

  return {
    homeScore,
    awayScore,
    homeHighBreaks,
    awayHighBreaks,
    isComplete:
      homeScore >= getFramesNeededToWin(state.bestOfFrames) ||
      awayScore >= getFramesNeededToWin(state.bestOfFrames),
  };
}