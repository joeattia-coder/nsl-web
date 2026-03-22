import type { CSSProperties } from "react";
import { BracketMatchCard } from "./BracketMatchCard";
import type { BracketMatch, BracketRound } from "./types";

type BracketRoundColumnProps = {
  connectorAnchorY: number;
  connectorSpan: number;
  getMatchHref?: (match: BracketMatch) => string | undefined;
  isLastRound: boolean;
  layoutStyle: CSSProperties;
  matchCardHeight: number;
  onMatchClick?: (match: BracketMatch) => void;
  round: BracketRound;
  roundIndex: number;
};

export function BracketRoundColumn({
  connectorAnchorY,
  connectorSpan,
  getMatchHref,
  isLastRound,
  layoutStyle,
  matchCardHeight,
  onMatchClick,
  round,
  roundIndex,
}: BracketRoundColumnProps) {
  const normalizedRoundName = round.name.trim().toLowerCase();
  const roundLabel = normalizedRoundName.includes("quarter") && !normalizedRoundName.includes("pre")
    ? "Quarter Final"
    : normalizedRoundName.includes("semi")
      ? "Semi Final"
      : normalizedRoundName.includes("final") && !normalizedRoundName.includes("quarter") && !normalizedRoundName.includes("semi")
        ? "Final"
        : `Round ${roundIndex + 1}`;

  return (
    <section className="min-w-[280px] max-w-[280px]" style={{ paddingTop: "16px" }}>
      <p className="mb-8 text-sm font-semibold tracking-[0.02em] text-[var(--theme-page-muted-3)]">{roundLabel}</p>

      <div className="flex flex-col" style={{ ...layoutStyle, marginTop: "24px" }}>
        {round.matches.map((match, matchIndex) => (
          <BracketMatchCard
            key={match.id}
            connectorAnchorY={connectorAnchorY}
            connectorSpan={connectorSpan}
            getMatchHref={getMatchHref}
            isLastRound={isLastRound}
            match={match}
            matchCardHeight={matchCardHeight}
            matchIndex={matchIndex}
            onMatchClick={onMatchClick}
          />
        ))}
      </div>
    </section>
  );
}