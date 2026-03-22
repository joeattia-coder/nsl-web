import Link from "next/link";
import { BracketConnector } from "./BracketConnector";
import { PlayerRow } from "./PlayerRow";
import type { BracketMatch } from "./types";

type BracketMatchCardProps = {
  connectorAnchorY: number;
  connectorSpan: number;
  getMatchHref?: (match: BracketMatch) => string | undefined;
  isLastRound: boolean;
  match: BracketMatch;
  matchCardHeight: number;
  matchIndex: number;
  onMatchClick?: (match: BracketMatch) => void;
};

function formatScheduledAt(scheduledAt: string | undefined) {
  if (!scheduledAt) {
    return "Upcoming";
  }

  const date = new Date(scheduledAt);

  if (Number.isNaN(date.getTime())) {
    return scheduledAt;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function MatchCardBody({ match }: { match: BracketMatch }) {
  const scheduledLabel = formatScheduledAt(match.scheduledAt);

  return (
    <div className="flex min-h-[112px] flex-col gap-4">
      <div className="text-[10px] font-normal tracking-[0.01em] text-[var(--theme-page-muted-4)]">
        {scheduledLabel}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <PlayerRow player={match.player1} />
        <PlayerRow player={match.player2} />
      </div>
    </div>
  );
}

export function BracketMatchCard({
  connectorAnchorY,
  connectorSpan,
  getMatchHref,
  isLastRound,
  match,
  matchCardHeight,
  matchIndex,
  onMatchClick,
}: BracketMatchCardProps) {
  const href = getMatchHref?.(match);
  const isInteractive = Boolean(href || onMatchClick);

  return (
    <div className="relative w-[280px]" style={{ minHeight: `${matchCardHeight}px` }}>
      <BracketConnector
        connectorAnchorY={connectorAnchorY}
        connectorSpan={connectorSpan}
        isLastRound={isLastRound}
        matchIndex={matchIndex}
      />

      {href ? (
        <Link href={href} className="group block focus-visible:outline-none">
          <MatchCardBody match={match} />
        </Link>
      ) : onMatchClick ? (
        <button
          type="button"
          onClick={() => onMatchClick(match)}
          className="group block w-full text-left focus-visible:outline-none"
        >
          <MatchCardBody match={match} />
        </button>
      ) : (
        <div className={isInteractive ? "group" : "group"}>
          <MatchCardBody match={match} />
        </div>
      )}
    </div>
  );
}