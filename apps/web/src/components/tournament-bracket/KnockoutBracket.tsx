import type { CSSProperties } from "react";
import { BracketRoundColumn } from "./BracketRoundColumn";
import type { BracketMatch, KnockoutBracketProps } from "./types";

const MATCH_CARD_HEIGHT = 112;
const MATCH_CONNECTOR_Y = 68;
const BASE_VERTICAL_GAP = 24;
const COLUMN_GAP = 64;
const SLOT_SPAN = MATCH_CARD_HEIGHT + BASE_VERTICAL_GAP;

// Each round doubles the distance between match centers so connector lines meet the next round precisely.
function getRoundLayout(roundIndex: number) {
  return {
    connectorSpan: SLOT_SPAN * 2 ** roundIndex,
    gap: SLOT_SPAN * (2 ** roundIndex - 1) + BASE_VERTICAL_GAP,
    paddingTop: roundIndex === 0 ? 0 : (SLOT_SPAN * (2 ** roundIndex - 1)) / 2,
  };
}

function defaultSubtitle(rounds: number) {
  if (rounds <= 1) {
    return "Track the remaining knockout match on a polished broadcast-style bracket.";
  }

  return "Follow every knockout match through each round with clean connectors and live-ready cards.";
}

export function KnockoutBracket({
  rounds,
  title = "Knockout Bracket",
  subtitle,
  className = "",
  onMatchClick,
  getMatchHref,
}: KnockoutBracketProps) {
  if (rounds.length === 0) {
    return (
      <section
        className={[
          "rounded-[8px] border border-[var(--theme-border-soft)] bg-[var(--theme-surface-2)] shadow-[var(--theme-shadow-card)]",
          className,
        ].join(" ")}
        style={{ padding: "30px" }}
      >
        <h2 className="text-xl font-semibold tracking-tight text-[var(--theme-page-text)]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--theme-page-muted-4)]">
          A knockout bracket will appear here once the tournament has enough advancing players.
        </p>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-[8px] border border-[var(--theme-border-soft)] bg-[var(--theme-surface-2)] shadow-[var(--theme-shadow-card)]",
        className,
      ].join(" ")}
      style={{ padding: "30px" }}
    >
      <div className="border-b border-[var(--theme-border-soft)] pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--theme-page-muted-4)]">
          Broadcast Bracket
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--theme-page-text)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--theme-page-muted-4)]">
          {subtitle ?? defaultSubtitle(rounds.length)}
        </p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden" style={{ paddingTop: "48px" }}>
        <div className="flex min-w-max items-start pb-2" style={{ columnGap: `${COLUMN_GAP}px` } as CSSProperties}>
          {rounds.map((round, roundIndex) => {
            const layout = getRoundLayout(roundIndex);

            return (
              <BracketRoundColumn
                key={round.id}
                connectorAnchorY={MATCH_CONNECTOR_Y}
                connectorSpan={layout.connectorSpan}
                getMatchHref={getMatchHref}
                isLastRound={roundIndex === rounds.length - 1}
                layoutStyle={{
                  gap: `${layout.gap}px`,
                  paddingTop: `${layout.paddingTop}px`,
                }}
                matchCardHeight={MATCH_CARD_HEIGHT}
                onMatchClick={onMatchClick}
                round={round}
                roundIndex={roundIndex}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export type { BracketMatch, BracketPlayer, BracketRound } from "./types";