import Image from "next/image";
import { getFlagCdnUrl } from "@/lib/country";
import type { BracketPlayer } from "./types";

type PlayerRowProps = {
  player: BracketPlayer | null;
};

export function PlayerRow({ player }: PlayerRowProps) {
  const displayPlayer =
    player ??
    ({
      id: "tbd",
      name: "TBD",
      score: null,
      isWinner: false,
    } satisfies BracketPlayer);

  const isWinner = Boolean(displayPlayer.isWinner);
  const isPlaceholder = displayPlayer.name.trim() === "" || displayPlayer.name === "TBD";
  const hasScore = typeof displayPlayer.score === "number";
  const flagUrl = displayPlayer.flagCode ? getFlagCdnUrl(displayPlayer.flagCode, "w40") : null;
  const nameParts = displayPlayer.name.trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";
  const showStructuredName = !isPlaceholder && nameParts.length > 0;

  return (
    <div
      className={[
        "flex items-center justify-between gap-2.5 rounded-[4px] border",
        isWinner
          ? "border-[var(--theme-accent-success)] bg-transparent text-[var(--theme-accent-success)]"
          : "border-[var(--theme-border-soft)] bg-transparent text-[var(--theme-page-text)]",
      ].join(" ")}
      style={{ minHeight: "40px", padding: "4px 7px" }}
    >
      <div className="flex min-w-0 items-center gap-2.5" style={{ paddingRight: "3px" }}>
        {displayPlayer.seed ? (
          <span
            className={[
              "shrink-0 text-[9px] font-semibold leading-none",
              isWinner
                ? "text-[var(--theme-accent-success)]"
                : "text-[var(--theme-page-muted-4)]",
            ].join(" ")}
          >
            {displayPlayer.seed}
          </span>
        ) : null}

        {flagUrl ? (
          <Image
            src={flagUrl}
            alt={displayPlayer.flagCode || "Player flag"}
            width={18}
            height={13}
            className="h-[11px] w-[16px] shrink-0 rounded-[2px] object-cover ring-1 ring-black/5"
          />
        ) : null}

        {showStructuredName ? (
          <div
            className={[
              "flex min-w-0 items-center gap-1 font-medium",
              isWinner
                ? "text-[var(--theme-accent-success)]"
                : "text-[var(--theme-page-text)]",
            ].join(" ")}
            style={{ fontSize: "10px", lineHeight: "1.2", padding: "0 3px" }}
          >
            {firstName ? <span className="truncate">{firstName}</span> : null}
            {middleName ? <span className="truncate text-[var(--theme-page-muted-4)]">{middleName}</span> : null}
            {lastName ? <span className="truncate">{lastName}</span> : null}
          </div>
        ) : (
          <span
            className="truncate font-medium text-[var(--theme-page-muted-4)]"
            style={{ fontSize: "10px", lineHeight: "1.2", padding: "0 3px" }}
          >
            TBD
          </span>
        )}
      </div>

      {hasScore ? (
        <span
          className={[
            "min-w-4 text-right font-bold tabular-nums",
            isWinner ? "text-[var(--theme-accent-success)]" : "text-[var(--theme-page-text)]",
          ].join(" ")}
          style={{ fontSize: "10px", lineHeight: "1.2", padding: "0 3px" }}
        >
          {displayPlayer.score}
        </span>
      ) : null}
    </div>
  );
}