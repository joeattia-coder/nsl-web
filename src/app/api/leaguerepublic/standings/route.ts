import { NextResponse } from "next/server";

type AnyObj = Record<string, any>;

function isArray(x: any): x is any[] {
  return Array.isArray(x);
}

/**
 * getStandingsForFixtureGroup typically returns:
 * [
 *   { standingsDesc: "...Group A", standingsLines: [ ... ] },
 *   { standingsDesc: "...Group B", standingsLines: [ ... ] }
 * ]
 */
function pickBlocks(data: AnyObj): AnyObj[] {
  if (isArray(data)) return data as AnyObj[];

  // Defensive fallback in case LR wraps output differently
  const candidates: any[] = [];
  for (const key of Object.keys(data || {})) {
    const v = (data as AnyObj)[key];
    if (isArray(v)) candidates.push(v);
  }
  if (candidates.length) {
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0] as AnyObj[];
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

function toNumber(v: any, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

function toString(v: any, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

/**
 * Examples:
 * - "1-1 Group A" -> "Group A"
 * - "2-3 Group B" -> "Group B"
 * - "League 1"    -> "League 1" (unchanged)
 */
function cleanStandingsDesc(input: string, fallback: string) {
  const s = (input || "").trim();
  if (!s) return fallback;

  // Keep everything from "Group X" onward if present
  const m = s.match(/(Group\s+[A-Z0-9]+)/i);
  if (m?.[1]) {
    // Normalize casing: "group a" -> "Group A"
    const label = m[1].trim();
    const parts = label.split(/\s+/);
    if (parts.length >= 2) {
      const groupWord = "Group";
      const groupId = parts.slice(1).join(" ").toUpperCase();
      return `${groupWord} ${groupId}`;
    }
    return label;
  }

  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // IMPORTANT:
  // fixtureTypeID=2 for competition group stage standings (Group A / Group B blocks)
  const fixtureTypeID = searchParams.get("fixtureTypeID") ?? "2";
  const fixtureGroupIdentifier = searchParams.get("fixtureGroupIdentifier");

  if (!fixtureGroupIdentifier) {
    return NextResponse.json(
      { error: "Missing fixtureGroupIdentifier query param" },
      { status: 400 }
    );
  }

  const url = `https://api.leaguerepublic.com/json/getStandingsForFixtureGroup/${encodeURIComponent(
    fixtureTypeID
  )}/${encodeURIComponent(fixtureGroupIdentifier)}.json`;

  const res = await fetchJson(url);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch standings", status: res.status, url: res.url, body: res.body },
      { status: res.status }
    );
  }

  const blocks = pickBlocks(res.json);

  const groups = blocks.map((block, blockIndex) => {
    const rawDesc = toString(block?.standingsDesc, "");
    const standingsDesc = cleanStandingsDesc(rawDesc, `Group ${String.fromCharCode(65 + blockIndex)}`);

    const linesRaw = isArray(block?.standingsLines) ? (block.standingsLines as AnyObj[]) : [];

    const rows = linesRaw.map((row, idx) => {
      const rank = toNumber(row?.position, idx + 1);
      const teamName = toString(row?.teamName, `Team ${idx + 1}`);

      // Match stats (overall)
      const played = toNumber(row?.overallPlayed, 0);
      const won = toNumber(row?.overallWon, 0);
      const tied = toNumber(row?.overallTied, 0);
      const lost = toNumber(row?.overallLoss, 0);

      // Frames for/against and diff
      const framesFor = toNumber(row?.overallScoreFor, 0);
      const framesAgainst = toNumber(row?.overallScoreAgainst, 0);
      const diff = toNumber(row?.scoreDifference, framesFor - framesAgainst);

      const points = toNumber(row?.points, 0);

      return {
        rank,
        teamName,
        played,
        won,
        tied,
        lost,
        framesFor,
        framesAgainst,
        diff,
        points,
        recentForm: toString(row?.recentForm, ""),
        raw: row, // keep for debugging / future fields
      };
    });

    rows.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

    return {
      standingsDesc,
      count: rows.length,
      rows,
    };
  });

  return NextResponse.json({
    fixtureTypeID: toNumber(fixtureTypeID, 2),
    fixtureGroupIdentifier,
    groupCount: groups.length,
    groups,
  });
}