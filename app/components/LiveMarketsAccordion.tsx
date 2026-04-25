"use client";
import { Chokepoint, Factor } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { LiveProbability, useLiveTicker } from "@/app/lib/markets";
import { fmtUsd } from "@/app/lib/risk";
import { useEffect, useState } from "react";

/**
 * Full-width, vertically-collapsible LIVE MARKETS panel.
 *
 * Default state: expanded — fills the empty horizontal space on the slim
 * customer view (/quote). Click the header to collapse (just the strip
 * stays). Inside: a responsive grid of cards covering EVERY active market
 * in the system — chokepoints (海峡 · 通道) + factors (天气 · 原料 · 政策 ·
 * 宏观). Each card shows category, label, live %, deriv path, 24h vol.
 *
 * Drives off `useLiveTicker` so it shows the global market book (across
 * every case), not just the markets relevant to the current voyage.
 */
export default function LiveMarketsAccordion({
  defaultOpen = true,
}: {
  defaultOpen?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const { chokepoints, factors, live, loading } = useLiveTicker();
  const [open, setOpen] = useState(defaultOpen);

  // Per-market local probability with gentle wobble — matches the rhythm of
  // the right-sidebar version so the page feels alive without flickering.
  const [probs, setProbs] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const c of chokepoints) next[c.id] = c.probability;
    for (const f of factors) next[f.id] = f.probability;
    setProbs(next);
  }, [chokepoints, factors]);
  useEffect(() => {
    const intv = setInterval(() => {
      setProbs((prev) => {
        const out = { ...prev };
        for (const c of chokepoints) {
          const base = prev[c.id] ?? c.probability;
          const drift = (Math.random() - 0.5) * 0.008;
          out[c.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        for (const f of factors) {
          const base = prev[f.id] ?? f.probability;
          const drift = (Math.random() - 0.5) * 0.008;
          out[f.id] = Math.max(0.005, Math.min(0.995, base + drift));
        }
        return out;
      });
    }, 1600);
    return () => clearInterval(intv);
  }, [chokepoints, factors]);

  const totalCount = chokepoints.length + factors.length;
  const liveCount = Object.keys(live).length;

  return (
    <div className="panel-raised">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2.5 border-b border-line flex items-center justify-between hover:bg-panel-2/50 transition-colors text-left"
      >
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="label-kicker text-amber">
            /// {t("活跃市场盘口", "LIVE MARKETS")}
          </div>
          <span className="text-[10px] text-faint">
            {t("Polymarket 实时定价", "real-time Polymarket pricing")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-faint">
          {loading ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dim" />
              <span className="text-amber-dim">{t("拉取中", "FETCHING")}</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
              <span className="text-green">
                {t(`${totalCount} 个市场 · ${liveCount} 个实时`, `${totalCount} markets · ${liveCount} live`)}
              </span>
            </>
          )}
          <span className="text-amber text-sm w-3 text-center">{open ? "▾" : "▸"}</span>
        </div>
      </button>

      {open && (
        <>
          {/* Strait section header */}
          <div className="px-4 py-1.5 border-b border-line bg-panel-2/30">
            <div className="text-[9px] text-faint tracking-widest">
              ▣ {t("海峡 / 通道", "STRAITS / CANALS")} · {chokepoints.length}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-line">
            {chokepoints.map((c) => (
              <ChokepointCard
                key={c.id}
                c={c}
                p={probs[c.id] ?? c.probability}
                lang={lang}
                liveInfo={c.polymarketSlug ? live[c.polymarketSlug] : undefined}
              />
            ))}
          </div>

          {/* Factor section header */}
          {factors.length > 0 && (
            <>
              <div className="px-4 py-1.5 border-b border-t border-line bg-panel-2/30">
                <div className="text-[9px] text-faint tracking-widest">
                  ✦ {t("其他风险因子 · 天气 / 原料 / 政策 / 宏观", "OTHER RISK FACTORS · weather / price / policy / macro")} · {factors.length}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-line">
                {factors.map((f) => (
                  <FactorCard
                    key={f.id}
                    f={f}
                    p={probs[f.id] ?? f.probability}
                    lang={lang}
                    liveInfo={live[f.polymarketSlug]}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

const SEVERITY_BAR: Record<Chokepoint["severity"], string> = {
  critical: "#ff5a4a",
  high: "#ff9a3c",
  med: "#ffd166",
  low: "#7dffb1",
};
const SEVERITY_TEXT: Record<Chokepoint["severity"], string> = {
  critical: "text-red",
  high: "text-amber-bright",
  med: "text-amber",
  low: "text-green",
};

const FACTOR_GLYPH: Record<Factor["category"], string> = {
  weather: "☁",
  price: "$",
  policy: "⚖",
  macro: "📉",
};
const FACTOR_LABEL_ZH: Record<Factor["category"], string> = {
  weather: "天气",
  price: "原料",
  policy: "政策",
  macro: "宏观",
};
const FACTOR_LABEL_EN: Record<Factor["category"], string> = {
  weather: "WEATHER",
  price: "PRICE",
  policy: "POLICY",
  macro: "MACRO",
};
const FACTOR_TONE: Record<Factor["category"], string> = {
  weather: "text-green-dim",
  price: "text-amber",
  policy: "text-purple-300",
  macro: "text-blue-300",
};

function ChokepointCard({
  c,
  p,
  lang,
  liveInfo,
}: {
  c: Chokepoint;
  p: number;
  lang: "zh" | "en";
  liveInfo: LiveProbability | undefined;
}) {
  const t = useT();
  const tone = SEVERITY_TEXT[c.severity];
  const bar = SEVERITY_BAR[c.severity];
  const name = lang === "en" ? c.name : c.nameZh;
  const altName = lang === "en" ? c.nameZh : c.name;
  const question = lang === "en" ? c.marketQuestion : c.marketQuestionZh;
  return (
    <div className="bg-panel p-3 flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-amber-dim text-[10px]">▣</span>
          <span className="text-text text-[12px] truncate">{name}</span>
          <span className="text-[9px] text-faint truncate">{altName}</span>
        </div>
        <div className={`tabular-nums text-[14px] font-semibold ${tone}`}>
          {(p * 100).toFixed(1)}%
        </div>
      </div>
      <div className="relative h-0.5 bg-line overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{ width: `${p * 100}%`, background: bar }}
        />
      </div>
      <div className="text-[9px] text-faint leading-snug line-clamp-2">{question}</div>
      <div className="flex items-center justify-between text-[9px] text-faint mt-auto pt-0.5">
        {liveInfo ? (
          <span className="text-green">
            ● {t("实时", "LIVE")}
          </span>
        ) : (
          <span>{c.marketSource}</span>
        )}
        <span>
          {t("24h ", "24h ")}
          {fmtUsd(liveInfo?.volume24h ?? c.volume24h)}
        </span>
      </div>
    </div>
  );
}

function FactorCard({
  f,
  p,
  lang,
  liveInfo,
}: {
  f: Factor;
  p: number;
  lang: "zh" | "en";
  liveInfo: LiveProbability | undefined;
}) {
  const t = useT();
  const tone = SEVERITY_TEXT[f.severity];
  const bar = SEVERITY_BAR[f.severity];
  const catTone = FACTOR_TONE[f.category];
  const catLabel = lang === "en" ? FACTOR_LABEL_EN[f.category] : FACTOR_LABEL_ZH[f.category];
  const label = lang === "en" ? f.labelEn ?? f.labelZh : f.labelZh;
  const question = lang === "en" ? f.marketQuestionEn ?? f.marketQuestionZh : f.marketQuestionZh;
  return (
    <div className="bg-panel p-3 flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`${catTone} text-[10px]`}>{FACTOR_GLYPH[f.category]}</span>
          <span className={`${catTone} text-[8px] tracking-widest`}>{catLabel}</span>
          <span className="text-text text-[12px] truncate">{label}</span>
        </div>
        <div className={`tabular-nums text-[14px] font-semibold ${tone}`}>
          {(p * 100).toFixed(1)}%
        </div>
      </div>
      <div className="relative h-0.5 bg-line overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{ width: `${p * 100}%`, background: bar }}
        />
      </div>
      <div className="text-[9px] text-faint leading-snug line-clamp-2">{question}</div>
      <div className="flex items-center justify-between text-[9px] text-faint mt-auto pt-0.5">
        {liveInfo ? (
          <span className="text-green">
            ● {t("实时 · Polymarket", "LIVE · Polymarket")}
          </span>
        ) : (
          <span>{t("拉取中", "fetching")}</span>
        )}
        <span>
          {t("24h ", "24h ")}
          {fmtUsd(liveInfo?.volume24h ?? f.volume24h)}
        </span>
      </div>
    </div>
  );
}
