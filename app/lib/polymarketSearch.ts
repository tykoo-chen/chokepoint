import "@/app/lib/init";

export type GammaEvent = {
  slug: string;
  title: string;
  description?: string;
  endDate?: string;
  volume24hr?: number;
  liquidity?: number;
  markets?: Array<{
    outcomes?: string;
    outcomePrices?: string;
    lastTradePrice?: number;
  }>;
};

export type SearchHit = {
  slug: string;
  title: string;
  description: string;
  endDate?: string;
  yes: number;
  no: number;
  volume24h: number;
  liquidity: number;
};

// Fetch a healthy slice of active events; cache in-process for a minute.
type Cache = { fetchedAt: number; events: GammaEvent[] };
let cache: Cache | null = null;

async function loadActiveEvents(): Promise<GammaEvent[]> {
  if (cache && Date.now() - cache.fetchedAt < 5 * 60_000) return cache.events;
  // Sort by 24h volume — top liquid events are where shipping-relevant signal lives.
  // 800 covers all the macro/geopolitical/weather/oil markets we care about.
  const url =
    "https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&ascending=false&limit=800";
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return cache?.events ?? [];
    const events = (await r.json()) as GammaEvent[];
    cache = { fetchedAt: Date.now(), events };
    return events;
  } catch {
    return cache?.events ?? [];
  }
}

function score(text: string, terms: string[]): number {
  const t = text.toLowerCase();
  let s = 0;
  for (const term of terms) if (term && t.includes(term)) s += 1;
  return s;
}

export async function searchPolymarket(
  query: string,
  limit = 5,
): Promise<SearchHit[]> {
  const events = await loadActiveEvents();
  const terms = query
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (terms.length === 0) return [];

  const scored = events
    .map((e) => {
      const text = `${e.title ?? ""} ${e.description ?? ""}`;
      return { e, s: score(text, terms) };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s;
      // Tie-breaker: 24h volume — liquid markets are more useful as hedges
      return (b.e.volume24hr ?? 0) - (a.e.volume24hr ?? 0);
    })
    .slice(0, limit);

  return scored
    .map(({ e }): SearchHit | null => {
      const m = e.markets?.[0];
      if (!m?.outcomePrices) return null;
      let prices: string[];
      try {
        prices = JSON.parse(m.outcomePrices);
      } catch {
        return null;
      }
      const yes = parseFloat(prices[0] ?? "0");
      const no = parseFloat(prices[1] ?? `${1 - yes}`);
      return {
        slug: e.slug,
        title: e.title,
        description: (e.description ?? "").slice(0, 400),
        endDate: e.endDate,
        yes,
        no,
        volume24h: e.volume24hr ?? 0,
        liquidity: e.liquidity ?? 0,
      };
    })
    .filter((x): x is SearchHit => x !== null);
}
