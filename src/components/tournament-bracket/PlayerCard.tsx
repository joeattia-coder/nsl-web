import type { BracketPlayer } from "./types";

type PlayerCardProps = {
  player: BracketPlayer;
};

export function PlayerCard({ player }: PlayerCardProps) {
  const isWinner = Boolean(player.isWinner);
  const isPlaceholder = Boolean(player.isPlaceholder) || player.name === "TBD";

  const containerClasses = isPlaceholder
    ? "border-white/8 bg-white/[0.03] text-slate-400"
    : isWinner
    ? "border-emerald-400/40 bg-emerald-400/15 text-white shadow-[0_0_24px_rgba(52,211,153,0.16)]"
    : "border-white/10 bg-slate-900/90 text-slate-200";

  const nameClasses = isWinner ? "text-white" : isPlaceholder ? "text-slate-500" : "text-slate-100";
  const scoreClasses = isWinner ? "text-emerald-200" : "text-slate-400";

  return (
    <div
      className={[
        "group flex items-center justify-between gap-4 rounded-full border px-4 py-3 transition duration-300",
        "hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-[0_8px_28px_rgba(15,23,42,0.45)]",
        containerClasses,
      ].join(" ")}
    >
      <span className={["truncate text-sm font-semibold tracking-[0.01em] sm:text-[15px]", nameClasses].join(" ")}>
        {player.name}
      </span>

      {player.score !== undefined && player.score !== null && player.score !== "" ? (
        <span
          className={[
            "inline-flex min-w-8 items-center justify-center rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold",
            scoreClasses,
          ].join(" ")}
        >
          {player.score}
        </span>
      ) : null}
    </div>
  );
}
