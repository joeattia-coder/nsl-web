import type { PublicLiveBroadcastState, PublicLiveMatchResponse } from "@/lib/live-match";
import type { PublicMatchCentreData } from "@/app/(public)/matches/[id]/match-centre-data";
import type { OverlayBreakBall, OverlayFrameContext, OverlayPlayerData, StreamScoreOverlayData } from "@/components/stream-overlay/types";

function getClearancePointsFrom(expectedShot: string) {
  switch (expectedShot) {
    case "yellow":
      return 27;
    case "green":
      return 25;
    case "brown":
      return 22;
    case "blue":
      return 18;
    case "pink":
      return 13;
    case "black":
      return 7;
    default:
      return 0;
  }
}

function getPointsRemaining(homePoints: number, awayPoints: number, details: PublicLiveBroadcastState | null): OverlayFrameContext {
  const ahead = Math.abs(homePoints - awayPoints);
  const leaderSide = homePoints === awayPoints ? null : homePoints > awayPoints ? "left" : "right";

  if (!details || leaderSide === null || details.expectedShot === null || details.redsRemaining === null) {
    return {
      leaderSide,
      ahead,
      remaining: null,
    };
  }

  let remaining: number;

  if (details.expectedShot === "none") {
    remaining = 0;
  } else if (details.expectedShot === "red") {
    remaining = details.redsRemaining * 8 + 27;
  } else if (details.expectedShot === "color") {
    remaining = 7 + details.redsRemaining * 8 + 27;
  } else {
    remaining = getClearancePointsFrom(details.expectedShot);
  }

  return {
    leaderSide,
    ahead,
    remaining,
  };
}

function normalizeBallLabel(value: string): OverlayBreakBall {
  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith("free")) {
    const nominated = normalized.split(":")[1]?.trim() || "red";
    const color = (nominated === "yellow" || nominated === "green" || nominated === "brown" || nominated === "blue" || nominated === "pink" || nominated === "black" ? nominated : "red");
    return {
      color,
      isFreeBall: true,
      label: `F${color.charAt(0).toUpperCase()}`,
    };
  }

  if (
    normalized === "red" ||
    normalized === "yellow" ||
    normalized === "green" ||
    normalized === "brown" ||
    normalized === "blue" ||
    normalized === "pink" ||
    normalized === "black"
  ) {
    return { color: normalized };
  }

  return { color: "red", label: normalized.charAt(0).toUpperCase() || "R" };
}

function emptyPlayer(name: string, flagUrl?: string | null, flagAlt?: string): OverlayPlayerData {
  return {
    name,
    flagUrl,
    flagAlt,
    score: 0,
    currentBreak: 0,
    breakSequence: [],
  };
}

function applyCurrentBreak(
  leftPlayer: OverlayPlayerData,
  rightPlayer: OverlayPlayerData,
  details: PublicLiveBroadcastState | null
) {
  if (!details?.currentBreak) {
    return { leftPlayer, rightPlayer, activeSide: null as "left" | "right" | null };
  }

  const breakSequence = details.currentBreak.balls.map(normalizeBallLabel);

  if (details.currentBreak.side === "home") {
    return {
      leftPlayer: {
        ...leftPlayer,
        currentBreak: details.currentBreak.points,
        breakSequence,
      },
      rightPlayer,
      activeSide: "left" as const,
    };
  }

  return {
    leftPlayer,
    rightPlayer: {
      ...rightPlayer,
      currentBreak: details.currentBreak.points,
      breakSequence,
    },
    activeSide: "right" as const,
  };
}

export function createOverlayDataFromMatch(data: PublicMatchCentreData): StreamScoreOverlayData {
  const baseLeft = emptyPlayer(data.leftPlayerName, data.leftPlayerFlagUrl, data.leftPlayerFlagAlt);
  const baseRight = emptyPlayer(data.rightPlayerName, data.rightPlayerFlagUrl, data.rightPlayerFlagAlt);
  const withBreak = applyCurrentBreak(baseLeft, baseRight, data.initialDetails);
  const leftScore = data.initialSnapshot.currentFrameHomePoints ?? 0;
  const rightScore = data.initialSnapshot.currentFrameAwayPoints ?? 0;

  return {
    leftPlayer: {
      ...withBreak.leftPlayer,
      score: leftScore,
    },
    rightPlayer: {
      ...withBreak.rightPlayer,
      score: rightScore,
    },
    frameScoreLeft: data.initialSnapshot.homeScore ?? 0,
    frameScoreRight: data.initialSnapshot.awayScore ?? 0,
    bestOf: data.bestOfFrames,
    activeSide:
      data.initialSnapshot.activeSide === "home"
        ? "left"
        : data.initialSnapshot.activeSide === "away"
          ? "right"
          : withBreak.activeSide,
      frameContext: getPointsRemaining(leftScore, rightScore, data.initialDetails),
    matchLabel: data.roundName,
    tournamentLabel: data.tournamentName,
    tableLabel: data.venueLabel || undefined,
    status: data.initialSnapshot.liveSessionStatus === "PAUSED"
      ? "INTERVAL"
      : data.initialSnapshot.liveSessionStatus === "COMPLETED"
        ? "FINISHED"
        : "LIVE",
    showLiveBadge: data.initialSnapshot.liveSessionStatus === "ACTIVE",
  };
}

export function mergeOverlayDataFromLiveResponse(
  current: StreamScoreOverlayData,
  response: PublicLiveMatchResponse
): StreamScoreOverlayData {
  const details = response.details ?? null;
  const leftScore = response.item.currentFrameHomePoints ?? 0;
  const rightScore = response.item.currentFrameAwayPoints ?? 0;
  const baseLeft: OverlayPlayerData = {
    ...current.leftPlayer,
    score: leftScore,
    currentBreak: 0,
    breakSequence: [],
  };
  const baseRight: OverlayPlayerData = {
    ...current.rightPlayer,
    score: rightScore,
    currentBreak: 0,
    breakSequence: [],
  };
  const withBreak = applyCurrentBreak(baseLeft, baseRight, details);

  return {
    ...current,
    leftPlayer: withBreak.leftPlayer,
    rightPlayer: withBreak.rightPlayer,
    frameScoreLeft: response.item.homeScore ?? 0,
    frameScoreRight: response.item.awayScore ?? 0,
    activeSide:
      response.item.activeSide === "home"
        ? "left"
        : response.item.activeSide === "away"
          ? "right"
          : withBreak.activeSide,
    frameContext: getPointsRemaining(leftScore, rightScore, details),
    status: response.item.liveSessionStatus === "PAUSED"
      ? "INTERVAL"
      : response.item.liveSessionStatus === "COMPLETED"
        ? "FINISHED"
        : "LIVE",
    showLiveBadge: response.item.liveSessionStatus === "ACTIVE",
  };
}