"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CASES, CHOKEPOINTS, type Chokepoint, type Factor } from "./cases";

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

export type LiveMap = Record<string, LiveProbability>;

export async function fetchLive(slugs: string[]): Promise<LiveMap> {
  if (slugs.length === 0) return {};
  try {
    const r = await fetch(`/api/markets?slugs=${slugs.join(",")}`);
    if (!r.ok) return {};
    const j = (await r.json()) as { markets: LiveMap };
    return j.markets ?? {};
  } catch {
    return {};
  }
}

export function disruptionFrom(cp: Chokepoint, live: LiveProbability | undefined): number {
  if (!live) return cp.probability;
  if (cp.polymarketSide === "YES") return live.yes;
  return 1 - live.yes;
}

/**
 * Fetch live Polymarket prices for the slugs referenced in `base` and return
 * a live-hydrated chokepoint list. The returned `chokepoints` array has stable
 * identity as long as IDs + resolved probabilities + volumes don't change, so
 * it's safe to pass into useEffect deps downstream.
 */
export function useLiveChokepoints(base: Chokepoint[]): {
  chokepoints: Chokepoint[];
  live: LiveMap;
  lastFetch: number | null;
  loading: boolean;
} {
  const [live, setLive] = useState<LiveMap>({});
  const [lastFetch, setLastFetch] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Freeze the slug set by content (not array identity).
  const slugsKey = useMemo(
    () =>
      Array.from(new Set(base.map((c) => c.polymarketSlug).filter((s): s is string => !!s)))
        .sort()
        .join(","),
    [base],
  );

  useEffect(() => {
    if (!slugsKey) {
      setLoading(false);
      return;
    }
    const slugs = slugsKey.split(",").filter(Boolean);
    let active = true;
    async function tick() {
      const m = await fetchLive(slugs);
      if (!active) return;
      setLive(m);
      setLastFetch(Date.now());
      setLoading(false);
    }
    tick();
    const t = setInterval(tick, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [slugsKey]);

  // Stable identity: only a new array if content actually changed.
  const prevRef = useRef<Chokepoint[]>(base);
  const chokepoints = useMemo(() => {
    const next = base.map((c) => {
      if (!c.polymarketSlug) return c;
      const l = live[c.polymarketSlug];
      if (!l) return c;
      return {
        ...c,
        probability: disruptionFrom(c, l),
        volume24h: l.volume24h || c.volume24h,
      };
    });
    const prev = prevRef.current;
    if (
      prev.length === next.length &&
      prev.every(
        (p, i) =>
          p.id === next[i].id &&
          p.probability === next[i].probability &&
          p.volume24h === next[i].volume24h,
      )
    ) {
      return prev;
    }
    prevRef.current = next;
    return next;
  }, [base, live]);

  return { chokepoints, live, lastFetch, loading };
}

// Stable base for global ticker
const TICKER_BASE: Chokepoint[] = Object.values(CHOKEPOINTS);

/** All unique factors across every case, deduplicated by polymarketSlug. */
function gatherAllFactors(): Factor[] {
  const seen = new Set<string>();
  const out: Factor[] = [];
  for (const c of CASES) {
    for (const f of c.factors ?? []) {
      if (seen.has(f.polymarketSlug)) continue;
      seen.add(f.polymarketSlug);
      out.push(f);
    }
  }
  return out;
}
const TICKER_FACTORS: Factor[] = gatherAllFactors();

export function useLiveTicker() {
  const cp = useLiveChokepoints(TICKER_BASE);
  const fa = useLiveFactors(TICKER_FACTORS);
  // CRITICAL: memoize the merged live map. A naive `{ ...cp.live, ...fa.live }`
  // creates a NEW object every render — downstream consumers that depend on
  // `live` in useMemo/useEffect will see fresh identity each time, fire setState,
  // re-render, and hit "Maximum update depth exceeded".
  const live = useMemo(() => ({ ...cp.live, ...fa.live }), [cp.live, fa.live]);
  return {
    chokepoints: cp.chokepoints,
    factors: fa.factors,
    live,
    loading: cp.loading || fa.loading,
  };
}

/** Live hydration for factor-level markets (weather/price/policy/macro). */
export function useLiveFactors(base: Factor[] | undefined): {
  factors: Factor[];
  live: LiveMap;
  loading: boolean;
} {
  const [live, setLive] = useState<LiveMap>({});
  const [loading, setLoading] = useState(true);

  const slugsKey = useMemo(
    () =>
      Array.from(
        new Set((base ?? []).map((f) => f.polymarketSlug).filter((s): s is string => !!s)),
      )
        .sort()
        .join(","),
    [base],
  );

  useEffect(() => {
    if (!slugsKey) {
      setLoading(false);
      return;
    }
    const slugs = slugsKey.split(",").filter(Boolean);
    let active = true;
    async function tick() {
      const m = await fetchLive(slugs);
      if (!active) return;
      setLive(m);
      setLoading(false);
    }
    tick();
    const t = setInterval(tick, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [slugsKey]);

  const prevRef = useRef<Factor[] | null>(base ?? null);
  const factors = useMemo(() => {
    if (!base) return [];
    const next = base.map((f) => {
      const l = live[f.polymarketSlug];
      if (!l) return f;
      const p = f.polymarketSide === "YES" ? l.yes : 1 - l.yes;
      return { ...f, probability: p, volume24h: l.volume24h || f.volume24h };
    });
    const prev = prevRef.current;
    if (
      prev &&
      prev.length === next.length &&
      prev.every(
        (p, i) =>
          p.id === next[i].id &&
          p.probability === next[i].probability &&
          p.volume24h === next[i].volume24h,
      )
    ) {
      return prev;
    }
    prevRef.current = next;
    return next;
  }, [base, live]);

  return { factors, live, loading };
}
