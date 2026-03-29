import MeasuredViewportShell from "@/components/MeasuredViewportShell";
import OverlayPreviewClient from "./OverlayPreviewClient";
import { mockOverlayData } from "./mock-data";
import styles from "./page.module.css";

export const revalidate = 0;

export default async function MatchScoreOverlayPage({
  searchParams,
}: {
  searchParams: Promise<{
    compact?: string | string[];
    breakDisplay?: string | string[];
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const compact = typeof resolvedSearchParams.compact === "string" && ["1", "true", "compact"].includes(resolvedSearchParams.compact.toLowerCase());
  const breakDisplay = typeof resolvedSearchParams.breakDisplay === "string" && resolvedSearchParams.breakDisplay.toLowerCase() === "text"
    ? "text"
    : "chips";

  const initialData = mockOverlayData;

  return (
    <main className={styles.page}>
      <MeasuredViewportShell className={styles.shell} contentClassName={styles.stage}>
        <OverlayPreviewClient
          initialData={initialData}
          compact={compact}
          breakDisplay={breakDisplay}
        />
      </MeasuredViewportShell>
    </main>
  );
}