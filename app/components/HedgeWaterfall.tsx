"use client";
import { Currency, fmtMoney, RiskModel } from "@/app/lib/risk";

type Layer = { key: string; label: string; sub: string; pct: number; color: string };

export default function HedgeWaterfall({ risk, currency = "USD" }: { risk: RiskModel; currency?: Currency }) {
  const layers: Layer[] = [
    { key: "mkt", label: "预测市场对冲", sub: "Polymarket · Kalshi · 事件合约", pct: 0.32, color: "#4fc3f7" },
    { key: "ffa", label: "运价 / 商品对冲", sub: "FFA (TD3C) · Brent · LME 组合", pct: 0.24, color: "#7dffb1" },
    { key: "reins", label: "再保险层", sub: "Swiss Re / Hannover · 超额赔付", pct: 0.22, color: "#ff9a3c" },
    { key: "retained", label: "自留资金", sub: "平台自有资本 · 承保利润", pct: 0.16, color: "#ffb347" },
    { key: "fee", label: "数据源 + 平台费", sub: "AIS (Spire) · PortWatch · Chokepoint.io", pct: 0.06, color: "#7b8896" },
  ];
  const total = risk.premiumUsd;

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// 你的保费去哪了</div>
        <div className="text-[10px] text-amber tabular-nums">合计 {fmtMoney(total, currency)}</div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="h-5 w-full flex overflow-hidden border border-line">
          {layers.map((l) => (
            <div
              key={l.key}
              style={{ width: `${l.pct * 100}%`, background: l.color, opacity: 0.85 }}
              title={`${l.label} · ${(l.pct * 100).toFixed(0)}%`}
            />
          ))}
        </div>

        <div className="space-y-1.5">
          {layers.map((l) => (
            <div key={l.key} className="flex items-center gap-3 text-[11px]">
              <span className="w-2 h-2" style={{ background: l.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-dim truncate">{l.label}</div>
                <div className="text-[10px] text-faint truncate">{l.sub}</div>
              </div>
              <div className="text-faint tabular-nums w-10 text-right">{(l.pct * 100).toFixed(0)}%</div>
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
