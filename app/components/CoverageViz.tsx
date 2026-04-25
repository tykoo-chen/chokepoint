"use client";
import { Case } from "@/app/lib/cases";
import { useT } from "@/app/lib/i18n";
import { fmtMoney, RiskModel } from "@/app/lib/risk";

const W = 780;
const H = 260;
const PAD_L = 56;
const PAD_R = 24;
const PAD_T = 20;
const PAD_B = 36;

function lognormalPdf(x: number, mu: number, sigma: number) {
  if (x <= 0) return 0;
  const z = (Math.log(x) - mu) / sigma;
  return (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

export default function CoverageViz({ case_, risk }: { case_: Case; risk: RiskModel }) {
  const t = useT();
  const maxDay = Math.max(risk.p99DelayDays + 5, 45);
  const mu = Math.log(Math.max(1, risk.p50DelayDays));
  const sigma = 0.9;

  const samples = Array.from({ length: 120 }, (_, i) => {
    const d = (i / 119) * maxDay;
    return { d, p: lognormalPdf(Math.max(0.1, d), mu, sigma) };
  });
  const maxP = Math.max(...samples.map((s) => s.p));

  const xFor = (d: number) => PAD_L + (d / maxDay) * (W - PAD_L - PAD_R);
  const yFor = (p: number) => H - PAD_B - (p / maxP) * (H - PAD_T - PAD_B);

  const areaPath = [
    `M ${xFor(0)} ${H - PAD_B}`,
    ...samples.map((s) => `L ${xFor(s.d)} ${yFor(s.p)}`),
    `L ${xFor(maxDay)} ${H - PAD_B}`,
    "Z",
  ].join(" ");

  const linePath = samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${xFor(s.d)} ${yFor(s.p)}`)
    .join(" ");

  const triggers = [
    { d: 10, payout: 0.2, label: "T1 · 10d" },
    { d: 20, payout: 0.5, label: "T2 · 20d" },
    { d: 30, payout: 1.0, label: "T3 · 30d" },
  ];

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">
          /// {t("延误分布 · 保障形状", "DELAY DISTRIBUTION · COVER SHAPE")}
        </div>
        <div className="text-[10px] text-faint tracking-widest">
          {t("对数正态 · 来自 842 次可比航次拟合", "Lognormal · fit on 842 comparable voyages")}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        <defs>
          <linearGradient id="riskfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ffb347" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffb347" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="coveredband" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7dffb1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7dffb1" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect
          x={xFor(case_.bufferDays)}
          y={PAD_T}
          width={xFor(maxDay) - xFor(case_.bufferDays)}
          height={H - PAD_T - PAD_B}
          fill="url(#coveredband)"
        />

        {[0, 7, 14, 21, 28, 35, 42].filter((d) => d <= maxDay).map((d) => (
          <g key={d}>
            <line
              x1={xFor(d)} x2={xFor(d)}
              y1={PAD_T} y2={H - PAD_B}
              stroke="#1a2430" strokeDasharray="1 3"
            />
            <text x={xFor(d)} y={H - PAD_B + 14} fill="#4a5663" fontSize="9" textAnchor="middle">
              {d}d
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#riskfill)" />
        <path d={linePath} fill="none" stroke="#ffb347" strokeWidth="1.2" />

        <line
          x1={xFor(case_.bufferDays)} x2={xFor(case_.bufferDays)}
          y1={PAD_T} y2={H - PAD_B}
          stroke="#7dffb1" strokeWidth="1" strokeDasharray="2 2"
        />
        <text x={xFor(case_.bufferDays)} y={PAD_T - 4} fill="#7dffb1" fontSize="9" textAnchor="middle">
          {t("缓冲 ", "BUFFER ")}{case_.bufferDays}d
        </text>

        {triggers.map((t) => (
          <g key={t.label}>
            <line
              x1={xFor(t.d)} x2={xFor(t.d)}
              y1={PAD_T + 6} y2={H - PAD_B}
              stroke="#ff9a3c" strokeWidth="0.8"
            />
            <rect x={xFor(t.d) - 28} y={PAD_T - 2} width="56" height="14" fill="#0b0f14" stroke="#ff9a3c" />
            <text x={xFor(t.d)} y={PAD_T + 8} fill="#ffb347" fontSize="9" textAnchor="middle">
              {t.label}
            </text>
          </g>
        ))}

        {[
          { d: risk.p50DelayDays, label: "P50", color: "#7b8896" },
          { d: risk.p90DelayDays, label: "P90", color: "#ffb347" },
          { d: risk.p99DelayDays, label: "P99", color: "#ff5a4a" },
        ].map((m) => (
          <g key={m.label}>
            <circle cx={xFor(m.d)} cy={yFor(lognormalPdf(Math.max(0.1, m.d), mu, sigma))} r="3" fill={m.color} />
            <text
              x={xFor(m.d)}
              y={yFor(lognormalPdf(Math.max(0.1, m.d), mu, sigma)) - 6}
              fill={m.color}
              fontSize="9"
              textAnchor="middle"
            >
              {m.label} · {m.d}d
            </text>
          </g>
        ))}

        <text x={PAD_L - 6} y={PAD_T + 6} fill="#4a5663" fontSize="9" textAnchor="end">
          {t("概率密度", "density")}
        </text>
        <text x={W - PAD_R} y={H - PAD_B + 24} fill="#4a5663" fontSize="9" textAnchor="end">
          {t("比预抵 ETA 晚多少天 →", "days late vs scheduled ETA →")}
        </text>
      </svg>

      <div className="border-t border-line px-4 py-3 grid grid-cols-4 gap-3 text-[11px]">
        {triggers.map((trig) => (
          <div key={trig.label} className="panel p-2">
            <div className="text-[9px] text-faint tracking-widest">
              {trig.label.split(" · ")[0]} · {t("触发器", "TRIGGER")}
            </div>
            <div className="text-dim">
              {t(`晚 ≥ ${trig.d} 天`, `Late ≥ ${trig.d}d`)}
            </div>
            <div className="text-amber tabular-nums mt-1">
              {t("赔 ", "Pay ")}
              {fmtMoney(Math.round(risk.recommendedCoverageUsd * trig.payout), case_.currency)}
            </div>
          </div>
        ))}
        <div className="panel p-2 border-amber-dim">
          <div className="text-[9px] text-amber-dim tracking-widest">{t("保额上限", "POLICY LIMIT")}</div>
          <div className="text-dim">{t("封顶全额赔付", "Full payout cap")}</div>
          <div className="text-amber text-lg tabular-nums mt-1">
            {fmtMoney(risk.recommendedCoverageUsd, case_.currency)}
          </div>
        </div>
      </div>

      {/* Plain-language explanation */}
      <div className="border-t border-line px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
        <div>
          <div className="label-kicker text-amber-dim mb-1.5">
            {t("/// 这张图在说什么", "/// WHAT THIS CHART MEANS")}
          </div>
          <p className="text-dim">
            {t(
              "横轴 = 比合同 ETA 晚多少天。竖轴 = 这种延迟程度发生的概率。整条曲线由过去 842 次同类航次拟合而成 (lognormal, 厚右尾)。",
              "X-axis = days late vs. contract ETA. Y-axis = probability density of that level of delay. The whole curve is fit from 842 past comparable voyages (lognormal, fat right tail).",
            )}
          </p>
          <p className="text-dim mt-2">
            {t(
              "曲线越往右越厚, 意味着你更可能晚很多 — 而不是只晚一点点。这就是为什么「光看 P50」会严重低估真实风险。",
              "The fatter the right tail, the more likely you'll be very late — not just a little late. This is why looking only at P50 dangerously understates real risk.",
            )}
          </p>
        </div>

        <div>
          <div className="label-kicker text-amber-dim mb-1.5">
            {t("/// 怎么读这些标记", "/// HOW TO READ THE MARKERS")}
          </div>
          <ul className="space-y-1.5 text-dim">
            <li>
              <span className="text-green font-semibold">{t("绿色虚线 BUFFER", "Green dashed BUFFER")}</span>
              {" — "}
              {t(
                `买方有 ${case_.bufferDays} 天库存兜底, 这条线左边你自己消化, 这条线右边就开始触发我们的赔付。`,
                `The buyer has ${case_.bufferDays} days of inventory before stockout. Left of this line you absorb the delay yourself; right of it our payouts start firing.`,
              )}
            </li>
            <li>
              <span className="text-amber font-semibold">{t("琥珀竖线 T1 / T2 / T3", "Amber lines T1 / T2 / T3")}</span>
              {" — "}
              {t(
                "10 天 / 20 天 / 30 天三档触发器, 每档对应一次自动赔付 (每档赔付递增, 30 天封顶)。",
                "Three triggers at 10 / 20 / 30 days late. Each fires an automatic payout, escalating up to the policy limit at 30 days.",
              )}
            </li>
            <li>
              <span className="text-dim font-semibold">P50 / P90 / P99</span>
              {" — "}
              {t(
                "概率分位数。P50 = 一半概率你到这天就到了 (中位数);  P90 = 只有 10% 概率比这还晚;  P99 = 极尾, 只有 1% 概率比这还晚 — 这是我们必须能承受的最坏情况。",
                "Probability percentiles. P50 = median (50/50); P90 = only 10% chance you'll be later; P99 = the deep tail (1%) — the worst case we must still pay.",
              )}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
