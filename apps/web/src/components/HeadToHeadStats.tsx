import Image from "next/image";
import Link from "next/link";
import styles from "./HeadToHeadStats.module.css";

export type HeadToHeadStatValue = number | string | null | undefined;

export type HeadToHeadStatRow = {
  label: string;
  leftValue: HeadToHeadStatValue;
  rightValue: HeadToHeadStatValue;
  highlightLeader?: boolean;
};

export type HeadToHeadStatsProps = {
  leftPlayerName: string;
  rightPlayerName: string;
  leftPlayerPhoto: string | null;
  rightPlayerPhoto: string | null;
  leftPlayerHref?: string;
  rightPlayerHref?: string;
  leftPlayerFlagUrl?: string | null;
  leftPlayerFlagAlt?: string;
  rightPlayerFlagUrl?: string | null;
  rightPlayerFlagAlt?: string;
  leftScore: number | string;
  rightScore: number | string;
  headToHead: {
    leftWins: number;
    rightWins: number;
  };
  stats: HeadToHeadStatRow[];
};

function parseComparableValue(value: HeadToHeadStatValue) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value: HeadToHeadStatValue) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
}

function getHighlightSide(row: HeadToHeadStatRow) {
  if (row.highlightLeader === false) {
    return null;
  }

  const left = parseComparableValue(row.leftValue);
  const right = parseComparableValue(row.rightValue);

  if (left === null || right === null || left === right) {
    return null;
  }

  return left > right ? "left" : "right";
}

function renderPlayerPhoto(photo: string | null, name: string) {
  if (photo) {
    return <Image src={photo} alt={name} width={320} height={400} className={styles.playerImage} priority={false} />;
  }

  return <Image src="/images/player_silhouette.svg" alt="" width={320} height={400} className={styles.playerImage} />;
}

function renderPlayerName(name: string) {
  const trimmedName = name.trim();
  const [firstToken, ...remainingTokens] = trimmedName.split(/\s+/);
  const secondaryLine = remainingTokens.join(" ");

  return (
    <>
      <span className={styles.playerLabelPrimary}>{firstToken || trimmedName}</span>
      {secondaryLine ? <span className={styles.playerLabelSecondary}>{secondaryLine}</span> : null}
    </>
  );
}

export default function HeadToHeadStats({
  leftPlayerName,
  rightPlayerName,
  leftPlayerPhoto,
  rightPlayerPhoto,
  leftPlayerHref,
  rightPlayerHref,
  leftPlayerFlagUrl,
  leftPlayerFlagAlt,
  rightPlayerFlagUrl,
  rightPlayerFlagAlt,
  leftScore,
  rightScore,
  headToHead,
  stats,
}: HeadToHeadStatsProps) {
  return (
    <section className={styles.panel} aria-labelledby="head-to-head-title">
      <div className={styles.inner}>
        <div className={styles.hero}>
          <div className={styles.playerBlock}>
            <div className={styles.playerVisual}>
              <div className={styles.playerShell}>{renderPlayerPhoto(leftPlayerPhoto, leftPlayerName)}</div>
            </div>
            <div className={styles.playerName}>
              <div className={styles.playerLabelRow}>
                {leftPlayerHref ? (
                  <Link id="head-to-head-title" href={leftPlayerHref} className={`${styles.playerLabel} public-player-link`}>
                    {renderPlayerName(leftPlayerName)}
                  </Link>
                ) : (
                  <h2 id="head-to-head-title" className={styles.playerLabel}>{renderPlayerName(leftPlayerName)}</h2>
                )}
                {leftPlayerFlagUrl ? (
                  <Image
                    src={leftPlayerFlagUrl}
                    alt={leftPlayerFlagAlt ?? ""}
                    width={24}
                    height={18}
                    className={styles.playerFlag}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.scoreCluster} aria-label="Current match score">
            <div className={styles.scoreLabel}>Match Score</div>
            <div className={styles.scoreValue}>
              <span className={styles.scoreNumber}>{leftScore}</span>
              <span className={styles.scoreDivider}>-</span>
              <span className={styles.scoreNumber}>{rightScore}</span>
            </div>

            <div className={styles.headToHead} aria-label="Head to head record">
              <div className={styles.headToHeadValue}>
                <span className={styles.headToHeadNumber}>{headToHead.leftWins}</span>
                <span className={styles.headToHeadDivider}>-</span>
                <span className={styles.headToHeadNumber}>{headToHead.rightWins}</span>
              </div>
              <div className={styles.headToHeadLabel}>Head to Head</div>
            </div>
          </div>

          <div className={styles.playerBlock}>
            <div className={styles.playerVisual}>
              <div className={styles.playerShell}>{renderPlayerPhoto(rightPlayerPhoto, rightPlayerName)}</div>
            </div>
            <div className={styles.playerName}>
              <div className={styles.playerLabelRow}>
                {rightPlayerFlagUrl ? (
                  <Image
                    src={rightPlayerFlagUrl}
                    alt={rightPlayerFlagAlt ?? ""}
                    width={24}
                    height={18}
                    className={styles.playerFlag}
                  />
                ) : null}
                {rightPlayerHref ? (
                  <Link href={rightPlayerHref} className={`${styles.playerLabel} public-player-link`}>
                    {renderPlayerName(rightPlayerName)}
                  </Link>
                ) : (
                  <div className={styles.playerLabel}>{renderPlayerName(rightPlayerName)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.statsList} role="table" aria-label="Match stats comparison">
            {stats.map((row) => {
              const highlight = getHighlightSide(row);

              return (
                <div className={styles.statsRow} role="row" key={row.label}>
                  <div
                    role="cell"
                    className={`${styles.statsValue} ${styles.statsValueLeft} ${highlight === "left" ? styles.statsValueHighlight : ""}`.trim()}
                  >
                    {formatValue(row.leftValue)}
                  </div>
                  <div role="columnheader" className={styles.statsLabel}>
                    {row.label}
                  </div>
                  <div
                    role="cell"
                    className={`${styles.statsValue} ${styles.statsValueRight} ${highlight === "right" ? styles.statsValueHighlight : ""}`.trim()}
                  >
                    {formatValue(row.rightValue)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}