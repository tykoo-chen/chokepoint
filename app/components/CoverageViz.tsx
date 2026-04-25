"use client";
import { Case } from "@/app/lib/cases";
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
        <div className="label-kicker">/// 延误分布 · 保障形状</div>
        <div className="text-[10px] text-faint tracking-widest">对数正态 · 来自 842 次可比航次拟合</div>
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
          缓冲 {case_.bufferDays}d
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
          概率密度
        </text>
        <text x={W - PAD_R} y={H - PAD_B + 24} fill="#4a5663" fontSize="9" textAnchor="end">
          比预抵 ETA 晚多少天 →
        </text>
      </svg>

      <div className="border-t border-line px-4 py-3 grid grid-cols-4 gap-3 text-[11px]">
        {triggers.map((t) => (
          <div key={t.label} className="panel p-2">
            <div className="text-[9px] text-faint tracking-widest">{t.label.split(" · ")[0]} · 触发器</div>
            <div className="text-dim">晚 ≥ {t.d} 天</div>
            <div className="text-amber tabular-nums mt-1">
              赔 {fmtMoney(Math.round(risk.recommendedCoverageUsd * t.payout), case_.currency)}
            </div>
          </div>
        ))}
        <div className="panel p-2 border-amber-dim">
          <div className="text-[9px] text-amber-dim tracking-widest">保额上限</div>
          <div className="text-dim">封顶全额赔付</div>
          <div className="text-amber text-lg tabular-nums mt-1">
            {fmtMoney(risk.recommendedCoverageUsd, case_.currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
