import { BracketRound } from "./BracketRound";
import type { BracketRoundData } from "./types";

type TournamentBracketProps = {
  rounds: BracketRoundData[];
  title?: string;
  subtitle?: string;
  className?: string;
};

export function TournamentBracket({
  rounds,
  title = "Tournament Bracket",
  subtitle = "Live path through the knockout rounds.",
  className = "",
}: TournamentBracketProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-[32px] border border-white/10",
        "bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_26%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]",
        "shadow-[0_24px_80px_rgba(2,6,23,0.5)]",
        className,
      ].join(" ")}
    >
      <div className="border-b border-white/10 px-6 py-6 sm:px-8">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300/80">Bracket View</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{subtitle}</p>
      </div>

      <div className="overflow-x-auto overflow-y-hidden px-6 py-8 sm:px-8">
        <div className="flex min-w-max items-start gap-8 pb-4 lg:gap-14">
          {rounds.map((round, index) => (
            <BracketRound
              key={round.id ?? `${round.name}-${index}`}
              round={round}
              roundIndex={index}
              totalRounds={rounds.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export type { BracketMatch, BracketPlayer, BracketRoundData } from "./types";
