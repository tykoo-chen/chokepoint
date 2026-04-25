"use client";
import { useLiveTicker } from "@/app/lib/markets";
import { useEffect, useState } from "react";

export default function Ticker() {
  const { chokepoints, live, loading } = useLiveTicker();
  const [probs, setProbs] = useState<Record<string, number>>({});

  // When live data arrives, re-seed local probabilities from live value.
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const c of chokepoints) next[c.id] = c.probability;
    setProbs(next);
  }, [chokepoints]);

  // Keep the "living ticker" wobble on top of the live seed.
  useEffect(() => {
    const t = setInterval(() => {
      setProbs((prev) => {
        const next: Record<string, number> = {};
        for (const c of chokepoints) {
          const base = prev[c.id] ?? c.probability;
          const drift = (Math.random() - 0.5) * 0.008;
          next[c.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [chokepoints]);

  const items = chokepoints;
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
          {loading ? "拉取中" : liveCount > 0 ? `POLYMARKET · 实时 × ${liveCount}` : "离线"}
        </span>
      </div>
      <div className="flex gap-10 py-2 whitespace-nowrap animate-[scroll_55s_linear_infinite] pl-[200px]">
        {[...items, ...items].map((c, i) => {
          const p = probs[c.id] ?? c.probability;
          const delta = c.probability24hDelta;
          const isLive = !!c.polymarketSlug && !!live[c.polymarketSlug];
          return (
            <div key={`${c.id}-${i}`} className="flex items-center gap-2 text-[11px]">
              <span className={isLive ? "text-amber-dim" : "text-faint"}>
                {isLive ? "实时" : "市场"}
              </span>
              <span className="text-dim">{c.id}</span>
              <span className="text-amber font-semibold tabular-nums">
                {(p * 100).toFixed(1)}%
              </span>
              <span
                className={`tabular-nums ${delta > 0 ? "text-red" : delta < 0 ? "text-green" : "text-faint"}`}
              >
                {delta > 0 ? "▲" : delta < 0 ? "▼" : "·"}
                {Math.abs(delta * 100).toFixed(1)}
              </span>
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
