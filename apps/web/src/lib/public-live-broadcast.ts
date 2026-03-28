import type { PublicLiveBroadcastState, PublicLiveBreakState, PublicLiveFrameSummary } from "@/lib/live-match";

type PlayerSide = "home" | "away";

type LiveBreak = {
  side: PlayerSide;
  points: number;
  balls: string[];
};

type LiveFrameState = {
  frameNumber: number;
  homePoints: number;
  awayPoints: number;
  homeFouls: number;
  awayFouls: number;
  breaks: LiveBreak[];
  currentBreak: LiveBreak | null;
  activeSide: PlayerSide;
  redsRemaining: number;
  expectedShot: string;
  winnerSide: PlayerSide | null;
  isComplete: boolean;
};

type LiveScoringState = {
  matchId: string;
  bestOfFrames: number;
  startedAt: string;
  currentFrameIndex: number;
  frames: LiveFrameState[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isPlayerSide(value: unknown): value is PlayerSide {
  return value === "home" || value === "away";
}

function parseBalls(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseBreak(value: unknown): LiveBreak | null {
  if (!isRecord(value) || !isPlayerSide(value.side) || !isInteger(value.points) || value.points < 0) {
    return null;
  }

  return {
    side: value.side,
    points: value.points,
    balls: parseBalls(value.balls),
  };
}

function parseFrame(value: unknown): LiveFrameState | null {
  if (!isRecord(value)) {
    return null;
  }

  const breaks = Array.isArray(value.breaks) ? value.breaks.map(parseBreak).filter(Boolean) as LiveBreak[] : [];
  const currentBreak = value.currentBreak === null ? null : parseBreak(value.currentBreak);
  const winnerSide = value.winnerSide;

  if (
    !isInteger(value.frameNumber) ||
    !isInteger(value.homePoints) ||
    !isInteger(value.awayPoints) ||
    !isPlayerSide(value.activeSide) ||
    !isInteger(value.redsRemaining) ||
    typeof value.expectedShot !== "string" ||
    typeof value.isComplete !== "boolean" ||
    !(winnerSide === null || isPlayerSide(winnerSide))
  ) {
    return null;
  }

  return {
    frameNumber: value.frameNumber,
    homePoints: value.homePoints,
    awayPoints: value.awayPoints,
    homeFouls: isInteger(value.homeFouls) ? value.homeFouls : 0,
    awayFouls: isInteger(value.awayFouls) ? value.awayFouls : 0,
    breaks,
    currentBreak,
    activeSide: value.activeSide,
    redsRemaining: value.redsRemaining,
    expectedShot: value.expectedShot,
    winnerSide,
    isComplete: value.isComplete,
  };
}

function parseLiveScoringState(value: unknown): LiveScoringState | null {
  if (
    !isRecord(value) ||
    typeof value.matchId !== "string" ||
    !isInteger(value.bestOfFrames) ||
    typeof value.startedAt !== "string" ||
    !isInteger(value.currentFrameIndex) ||
    !Array.isArray(value.frames)
  ) {
    return null;
  }

  const frames = value.frames.map(parseFrame);

  if (frames.some((frame) => !frame)) {
    return null;
  }

  return {
    matchId: value.matchId,
    bestOfFrames: value.bestOfFrames,
    startedAt: value.startedAt,
    currentFrameIndex: value.currentFrameIndex,
    frames: frames as LiveFrameState[],
  };
}

function getHighBreak(frame: LiveFrameState, side: PlayerSide) {
  const values = [...frame.breaks, ...(frame.currentBreak ? [frame.currentBreak] : [])]
    .filter((entry) => entry.side === side)
    .map((entry) => entry.points);

  return values.length > 0 ? Math.max(...values) : null;
}

function toFrameSummary(frame: LiveFrameState, isCurrent: boolean): PublicLiveFrameSummary {
  return {
    frameNumber: frame.frameNumber,
    homePoints: frame.homePoints,
    awayPoints: frame.awayPoints,
    homeHighBreak: getHighBreak(frame, "home"),
    awayHighBreak: getHighBreak(frame, "away"),
    homeFouls: frame.homeFouls,
    awayFouls: frame.awayFouls,
    winnerSide: frame.winnerSide,
    isComplete: frame.isComplete,
    isCurrent,
  };
}

function toCurrentBreak(currentBreak: LiveBreak | null): PublicLiveBreakState | null {
  if (!currentBreak) {
    return null;
  }

  return {
    side: currentBreak.side,
    points: currentBreak.points,
    balls: currentBreak.balls,
  };
}

export function derivePublicLiveBroadcastState(scoringStateValue: unknown): PublicLiveBroadcastState | null {
  const scoringState = parseLiveScoringState(scoringStateValue);

  if (!scoringState) {
    return null;
  }

  const frames = Array.from({ length: scoringState.bestOfFrames }, (_, index) => {
    const frame = scoringState.frames.find((entry) => entry.frameNumber === index + 1) ?? {
      frameNumber: index + 1,
      homePoints: 0,
      awayPoints: 0,
      homeFouls: 0,
      awayFouls: 0,
      breaks: [],
      currentBreak: null,
      activeSide: "home" as PlayerSide,
      redsRemaining: 0,
      expectedShot: "none",
      winnerSide: null,
      isComplete: false,
    };

    return toFrameSummary(frame, index === scoringState.currentFrameIndex);
  });

  const currentFrame = scoringState.frames[scoringState.currentFrameIndex] ?? null;
  const highestHome = frames.map((frame) => frame.homeHighBreak ?? 0);
  const highestAway = frames.map((frame) => frame.awayHighBreak ?? 0);

  return {
    startedAt: scoringState.startedAt || null,
    currentFrameNumber: currentFrame?.frameNumber ?? null,
    redsRemaining: currentFrame?.redsRemaining ?? null,
    expectedShot: currentFrame?.expectedShot ?? null,
    activeSide: currentFrame?.activeSide ?? null,
    currentBreak: toCurrentBreak(currentFrame?.currentBreak ?? null),
    highestBreak: {
      home: highestHome.some((value) => value > 0) ? Math.max(...highestHome) : null,
      away: highestAway.some((value) => value > 0) ? Math.max(...highestAway) : null,
    },
    totalFouls: {
      home: frames.reduce((total, frame) => total + frame.homeFouls, 0),
      away: frames.reduce((total, frame) => total + frame.awayFouls, 0),
    },
    frames,
  } satisfies PublicLiveBroadcastState;
}