"use client";
import { Chokepoint } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
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
  const t = useT();
  const { lang } = useLang();
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
        <div className="label-kicker">/// {t("活跃风险点", "ACTIVE CHOKEPOINTS")}</div>
        <div className="text-[10px] text-faint flex items-center gap-1.5">
          {lastFetch ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
              <span className="text-green">{t("实时 · Polymarket", "LIVE · Polymarket")}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dim" />
              <span className="text-amber-dim">{t("拉取中", "FETCHING")}</span>
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
                  <span className="text-sm text-text">{lang === "en" ? c.name : c.nameZh}</span>
                  <span className="text-[10px] text-faint">{lang === "en" ? c.nameZh : c.name}</span>
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
                {lang === "en" ? c.marketQuestion : c.marketQuestionZh}
              </div>
              {liveInfo && (
                <div className="mt-1 text-[10px] text-faint leading-snug">
                  <span className="text-amber-dim">{t("推导 · ", "DERIV · ")}</span>
                  {c.polymarketSide === "YES" ? (
                    <>
                      {t("直接取 YES 价 = ", "= YES = ")}
                      <span className="text-dim">{(liveInfo.yes * 100).toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      {t("取 (1 − YES) = 1 − ", "= (1 − YES) = 1 − ")}
                      <span className="text-dim">{(liveInfo.yes * 100).toFixed(1)}%</span>
                      {" = "}
                      <span className="text-dim">{((1 - liveInfo.yes) * 100).toFixed(1)}%</span>
                    </>
                  )}
                </div>
              )}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-faint">
                <span>
                  {liveInfo ? (
                    <span className="text-green">● {t("实时 · Polymarket", "LIVE · Polymarket")}</span>
                  ) : (
                    <span>
                      {t("源 · ", "SRC · ")}
                      {c.marketSource}
                    </span>
                  )}
                </span>
                <span className="text-dim">
                  {t("24h 成交 ", "24h vol ")}
                  {fmtUsd(liveInfo?.volume24h ?? c.volume24h)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
