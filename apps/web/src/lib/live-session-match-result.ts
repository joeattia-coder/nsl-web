import type { MatchResultSubmissionFrameValue } from "@/lib/match-result-submissions";

type LiveBreak = {
  side: "home" | "away";
  points: number;
};

type LiveFrameState = {
  frameNumber: number;
  homePoints: number;
  awayPoints: number;
  breaks: LiveBreak[];
  currentBreak: LiveBreak | null;
  activeSide: "home" | "away";
  winnerSide: "home" | "away" | null;
  isComplete: boolean;
};

type LiveScoringState = {
  matchId: string;
  bestOfFrames: number;
  startedAt: string;
  completedAt: string | null;
  frames: LiveFrameState[];
  currentFrameIndex?: number;
};

type OfficialFrameResult = MatchResultSubmissionFrameValue & {
  winnerEntryId: string | null;
  homePoints: number;
  awayPoints: number;
};

export type DerivedLiveSessionMatchResult = {
  homeScore: number;
  awayScore: number;
  winnerEntryId: string | null;
  homeHighBreaks: Array<number | null>;
  awayHighBreaks: Array<number | null>;
  frames: OfficialFrameResult[];
  startedAt: string | null;
  completedAt: string | null;
  isComplete: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isBreak(value: unknown): value is LiveBreak {
  return isRecord(value) && (value.side === "home" || value.side === "away") && isInteger(value.points) && value.points >= 0;
}

function parseFrame(value: unknown): LiveFrameState | null {
  if (!isRecord(value)) {
    return null;
  }

  const breaks = Array.isArray(value.breaks) ? value.breaks.filter(isBreak) : [];
  const currentBreak = value.currentBreak === null ? null : isBreak(value.currentBreak) ? value.currentBreak : null;
  const activeSide = value.activeSide;
  const winnerSide = value.winnerSide;

  if (
    !isInteger(value.frameNumber) ||
    !isInteger(value.homePoints) ||
    !isInteger(value.awayPoints) ||
    typeof value.isComplete !== "boolean" ||
    !(activeSide === "home" || activeSide === "away") ||
    !(winnerSide === "home" || winnerSide === "away" || winnerSide === null)
  ) {
    return null;
  }

  return {
    frameNumber: value.frameNumber,
    homePoints: value.homePoints,
    awayPoints: value.awayPoints,
    breaks,
    currentBreak,
    activeSide,
    winnerSide,
    isComplete: value.isComplete,
  };
}

export function parseLiveScoringState(value: unknown): LiveScoringState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.matchId !== "string" ||
    !isInteger(value.bestOfFrames) ||
    typeof value.startedAt !== "string" ||
    !Array.isArray(value.frames) ||
    !(value.completedAt === undefined || value.completedAt === null || typeof value.completedAt === "string")
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
    completedAt: value.completedAt === undefined ? null : value.completedAt,
    frames: frames as LiveFrameState[],
    currentFrameIndex: isInteger(value.currentFrameIndex) ? value.currentFrameIndex : undefined,
  };
}

function getHighBreak(frame: LiveFrameState, side: "home" | "away") {
  const values = [...frame.breaks, ...(frame.currentBreak ? [frame.currentBreak] : [])]
    .filter((entry) => entry.side === side)
    .map((entry) => entry.points);

  return values.length > 0 ? Math.max(...values) : null;
}

export function deriveMatchResultFromLiveSession(input: {
  scoringState: unknown;
  homeEntryId: string;
  awayEntryId: string;
  completedAt?: string | null;
}) {
  const scoringState = parseLiveScoringState(input.scoringState);

  if (!scoringState) {
    return null;
  }

  const frames = Array.from({ length: scoringState.bestOfFrames }, (_, index) => {
    const frame = scoringState.frames.find((entry) => entry.frameNumber === index + 1) ?? {
      frameNumber: index + 1,
      homePoints: 0,
      awayPoints: 0,
      breaks: [],
      currentBreak: null,
      activeSide: "home",
      winnerSide: null,
      isComplete: false,
    };

    return {
      frameNumber: index + 1,
      winnerEntryId:
        frame.winnerSide === "home"
          ? input.homeEntryId
          : frame.winnerSide === "away"
            ? input.awayEntryId
            : null,
      homePoints: frame.homePoints,
      awayPoints: frame.awayPoints,
      homeHighBreak: getHighBreak(frame, "home"),
      awayHighBreak: getHighBreak(frame, "away"),
    } satisfies OfficialFrameResult;
  });

  const homeScore = frames.filter((frame) => frame.winnerEntryId === input.homeEntryId).length;
  const awayScore = frames.filter((frame) => frame.winnerEntryId === input.awayEntryId).length;
  const framesNeededToWin = Math.floor(scoringState.bestOfFrames / 2) + 1;
  const isComplete = homeScore >= framesNeededToWin || awayScore >= framesNeededToWin;

  return {
    homeScore,
    awayScore,
    winnerEntryId:
      homeScore >= framesNeededToWin && homeScore > awayScore
        ? input.homeEntryId
        : awayScore >= framesNeededToWin && awayScore > homeScore
          ? input.awayEntryId
          : null,
    homeHighBreaks: frames.map((frame) => frame.homeHighBreak),
    awayHighBreaks: frames.map((frame) => frame.awayHighBreak),
    frames,
    startedAt: scoringState.startedAt || null,
    completedAt: scoringState.completedAt ?? input.completedAt ?? null,
    isComplete,
  } satisfies DerivedLiveSessionMatchResult;
}