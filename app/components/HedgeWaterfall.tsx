"use client";
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
  options: Array<{
    name: string;
    note_zh: string;
    note_en: string;
  }>;
};

const LAYERS: Layer[] = [
  {
    key: "reins",
    zh: "再保险层",
    en: "Reinsurance treaty",
    subZh: "Swiss Re / Hannover / Munich Re · 超额损失",
    subEn: "Swiss Re / Hannover Re / Munich Re · excess of loss",
    pct: 0.35,
    color: "#ff9a3c",
    detailZh:
      "把超过我们自留层 (单笔 $500K) 的赔付转嫁给传统再保险公司。这是任何参数化保单走向规模化的必经之路 — 没有再保, 单一赔付就能击穿你的偿付能力。",
    detailEn:
      "Cedes any single-claim payout above our retention ($500K) to a tier-1 reinsurer. Any parametric product needs this to scale — without it, a single large claim can wipe out the capital base.",
    options: [
      { name: "Swiss Re Corporate Solutions", note_zh: "Lloyd's Box 4812 转分入", note_en: "Lloyd's Box 4812 outward cession" },
      { name: "Hannover Re", note_zh: "stop-loss treaty · attachment $500K", note_en: "stop-loss treaty · attachment $500K" },
      { name: "Munich Re", note_zh: "alternative — 长尾航运延误线", note_en: "alternative — long-tail shipping delay line" },
    ],
  },
  {
    key: "mkt",
    zh: "预测市场对冲 + 信号",
    en: "Prediction-market hedge + signal",
    subZh: "Polymarket · Kalshi · 事件合约",
    subEn: "Polymarket · Kalshi · event contracts",
    pct: 0.25,
    color: "#4fc3f7",
    detailZh:
      "Polymarket 实时价是我们定价的最重要单一信号 — 它就是这张保单的「价格底」。在合规允许的辖区, 我们也直接持有少量头寸做局部对冲 (主要是 Kalshi, 美国 CFTC 监管事件合约)。",
    detailEn:
      "Polymarket live prices are the single most important signal in our pricing — they set the floor for this policy. Where regulation allows, we also hold modest positions directly (mainly Kalshi, the US-regulated event-contract exchange) as a partial hedge.",
    options: [
      { name: "Polymarket (Gamma API)", note_zh: "实时价格信号 · 不直接建仓 (合规限制)", note_en: "live pricing signal · no direct positions (regulatory)" },
      { name: "Kalshi", note_zh: "美国 CFTC 监管 · 合规直接对冲 (受额度限制)", note_en: "US CFTC-regulated · compliant direct hedging (within position limits)" },
      { name: "Metaculus / Manifold", note_zh: "辅助信号 · 不直接建仓", note_en: "supplemental signal · no direct positions" },
    ],
  },
  {
    key: "retained",
    zh: "自留资本 (skin in the game)",
    en: "Retained capital (skin in the game)",
    subZh: "平台自有资本 · 第一损失层",
    subEn: "Platform balance sheet · first-loss layer",
    pct: 0.2,
    color: "#ffb347",
    detailZh:
      "前 $500K 损失由我们自己承担。这一条比例固定 (20%) 是结构性的 — 我们必须有 skin in the game, 否则你不会信任我们能赔。",
    detailEn:
      "We absorb the first $500K of any single claim ourselves. This 20% retention is structural — without skin in the game you can't trust us to actually pay out.",
    options: [
      { name: "MGA balance sheet", note_zh: "platform 自有资本", note_en: "platform's own capital" },
      { name: "Underwriting profit reserve", note_zh: "历史承保利润滚动累积", note_en: "rolling reserve from past underwriting profit" },
    ],
  },
  {
    key: "ffa",
    zh: "运价 / 商品衍生品",
    en: "Freight & commodity derivatives",
    subZh: "Baltic FFA · ICE Brent · LME",
    subEn: "Baltic FFA · ICE Brent · LME",
    pct: 0.14,
    color: "#7dffb1",
    detailZh:
      "对冲间接价格风险 — 比如霍尔木兹一旦绕行, MEG-China VLCC 运价飙涨, 我们买的 FFA 自动盈利冲抵赔付。仅用于和本航次直接相关的商品 / 运价。",
    detailEn:
      "Hedges the indirect price exposures — e.g. if Hormuz forces a detour, MEG-China VLCC freight spikes and our long FFA position offsets the claim. Used only for instruments directly relevant to the voyage.",
    options: [
      { name: "Baltic Exchange FFA (TD3C)", note_zh: "MEG → China VLCC 运价远期", note_en: "MEG → China VLCC freight forward" },
      { name: "ICE Brent options", note_zh: "原油尾部价格风险", note_en: "crude tail price risk" },
      { name: "LME Copper / Nickel", note_zh: "金属类货物专用", note_en: "for metal cargo only" },
      { name: "CME Henry Hub / TTF", note_zh: "LNG 类货物专用", note_en: "for LNG cargo only" },
    ],
  },
  {
    key: "fee",
    zh: "数据源 + 平台运营",
    en: "Data feed + platform ops",
    subZh: "AIS · IMF PortWatch · Lloyd's List · 平台",
    subEn: "AIS · IMF PortWatch · Lloyd's List · platform",
    pct: 0.06,
    color: "#7b8896",
    detailZh:
      "固定成本, 跟赔不赔无关。这一条是我们能保持 6% 而不像传统保险公司那样收 25% 的关键 — 平台费透明, 不从赔付里抽成。",
    detailEn:
      "Fixed cost, paid whether triggers fire or not. This is why we charge 6% instead of the 25% traditional insurers take — fees are transparent and never come out of payouts.",
    options: [
      { name: "Spire Maritime AIS", note_zh: "卫星 AIS · ~$50K/年", note_en: "satellite AIS · ~$50K/year" },
      { name: "IMF PortWatch", note_zh: "免费 · 港口 + chokepoint 通行量", note_en: "free · port + chokepoint transit data" },
      { name: "Lloyd's List Intelligence", note_zh: "船舶事件 + 港口拥堵", note_en: "vessel incidents + port congestion" },
      { name: "Vercel + Anthropic API", note_zh: "前端 + AI 推理", note_en: "front-end + AI inference" },
    ],
  },
];

export default function HedgeWaterfall({
  risk,
  currency = "USD",
}: {
  risk: RiskModel;
  currency?: Currency;
}) {
  const t = useT();
  const total = risk.premiumUsd;
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div>
          <div className="label-kicker">/// {t("你的保费去哪了", "WHERE YOUR PREMIUM GOES")}</div>
          <div className="text-[10px] text-faint mt-0.5">
            {t(
              "5 个对冲层 · 点任意一层展开真实交易对手 + 解释",
              "5 hedge layers · click any layer to see real counterparties + explanation",
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
          {LAYERS.map((l) => (
            <div
              key={l.key}
              style={{ width: `${l.pct * 100}%`, background: l.color, opacity: 0.85 }}
              title={`${t(l.zh, l.en)} · ${(l.pct * 100).toFixed(0)}%`}
            />
          ))}
        </div>

        {/* Layer rows */}
        <div className="space-y-1.5">
          {LAYERS.map((l) => {
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
      </div>
    </div>
  );
}
