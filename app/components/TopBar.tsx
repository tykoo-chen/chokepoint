"use client";
import { useEffect, useState } from "react";

function fmtTime(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

export default function TopBar({ screen, threat = 3 }: { screen: string; threat?: number }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const threatLabel = threat <= 2 ? "低" : threat <= 4 ? "偏高" : threat <= 6 ? "高" : "极高";
  const threatEn = threat <= 2 ? "LOW" : threat <= 4 ? "ELEVATED" : threat <= 6 ? "HIGH" : "CRITICAL";
  const threatColor = threat <= 2 ? "text-green" : threat <= 4 ? "text-amber" : "text-red";

  return (
    <div className="relative z-10 border-b border-line bg-panel/80 backdrop-blur">
      <div className="flex items-center gap-6 px-5 py-2.5 text-[11px]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber pulse-dot" />
          <span className="text-amber tracking-[0.3em] font-semibold">CHOKEPOINT</span>
          <span className="text-faint">v0.1 · demo</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-faint">
          <span>页面</span>
          <span className="text-dim">/</span>
          <span className="text-amber">{screen}</span>
        </div>
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-1 text-faint">
          <span>风险</span>
          <span className="text-dim">/</span>
          <span className={`${threatColor} font-semibold`}>
            {threatLabel} · {threatEn} · {threat}/10
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-faint">
          <span>数据源</span>
          <span className="text-dim">/</span>
          <span className="text-green flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" /> 实时
          </span>
        </div>
        <div className="text-dim tabular-nums">{now ? fmtTime(now) : "····-··-·· ··:··:··Z"}</div>
      </div>
    </div>
  );
}
