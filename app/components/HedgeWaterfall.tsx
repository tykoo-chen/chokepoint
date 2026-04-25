"use client";
import { useT } from "@/app/lib/i18n";
import { Currency, fmtMoney, RiskModel } from "@/app/lib/risk";

type Layer = {
  key: string;
  zh: string;
  en: string;
  subZh: string;
  subEn: string;
  pct: number;
  color: string;
};

export default function HedgeWaterfall({
  risk,
  currency = "USD",
}: {
  risk: RiskModel;
  currency?: Currency;
}) {
  const t = useT();
  const layers: Layer[] = [
    {
      key: "mkt",
      zh: "预测市场对冲",
      en: "Prediction-market hedge",
      subZh: "Polymarket · Kalshi · 事件合约",
      subEn: "Polymarket · Kalshi · event contracts",
      pct: 0.32,
      color: "#4fc3f7",
    },
    {
      key: "ffa",
      zh: "运价 / 商品对冲",
      en: "Freight / commodity hedge",
      subZh: "FFA (TD3C) · Brent · LME 组合",
      subEn: "FFA (TD3C) · Brent · LME basket",
      pct: 0.24,
      color: "#7dffb1",
    },
    {
      key: "reins",
      zh: "再保险层",
      en: "Reinsurance layer",
      subZh: "Swiss Re / Hannover · 超额赔付",
      subEn: "Swiss Re / Hannover · excess of loss",
      pct: 0.22,
      color: "#ff9a3c",
    },
    {
      key: "retained",
      zh: "自留资金",
      en: "Retained capital",
      subZh: "平台自有资本 · 承保利润",
      subEn: "Platform balance sheet · underwriting margin",
      pct: 0.16,
      color: "#ffb347",
    },
    {
      key: "fee",
      zh: "数据源 + 平台费",
      en: "Data feed + platform fee",
      subZh: "AIS (Spire) · PortWatch · Chokepoint.io",
      subEn: "AIS (Spire) · PortWatch · Chokepoint.io",
      pct: 0.06,
      color: "#7b8896",
    },
  ];
  const total = risk.premiumUsd;

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// {t("你的保费去哪了", "WHERE YOUR PREMIUM GOES")}</div>
        <div className="text-[10px] text-amber tabular-nums">
          {t("合计 ", "TOTAL ")}
          {fmtMoney(total, currency)}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="h-5 w-full flex overflow-hidden border border-line">
          {layers.map((l) => (
            <div
              key={l.key}
              style={{ width: `${l.pct * 100}%`, background: l.color, opacity: 0.85 }}
              title={`${t(l.zh, l.en)} · ${(l.pct * 100).toFixed(0)}%`}
            />
          ))}
        </div>

        <div className="space-y-1.5">
          {layers.map((l) => (
            <div key={l.key} className="flex items-center gap-3 text-[11px]">
              <span className="w-2 h-2" style={{ background: l.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-dim truncate">{t(l.zh, l.en)}</div>
                <div className="text-[10px] text-faint truncate">{t(l.subZh, l.subEn)}</div>
              </div>
              <div className="text-faint tabular-nums w-10 text-right">
                {(l.pct * 100).toFixed(0)}%
              </div>
              <div className="text-amber tabular-nums w-20 text-right">
                {fmtMoney(Math.round(total * l.pct), currency)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
