"use client";

import Image from "next/image";
import LocalTimeText from "@/components/LocalTimeText";
import styles from "./LiveMatchStageView.module.css";

type LiveMatchStageViewProps = {
  scheduledAt: string | null;
  leftPlayerName: string;
  rightPlayerName: string;
  leftPlayerPhoto: string | null;
  rightPlayerPhoto: string | null;
  leftPlayerFlagUrl: string | null;
  leftPlayerFlagAlt: string;
  rightPlayerFlagUrl: string | null;
  rightPlayerFlagAlt: string;
};

function renderPlayerPhoto(photo: string | null, name: string) {
  if (photo) {
    return <Image src={photo} alt={name} fill sizes="180px" className={styles.playerPhoto} />;
  }

  return <Image src="/images/player_silhouette.svg" alt="" fill sizes="180px" className={styles.playerPhoto} />;
}

function renderPlayerFlag(src: string | null, alt: string) {
  if (!src) {
    return null;
  }

  return <Image src={src} alt={alt} width={34} height={24} className={styles.playerFlag} />;
}

export default function LiveMatchStageView({
  scheduledAt,
  leftPlayerName,
  rightPlayerName,
  leftPlayerPhoto,
  rightPlayerPhoto,
  leftPlayerFlagUrl,
  leftPlayerFlagAlt,
  rightPlayerFlagUrl,
  rightPlayerFlagAlt,
}: LiveMatchStageViewProps) {
  return (
    <div className={styles.page}>
      <section className={styles.stage} aria-label="Live match players and start time">
        <article className={styles.playerCard}>
          <div className={styles.playerPhotoShell}>{renderPlayerPhoto(leftPlayerPhoto, leftPlayerName)}</div>
          <div className={styles.playerMeta}>
            {renderPlayerFlag(leftPlayerFlagUrl, leftPlayerFlagAlt)}
            <span className={styles.playerName}>{leftPlayerName}</span>
          </div>
        </article>

        <div className={styles.startBlock}>
          <span className={styles.startLabel}>Match Start</span>
          <LocalTimeText
            value={scheduledAt}
            fallback="TBC"
            className={styles.startTime}
            options={{ hour: "numeric", minute: "2-digit" }}
            titleOptions={{ weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }}
          />
        </div>

        <article className={styles.playerCard}>
          <div className={styles.playerPhotoShell}>{renderPlayerPhoto(rightPlayerPhoto, rightPlayerName)}</div>
          <div className={`${styles.playerMeta} ${styles.playerMetaRight}`}>
            {renderPlayerFlag(rightPlayerFlagUrl, rightPlayerFlagAlt)}
            <span className={styles.playerName}>{rightPlayerName}</span>
          </div>
        </article>
      </section>
    </div>
  );
}