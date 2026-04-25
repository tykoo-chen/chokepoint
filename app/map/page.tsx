"use client";
import ChokepointPanel from "@/app/components/ChokepointPanel";
import FactorDecomposition from "@/app/components/FactorDecomposition";
import Globe from "@/app/components/Globe";
import ShipmentPanel from "@/app/components/ShipmentPanel";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor } from "@/app/lib/cases";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtMoney, fmtMoneyLong, fmtPct } from "@/app/lib/risk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

function MapInner() {
  const params = useSearchParams();
  const caseId = params.get("case") ?? "hormuz2026";
  const case_ = caseById(caseId);
  const baseChokepoints = useMemo(() => chokepointsFor(case_), [case_.id]);
  const { chokepoints } = useLiveChokepoints(baseChokepoints);
  const risk = useMemo(() => buildRiskModel(case_, chokepoints), [case_, chokepoints]);

  const threat = Math.min(10, Math.round(risk.combinedDisruptionProb * 13));
  const focus = useMemo(() => {
    const midLat = chokepoints.reduce((s, c) => s + c.lat, 0) / Math.max(1, chokepoints.length);
    const midLng = chokepoints.reduce((s, c) => s + c.lng, 0) / Math.max(1, chokepoints.length);
    return { lat: midLat, lng: midLng, altitude: 2.4 };
  }, [chokepoints]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar screen={`地图 · ${case_.id.toUpperCase()}`} threat={threat} />
      <Ticker />

      <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/" className="text-faint hover:text-amber">← 录入</Link>
          <span className="text-faint">/</span>
          <span className="text-amber">{case_.title}</span>
          <span className="text-faint">· {case_.subtitle}</span>
        </div>
        <Link
          href={`/quote?case=${case_.id}`}
          className="btn-amber px-4 py-1.5 text-xs tracking-widest"
        >
          下一步 · 报价 →
        </Link>
      </div>

      {(case_.realContext || case_.painPointZh) && (
        <div className="mx-5 mt-3 space-y-2">
          {case_.painPointZh && (
            <div className="panel border-amber bg-amber/5 px-4 py-3 text-[11px] leading-relaxed flex gap-3">
              <div className="flex-shrink-0 text-amber tracking-widest text-[10px] pt-0.5">
                ⚠ 客户的真实痛点
              </div>
              <div className="text-text flex-1">{case_.painPointZh}</div>
            </div>
          )}
          {case_.realContext && (
            <div className="panel border-amber-dim bg-panel-2/60 px-4 py-3 text-[11px] leading-relaxed flex gap-3">
              <div className="flex-shrink-0 text-amber-dim tracking-widest text-[10px] pt-0.5">
                🛰 真实背景
              </div>
              <div className="text-dim flex-1">
                {case_.realContext}
                {case_.sources && (
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-faint">
                    {case_.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="hover:text-amber underline">
                        {s.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <ShipmentPanel case_={case_} />
          <div className="panel-raised p-4">
            <div className="label-kicker mb-2">/// AI 路线解读</div>
            <p className="text-[11px] text-dim leading-relaxed">
              本航线途经 {chokepoints.length} 个受监控的海峡/通道。
              综合扰动概率为 <span className="text-amber">{fmtPct(risk.combinedDisruptionProb, 1)}</span>,
              P90 延误估计 <span className="text-amber">{risk.p90DelayDays} 天</span>,
              已超过买方 {case_.bufferDays} 天库存缓冲,
              会在第 {case_.bufferDays + 1} 天起触发违约金。
            </p>
            {case_.altRouteLabel && (
              <p className="text-[11px] text-faint mt-2 leading-relaxed">
                备选航线: <span className="text-green-dim">{case_.altRouteLabel}</span>, 可作为期权式对冲提前锁定。
              </p>
            )}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6 panel-raised overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="label-kicker">/// 航线 · 风险点叠加</div>
            </div>
            <div className="text-[10px] text-faint tracking-widest flex items-center gap-3">
              <span>投影 · 正交</span>
              <span className="w-1 h-1 bg-line" />
              <span>倾角 · 0°</span>
              <span className="w-1 h-1 bg-line" />
              <span className="text-amber">刷新 · 1.4s</span>
            </div>
          </div>
          <Globe case_={case_} chokepoints={chokepoints} focus={focus} height={620} />
          <div className="absolute top-12 right-4 panel p-3 min-w-[180px]">
            <div className="label-kicker mb-1">综合扰动概率</div>
            <div className="text-2xl text-amber tabular-nums">{fmtPct(risk.combinedDisruptionProb, 1)}</div>
            <div className="text-[10px] text-faint mt-1">60 天窗口 · 任一扰动</div>
            <div className="h-px bg-line my-2" />
            <div className="grid grid-cols-3 gap-1 text-center">
              <div>
                <div className="text-[9px] text-faint">P50</div>
                <div className="text-sm text-dim tabular-nums">{risk.p50DelayDays}d</div>
              </div>
              <div>
                <div className="text-[9px] text-faint">P90</div>
                <div className="text-sm text-amber tabular-nums">{risk.p90DelayDays}d</div>
              </div>
              <div>
                <div className="text-[9px] text-faint">P99</div>
                <div className="text-sm text-red tabular-nums">{risk.p99DelayDays}d</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <ChokepointPanel chokepoints={chokepoints} />
          <div className="panel-raised p-4">
            <div className="label-kicker mb-2">/// 风险敞口一览</div>
            <div className="text-[11px] space-y-2">
              <Row k="货值" v={fmtMoneyLong(case_.cargoValueUsd, case_.currency)} />
              <Row k="P90 延误损失" v={fmtMoney(risk.scenarios[1].lossUsd, case_.currency)} tone="amber" />
              <Row k="P99 延误损失" v={fmtMoney(risk.scenarios[2].lossUsd, case_.currency)} tone="red" />
              <Row k="期望损失" v={fmtMoney(risk.expectedLossUsd, case_.currency)} />
              <div className="h-px bg-line my-1" />
              <Row k="建议保额" v={fmtMoney(risk.recommendedCoverageUsd, case_.currency)} tone="amber" />
              <Row k="预估保费" v={fmtMoney(risk.premiumUsd, case_.currency)} tone="green" />
            </div>
            <Link
              href={`/quote?case=${case_.id}`}
              className="mt-3 btn-amber w-full text-center py-2 text-xs tracking-widest block"
            >
              去报价 →
            </Link>
          </div>
        </aside>
      </main>

      {case_.factors && case_.factors.length > 0 && (
        <div className="px-5 pb-6">
          <FactorDecomposition case_={case_} chokepoints={chokepoints} />
        </div>
      )}
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "amber" | "red" | "green" }) {
  const cls = tone === "amber" ? "text-amber" : tone === "red" ? "text-red" : tone === "green" ? "text-green" : "text-dim";
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-faint">{k}</span>
      <span className={`${cls} tabular-nums`}>{v}</span>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-faint">initializing…</div>}>
      <MapInner />
    </Suspense>
  );
}
