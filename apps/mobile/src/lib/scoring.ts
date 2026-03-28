import type { MatchDetailResponse } from "../types/api";
import type { ExpectedShot, MatchScoringState, PlayerSide, RecordedBreak, ScoringAction, SnookerBall } from "../types/scoring";

const BALL_POINTS: Record<SnookerBall, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  brown: 4,
  blue: 5,
  pink: 6,
  black: 7,
};

const CLEARANCE_ORDER: SnookerBall[] = ["yellow", "green", "brown", "blue", "pink", "black"];

function isColorBall(ball: SnookerBall) {
  return ball !== "red";
}

function isOpenRedSequence(frame: MatchScoringState["frames"][number]) {
  return frame.expectedShot === "color" && frame.redsRemaining > 0;
}

function getNextClearanceBall(ball: SnookerBall): ExpectedShot {
  const currentIndex = CLEARANCE_ORDER.indexOf(ball);

  if (currentIndex === -1 || currentIndex === CLEARANCE_ORDER.length - 1) {
    return "none";
  }

  return CLEARANCE_ORDER[currentIndex + 1];
}

function getClearancePointsFrom(ball: SnookerBall) {
  const startIndex = CLEARANCE_ORDER.indexOf(ball);

  if (startIndex === -1) {
    return 0;
  }

  return CLEARANCE_ORDER.slice(startIndex).reduce((total, entry) => total + BALL_POINTS[entry], 0);
}

function getInitialFrameState(frameNumber: number, redsRemaining: number) {
  return {
    frameNumber,
    homePoints: 0,
    awayPoints: 0,
    homeFouls: 0,
    awayFouls: 0,
    breaks: [] as RecordedBreak[],
    currentBreak: null,
    activeSide: "home" as PlayerSide,
    redsRemaining,
    expectedShot: "red" as ExpectedShot,
    freeBallAvailable: false,
    winnerSide: null,
    isComplete: false,
  };
}

function getExpectedShotForNewVisit(frame: MatchScoringState["frames"][number]): ExpectedShot {
  if (frame.redsRemaining > 0) {
    return "red";
  }

  if (frame.expectedShot === "color") {
    return "yellow";
  }

  return frame.expectedShot;
}

function getTotalRedsFromFormat(snookerFormat: MatchScoringState["snookerFormat"]) {
  switch (snookerFormat) {
    case "REDS_6":
      return 6;
    case "REDS_10":
      return 10;
    default:
      return 15;
  }
}

function isLegalPot(frame: MatchScoringState["frames"][number], ball: SnookerBall, scoredAs: SnookerBall, isFreeBall: boolean) {
  if (frame.expectedShot === "none") {
    return false;
  }

  if (isFreeBall) {
    if (!frame.freeBallAvailable) {
      return false;
    }

    if (frame.expectedShot === "red") {
      return scoredAs === "red" && isColorBall(ball);
    }

    if (frame.expectedShot === "color") {
      return isColorBall(ball) && isColorBall(scoredAs);
    }

    return scoredAs === frame.expectedShot && isColorBall(ball);
  }

  if (frame.expectedShot === "red") {
    return ball === "red";
  }

  if (frame.expectedShot === "color") {
    if (ball === "red") {
      return frame.redsRemaining > 0 && scoredAs === "red";
    }

    return isColorBall(ball) && scoredAs === ball;
  }

  return ball === frame.expectedShot && scoredAs === ball;
}

function advanceFrameAfterPot(frame: MatchScoringState["frames"][number], scoredAs: SnookerBall, isFreeBall: boolean) {
  if (frame.expectedShot === "red") {
    if (!isFreeBall) {
      frame.redsRemaining = Math.max(frame.redsRemaining - 1, 0);
    }

    frame.expectedShot = "color";
    return;
  }

  if (frame.expectedShot === "color") {
    if (scoredAs === "red") {
      if (!isFreeBall) {
        frame.redsRemaining = Math.max(frame.redsRemaining - 1, 0);
      }

      frame.expectedShot = "color";
      return;
    }

    frame.expectedShot = frame.redsRemaining > 0 ? "red" : "yellow";
    return;
  }

  frame.expectedShot = getNextClearanceBall(scoredAs);
}

function deepCloneState(state: MatchScoringState): MatchScoringState {
  return {
    ...state,
    frames: state.frames.map((frame) => ({
      ...frame,
      homeFouls: frame.homeFouls,
      awayFouls: frame.awayFouls,
      currentBreak: frame.currentBreak ? { ...frame.currentBreak, balls: [...frame.currentBreak.balls] } : null,
      breaks: frame.breaks.map((entry) => ({ ...entry, balls: [...entry.balls] })),
    })),
  };
}

export function getFramesNeededToWin(bestOfFrames: number) {
  return Math.floor(bestOfFrames / 2) + 1;
}

export function buildInitialScoringState(match: MatchDetailResponse["match"]) {
  const totalReds = getTotalRedsFromFormat(match.snookerFormat);
  const officialFrames = match.pendingSubmission?.frames.length
    ? match.pendingSubmission.frames
    : match.frames.map((frame) => ({
        frameNumber: frame.frameNumber,
        homeHighBreak: frame.homeHighBreak,
        awayHighBreak: frame.awayHighBreak,
      }));

  const frames = Array.from({ length: match.bestOfFrames }, (_, index) => {
    const frame = getInitialFrameState(index + 1, totalReds);
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
          balls: [],
        });
      }
    } else if (pendingFrame?.homeHighBreak) {
      breaks.push({
        id: `pending-home-${index + 1}`,
        side: "home",
        points: pendingFrame.homeHighBreak,
        balls: [],
      });
    }

    if (!officialFrame && pendingFrame?.awayHighBreak) {
      breaks.push({
        id: `pending-away-${index + 1}`,
        side: "away",
        points: pendingFrame.awayHighBreak,
        balls: [],
      });
    }

    return {
      ...frame,
      homePoints: officialFrame?.homePoints ?? 0,
      awayPoints: officialFrame?.awayPoints ?? 0,
      homeFouls: 0,
      awayFouls: 0,
      breaks,
      winnerSide,
      isComplete: Boolean(winnerSide),
      activeSide: match.currentSide,
      expectedShot: winnerSide ? "none" : frame.expectedShot,
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

  if (action.type === "startNextFrame") {
    const nextFrameIndex = nextState.frames.findIndex((entry, index) => index > nextState.currentFrameIndex && !entry.isComplete);

    if (nextFrameIndex !== -1) {
      nextState.currentFrameIndex = nextFrameIndex;
    }

    return nextState;
  }

  const frame = nextState.frames[nextState.currentFrameIndex];

  if (!frame || frame.isComplete) {
    return nextState;
  }

  if (action.type === "pot") {
    const scoredAs = action.isFreeBall
      ? getFreeBallScoreTarget(frame, action.ball)
      : action.ball;

    if (!scoredAs) {
      return nextState;
    }

    if (!isLegalPot(frame, action.ball, scoredAs, Boolean(action.isFreeBall))) {
      return nextState;
    }

    const points = BALL_POINTS[scoredAs];
    const nextBreakPoints = frame.currentBreak?.side === action.side ? frame.currentBreak.points + points : points;
    frame.currentBreak = {
      side: action.side,
      points: nextBreakPoints,
      balls: frame.currentBreak?.side === action.side ? [...frame.currentBreak.balls, action.ball] : [action.ball],
    };
    frame.activeSide = action.side;

    if (action.side === "home") {
      frame.homePoints += points;
    } else {
      frame.awayPoints += points;
    }

    advanceFrameAfterPot(frame, scoredAs, Boolean(action.isFreeBall));
    frame.freeBallAvailable = false;

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
        balls: [...frame.currentBreak.balls],
      });
    }

    if (action.side === "home") {
      frame.homeFouls += 1;
    } else {
      frame.awayFouls += 1;
    }

    frame.currentBreak = null;
    frame.activeSide = opponent;
    frame.freeBallAvailable = true;
    return nextState;
  }

  if (action.type === "endTurn") {
    if (frame.currentBreak) {
      frame.breaks.push({
        id: `${frame.frameNumber}-${frame.breaks.length + 1}`,
        side: frame.currentBreak.side,
        points: frame.currentBreak.points,
        balls: [...frame.currentBreak.balls],
      });
    }

    frame.currentBreak = null;
    frame.activeSide = frame.activeSide === "home" ? "away" : "home";
    frame.expectedShot = getExpectedShotForNewVisit(frame);
    frame.freeBallAvailable = false;
    return nextState;
  }

  if (action.type === "declineFreeBall") {
    frame.freeBallAvailable = false;
    return nextState;
  }

  if (action.type === "awardFrame") {
    if (frame.currentBreak) {
      frame.breaks.push({
        id: `${frame.frameNumber}-${frame.breaks.length + 1}`,
        side: frame.currentBreak.side,
        points: frame.currentBreak.points,
        balls: [...frame.currentBreak.balls],
      });
    }

    frame.currentBreak = null;
    frame.winnerSide = action.side;
    frame.isComplete = true;
    frame.expectedShot = "none";
    frame.freeBallAvailable = false;
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

export function getLegalPots(frame: MatchScoringState["frames"][number]) {
  if (frame.expectedShot === "none") {
    return [] as SnookerBall[];
  }

  if (frame.expectedShot === "red") {
    return ["red"] as SnookerBall[];
  }

  if (frame.expectedShot === "color") {
    return isOpenRedSequence(frame) ? (["red", ...CLEARANCE_ORDER] as SnookerBall[]) : CLEARANCE_ORDER;
  }

  return [frame.expectedShot];
}

export function getFreeBallScoreTarget(frame: MatchScoringState["frames"][number], nominatedBall: SnookerBall): SnookerBall | null {
  if (!frame.freeBallAvailable) {
    return null;
  }

  if (frame.expectedShot === "none") {
    return null;
  }

  if (frame.expectedShot === "red") {
    return nominatedBall === "red" ? null : "red";
  }

  if (frame.expectedShot === "color") {
    return nominatedBall === "red" ? null : nominatedBall;
  }

  return nominatedBall === "red" ? null : frame.expectedShot;
}

export function getFreeBallOptions(frame: MatchScoringState["frames"][number]) {
  if (!frame.freeBallAvailable) {
    return [] as SnookerBall[];
  }

  if (frame.expectedShot === "none") {
    return [] as SnookerBall[];
  }

  if (frame.expectedShot === "red" || frame.expectedShot === "color") {
    return CLEARANCE_ORDER;
  }

  const currentIndex = CLEARANCE_ORDER.indexOf(frame.expectedShot);

  if (currentIndex === -1 || currentIndex === CLEARANCE_ORDER.length - 1) {
    return [] as SnookerBall[];
  }

  return CLEARANCE_ORDER.slice(currentIndex + 1);
}

export function getPossiblePointsRemaining(frame: MatchScoringState["frames"][number]) {
  if (frame.expectedShot === "none") {
    return 0;
  }

  if (frame.expectedShot === "red") {
    return frame.redsRemaining * 8 + 27;
  }

  if (frame.expectedShot === "color") {
    return 7 + frame.redsRemaining * 8 + 27;
  }

  return getClearancePointsFrom(frame.expectedShot);
}