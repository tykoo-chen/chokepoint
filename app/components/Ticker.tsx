"use client";
import { useT } from "@/app/lib/i18n";
import { useLiveTicker } from "@/app/lib/markets";
import { useEffect, useMemo, useState } from "react";

type TickerItem = {
  id: string;       // unique per row
  code: string;     // short label e.g. "HORMUZ" / "WX-STORM"
  category: "chokepoint" | "weather" | "price" | "policy" | "macro";
  probability: number;
  delta?: number;
  isLive: boolean;
};

const CATEGORY_GLYPH: Record<TickerItem["category"], string> = {
  chokepoint: "▣",
  weather: "☁",
  price: "$",
  policy: "⚖",
  macro: "📉",
};

const CATEGORY_LABEL_EN: Record<TickerItem["category"], string> = {
  chokepoint: "STRAIT",
  weather: "WX",
  price: "PRICE",
  policy: "POLICY",
  macro: "MACRO",
};

const CATEGORY_LABEL_ZH: Record<TickerItem["category"], string> = {
  chokepoint: "海峡",
  weather: "天气",
  price: "原料",
  policy: "政策",
  macro: "宏观",
};

const CATEGORY_TONE: Record<TickerItem["category"], string> = {
  chokepoint: "text-amber-dim",
  weather: "text-green-dim",
  price: "text-amber",
  policy: "text-purple-300",
  macro: "text-blue-300",
};

export default function Ticker() {
  const t = useT();
  const { chokepoints, factors, live, loading } = useLiveTicker();
  const [probs, setProbs] = useState<Record<string, number>>({});

  // Build a unified ticker list from chokepoints + factors
  const items: TickerItem[] = useMemo(() => {
    const out: TickerItem[] = [];
    for (const c of chokepoints) {
      out.push({
        id: `cp:${c.id}`,
        code: c.id,
        category: "chokepoint",
        probability: c.probability,
        delta: c.probability24hDelta,
        isLive: !!c.polymarketSlug && !!live[c.polymarketSlug],
      });
    }
    for (const f of factors) {
      const code = factorCode(f.id);
      out.push({
        id: `f:${f.id}`,
        code,
        category: f.category,
        probability: f.probability,
        delta: undefined,
        isLive: !!f.polymarketSlug && !!live[f.polymarketSlug],
      });
    }
    return out;
  }, [chokepoints, factors, live]);

  // When live data arrives, re-seed local probabilities from live value.
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const it of items) next[it.id] = it.probability;
    setProbs(next);
  }, [items]);

  // Keep the "living ticker" wobble on top of the live seed.
  useEffect(() => {
    const intv = setInterval(() => {
      setProbs((prev) => {
        const next: Record<string, number> = {};
        for (const it of items) {
          const base = prev[it.id] ?? it.probability;
          const drift = (Math.random() - 0.5) * 0.008;
          next[it.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        return next;
      });
    }, 1600);
    return () => clearInterval(intv);
  }, [items]);

  const liveCount = Object.keys(live).length;

  return (
    <div className="border-y border-line bg-panel/60 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-panel-2 border-r border-line px-3 flex items-center gap-2 text-[10px] tracking-widest">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            loading ? "bg-amber-dim" : liveCount > 0 ? "bg-green pulse-dot" : "bg-red"
          }`}
        />
        <span className={liveCount > 0 ? "text-green" : loading ? "text-amber-dim" : "text-red"}>
          {loading
            ? t("拉取中", "FETCHING")
            : liveCount > 0
              ? `POLYMARKET · ${t("实时", "LIVE")} × ${liveCount}`
              : t("离线", "OFFLINE")}
        </span>
      </div>
      <div className="flex gap-10 py-2 whitespace-nowrap animate-[scroll_55s_linear_infinite] pl-[200px]">
        {[...items, ...items].map((it, i) => {
          const p = probs[it.id] ?? it.probability;
          const delta = it.delta ?? 0;
          const catLabel = (lang: "zh" | "en") =>
            lang === "en" ? CATEGORY_LABEL_EN[it.category] : CATEGORY_LABEL_ZH[it.category];
          return (
            <div key={`${it.id}-${i}`} className="flex items-center gap-2 text-[11px]">
              <span className={CATEGORY_TONE[it.category]}>{CATEGORY_GLYPH[it.category]}</span>
              <span className={`${CATEGORY_TONE[it.category]} text-[9px] tracking-widest`}>
                {t(catLabel("zh"), catLabel("en"))}
              </span>
              <span className="text-dim">{it.code}</span>
              <span className="text-amber font-semibold tabular-nums">
                {(p * 100).toFixed(1)}%
              </span>
              {delta !== 0 && (
                <span
                  className={`tabular-nums ${delta > 0 ? "text-red" : "text-green"}`}
                >
                  {delta > 0 ? "▲" : "▼"}
                  {Math.abs(delta * 100).toFixed(1)}
                </span>
              )}
              {it.isLive && (
                <span className="text-green-dim text-[9px]">●</span>
              )}
            </div>
          );
        })}
      </div>
      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/** Short code for factor display in ticker — derive from factor.id. */
function factorCode(id: string): string {
  // factor.id like "wx-storm-2026" → "WX-STORM"
  // factor.id like "policy-hormuz-blockade" → "HORMUZ-LIFT"
  // factor.id like "macro-fed-jun" → "FED-JUN"
  // factor.id like "policy-trump-china" → "TRUMP-CN"
  const overrides: Record<string, string> = {
    "wx-storm-2026": "WX-STORM",
    "policy-hormuz-blockade": "HORMUZ-LIFT",
    "policy-ru-ukr": "RU-UA",
    "policy-ru-ukr-fuel": "RU-UA",
    "policy-ru-ukr-suez": "RU-UA",
    "price-wti-atl": "WTI-ATH",
    "price-wti-may-fuel": "WTI-MAY",
    "macro-fed-jun": "FED-JUN",
    "macro-boe-apr": "BOE-APR",
    "policy-trump-china": "TRUMP-CN",
  };
  return overrides[id] ?? id.toUpperCase().replace(/_/g, "-");
}
