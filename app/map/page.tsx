"use client";
import BetBasisBanner from "@/app/components/BetBasisBanner";
import ChokepointPanel from "@/app/components/ChokepointPanel";
import CoverageViz from "@/app/components/CoverageViz";
import FactorDecomposition from "@/app/components/FactorDecomposition";
import Globe from "@/app/components/Globe";
import HedgeWaterfall from "@/app/components/HedgeWaterfall";
import ShipmentPanel from "@/app/components/ShipmentPanel";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtMoney, fmtMoneyLong, fmtPct } from "@/app/lib/risk";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

function MapInner() {
  const t = useT();
  const { lang } = useLang();
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

  const title = L(case_.title, case_.titleEn, lang);
  const painPoint = L(case_.painPointZh, case_.painPointEn, lang);
  const realCtx = L(case_.realContext, case_.realContextEn, lang);
  const altRouteLabel = L(case_.altRouteLabel, case_.altRouteLabelEn, lang);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar
        screen={`${t("X-RAY", "X-RAY")} · ${case_.id.toUpperCase()}`}
        threat={threat}
      />
      <Ticker />

      <div className="px-5 pt-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <Link href="/" className="text-faint hover:text-amber">
            ← {t("录入", "INTAKE")}
          </Link>
          <span className="text-faint">/</span>
          <span className="text-amber">
            {t("X-RAY 拆解视图", "X-RAY · BREAKDOWN VIEW")}
          </span>
          <span className="text-faint">· {title}</span>
        </div>
        <Link
          href={`/quote?case=${case_.id}`}
          className="btn-amber px-4 py-1.5 text-xs tracking-widest"
        >
          ← {t("回到保单", "BACK TO POLICY")}
        </Link>
      </div>

      {(realCtx || painPoint) && (
        <div className="mx-5 mt-3 space-y-2">
          {painPoint && (
            <div className="panel border-amber bg-amber/5 px-4 py-3 text-[11px] leading-relaxed flex gap-3">
              <div className="flex-shrink-0 text-amber tracking-widest text-[10px] pt-0.5">
                ⚠ {t("客户的真实痛点", "REAL CUSTOMER PAIN")}
              </div>
              <div className="text-text flex-1">{painPoint}</div>
            </div>
          )}
          {realCtx && (
            <div className="panel border-amber-dim bg-panel-2/60 px-4 py-3 text-[11px] leading-relaxed flex gap-3">
              <div className="flex-shrink-0 text-amber-dim tracking-widest text-[10px] pt-0.5">
                🛰 {t("真实背景", "LIVE CONTEXT")}
              </div>
              <div className="text-dim flex-1">
                {realCtx}
                {case_.sources && (
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-faint">
                    {case_.sources.map((s) => (
                      <a
                        key={s.url}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-amber underline"
                      >
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

      <div className="mx-5 mt-3">
        <BetBasisBanner case_={case_} />
      </div>

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
          <ShipmentPanel case_={case_} />
          <div className="panel-raised p-4">
            <div className="label-kicker mb-2">/// {t("AI 路线解读", "AI ROUTE NOTES")}</div>
            <p className="text-[11px] text-dim leading-relaxed">
              {t(
                `本航线途经 ${chokepoints.length} 个受监控的海峡/通道。综合扰动概率为 `,
                `This voyage transits ${chokepoints.length} monitored chokepoints. Combined disruption probability `,
              )}
              <span className="text-amber">{fmtPct(risk.combinedDisruptionProb, 1)}</span>
              {t(
                `, P90 延误估计 `,
                `, P90 delay estimate `,
              )}
              <span className="text-amber">
                {risk.p90DelayDays} {t("天", "days")}
              </span>
              {t(
                `, 已超过买方 ${case_.bufferDays} 天库存缓冲, 会在第 ${case_.bufferDays + 1} 天起触发违约金。`,
                ` — exceeds the buyer's ${case_.bufferDays}-day buffer, triggering LD penalties from day ${case_.bufferDays + 1}.`,
              )}
            </p>
            {altRouteLabel && (
              <p className="text-[11px] text-faint mt-2 leading-relaxed">
                {t("备选航线: ", "Alt route: ")}
                <span className="text-green-dim">{altRouteLabel}</span>
                {t("。可作为期权式对冲提前锁定。", " — can be locked as an option-style hedge.")}
              </p>
            )}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-6 panel-raised overflow-hidden relative">
          <div className="flex items-center justify-between px-4 py-2 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="label-kicker">
                /// {t("航线 · 风险点叠加", "ROUTE · CHOKEPOINTS OVERLAY")}
              </div>
            </div>
            <div className="text-[10px] text-faint tracking-widest flex items-center gap-3">
              <span>{t("投影 · 正交", "PROJ · ORTHO")}</span>
              <span className="w-1 h-1 bg-line" />
              <span>{t("倾角 · 0°", "TILT · 0°")}</span>
              <span className="w-1 h-1 bg-line" />
              <span className="text-amber">{t("刷新 · 1.4s", "REFRESH · 1.4s")}</span>
            </div>
          </div>
          <Globe
            case_={case_}
            chokepoints={chokepoints}
            factors={case_.factors}
            focus={focus}
            height={620}
          />
          <div className="absolute top-12 right-4 panel p-3 min-w-[180px]">
            <div className="label-kicker mb-1">{t("综合扰动概率", "COMBINED DISRUPTION")}</div>
            <div className="text-2xl text-amber tabular-nums">
              {fmtPct(risk.combinedDisruptionProb, 1)}
            </div>
            <div className="text-[10px] text-faint mt-1">
              {t("60 天窗口 · 任一扰动", "60-day window · any disruption")}
            </div>
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
            <div className="label-kicker mb-2">/// {t("风险敞口一览", "RISK EXPOSURE")}</div>
            <div className="text-[11px] space-y-2">
              <Row
                k={t("货值", "Cargo value")}
                v={fmtMoneyLong(case_.cargoValueUsd, case_.currency)}
              />
              <Row
                k={t("P90 延误损失", "P90 delay loss")}
                v={fmtMoney(risk.scenarios[1].lossUsd, case_.currency)}
                tone="amber"
              />
              <Row
                k={t("P99 延误损失", "P99 delay loss")}
                v={fmtMoney(risk.scenarios[2].lossUsd, case_.currency)}
                tone="red"
              />
              <Row
                k={t("期望损失", "Expected loss")}
                v={fmtMoney(risk.expectedLossUsd, case_.currency)}
              />
              <div className="h-px bg-line my-1" />
              <Row
                k={t("建议保额", "Suggested limit")}
                v={fmtMoney(risk.recommendedCoverageUsd, case_.currency)}
                tone="amber"
              />
              <Row
                k={t("预估保费", "Estimated premium")}
                v={fmtMoney(risk.premiumUsd, case_.currency)}
                tone="green"
              />
            </div>
            <Link
              href={`/quote?case=${case_.id}`}
              className="mt-3 btn-amber w-full text-center py-2 text-xs tracking-widest block"
            >
              ← {t("回到保单", "BACK TO POLICY")}
            </Link>
          </div>
        </aside>
      </main>

      {case_.factors && case_.factors.length > 0 && (
        <div className="px-5 pb-4">
          <FactorDecomposition case_={case_} chokepoints={chokepoints} />
        </div>
      )}

      {/* Coverage waterfall — what the policy bails out at each loss tier */}
      <div className="px-5 pb-4">
        <CoverageViz case_={case_} risk={risk} />
      </div>

      {/* Hedge waterfall — where the premium goes (PM / reinsurance / derivatives) */}
      <div className="px-5 pb-4">
        <HedgeWaterfall risk={risk} currency={case_.currency} case_={case_} />
      </div>

      {/* Trigger ladder — the parametric mechanics */}
      <div className="px-5 pb-6">
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
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "amber" | "red" | "green" }) {
  const cls =
    tone === "amber" ? "text-amber" : tone === "red" ? "text-red" : tone === "green" ? "text-green" : "text-dim";
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
