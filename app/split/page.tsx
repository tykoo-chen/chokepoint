"use client";
import MarketLeg from "@/app/components/MarketLeg";
import Ticker from "@/app/components/Ticker";
import TopBar from "@/app/components/TopBar";
import { caseById, chokepointsFor } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { useLiveChokepoints } from "@/app/lib/markets";
import { buildRiskModel, fmtUsd } from "@/app/lib/risk";
import {
  buildSplit,
  fmtCny,
  scenariosFor,
  sumNotional,
  sumPayout,
  usdToCny,
} from "@/app/lib/split";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function SplitInner() {
  const t = useT();
  const { lang } = useLang();
  const params = useSearchParams();
  const caseId = params.get("case") ?? "hormuz2026";
  const case_ = caseById(caseId);
  const baseChokepoints = useMemo(() => chokepointsFor(case_), [case_.id]);
  const { chokepoints } = useLiveChokepoints(baseChokepoints);
  const risk = useMemo(() => buildRiskModel(case_, chokepoints), [case_, chokepoints]);
  const legs = useMemo(() => buildSplit(case_, chokepoints, risk), [case_, chokepoints, risk]);
  const scenarios = useMemo(() => scenariosFor(case_, chokepoints, legs), [case_, chokepoints, legs]);

  const [fillIndex, setFillIndex] = useState(-1);
  const [scenarioIdx, setScenarioIdx] = useState(0);

  useEffect(() => {
    setFillIndex(-1);
    let i = 0;
    const tt = setInterval(() => {
      if (i >= legs.length) {
        clearInterval(tt);
        return;
      }
      setFillIndex(i);
      i += 1;
    }, 380);
    return () => clearInterval(tt);
  }, [legs.length]);

  const totalNotional = sumNotional(legs);
  const totalPayout = sumPayout(legs);
  const allFilled = fillIndex >= legs.length - 1;

  const scenario = scenarios[scenarioIdx];
  const hitLegs = scenario.hitLegIds;
  const scenarioPayout = legs
    .filter((l) => hitLegs.includes(l.id))
    .reduce((s, l) => s + l.payoutIfHitUsd, 0);
  const scenarioPnl = scenarioPayout - totalNotional;

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar
        screen={`${t("拆单", "SPLIT")} · EXECUTION`}
        threat={Math.round(risk.combinedDisruptionProb * 13)}
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
          <Link href={`/quote?case=${case_.id}`} className="text-faint hover:text-amber">
            {t("报价", "QUOTE")}
          </Link>
          <span className="text-faint">/</span>
          <span className="text-amber">{t("拆单执行", "EXECUTION")}</span>
        </div>
        <div className="text-[10px] text-faint tracking-widest flex items-center gap-2">
          {!allFilled ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber pulse-dot" />
              {t(`正在并行下单 · ${fillIndex + 1} / ${legs.length}`, `Placing orders in parallel · ${fillIndex + 1} / ${legs.length}`)}
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              {t("全部建仓完成 · 保单已生效", "All positions filled · policy active")}
            </>
          )}
        </div>
      </div>

      {/* Big "what just happened" intro */}
      <div className="mx-5 mt-3 panel-raised border-amber-dim p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-amber pulse-dot" />
          <div className="label-kicker text-amber">
            /// {t("刚刚发生了什么", "WHAT JUST HAPPENED")}
          </div>
        </div>
        <p className="text-[12px] text-dim leading-relaxed">
          {t(
            "你点了「一键投保」。后台 (没有人工)马上做了三件事:",
            "You hit One-Click Insure. The system did three things in the background, with no human in the loop:",
          )}
        </p>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
          <div className="panel p-2.5">
            <div className="text-amber tracking-widest text-[9px]">①  PRICE</div>
            <div className="text-dim mt-1">
              {t(
                "锁定保费金额, 写一份合规保单 (受 Lloyd's 辛迪加 4812 承保)。",
                "Premium locked, a regulatory-compliant policy was issued (underwritten by Lloyd's Syndicate 4812).",
              )}
            </div>
          </div>
          <div className="panel p-2.5">
            <div className="text-amber tracking-widest text-[9px]">②  SPLIT</div>
            <div className="text-dim mt-1">
              {t(
                `把保费拆成 ${legs.length} 笔独立头寸, 并行下到预测市场 / 运价衍生品 / 再保险 / 自留资金。`,
                `Premium split into ${legs.length} parallel positions across prediction markets, freight derivatives, reinsurance, and retained capital.`,
              )}
            </div>
          </div>
          <div className="panel p-2.5">
            <div className="text-amber tracking-widest text-[9px]">③  WATCH</div>
            <div className="text-dim mt-1">
              {t(
                "AIS 船位 + 港到港数据持续监控。任一触发器命中, 自动结算赔付到你账上, 72h 内。",
                "AIS + port-arrival data start monitoring. Any trigger fire → automatic payout to your account within 72 h.",
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-3 panel-raised p-4 flex flex-wrap gap-6 items-center">
        <div>
          <div className="label-kicker">/// {t("你的保费", "YOUR PREMIUM")}</div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl text-amber tabular-nums">{fmtUsd(totalNotional)}</span>
            <span className="text-dim tabular-nums">≈ {fmtCny(usdToCny(totalNotional))}</span>
          </div>
        </div>
        <div className="h-10 w-px bg-line hidden md:block" />
        <div>
          <div className="label-kicker">/// {t("最大赔付能力", "MAX PAYOUT")}</div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl text-green tabular-nums">{fmtUsd(totalPayout)}</span>
            <span className="text-faint tabular-nums">≈ {fmtCny(usdToCny(totalPayout))}</span>
          </div>
        </div>
        <div className="h-10 w-px bg-line hidden md:block" />
        <div>
          <div className="label-kicker">/// {t("杠杆", "LEVERAGE")}</div>
          <div className="text-2xl text-amber tabular-nums mt-1">
            {(totalPayout / totalNotional).toFixed(1)}x
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="label-kicker mb-2">/// {t("简单说", "IN SHORT")}</div>
          <p className="text-[11px] text-dim leading-relaxed">
            {t(
              `${legs.length} 笔头寸彼此独立。任意一笔触发都有对应赔付来源 — 没有"一刀切, 不赔"的灰色地带。`,
              `${legs.length} positions, each independent. Any single one firing has a matched payout source — no "blanket exclusion" gray zones.`,
            )}
          </p>
        </div>
      </div>

      <div className="mx-5 mt-3 panel p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="label-kicker">/// {t("资金流向", "MONEY FLOW")}</div>
          <div className="text-[10px] text-faint">{t("按比例显示", "by proportion")}</div>
        </div>
        <div className="flex h-6 w-full overflow-hidden border border-line">
          {legs.map((l, i) => (
            <div
              key={l.id}
              className="border-r border-bg/60 flex items-center justify-center text-[9px] text-bg font-semibold tabular-nums overflow-hidden"
              style={{
                width: `${(l.notionalUsd / totalNotional) * 100}%`,
                background: i <= fillIndex ? l.colorHex : "#1a2430",
                opacity: i <= fillIndex ? 0.9 : 0.35,
                transition: "background 300ms, opacity 300ms",
              }}
              title={`${l.venue} · ${fmtUsd(l.notionalUsd)}`}
            >
              {(l.notionalUsd / totalNotional) * 100 > 6
                ? `${Math.round((l.notionalUsd / totalNotional) * 100)}%`
                : ""}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-faint">
          <LegendDot label="Polymarket / Kalshi" color="#4fc3f7" />
          <LegendDot
            label={t("Baltic Exchange / ICE (运价/商品)", "Baltic Exchange / ICE (freight/commodity)")}
            color="#ffb347"
          />
          <LegendDot label={t("Swiss Re 再保险", "Swiss Re reinsurance")} color="#ff9a3c" />
          <LegendDot
            label={t("自留 + 数据费", "Retained capital + data fees")}
            color="#7b8896"
          />
        </div>
      </div>

      <main className="flex-1 grid grid-cols-12 gap-4 px-5 py-4">
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-3">
            <div className="label-kicker">
              /// {t(
                `所有头寸 · ${legs.length} 笔并行`,
                `ALL POSITIONS · ${legs.length} parallel orders`,
              )}
            </div>
            <div className="text-[10px] text-faint">
              {t("按金额从大到小", "Sorted by allocation, descending")}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...legs]
              .sort((a, b) => b.notionalUsd - a.notionalUsd)
              .map((leg) => {
                const originalIdx = legs.findIndex((l) => l.id === leg.id);
                const status =
                  originalIdx < fillIndex
                    ? "filled"
                    : originalIdx === fillIndex
                    ? "placing"
                    : "pending";
                return (
                  <MarketLeg
                    key={leg.id}
                    leg={leg}
                    status={status}
                    highlight={hitLegs.includes(leg.id)}
                  />
                );
              })}
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="panel-raised p-4">
            <div className="label-kicker mb-2">
              /// {t("情景模拟 · 会赔多少?", "SCENARIO SIM · how much does it pay?")}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {scenarios.map((s, i) => {
                const tt = lang === "en" ? s.titleEn : s.titleZh;
                return (
                  <button
                    key={s.id}
                    onClick={() => setScenarioIdx(i)}
                    className={`text-[10px] px-2 py-1 border tracking-wider ${
                      i === scenarioIdx
                        ? "border-amber bg-amber/10 text-amber"
                        : "border-line text-faint hover:border-amber-dim hover:text-amber"
                    }`}
                  >
                    {tt.split(" · ")[0]}
                  </button>
                );
              })}
            </div>
            <div className="text-sm text-text leading-snug">
              {lang === "en" ? scenario.titleEn : scenario.titleZh}
            </div>
            <div className="text-[11px] text-dim mt-1 leading-relaxed">
              {lang === "en" ? scenario.narrativeEn : scenario.narrativeZh}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div className="panel p-2">
                <div className="text-faint">{t("保费投入", "Premium paid")}</div>
                <div className="text-dim tabular-nums">-{fmtUsd(totalNotional)}</div>
              </div>
              <div className="panel p-2">
                <div className="text-faint">{t("本情景赔付", "Scenario payout")}</div>
                <div className="text-green tabular-nums">+{fmtUsd(scenarioPayout)}</div>
              </div>
              <div className="panel p-2 border-amber-dim">
                <div className="text-faint">{t("净收益", "Net P&L")}</div>
                <div className={`tabular-nums ${scenarioPnl >= 0 ? "text-green" : "text-red"}`}>
                  {scenarioPnl >= 0 ? "+" : ""}
                  {fmtUsd(scenarioPnl)}
                </div>
              </div>
            </div>

            <div className="mt-3 text-[10px] text-faint tracking-widest">
              {t("被触发的头寸", "TRIGGERED POSITIONS")}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {hitLegs.length === 0 ? (
                <span className="text-[10px] text-faint">
                  · {t("无头寸触发", "no positions triggered")}
                </span>
              ) : (
                legs
                  .filter((l) => hitLegs.includes(l.id))
                  .map((l) => (
                    <span
                      key={l.id}
                      className="text-[9px] px-1.5 py-0.5 border border-amber-dim text-amber tracking-wider"
                    >
                      {l.instrument.split(" · ")[0]}
                    </span>
                  ))
              )}
            </div>
          </div>

          <div className="panel-raised p-4">
            <div className="label-kicker mb-2">/// {t("为什么这样拆", "WHY THIS SPLIT")}</div>
            <div className="text-[11px] text-dim leading-relaxed space-y-2">
              <p>
                <span className="text-amber">
                  {t("不要把所有钱押在一个市场。", "Don't bet the whole premium on one market.")}
                </span>{" "}
                {t(
                  "海峡、天气、运价、商品价格彼此独立, 一类风险发生时另一类可能价格反向走, 对冲效果才稳。",
                  "Chokepoint / weather / freight / commodity risks are independent — when one fires, another may move the other way, which is what makes a portfolio hedge stable.",
                )}
              </p>
              <p>
                <span className="text-amber">
                  {t("预测市场 ≠ 全部底层。", "Prediction markets ≠ the entire foundation.")}
                </span>{" "}
                {t("它是快速、透明、可验证的", "They're fast, transparent, verifiable ")}
                <span className="text-amber-dim">{t("价格信号", "price signals")}</span>{" "}
                {t("和", "and ")}
                <span className="text-amber-dim">{t("部分对冲工具", "partial hedge instruments")}</span>
                {t(", 大额尾部依然由再保险承接。", " — the large-loss tail is still absorbed by reinsurance.")}
              </p>
              <p>
                <span className="text-amber">{t("费用透明。", "Transparent fees.")}</span>{" "}
                {t(
                  "平台费固定 6%, 不从赔付中抽成 · 你赔得越多我们不赚更多。",
                  "Platform fee is a fixed 6%, never taken from payouts. We don't earn more when you collect more.",
                )}
              </p>
            </div>
          </div>

          <div className="panel p-4 text-[10px] text-faint leading-relaxed">
            <div className="label-kicker mb-1">{t("/// 真实市场数据", "/// REAL MARKET DATA")}</div>
            <p>
              {t(
                "示例中 Polymarket、Kalshi 价格取自 2026 年 4 月 23 日公开报价 (详见地图页「真实背景」链接)。FFA 价格来自 Baltic Exchange TD3C 当日收盘指示价。",
                "Polymarket / Kalshi prices in this example are taken from public quotes on April 23, 2026 (see the Map page's 'Live context' for source links). FFA price is the Baltic Exchange TD3C closing indication for the same day.",
              )}
            </p>
          </div>
        </aside>
      </main>

      <footer className="px-5 py-3 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
        <div>CHOKEPOINT · {t("拆单执行层 · DEMO", "EXECUTION LAYER · DEMO")}</div>
        <div>
          {t(
            "所有下单为模拟 · 不构成投资建议",
            "All orders simulated · not investment advice",
          )}
        </div>
      </footer>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

export default function SplitPage() {
  return (
    <Suspense fallback={<div className="p-8 text-faint">initializing…</div>}>
      <SplitInner />
    </Suspense>
  );
}
