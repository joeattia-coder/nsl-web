import { PlayerCard } from "./PlayerCard";
import type { BracketMatch, BracketPlayer } from "./types";

type MatchCardProps = {
  match: BracketMatch;
  isLastRound: boolean;
};

function normalizePlayer(player: BracketPlayer | string): BracketPlayer {
  if (typeof player === "string") {
    return {
      name: player,
      isPlaceholder: player === "TBD",
    };
  }

  return {
    ...player,
    isPlaceholder: player.isPlaceholder ?? player.name === "TBD",
  };
}

function toComparableScore(score: BracketPlayer["score"]) {
  if (typeof score === "number") return score;
  if (typeof score === "string" && score.trim() !== "" && !Number.isNaN(Number(score))) {
    return Number(score);
  }
  return null;
}

export function MatchCard({ match, isLastRound }: MatchCardProps) {
  const player1 = {
    ...normalizePlayer(match.player1),
    score: normalizePlayer(match.player1).score ?? match.score1,
  };
  const player2 = {
    ...normalizePlayer(match.player2),
    score: normalizePlayer(match.player2).score ?? match.score2,
  };

  const score1 = toComparableScore(player1.score);
  const score2 = toComparableScore(player2.score);

  const player1Winner = player1.isWinner ?? (score1 !== null && score2 !== null ? score1 > score2 : false);
  const player2Winner = player2.isWinner ?? (score1 !== null && score2 !== null ? score2 > score1 : false);

  return (
    <div className="relative w-[240px] sm:w-[260px]">
      <div className="absolute -right-10 top-1/2 hidden h-px w-10 -translate-y-1/2 bg-white/15 lg:block" />

      {!isLastRound ? (
        <>
          <div className="absolute -right-10 top-[25%] hidden h-px w-10 bg-white/15 lg:block" />
          <div className="absolute -right-10 bottom-[25%] hidden h-px w-10 bg-white/15 lg:block" />
          <div className="absolute right-0 top-[25%] hidden h-[50%] w-px translate-x-10 bg-white/15 lg:block" />
        </>
      ) : null}

      <div className="rounded-[28px] border border-white/10 bg-slate-950/75 p-3 shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl">
        <div className="flex flex-col gap-3">
          <PlayerCard player={{ ...player1, isWinner: player1Winner }} />
          <PlayerCard player={{ ...player2, isWinner: player2Winner }} />
        </div>
      </div>
    </div>
  );
}
