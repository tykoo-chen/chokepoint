"use client";
import { Case } from "@/app/lib/cases";
import { useT } from "@/app/lib/i18n";
import { Currency, fmtMoney, RiskModel } from "@/app/lib/risk";
import { useState } from "react";

type Layer = {
  key: string;
  zh: string;
  en: string;
  subZh: string;
  subEn: string;
  pct: number;
  color: string;
  detailZh: string;
  detailEn: string;
  payoutZh: string;
  payoutEn: string;
  options: Array<{
    name: string;
    note_zh: string;
    note_en: string;
  }>;
};

const PM_LAYER: Layer = {
  key: "pm",
  zh: "预测市场",
  en: "Prediction markets",
  subZh: "Polymarket · Kalshi · 事件合约",
  subEn: "Polymarket · Kalshi · event contracts",
  pct: 0.3,
  color: "#4fc3f7",
  detailZh:
    "对冲「事件类风险」 — 海峡是否封闭、飓风是否登陆、政策事件是否发生。我们持有对应事件合约的 NO/YES 头寸; 一旦事件命中, 头寸盈利直接抵销我们要赔给你的钱。Polymarket 是定价的「价格底」, Kalshi 是合规直接建仓的渠道。",
  detailEn:
    "Hedges event-driven risks — chokepoint closures, hurricane landfall, policy events. We hold NO/YES positions in the relevant event contracts; when an event resolves, the position P&L directly offsets what we owe you. Polymarket sets the pricing floor; Kalshi is the compliant venue for direct positions.",
  payoutZh: "对应事件触发 → 头寸结算 → 盈利冲抵赔付。",
  payoutEn: "Event resolves → position settles → P&L offsets the payout we owe.",
  options: [
    { name: "Polymarket (Gamma API)", note_zh: "实时价格信号 · 合规未支持直接建仓", note_en: "live price signal · no direct positions due to regulation" },
    { name: "Kalshi", note_zh: "美国 CFTC 监管 · 合规直接对冲 (受持仓限额)", note_en: "US CFTC-regulated · compliant direct hedging (within position limits)" },
    { name: "Metaculus / Manifold", note_zh: "辅助信号源 · 不直接建仓", note_en: "supplemental signal · no direct positions" },
  ],
};

const REINS_LAYER: Layer = {
  key: "reins",
  zh: "传统再保险",
  en: "Traditional reinsurance",
  subZh: "Swiss Re · Hannover Re · Munich Re · Lloyd's",
  subEn: "Swiss Re · Hannover Re · Munich Re · Lloyd's",
  pct: 0.5,
  color: "#ff9a3c",
  detailZh:
    "把单笔大额赔付的尾部 (超过 $500K 的部分) 转嫁给传统再保险公司。这是参数化保险能成规模的唯一基础 — 没有再保, 一单就能击穿你的偿付能力。这一层占比最大, 因为这才是真正承担「最坏情况」的钱。",
  detailEn:
    "Cedes the tail of any single large payout (above $500K) to traditional reinsurers. This is the only infrastructure that lets parametric insurance scale — without it, one large claim breaks solvency. It's the largest layer because this is where the worst-case money actually sits.",
  payoutZh: "单笔赔付 > $500K → 再保险承担超额部分的 85%。",
  payoutEn: "Single payout > $500K → reinsurer covers 85% of the excess.",
  options: [
    { name: "Swiss Re Corporate Solutions", note_zh: "主力 stop-loss treaty", note_en: "primary stop-loss treaty" },
    { name: "Hannover Re", note_zh: "second-tier 备用容量", note_en: "second-tier backup capacity" },
    { name: "Munich Re", note_zh: "alternative · 长尾航运延误线", note_en: "alternative · long-tail shipping delay book" },
    { name: "Lloyd's Syndicate 4812", note_zh: "fronting · 出具合规保单", note_en: "fronting · issues the regulatory paper" },
  ],
};

const DERIV_LAYER: Layer = {
  key: "deriv",
  zh: "运价 / 商品衍生品",
  en: "Freight / commodity derivatives",
  subZh: "Baltic FFA · ICE Brent · LME · CME",
  subEn: "Baltic FFA · ICE Brent · LME · CME",
  pct: 0.2,
  color: "#7dffb1",
  detailZh:
    "对冲「价格类风险」 — 不是事件本身, 而是事件发生后导致的价格剧烈波动。比如霍尔木兹一旦绕行, MEG-China VLCC 运价立刻飙涨, 我们做多的 FFA 头寸自动盈利。这一层只对**和本货物直接相关**的商品启用 — 原油货才上 Brent, 集装箱货才上 FFA, 啤酒货则跳过。",
  detailEn:
    "Hedges price-driven exposures — not the event itself, but the price moves that follow. E.g. if Hormuz forces a detour, MEG-China VLCC freight spikes, and our long FFA position automatically gains. This layer is only activated for instruments directly relevant to the cargo — Brent for crude, FFA for containers, skipped for beer.",
  payoutZh: "标的价格穿越执行价 → 头寸盈利抵销我们的赔付义务。",
  payoutEn: "Underlying crosses strike → position gains offset the payout we owe.",
  options: [
    { name: "Baltic Exchange FFA (TD3C)", note_zh: "MEG → China VLCC 运价远期", note_en: "MEG → China VLCC freight forward" },
    { name: "ICE Brent options", note_zh: "原油尾部价格风险", note_en: "crude tail price risk" },
    { name: "LME Copper / Nickel", note_zh: "金属货物专用", note_en: "metal cargo only" },
    { name: "CME Henry Hub / TTF", note_zh: "LNG 货物专用", note_en: "LNG cargo only" },
  ],
};

/** Pick which layers apply based on cargo class. */
function layersFor(case_?: Case): Layer[] {
  // For demo simplicity we always show 3 layers. In production we'd toggle the
  // derivative layer on/off based on whether the cargo has a tradeable price index.
  const cargo = (case_?.cargo ?? "").toLowerCase();
  const hasDerivatives =
    /crude|oil|brent|wti|coal|copper|iron|metal|lng|lpg|gas|grain|wheat|soy/.test(cargo) ||
    case_?.id === "saudi-crude-yantai";
  if (!hasDerivatives) {
    // Re-allocate the 20% derivative slice into reinsurance when not applicable.
    return [
      { ...PM_LAYER, pct: 0.3 },
      { ...REINS_LAYER, pct: 0.7 },
    ];
  }
  return [PM_LAYER, REINS_LAYER, DERIV_LAYER];
}

export default function HedgeWaterfall({
  risk,
  currency = "USD",
  case_,
}: {
  risk: RiskModel;
  currency?: Currency;
  case_?: Case;
}) {
  const t = useT();
  const total = risk.premiumUsd;
  const layers = layersFor(case_);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div>
          <div className="label-kicker">/// {t("你的保费去哪了", "WHERE YOUR PREMIUM GOES")}</div>
          <div className="text-[10px] text-faint mt-0.5">
            {t(
              `${layers.length} 个对冲层 · 点任意一层展开真实交易对手 + 解释`,
              `${layers.length} hedge layers · click any layer to see real counterparties + explanation`,
            )}
          </div>
        </div>
        <div className="text-[10px] text-amber tabular-nums">
          {t("合计 ", "TOTAL ")}
          {fmtMoney(total, currency)}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Stacked bar */}
        <div className="h-5 w-full flex overflow-hidden border border-line">
          {layers.map((l) => (
            <div
              key={l.key}
              style={{ width: `${l.pct * 100}%`, background: l.color, opacity: 0.85 }}
              title={`${t(l.zh, l.en)} · ${(l.pct * 100).toFixed(0)}%`}
            />
          ))}
        </div>

        {/* Layer rows */}
        <div className="space-y-1.5">
          {layers.map((l) => {
            const isOpen = open === l.key;
            return (
              <div key={l.key} className="border border-line">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : l.key)}
                  className="w-full flex items-center gap-3 text-[11px] px-2 py-2 hover:bg-panel-2 transition-colors text-left"
                >
                  <span className="w-2 h-2 flex-shrink-0" style={{ background: l.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-text font-semibold">{t(l.zh, l.en)}</div>
                    <div className="text-[10px] text-faint truncate">{t(l.subZh, l.subEn)}</div>
                  </div>
                  <div className="text-faint tabular-nums w-10 text-right">
                    {(l.pct * 100).toFixed(0)}%
                  </div>
                  <div className="text-amber tabular-nums w-20 text-right">
                    {fmtMoney(Math.round(total * l.pct), currency)}
                  </div>
                  <span className="text-amber-dim text-xs w-3 text-center">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-line bg-panel-2/40 px-3 py-2.5 text-[11px] leading-relaxed">
                    <div className="text-dim">{t(l.detailZh, l.detailEn)}</div>

                    <div className="mt-2 px-2 py-1.5 border border-line bg-bg/40 text-[10px]">
                      <span className="text-green tracking-widest mr-2">
                        {t("怎么赔回来 →", "HOW IT PAYS BACK →")}
                      </span>
                      <span className="text-dim">{t(l.payoutZh, l.payoutEn)}</span>
                    </div>

                    <div className="mt-2 text-[9px] text-amber-dim tracking-widest">
                      {t("具体交易对手 / 工具", "REAL COUNTERPARTIES / INSTRUMENTS")}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {l.options.map((opt) => (
                        <div key={opt.name} className="flex gap-2 text-[10px]">
                          <span className="text-amber flex-shrink-0">▸</span>
                          <span className="text-text font-mono">{opt.name}</span>
                          <span className="text-faint">·</span>
                          <span className="text-dim flex-1">
                            {t(opt.note_zh, opt.note_en)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footnote about what's NOT included */}
        <div className="text-[10px] text-faint leading-relaxed border-t border-line pt-2">
          <span className="text-amber-dim tracking-widest">
            {t("说明 · ", "NOTE · ")}
          </span>
          {t(
            "上面这 100% 是「对冲钱」 — 真正用来对冲你这一票货的部分。承保方的运营成本、自留资本和承保利润是另一笔账, 不从你的保费里抽 — 平台费固定 6%, 单独入账。",
            "These layers add up to 100% — this is the actual hedge money for your shipment. Underwriter operating cost, retained capital, and underwriting margin are separate — never taken from your premium. Platform fee is a flat 6%, billed separately.",
          )}
        </div>
      </div>
    </div>
  );
}
