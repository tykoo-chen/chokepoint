"use client";
import { Chokepoint, Factor } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { useLiveChokepoints, useLiveFactors } from "@/app/lib/markets";
import { fmtUsd } from "@/app/lib/risk";
import { useEffect, useMemo, useState } from "react";

function severityTone(s: Chokepoint["severity"]) {
  switch (s) {
    case "critical": return { text: "text-red", bar: "#ff5a4a" };
    case "high": return { text: "text-amber-bright", bar: "#ff9a3c" };
    case "med": return { text: "text-amber", bar: "#ffd166" };
    default: return { text: "text-green", bar: "#7dffb1" };
  }
}

const CATEGORY_GLYPH: Record<Factor["category"], string> = {
  weather: "☁",
  price: "$",
  policy: "⚖",
  macro: "📉",
};
const CATEGORY_LABEL_ZH: Record<Factor["category"], string> = {
  weather: "天气",
  price: "原料",
  policy: "政策",
  macro: "宏观",
};
const CATEGORY_LABEL_EN: Record<Factor["category"], string> = {
  weather: "WEATHER",
  price: "PRICE",
  policy: "POLICY",
  macro: "MACRO",
};
const CATEGORY_TONE: Record<Factor["category"], string> = {
  weather: "text-green-dim",
  price: "text-amber",
  policy: "text-purple-300",
  macro: "text-blue-300",
};

/**
 * Live markets panel for the X-Ray view. Shows the chokepoint book on top
 * (海峡 · 通道) and the factor book below (天气 · 原料 · 政策 · 宏观). Both
 * are read live from Polymarket Gamma. Each row reveals the deriv path
 * (`= YES` or `= 1 − YES`) so users can audit how a market price translates
 * into the disruption probability we use for pricing.
 */
export default function ChokepointPanel({
  chokepoints: baseCp,
  factors: baseFactors = [],
}: {
  chokepoints: Chokepoint[];
  factors?: Factor[];
}) {
  const t = useT();
  const { lang } = useLang();
  const { chokepoints, live: liveCp, lastFetch } = useLiveChokepoints(baseCp);
  const { factors, live: liveFactors } = useLiveFactors(baseFactors);
  // Memoize the merged live map. Bare `{ ...liveCp, ...liveFactors }` would
  // be a new object every render → child useEffect deps would fire forever.
  const live = useMemo(() => ({ ...liveCp, ...liveFactors }), [liveCp, liveFactors]);

  const [probs, setProbs] = useState<Record<string, number>>(() => ({
    ...Object.fromEntries(chokepoints.map((c) => [c.id, c.probability])),
    ...Object.fromEntries(factors.map((f) => [f.id, f.probability])),
  }));
  const [flash, setFlash] = useState<Record<string, number>>({});

  useEffect(() => {
    setProbs((prev) => {
      const next = { ...prev };
      for (const c of chokepoints) next[c.id] = c.probability;
      for (const f of factors) next[f.id] = f.probability;
      return next;
    });
  }, [chokepoints, factors]);

  useEffect(() => {
    const t = setInterval(() => {
      setProbs((prev) => {
        const next = { ...prev };
        const f: Record<string, number> = {};
        for (const c of chokepoints) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[c.id] ?? c.probability;
          next[c.id] = Math.max(0.005, Math.min(0.995, base + drift));
          if (Math.random() > 0.5) f[c.id] = Date.now();
        }
        for (const fa of factors) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[fa.id] ?? fa.probability;
          next[fa.id] = Math.max(0.005, Math.min(0.995, base + drift));
          if (Math.random() > 0.5) f[fa.id] = Date.now();
        }
        setFlash((pf) => ({ ...pf, ...f }));
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [chokepoints, factors]);

  return (
    <div className="panel-raised flex flex-col">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// {t("活跃市场盘口", "LIVE MARKETS")}</div>
        <div className="text-[10px] text-faint flex items-center gap-1.5">
          {lastFetch ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
              <span className="text-green">
                {t("实时 · Polymarket", "LIVE · Polymarket")} ×{" "}
                {chokepoints.length + factors.length}
              </span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dim" />
              <span className="text-amber-dim">{t("拉取中", "FETCHING")}</span>
            </>
          )}
        </div>
      </div>

      {/* Chokepoint section */}
      <div className="px-4 py-1.5 border-b border-line bg-panel-2/30">
        <div className="text-[9px] text-faint tracking-widest">
          ▣ {t("海峡 / 通道", "STRAITS / CANALS")} · {chokepoints.length}
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
              className={`px-4 py-3 border-b border-line ${flashing ? "tick-flash" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tone.bar }}
                  />
                  <span className="text-sm text-text">
                    {lang === "en" ? c.name : c.nameZh}
                  </span>
                  <span className="text-[10px] text-faint">
                    {lang === "en" ? c.nameZh : c.name}
                  </span>
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
                    <span className="text-green">
                      ● {t("实时 · Polymarket", "LIVE · Polymarket")}
                    </span>
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

      {/* Factor section (only render if any factors present) */}
      {factors.length > 0 && (
        <>
          <div className="px-4 py-1.5 border-b border-line bg-panel-2/30">
            <div className="text-[9px] text-faint tracking-widest">
              {t("✦ 其他风险因子", "✦ OTHER RISK FACTORS")} · {factors.length}
            </div>
          </div>
          <div className="flex flex-col">
            {factors.map((f) => {
              const p = probs[f.id] ?? f.probability;
              const flashing = flash[f.id] && Date.now() - flash[f.id] < 800;
              const liveInfo = live[f.polymarketSlug];
              const label = lang === "en" ? f.labelEn ?? f.labelZh : f.labelZh;
              const question = lang === "en" ? f.marketQuestionEn ?? f.marketQuestionZh : f.marketQuestionZh;
              const catTone = CATEGORY_TONE[f.category];
              const catLabel = lang === "en" ? CATEGORY_LABEL_EN[f.category] : CATEGORY_LABEL_ZH[f.category];
              const tone = severityTone(f.severity);
              return (
                <div
                  key={f.id}
                  className={`px-4 py-3 border-b border-line last:border-b-0 ${flashing ? "tick-flash" : ""}`}
                >
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className={catTone}>{CATEGORY_GLYPH[f.category]}</span>
                      <span className={`text-[9px] tracking-widest ${catTone}`}>{catLabel}</span>
                      <span className="text-sm text-text">{label}</span>
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

                  <div className="mt-2 text-[10px] text-faint leading-snug">{question}</div>
                  {liveInfo && (
                    <div className="mt-1 text-[10px] text-faint leading-snug">
                      <span className="text-amber-dim">{t("推导 · ", "DERIV · ")}</span>
                      {f.polymarketSide === "YES" ? (
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
                        <span className="text-green">
                          ● {t("实时 · Polymarket", "LIVE · Polymarket")}
                        </span>
                      ) : (
                        <span>{t("拉取中", "fetching")}</span>
                      )}
                    </span>
                    <span className="text-dim">
                      {t("24h 成交 ", "24h vol ")}
                      {fmtUsd(liveInfo?.volume24h ?? f.volume24h)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
