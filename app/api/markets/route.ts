import "@/app/lib/init";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Market = {
  question?: string;
  outcomes?: string;       // JSON string e.g. "[\"Yes\",\"No\"]"
  outcomePrices?: string;  // JSON string e.g. "[\"0.145\",\"0.855\"]"
  volume?: string;
  lastTradePrice?: number;
};

type Event = {
  slug: string;
  title: string;
  endDate?: string;
  volume24hr?: number;
  liquidity?: number;
  markets?: Market[];
};

export type LiveProbability = {
  slug: string;       // original slugRef passed in (may include :idx suffix)
  title: string;      // sub-market question if multi-outcome, else event title
  yes: number;
  no: number;
  volume24h: number;
  liquidity: number;
  endDate?: string;
  fetchedAt: number;
};

/**
 * Fetch a single market reading.
 *
 * `slugRef` may be either `event-slug` (default sub-market 0) or
 * `event-slug:idx` to pick a specific sub-market within a multi-outcome
 * event (e.g. Fed rate decisions, Trump visits China by N dates, BoE
 * decisions). The returned LiveProbability is keyed by the original slugRef
 * so callers can store both `fed-decision:0` and `fed-decision:3` distinctly.
 */
async function fetchOne(slugRef: string): Promise<LiveProbability | null> {
  const [slug, idxStr] = slugRef.split(":");
  const idx = idxStr ? Number.parseInt(idxStr, 10) || 0 : 0;
  try {
    const r = await fetch(
      `https://gamma-api.polymarket.com/events/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const e = (await r.json()) as Event;
    const m = e.markets?.[idx];
    if (!m?.outcomePrices) return null;
    const prices = JSON.parse(m.outcomePrices) as string[];
    const yes = parseFloat(prices[0] ?? "0");
    const no = parseFloat(prices[1] ?? `${1 - yes}`);
    // For multi-outcome events the sub-market's question is the precise wording
    // ("No change in Fed's interest rates ..."), the event-level title is generic
    // ("Fed Decision in June?"). Prefer the sub-market question when available.
    const title = (e.markets && e.markets.length > 1 && m.question) ? m.question : e.title;
    return {
      slug: slugRef,
      title,
      yes,
      no,
      volume24h: e.volume24hr ?? 0,
      liquidity: e.liquidity ?? 0,
      endDate: e.endDate,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slugs = (url.searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    return NextResponse.json({ error: "missing slugs" }, { status: 400 });
  }
  const results = await Promise.all(slugs.map(fetchOne));
  const map: Record<string, LiveProbability> = {};
  for (const r of results) {
    if (r) map[r.slug] = r;
  }
  return NextResponse.json({
    fetchedAt: Date.now(),
    count: Object.keys(map).length,
    markets: map,
  });
}
