"use client";
import CoverageViz from "@/app/components/CoverageViz";
import FactorDecomposition from "@/app/components/FactorDecomposition";
import HedgeWaterfall from "@/app/components/HedgeWaterfall";
import InsureButton from "@/app/components/InsureButton";
import PlainLanguage from "@/app/components/PlainLanguage";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor } from "@/app/lib/cases";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtMoney, fmtMoneyLong, fmtPct } from "@/app/lib/risk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

function QuoteInner() {
  const params = useSearchParams();
  const caseId = params.get("case") ?? "hormuz2026";
  const case_ = caseById(caseId);
  const baseChokepoints = useMemo(() => chokepointsFor(case_), [case_.id]);
  const { chokepoints } = useLiveChokepoints(baseChokepoints);
  const risk = useMemo(() => buildRiskModel(case_, chokepoints), [case_, chokepoints]);
  const threat = Math.min(10, Math.round(risk.combinedDisruptionProb * 13));

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar screen={`报价 · ${case_.id.toUpperCase()}`} threat={threat} />
      <Ticker />

      <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/" className="text-faint hover:text-amber">录入</Link>
          <span className="text-faint">/</span>
          <Link href={`/map?case=${case_.id}`} className="text-faint hover:text-amber">地图</Link>
          <span className="text-faint">/</span>
          <span className="text-amber">报价</span>
          <span className="text-faint">· {case_.title}</span>
        </div>
        <div className="text-[10px] text-faint tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
          报价锁定 · 剩余 15:00
        </div>
      </div>

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="panel-raised p-4 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[160px]">
              <div className="label-kicker">航次</div>
              <div className="text-sm text-text mt-0.5">{case_.title}</div>
              <div className="text-[11px] text-faint">{case_.subtitle}</div>
            </div>
            <Stat k="货值" v={fmtMoneyLong(case_.cargoValueUsd, case_.currency)} />
            <Stat k="扰动率" v={fmtPct(risk.combinedDisruptionProb, 1)} tone="amber" />
            <Stat k="P90 延误" v={`${risk.p90DelayDays} 天`} tone="amber" />
            <Stat k="期望损失" v={fmtMoney(risk.expectedLossUsd, case_.currency)} tone="red" />
          </div>

          <PlainLanguage case_={case_} risk={risk} />

          {case_.factors && case_.factors.length > 0 && (
            <FactorDecomposition case_={case_} chokepoints={chokepoints} />
          )}

          <CoverageViz case_={case_} risk={risk} />

          <div className="panel-raised">
            <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
              <div className="label-kicker">/// 赔付触发器 · 由预言机自动确认</div>
              <div className="text-[10px] text-faint">两源独立交叉确认</div>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {risk.triggers.map((t) => (
                <div key={t.code} className="grid grid-cols-12 items-center px-4 py-2.5 gap-3 text-[11px]">
                  <div className="col-span-3 text-amber tracking-widest">{t.code}</div>
                  <div className="col-span-5 text-dim">{t.description}</div>
                  <div className="col-span-2 text-[10px] text-faint">{t.source}</div>
                  <div className="col-span-2 text-right text-amber tabular-nums">
                    赔 {fmtMoney(t.payoutUsd, case_.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <InsureButton risk={risk} caseId={case_.id} currency={case_.currency} />
          <HedgeWaterfall risk={risk} currency={case_.currency} />
          <div className="panel-raised p-4 text-[11px] text-dim leading-relaxed">
            <div className="label-kicker mb-2">/// 为什么需要这张保单</div>
            <p>
              传统货运险只管"<span className="text-faint">货物物理损坏</span>"。
              大多数情况下, <span className="text-amber">时间损失</span>是不赔的 ——
              而时间损失才是你实际的生意损失。
            </p>
            <p className="mt-2">
              这张保单按<span className="text-amber">时间戳</span>赔, 不按定损单赔。
              触发器一响, 72 小时内到账, 不用和理赔员扯皮, 不用等卸货查勘。
            </p>
          </div>
        </aside>
      </main>

      <footer className="px-5 py-3 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
        <div>CHOKEPOINT · 演示版本 · 非实际保单</div>
        <div>数字为模拟 · 仅用于黑客松展示</div>
      </footer>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "amber" | "red" }) {
  const cls = tone === "amber" ? "text-amber" : tone === "red" ? "text-red" : "text-dim";
  return (
    <div>
      <div className="text-[10px] text-faint tracking-widest">{k}</div>
      <div className={`text-lg ${cls} tabular-nums`}>{v}</div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="p-8 text-faint">initializing…</div>}>
      <QuoteInner />
    </Suspense>
  );
}
