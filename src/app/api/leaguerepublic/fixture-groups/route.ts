import { NextResponse } from "next/server";

type AnyObj = Record<string, any>;

function isArray(x: any): x is any[] {
  return Array.isArray(x);
}

function pickArrayFromResponse(data: AnyObj): any[] {
  if (isArray(data)) return data;

  const candidates: any[] = [];
  for (const key of Object.keys(data || {})) {
    const v = (data as AnyObj)[key];
    if (isArray(v)) candidates.push(v);
  }
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0];
  }
  return [];
}

async function fetchJson(url: string) {
  const isDev = process.env.NODE_ENV !== "production";

  const res = await fetch(url, isDev ? { cache: "no-store" } : { next: { revalidate: 60 } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false as const, status: res.status, url, body: text };
  }

  const json = (await res.json()) as AnyObj;
  return { ok: true as const, status: res.status, url, json };
}

export async function GET() {
  const leagueId = process.env.LEAGUEREPUBLIC_LEAGUE_ID;
  const seasonIdOverride = process.env.LEAGUEREPUBLIC_SEASON_ID;

  if (!leagueId) {
    return NextResponse.json(
      { error: "Missing LEAGUEREPUBLIC_LEAGUE_ID in .env.local" },
      { status: 500 }
    );
  }

  // Determine seasonId (override or first season)
  let seasonId = seasonIdOverride;

  if (!seasonId) {
    const seasonsUrl = `https://api.leaguerepublic.com/json/getSeasonsForLeague/${leagueId}.json`;
    const seasonsRes = await fetchJson(seasonsUrl);

    if (!seasonsRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch seasons", status: seasonsRes.status, url: seasonsRes.url },
        { status: seasonsRes.status }
      );
    }

    const seasonsArr = pickArrayFromResponse(seasonsRes.json);
    const first = seasonsArr?.[0];

    seasonId =
      first?.SeasonID ??
      first?.seasonID ??
      first?.seasonId ??
      first?.ID ??
      first?.Id;

    if (!seasonId) {
      return NextResponse.json(
        {
          error:
            "Could not determine SeasonID from seasons response. Set LEAGUEREPUBLIC_SEASON_ID in .env.local.",
          seasonsSample: seasonsArr?.slice?.(0, 3) ?? seasonsArr,
        },
        { status: 500 }
      );
    }
  }

  // Get fixture groups for the season
  const groupsUrl = `https://api.leaguerepublic.com/json/getFixtureGroupsForSeason/${seasonId}.json`;
  const groupsRes = await fetchJson(groupsUrl);

  if (!groupsRes.ok) {
    return NextResponse.json(
      { error: "Failed to fetch fixture groups", status: groupsRes.status, url: groupsRes.url },
      { status: groupsRes.status }
    );
  }

  const groupsArr = pickArrayFromResponse(groupsRes.json);

  return NextResponse.json({
    leagueId,
    seasonId,
    count: groupsArr.length,
    fixtureGroups: groupsArr,
  });
}