"use client";
import { Case, Chokepoint, Factor } from "@/app/lib/cases";
import { useLiveFactors } from "@/app/lib/markets";
import { fmtUsd, fmtPct } from "@/app/lib/risk";

const CATEGORY_META: Record<
  Factor["category"] | "chokepoint",
  { icon: string; color: string; zh: string; en: string }
> = {
  chokepoint: { icon: "⚓", color: "#ff5a4a", zh: "海峡 / 地缘", en: "CHOKEPOINT" },
  weather: { icon: "🌀", color: "#7dffb1", zh: "天气", en: "WEATHER" },
  price: { icon: "Ξ", color: "#ffb347", zh: "原料价格", en: "PRICE" },
  policy: { icon: "⚖", color: "#c084fc", zh: "政策 / 地缘政策", en: "POLICY" },
  macro: { icon: "📉", color: "#4fc3f7", zh: "宏观 / 货币", en: "MACRO" },
};

function severityDot(s: Factor["severity"]) {
  switch (s) {
    case "critical": return "bg-red";
    case "high": return "bg-amber-bright";
    case "med": return "bg-amber";
    default: return "bg-green";
  }
}

export default function FactorDecomposition({
  case_,
  chokepoints,
}: {
  case_: Case;
  chokepoints: Chokepoint[];
}) {
  const { factors, loading } = useLiveFactors(case_.factors);

  // Combine chokepoints + factors into a single "AI-decomposed" view
  const cards = [
    ...chokepoints.map((c) => ({
      id: c.id,
      category: "chokepoint" as const,
      labelZh: c.nameZh,
      marketQuestionZh: c.marketQuestionZh,
      rationaleZh: `本航线直接经过 ${c.nameZh}, 任何封锁或延误会拖慢到港时间。`,
      severity: c.severity,
      probability: c.probability,
      volume24h: c.volume24h,
      polymarketSlug: c.polymarketSlug ?? "",
    })),
    ...factors.map((f) => ({
      id: f.id,
      category: f.category,
      labelZh: f.labelZh,
      marketQuestionZh: f.marketQuestionZh,
      rationaleZh: f.rationaleZh,
      severity: f.severity,
      probability: f.probability,
      volume24h: f.volume24h,
      polymarketSlug: f.polymarketSlug,
    })),
  ];

  // group by category
  const grouped = cards.reduce<Record<string, typeof cards>>((acc, c) => {
    (acc[c.category] ??= []).push(c);
    return acc;
  }, {});

  const order: (Factor["category"] | "chokepoint")[] = [
    "chokepoint",
    "weather",
    "price",
    "policy",
    "macro",
  ];

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div>
          <div className="label-kicker text-amber">/// AI 风险拆解 · 跨市场</div>
          <div className="text-[10px] text-faint mt-0.5">
            把一票货拆成 {cards.length} 个独立风险维度, 每个都绑一条真实 Polymarket 合约
          </div>
        </div>
        <div className="text-[10px] text-faint flex items-center gap-1.5">
          {loading ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-dim" />
              <span className="text-amber-dim">拉取中</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
              <span className="text-green">实时 · {cards.filter((c) => c.polymarketSlug).length} 条活跃</span>
            </>
          )}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {order
          .filter((cat) => grouped[cat])
          .flatMap((cat) => grouped[cat])
          .map((c) => {
            const meta = CATEGORY_META[c.category];
            return (
              <div
                key={c.id}
                className="panel p-3 relative overflow-hidden"
                style={{ borderLeft: `2px solid ${meta.color}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span style={{ color: meta.color }} className="text-sm">
                      {meta.icon}
                    </span>
                    <span className="text-[9px] tracking-widest text-faint">
                      {meta.en}
                    </span>
                    <span className="text-[9px] text-amber-dim">
                      {meta.zh}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${severityDot(c.severity)}`} />
                    <span className="text-lg font-semibold tabular-nums text-amber">
                      {fmtPct(c.probability, 1)}
                    </span>
                  </div>
                </div>

                <div className="mt-1 text-[13px] text-text leading-snug">
                  {c.labelZh}
                </div>
                <div className="mt-1 text-[10px] text-faint">{c.marketQuestionZh}</div>

                <div className="mt-2 text-[11px] text-dim leading-relaxed border-t border-line pt-2">
                  <span className="text-amber-dim tracking-widest text-[9px]">为什么和本票相关 · </span>
                  {c.rationaleZh}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-faint">
                  {c.polymarketSlug ? (
                    <span className="text-green">● Polymarket · 实时</span>
                  ) : (
                    <span>无直接市场 · 使用代理</span>
                  )}
                  {c.volume24h > 0 && (
                    <span>24h 成交 {fmtUsd(c.volume24h)}</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div className="px-4 py-2.5 border-t border-line text-[10px] text-faint leading-relaxed">
        <span className="text-amber-dim tracking-widest">AI 要点 · </span>
        这 {cards.length} 个维度<span className="text-amber">彼此独立</span> —
        一个发生不代表另一个发生。传统货运险只保物理损坏, 无法同时应对 4 个维度。
        我们把保费按每个维度的"边际贡献"拆到对应 Polymarket / 再保险 / 运价衍生品上,
        任意一条触发都有对应赔付来源。
      </div>
    </div>
  );
}
