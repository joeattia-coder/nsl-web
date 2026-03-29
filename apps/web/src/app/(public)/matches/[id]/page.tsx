import { notFound } from "next/navigation";
import LiveMatchCentrePanel from "./LiveMatchCentrePanel";
import styles from "./MatchCentrePage.module.css";
import { getPublicMatchCentreData } from "./match-centre-data";

export default async function MatchCentrePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = resolvedParams.id;
  const requestedGroupId = typeof resolvedSearchParams.group === "string" ? resolvedSearchParams.group : "";

  const data = await getPublicMatchCentreData(id, requestedGroupId);

  if (!data) {
    notFound();
  }

  return (
    <main className={`content ${styles.page}`}>
      <LiveMatchCentrePanel
        matchId={data.matchId}
        backHref={data.matchesHref}
        tournamentName={data.tournamentName}
        seasonName={data.seasonName}
        roundName={data.roundName}
        scheduledAt={data.scheduledAt}
        venueLabel={data.venueLabel}
        initialSnapshot={data.initialSnapshot}
        initialDetails={data.initialDetails}
        leftPlayerName={data.leftPlayerName}
        rightPlayerName={data.rightPlayerName}
        leftPlayerHref={data.leftPlayerHref}
        rightPlayerHref={data.rightPlayerHref}
        leftPlayerPhoto={data.leftPlayerPhoto}
        rightPlayerPhoto={data.rightPlayerPhoto}
        leftPlayerFlagUrl={data.leftPlayerFlagUrl}
        leftPlayerFlagAlt={data.leftPlayerFlagAlt}
        rightPlayerFlagUrl={data.rightPlayerFlagUrl}
        rightPlayerFlagAlt={data.rightPlayerFlagAlt}
        headToHead={data.headToHead}
        stats={data.stats}
        showLiveBoard={false}
      />
    </main>
  );
}