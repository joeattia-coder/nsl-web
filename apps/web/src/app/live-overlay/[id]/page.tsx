import { redirect } from "next/navigation";

export default async function LiveOverlayPage({
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
  const nextParams = new URLSearchParams();

  if (typeof resolvedSearchParams.compact === "string" && resolvedSearchParams.compact.trim()) {
    nextParams.set("compact", resolvedSearchParams.compact.trim());
  }

  if (typeof resolvedSearchParams.breakDisplay === "string" && resolvedSearchParams.breakDisplay.trim()) {
    nextParams.set("breakDisplay", resolvedSearchParams.breakDisplay.trim());
  }

  const query = nextParams.toString();

  redirect(`/overlay/match-score/${encodeURIComponent(resolvedParams.id)}${query ? `?${query}` : ""}`);
}