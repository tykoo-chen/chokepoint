"use client";
import { useT } from "@/app/lib/i18n";
import { useEffect, useState } from "react";

function fmtTime(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

export default function TopBar({ screen, threat = 3 }: { screen: string; threat?: number }) {
  const t = useT();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const tt = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tt);
  }, []);

  const threatLabel =
    threat <= 2
      ? t("低 · LOW", "LOW")
      : threat <= 4
      ? t("偏高 · ELEVATED", "ELEVATED")
      : threat <= 6
      ? t("高 · HIGH", "HIGH")
      : t("极高 · CRITICAL", "CRITICAL");
  const threatColor = threat <= 2 ? "text-green" : threat <= 4 ? "text-amber" : "text-red";

  return (
    <div className="relative z-10 border-b border-line bg-panel/80 backdrop-blur">
      <div className="flex items-center gap-6 px-5 py-2.5 text-[11px]">
        <div className="flex items-baseline gap-2">
          <div className="w-2 h-2 rounded-full bg-amber pulse-dot self-center" />
          <span className="text-amber tracking-[0.3em] font-semibold">JUSTINCASE</span>
          <span className="text-amber-dim text-[12px] font-medium">万一</span>
          <span className="text-faint text-[10px]">v0.1 · demo</span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-faint">
          <span>{t("页面", "SCREEN")}</span>
          <span className="text-dim">/</span>
          <span className="text-amber">{screen}</span>
        </div>
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-1 text-faint">
          <span>{t("风险", "THREAT")}</span>
          <span className="text-dim">/</span>
          <span className={`${threatColor} font-semibold`}>
            {threatLabel} · {threat}/10
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1 text-faint">
          <span>{t("数据源", "FEED")}</span>
          <span className="text-dim">/</span>
          <span className="text-green flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
            {t("实时", "LIVE")}
          </span>
        </div>
        <div className="text-dim tabular-nums">{now ? fmtTime(now) : "····-··-·· ··:··:··Z"}</div>
      </div>
    </div>
  );
}
