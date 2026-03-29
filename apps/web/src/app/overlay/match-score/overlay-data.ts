import type { PublicLiveBroadcastState, PublicLiveMatchResponse } from "@/lib/live-match";
import type { PublicMatchCentreData } from "@/app/(public)/matches/[id]/match-centre-data";
import type { OverlayBreakBall, OverlayPlayerData, StreamScoreOverlayData } from "@/components/stream-overlay/types";

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

  return {
    leftPlayer: {
      ...withBreak.leftPlayer,
      score: data.initialSnapshot.currentFrameHomePoints ?? 0,
    },
    rightPlayer: {
      ...withBreak.rightPlayer,
      score: data.initialSnapshot.currentFrameAwayPoints ?? 0,
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
  const baseLeft: OverlayPlayerData = {
    ...current.leftPlayer,
    score: response.item.currentFrameHomePoints ?? 0,
    currentBreak: 0,
    breakSequence: [],
  };
  const baseRight: OverlayPlayerData = {
    ...current.rightPlayer,
    score: response.item.currentFrameAwayPoints ?? 0,
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
    status: response.item.liveSessionStatus === "PAUSED"
      ? "INTERVAL"
      : response.item.liveSessionStatus === "COMPLETED"
        ? "FINISHED"
        : "LIVE",
    showLiveBadge: response.item.liveSessionStatus === "ACTIVE",
  };
}