import "@/app/lib/init";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Market = {
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
  slug: string;
  title: string;
  yes: number;
  no: number;
  volume24h: number;
  liquidity: number;
  endDate?: string;
  fetchedAt: number;
};

async function fetchOne(slug: string): Promise<LiveProbability | null> {
  try {
    const r = await fetch(
      `https://gamma-api.polymarket.com/events/slug/${encodeURIComponent(slug)}`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(5000) },
    );
    if (!r.ok) return null;
    const e = (await r.json()) as Event;
    const m = e.markets?.[0];
    if (!m?.outcomePrices) return null;
    const prices = JSON.parse(m.outcomePrices) as string[];
    const yes = parseFloat(prices[0] ?? "0");
    const no = parseFloat(prices[1] ?? `${1 - yes}`);
    return {
      slug: e.slug,
      title: e.title,
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
