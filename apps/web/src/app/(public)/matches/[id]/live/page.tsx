import { notFound } from "next/navigation";
import LiveMatchStageView from "../LiveMatchStageView";
import { getPublicMatchCentreData } from "../match-centre-data";
import styles from "../LiveMatchStageView.module.css";
import OverlayPreviewClient from "@/app/overlay/match-score/OverlayPreviewClient";
import { createOverlayDataFromMatch } from "@/app/overlay/match-score/overlay-data";
import MeasuredViewportShell from "@/components/MeasuredViewportShell";

export default async function LiveMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const requestedGroupId = typeof resolvedSearchParams.group === "string" ? resolvedSearchParams.group : "";
  const data = await getPublicMatchCentreData(resolvedParams.id, requestedGroupId);

  if (!data) {
    notFound();
  }

  const initialOverlayData = createOverlayDataFromMatch(data);

  return (
    <main className={`content ${styles.page}`}>
      <MeasuredViewportShell contentClassName={styles.layoutStack}>
        <LiveMatchStageView
          scheduledAt={data.liveStartedAt ?? data.scheduledAt}
          leftPlayerName={data.leftPlayerName}
          rightPlayerName={data.rightPlayerName}
          leftPlayerPhoto={data.leftPlayerPhoto}
          rightPlayerPhoto={data.rightPlayerPhoto}
          leftPlayerFlagUrl={data.leftPlayerFlagUrl}
          leftPlayerFlagAlt={data.leftPlayerFlagAlt}
          rightPlayerFlagUrl={data.rightPlayerFlagUrl}
          rightPlayerFlagAlt={data.rightPlayerFlagAlt}
        />
        <OverlayPreviewClient
          initialData={initialOverlayData}
          matchId={data.matchId}
          wrapperClassName={styles.overlaySection}
        />
      </MeasuredViewportShell>
    </main>
  );
}