"use client";
import { Chokepoint } from "@/app/lib/cases";
import { useLiveChokepoints } from "@/app/lib/markets";
import { fmtUsd } from "@/app/lib/risk";
import { useEffect, useState } from "react";

function severityTone(s: Chokepoint["severity"]) {
  switch (s) {
    case "critical": return { text: "text-red", bar: "#ff5a4a" };
    case "high": return { text: "text-amber-bright", bar: "#ff9a3c" };
    case "med": return { text: "text-amber", bar: "#ffd166" };
    default: return { text: "text-green", bar: "#7dffb1" };
  }
}

export default function ChokepointPanel({ chokepoints: base }: { chokepoints: Chokepoint[] }) {
  const { chokepoints, live, lastFetch } = useLiveChokepoints(base);

  const [probs, setProbs] = useState<Record<string, number>>(() =>
    Object.fromEntries(chokepoints.map((c) => [c.id, c.probability])),
  );
  const [flash, setFlash] = useState<Record<string, number>>({});

  useEffect(() => {
    setProbs((prev) => {
      const next = { ...prev };
      for (const c of chokepoints) next[c.id] = c.probability;
      return next;
    });
  }, [chokepoints]);

  useEffect(() => {
    const t = setInterval(() => {
      setProbs((prev) => {
        const next = { ...prev };
        const f: Record<string, number> = {};
        for (const c of chokepoints) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[c.id] ?? c.probability;
          const newVal = Math.max(0.005, Math.min(0.995, base + drift));
          if (Math.random() > 0.5) f[c.id] = Date.now();
          next[c.id] = newVal;
        }
        setFlash((pf) => ({ ...pf, ...f }));
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [chokepoints]);

  return (
    <div className="panel-raised flex flex-col">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// 活跃风险点</div>
        <div className="text-[10px] text-faint flex items-center gap-1.5">
          {lastFetch ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
              <span className="text-green">实时 · Polymarket</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dim" />
              <span className="text-amber-dim">拉取中</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col">
        {chokepoints.map((c) => {
          const p = probs[c.id] ?? c.probability;
          const tone = severityTone(c.severity);
          const flashing = flash[c.id] && Date.now() - flash[c.id] < 800;
          const liveInfo = c.polymarketSlug ? live[c.polymarketSlug] : undefined;
          return (
            <div
              key={c.id}
              className={`px-4 py-3 border-b border-line last:border-b-0 ${flashing ? "tick-flash" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tone.bar }}
                  />
                  <span className="text-sm text-text">{c.name}</span>
                  <span className="text-[10px] text-faint">{c.nameZh}</span>
                </div>
                <div className={`text-lg font-semibold tabular-nums ${tone.text}`}>
                  {(p * 100).toFixed(1)}%
                </div>
              </div>

              <div className="relative h-1 mt-2 bg-line overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{ width: `${p * 100}%`, background: tone.bar }}
                />
              </div>

              <div className="mt-2 text-[10px] text-faint leading-snug">
                {c.marketQuestionZh}
              </div>
              {liveInfo && (
                <div className="mt-1 text-[10px] text-faint leading-snug">
                  <span className="text-amber-dim">推导 · </span>
                  {c.polymarketSide === "YES" ? (
                    <>直接取 YES 价 = <span className="text-dim">{(liveInfo.yes * 100).toFixed(1)}%</span></>
                  ) : (
                    <>取 (1 − YES) = 1 − <span className="text-dim">{(liveInfo.yes * 100).toFixed(1)}%</span> = <span className="text-dim">{((1 - liveInfo.yes) * 100).toFixed(1)}%</span></>
                  )}
                </div>
              )}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-faint">
                <span>
                  {liveInfo ? (
                    <span className="text-green">● 实时 · Polymarket</span>
                  ) : (
                    <span>源 · {c.marketSource}</span>
                  )}
                </span>
                <span className="text-dim">24h 成交 {fmtUsd(liveInfo?.volume24h ?? c.volume24h)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
