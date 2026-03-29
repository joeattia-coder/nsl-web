import { notFound } from "next/navigation";
import { getPublicMatchCentreData } from "@/app/(public)/matches/[id]/match-centre-data";
import MeasuredViewportShell from "@/components/MeasuredViewportShell";
import OverlayPreviewClient from "../OverlayPreviewClient";
import { createOverlayDataFromMatch } from "../overlay-data";
import styles from "../page.module.css";

export const revalidate = 0;

export default async function MatchScoreOverlayMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    compact?: string | string[];
    breakDisplay?: string | string[];
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const compact = typeof resolvedSearchParams.compact === "string" && ["1", "true", "compact"].includes(resolvedSearchParams.compact.toLowerCase());
  const breakDisplay = typeof resolvedSearchParams.breakDisplay === "string" && resolvedSearchParams.breakDisplay.toLowerCase() === "text"
    ? "text"
    : "chips";

  const liveMatchData = await getPublicMatchCentreData(resolvedParams.id);

  if (!liveMatchData) {
    notFound();
  }

  return (
    <main className={styles.page}>
      <MeasuredViewportShell className={styles.shell} contentClassName={styles.stage}>
        <OverlayPreviewClient
          initialData={createOverlayDataFromMatch(liveMatchData)}
          matchId={liveMatchData.matchId}
          compact={compact}
          breakDisplay={breakDisplay}
        />
      </MeasuredViewportShell>
    </main>
  );
}