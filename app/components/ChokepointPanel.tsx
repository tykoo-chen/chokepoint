"use client";
import { Chokepoint, Factor } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { LiveProbability, useLiveChokepoints, useLiveFactors } from "@/app/lib/markets";
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
 * Live markets panel — case-scoped (chokepoints relevant to the voyage +
 * factor exposures pulled from the case definition). Each row is a
 * collapsible drop-down: header (always visible) shows the gist (name +
 * live %), click to expand for the market question + derivation path
 * + 24h volume. Default collapsed → keeps the right sidebar tight on /map.
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
  const live = useMemo(() => ({ ...liveCp, ...liveFactors }), [liveCp, liveFactors]);

  const [probs, setProbs] = useState<Record<string, number>>(() => ({
    ...Object.fromEntries(chokepoints.map((c) => [c.id, c.probability])),
    ...Object.fromEntries(factors.map((f) => [f.id, f.probability])),
  }));
  /**
   * Per-row collapse state. Default: ALL expanded so the panel never looks
   * sparse on first paint. User can collapse individual rows by clicking
   * the header — the chevron flips ▾ ↔ ▸.
   */
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of baseCp) init[c.id] = true;
    for (const f of baseFactors) init[f.id] = true;
    return init;
  });
  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  /** Whole-panel collapse toggle. Click header → fold everything. */
  const [panelOpen, setPanelOpen] = useState(true);

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
        for (const c of chokepoints) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[c.id] ?? c.probability;
          next[c.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        for (const fa of factors) {
          const drift = (Math.random() - 0.5) * 0.010;
          const base = prev[fa.id] ?? fa.probability;
          next[fa.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [chokepoints, factors]);

  return (
    <div className="panel-raised flex flex-col lg:max-h-[440px]">
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        className="w-full px-4 py-2.5 border-b border-line flex items-center justify-between hover:bg-panel-2/40 transition-colors text-left flex-shrink-0"
      >
        <div className="label-kicker">/// {t("活跃市场盘口", "LIVE MARKETS")}</div>
        <div className="text-[10px] text-faint flex items-center gap-2">
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
          <span className="text-amber text-sm w-3 text-center">
            {panelOpen ? "▾" : "▸"}
          </span>
        </div>
      </button>

      {panelOpen && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Chokepoint section */}
          <div className="px-4 py-1.5 border-b border-line bg-panel-2/30 sticky top-0 z-10">
            <div className="text-[9px] text-faint tracking-widest">
              ▣ {t("海峡 / 通道", "STRAITS / CANALS")} · {chokepoints.length}
            </div>
          </div>
          <div className="flex flex-col">
            {chokepoints.map((c) => (
              <ChokepointRow
                key={c.id}
                c={c}
                p={probs[c.id] ?? c.probability}
                lang={lang}
                liveInfo={c.polymarketSlug ? live[c.polymarketSlug] : undefined}
                isExpanded={!!expanded[c.id]}
                onToggle={() => toggle(c.id)}
              />
            ))}
          </div>

          {/* Factor section (only render if any factors present) */}
          {factors.length > 0 && (
            <>
              <div className="px-4 py-1.5 border-b border-line bg-panel-2/30 sticky top-0 z-10">
                <div className="text-[9px] text-faint tracking-widest">
                  {t("✦ 其他风险因子", "✦ OTHER RISK FACTORS")} · {factors.length}
                </div>
              </div>
              <div className="flex flex-col">
                {factors.map((f) => (
                  <FactorRow
                    key={f.id}
                    f={f}
                    p={probs[f.id] ?? f.probability}
                    lang={lang}
                    liveInfo={live[f.polymarketSlug]}
                    isExpanded={!!expanded[f.id]}
                    onToggle={() => toggle(f.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ChokepointRow({
  c,
  p,
  lang,
  liveInfo,
  isExpanded,
  onToggle,
}: {
  c: Chokepoint;
  p: number;
  lang: "zh" | "en";
  liveInfo: LiveProbability | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const tone = severityTone(c.severity);
  const name = lang === "en" ? c.name : c.nameZh;
  const altName = lang === "en" ? c.nameZh : c.name;
  const question = lang === "en" ? c.marketQuestion : c.marketQuestionZh;
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-panel-2/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: tone.bar }}
          />
          <span className="text-sm text-text truncate">{name}</span>
          <span className="text-[10px] text-faint truncate">{altName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-base font-semibold tabular-nums ${tone.text}`}>
            {(p * 100).toFixed(1)}%
          </span>
          <span className="text-amber-dim text-xs w-3 text-center">
            {isExpanded ? "▾" : "▸"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1">
          <div className="relative h-1 bg-line overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-700"
              style={{ width: `${p * 100}%`, background: tone.bar }}
            />
          </div>
          <div className="text-[10px] text-faint leading-snug">{question}</div>
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
      )}
    </div>
  );
}

function FactorRow({
  f,
  p,
  lang,
  liveInfo,
  isExpanded,
  onToggle,
}: {
  f: Factor;
  p: number;
  lang: "zh" | "en";
  liveInfo: LiveProbability | undefined;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const tone = severityTone(f.severity);
  const catTone = CATEGORY_TONE[f.category];
  const catLabel = lang === "en" ? CATEGORY_LABEL_EN[f.category] : CATEGORY_LABEL_ZH[f.category];
  const label = lang === "en" ? f.labelEn ?? f.labelZh : f.labelZh;
  const question = lang === "en" ? f.marketQuestionEn ?? f.marketQuestionZh : f.marketQuestionZh;
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-panel-2/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`${catTone} text-[12px] flex-shrink-0`}>
            {CATEGORY_GLYPH[f.category]}
          </span>
          <span className={`${catTone} text-[8px] tracking-widest flex-shrink-0`}>
            {catLabel}
          </span>
          <span className="text-sm text-text truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-base font-semibold tabular-nums ${tone.text}`}>
            {(p * 100).toFixed(1)}%
          </span>
          <span className="text-amber-dim text-xs w-3 text-center">
            {isExpanded ? "▾" : "▸"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 pt-1">
          <div className="relative h-1 bg-line overflow-hidden mb-2">
            <div
              className="absolute inset-y-0 left-0 transition-all duration-700"
              style={{ width: `${p * 100}%`, background: tone.bar }}
            />
          </div>
          <div className="text-[10px] text-faint leading-snug">{question}</div>
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
      )}
    </div>
  );
}
