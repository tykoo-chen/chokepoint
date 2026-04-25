"use client";
import BetBasisBanner from "@/app/components/BetBasisBanner";
import CoverageViz from "@/app/components/CoverageViz";
import FactorDecomposition from "@/app/components/FactorDecomposition";
import HedgeWaterfall from "@/app/components/HedgeWaterfall";
import InsureButton from "@/app/components/InsureButton";
import PlainLanguage from "@/app/components/PlainLanguage";
import ScenarioPanel from "@/app/components/ScenarioPanel";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtMoney, fmtMoneyLong, fmtPct } from "@/app/lib/risk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

function QuoteInner() {
  const t = useT();
  const { lang } = useLang();
  const params = useSearchParams();
  const caseId = params.get("case") ?? "saudi-crude-yantai";
  const case_ = caseById(caseId);
  const baseChokepoints = useMemo(() => chokepointsFor(case_), [case_.id]);
  const { chokepoints } = useLiveChokepoints(baseChokepoints);
  const risk = useMemo(() => buildRiskModel(case_, chokepoints), [case_, chokepoints]);
  const threat = Math.min(10, Math.round(risk.combinedDisruptionProb * 13));

  const title = L(case_.title, case_.titleEn, lang);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar
        screen={`${t("报价", "QUOTE")} · ${case_.id.toUpperCase()}`}
        threat={threat}
      />
      <Ticker />

      <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/" className="text-faint hover:text-amber">
            {t("录入", "INTAKE")}
          </Link>
          <span className="text-faint">/</span>
          <Link href={`/map?case=${case_.id}`} className="text-faint hover:text-amber">
            {t("地图", "MAP")}
          </Link>
          <span className="text-faint">/</span>
          <span className="text-amber">{t("报价", "QUOTE")}</span>
          <span className="text-faint">· {title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-faint tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
            {t("报价锁定 · 剩余 15:00", "QUOTE LOCKED · 15:00 remaining")}
          </div>
          <Link
            href={`/split?case=${case_.id}`}
            className="btn-amber px-4 py-1.5 text-xs tracking-widest"
          >
            {t("下一步 · 拆分 →", "NEXT · SPLIT →")}
          </Link>
        </div>
      </div>

      <div className="mx-5 mt-3">
        <BetBasisBanner case_={case_} />
      </div>

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <div className="panel-raised p-4 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[160px]">
              <div className="label-kicker">{t("航次", "VOYAGE")}</div>
              <div className="text-sm text-text mt-0.5">{title}</div>
              <div className="text-[11px] text-faint">{case_.subtitle}</div>
            </div>
            <Stat k={t("货值", "VALUE")} v={fmtMoneyLong(case_.cargoValueUsd, case_.currency)} />
            <Stat k={t("出事概率", "ODDS THINGS TRIP")} v={fmtPct(risk.combinedDisruptionProb, 1)} tone="amber" />
            <Stat
              k={t("够呛情景", "TAIL CASE")}
              v={`${risk.p90DelayDays} ${t("天", "days")}`}
              tone="amber"
            />
            <Stat
              k={t("你预期掏", "YOU EXPECT")}
              v={fmtMoney(risk.expectedLossUsd, case_.currency)}
              tone="red"
            />
          </div>

          <PlainLanguage case_={case_} risk={risk} />

          {case_.scenarios && case_.scenarios.length > 0 && (
            <ScenarioPanel case_={case_} />
          )}

          {case_.factors && case_.factors.length > 0 && (
            <FactorDecomposition case_={case_} chokepoints={chokepoints} />
          )}

          <CoverageViz case_={case_} risk={risk} />

          <div className="panel-raised">
            <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
              <div className="label-kicker">
                /// {t("赔付触发器 · 由预言机自动确认", "PAYOUT TRIGGERS · oracle-confirmed")}
              </div>
              <div className="text-[10px] text-faint">
                {t("两源独立交叉确认", "Two-source cross-verified")}
              </div>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {risk.triggers.map((tg) => (
                <div
                  key={tg.code}
                  className="grid grid-cols-12 items-center px-4 py-2.5 gap-3 text-[11px]"
                >
                  <div className="col-span-3 text-amber tracking-widest">{tg.code}</div>
                  <div className="col-span-5 text-dim">{tg.description}</div>
                  <div className="col-span-2 text-[10px] text-faint">{tg.source}</div>
                  <div className="col-span-2 text-right text-amber tabular-nums">
                    {t("赔 ", "Pay ")}
                    {fmtMoney(tg.payoutUsd, case_.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <InsureButton risk={risk} caseId={case_.id} currency={case_.currency} />
          <HedgeWaterfall risk={risk} currency={case_.currency} case_={case_} />
          <div className="panel-raised p-4 text-[11px] text-dim leading-relaxed">
            <div className="label-kicker mb-2">
              /// {t("为什么需要这张保单", "WHY THIS POLICY")}
            </div>
            <p>
              {t("传统货运险只管「", "Traditional cargo cover only handles ")}
              <span className="text-faint">
                {t("货物物理损坏", "physical damage to cargo")}
              </span>
              {t("」。大多数情况下, ", ". Most of the time ")}
              <span className="text-amber">{t("时间损失", "time loss")}</span>
              {t(
                "是不赔的 — 而时间损失才是你实际的生意损失。",
                " is not covered — and time loss IS the actual business loss.",
              )}
            </p>
            <p className="mt-2">
              {t("这张保单按", "This policy pays on ")}
              <span className="text-amber">{t("时间戳", "timestamps")}</span>
              {t(
                "赔, 不按定损单赔。触发器一响, 72 小时内到账, 不用和理赔员扯皮, 不用等卸货查勘。",
                ", not adjuster reports. When a trigger fires, money lands within 72 hours — no haggling, no port surveys.",
              )}
            </p>
          </div>
        </aside>
      </main>

      <footer className="px-5 py-3 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
        <div>JUSTINCASE · 万一 · {t("演示版本 · 非实际保单", "DEMO build · not a bound policy")}</div>
        <div>{t("数字为模拟 · 仅用于黑客松展示", "Numbers simulated · hackathon showcase only")}</div>
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
