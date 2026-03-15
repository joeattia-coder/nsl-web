import type { CSSProperties } from "react";
import { MatchCard } from "./MatchCard";
import type { BracketRoundData } from "./types";

type BracketRoundProps = {
  round: BracketRoundData;
  roundIndex: number;
  totalRounds: number;
};

export function BracketRound({ round, roundIndex, totalRounds }: BracketRoundProps) {
  const isLastRound = roundIndex === totalRounds - 1;
  const spacingUnit = 88;
  const columnStyle: CSSProperties = {
    paddingTop: roundIndex === 0 ? 0 : (spacingUnit * (2 ** roundIndex - 1)) / 2,
    gap: spacingUnit * (2 ** roundIndex - 1) + 24,
  };

  return (
    <section className="min-w-[240px] sm:min-w-[260px]">
      <div className="mb-5 px-1">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
          Round {roundIndex + 1}
        </p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">{round.name}</h3>
      </div>

      <div className="flex flex-col" style={columnStyle}>
        {round.matches.map((match, index) => (
          <MatchCard
            key={match.id ?? `${round.name}-${index}`}
            match={match}
            isLastRound={isLastRound}
          />
        ))}
      </div>
    </section>
  );
}
