import { NextResponse } from "next/server";

type AnyObj = Record<string, any>;

function isArray(x: any): x is any[] {
  return Array.isArray(x);
}

function pickArrayFromResponse(data: AnyObj): any[] {
  const candidates: any[] = [];

  for (const key of Object.keys(data || {})) {
    const v = (data as AnyObj)[key];
    if (isArray(v)) candidates.push(v);
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0];
  }

  if (isArray(data)) return data;

  return [];
}

function firstString(obj: AnyObj, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false as const,
      status: res.status,
      url,
      body: text,
    };
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

  // 1) Decide seasonId (use override if provided, otherwise pick the first season returned)
  let seasonId = seasonIdOverride;
  let seasonDesc = "";

  if (!seasonId) {
    const seasonsUrl = `https://api.leaguerepublic.com/json/getSeasonsForLeague/${leagueId}.json`;
    const seasonsRes = await fetchJson(seasonsUrl);

    if (!seasonsRes.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch seasons",
          status: seasonsRes.status,
          url: seasonsRes.url,
          body: seasonsRes.body,
        },
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

    seasonDesc = firstString(first ?? {}, ["SeasonDesc", "seasonDesc", "Description", "description", "Name", "name"], "");

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
  } else {
    // If season is overridden, we usually still want a label; leave blank unless you later add a season lookup.
    seasonDesc = "";
  }

  // 2) Fetch fixtures for that season
  const fixturesUrl = `https://api.leaguerepublic.com/json/getFixturesForSeason/${seasonId}.json`;
  const fixturesRes = await fetchJson(fixturesUrl);

  if (!fixturesRes.ok) {
    return NextResponse.json(
      {
        error: "Failed to fetch fixtures",
        status: fixturesRes.status,
        url: fixturesRes.url,
        body: fixturesRes.body,
      },
      { status: fixturesRes.status }
    );
  }

  const fixturesArr = pickArrayFromResponse(fixturesRes.json);

  return NextResponse.json({
    leagueId,
    seasonId,
    seasonDesc,
    count: fixturesArr.length,
    fixtures: fixturesArr,
  });
}