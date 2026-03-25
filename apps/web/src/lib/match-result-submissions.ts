import { parseStoredMatchDateTime } from "@/lib/timezone";

export type MatchResultSubmissionFrameValue = {
  frameNumber: number;
  homeHighBreak: number | null;
  awayHighBreak: number | null;
};

export function isNonNegativeWholeNumber(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function getRequestOrigin(request: Request) {
  const explicitOrigin =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_ORIGIN;

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return new URL(request.url).origin;
}

export function buildMatchCentreUrl(origin: string, matchId: string) {
  return `${origin}/matches/${encodeURIComponent(matchId)}`;
}

export function formatScheduledAtLabel(
  matchDate: Date | string | number | null | undefined,
  matchTime?: string | null
) {
  const scheduledAt = parseStoredMatchDateTime(matchDate, matchTime);

  if (!scheduledAt) {
    return null;
  }

  return scheduledAt.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function determineWinnerEntryId(input: {
  homeScore: number;
  awayScore: number;
  homeEntryId: string;
  awayEntryId: string;
  winnerEntryId?: string | null;
  framesNeededToWin?: number;
}) {
  if (input.winnerEntryId === input.homeEntryId || input.winnerEntryId === input.awayEntryId) {
    return input.winnerEntryId;
  }

  if (input.homeScore === input.awayScore) {
    return null;
  }

  if (input.framesNeededToWin) {
    if (input.homeScore >= input.framesNeededToWin && input.homeScore > input.awayScore) {
      return input.homeEntryId;
    }

    if (input.awayScore >= input.framesNeededToWin && input.awayScore > input.homeScore) {
      return input.awayEntryId;
    }

    return null;
  }

  return input.homeScore > input.awayScore ? input.homeEntryId : input.awayEntryId;
}

export function normalizeFrameHighBreaks(
  homeHighBreaks: unknown[],
  awayHighBreaks: unknown[]
): MatchResultSubmissionFrameValue[] {
  if (homeHighBreaks.length !== awayHighBreaks.length) {
    throw new Error("Frame high break arrays must match the match format.");
  }

  return Array.from({ length: homeHighBreaks.length }, (_, index) => {
    const homeHighBreak = homeHighBreaks[index];
    const awayHighBreak = awayHighBreaks[index];

    if (homeHighBreak !== null && homeHighBreak !== undefined && !isNonNegativeWholeNumber(homeHighBreak)) {
      throw new Error(`Home high break for frame ${index + 1} must be null or a whole number greater than or equal to 0.`);
    }

    if (awayHighBreak !== null && awayHighBreak !== undefined && !isNonNegativeWholeNumber(awayHighBreak)) {
      throw new Error(`Away high break for frame ${index + 1} must be null or a whole number greater than or equal to 0.`);
    }

    return {
      frameNumber: index + 1,
      homeHighBreak:
        homeHighBreak === null || homeHighBreak === undefined ? null : Number(homeHighBreak),
      awayHighBreak:
        awayHighBreak === null || awayHighBreak === undefined ? null : Number(awayHighBreak),
    };
  });
}
