"use client";
import BetBasisBanner from "@/app/components/BetBasisBanner";
import InsureButton from "@/app/components/InsureButton";
import LiveMarketsAccordion from "@/app/components/LiveMarketsAccordion";
import PlainLanguage from "@/app/components/PlainLanguage";
import ScenarioPanel from "@/app/components/ScenarioPanel";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtMoney, fmtMoneyLong } from "@/app/lib/risk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

/**
 * Customer layer (decision-grade).
 *
 * The buyer of the policy lands here. They see only what they need to act:
 * who's holding the policy, the bet basis (4 inputs), the 4 named scenarios,
 * the premium, the max payout, and a 'lock' button. Nothing else.
 *
 * The technical decomposition (factor cards · market prices · hedge waterfall ·
 * coverage waterfall · trigger ladder) lives at /map (the X-Ray view), reachable
 * via the explicit "see how AI got these numbers →" link.
 */
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
  const ccy = case_.currency;

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar
        screen={`${t("保单", "POLICY")} · ${case_.id.toUpperCase()}`}
        threat={threat}
      />
      <Ticker />

      <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/" className="text-faint hover:text-amber">
            {t("录入", "INTAKE")}
          </Link>
          <span className="text-faint">/</span>
          <span className="text-amber">{t("保单 · 客户视图", "POLICY · CUSTOMER VIEW")}</span>
          <span className="text-faint">· {title}</span>
        </div>
        <div className="text-[10px] text-faint tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green pulse-dot" />
          {t("报价锁定 · 剩余 15:00", "QUOTE LOCKED · 15:00 remaining")}
        </div>
      </div>

      <div className="mx-5 mt-3">
        <BetBasisBanner case_={case_} />
      </div>

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Decision-row: only what matters for buy/skip */}
          <div className="panel-raised p-4 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[180px]">
              <div className="label-kicker">{t("航次", "VOYAGE")}</div>
              <div className="text-sm text-text mt-0.5">{title}</div>
              <div className="text-[11px] text-faint">{case_.subtitle}</div>
            </div>
            <Stat
              k={t("货值", "VALUE")}
              v={fmtMoneyLong(case_.cargoValueUsd, ccy)}
            />
            <Stat
              k={t("这一票保费", "PREMIUM")}
              v={fmtMoney(risk.premiumUsd, ccy)}
              tone="amber"
            />
            <Stat
              k={t("最多赔回", "MAX PAYOUT")}
              v={fmtMoney(risk.recommendedCoverageUsd, ccy)}
              tone="green"
            />
          </div>

          <PlainLanguage case_={case_} risk={risk} />

          {case_.scenarios && case_.scenarios.length > 0 && (
            <ScenarioPanel case_={case_} />
          )}

          {/* Live markets — full-width, default-expanded, shows the entire
              global Polymarket book (chokepoints + factors). Fills the empty
              middle/left space and reinforces "we're priced live, not by
              actuarial tables". */}
          <LiveMarketsAccordion defaultOpen />

          {/* Crosslink — fold the X-Ray underneath */}
          <Link
            href={`/map?case=${case_.id}`}
            className="group panel-raised p-4 flex items-center justify-between border-amber-dim hover:border-amber transition-colors"
          >
            <div>
              <div className="label-kicker text-amber-dim group-hover:text-amber">
                /// {t("好奇 AI 是怎么算出这些数的?", "CURIOUS HOW AI GOT THESE NUMBERS?")}
              </div>
              <div className="text-[12px] text-dim mt-1 leading-relaxed">
                {t(
                  "进 X-Ray 视图: 实时 Polymarket 因子 + 路线风险点 + 保费拆单去向。给评委 / 风控 / 投资人看的版本。",
                  "Open X-Ray view: live Polymarket factor cards · chokepoint risks · premium-allocation breakdown. The version for reviewers / risk / investors.",
                )}
              </div>
            </div>
            <span className="text-amber group-hover:text-amber-bright text-[13px] tracking-widest">
              {t("打开 X-RAY →", "OPEN X-RAY →")}
            </span>
          </Link>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <InsureButton risk={risk} caseId={case_.id} currency={case_.currency} />
        </aside>
      </main>

      <footer className="px-5 py-3 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
        <div>JUSTINCASE · 万一 · {t("演示版本 · 非实际保单", "DEMO build · not a bound policy")}</div>
        <div>{t("数字为模拟 · 仅用于黑客松展示", "Numbers simulated · hackathon showcase only")}</div>
      </footer>
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "amber" | "red" | "green" }) {
  const cls =
    tone === "amber"
      ? "text-amber"
      : tone === "red"
        ? "text-red"
        : tone === "green"
          ? "text-green"
          : "text-dim";
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
