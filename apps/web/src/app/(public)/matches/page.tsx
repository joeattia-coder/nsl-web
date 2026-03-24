import { Suspense } from "react";
import MatchesPageClient from "./MatchesPageClient";

export default function MatchesPage() {
  return (
    <Suspense fallback={<main className="content matches-page-shell" />}>
      <MatchesPageClient />
    </Suspense>
  );
}