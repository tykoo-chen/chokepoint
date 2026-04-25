"use client";
import { Case, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney, fmtMoneyLong } from "@/app/lib/risk";

/**
 * The 4 essentials AI extracts from a B/L → these are the literal inputs
 * for every parametric bet placed downstream. We show them prominently on
 * Map / Quote / Split so users always remember what the policy is anchored to.
 */
export default function BetBasisBanner({ case_ }: { case_: Case }) {
  const t = useT();
  const { lang } = useLang();
  const cargo = L(case_.cargo, case_.cargoEn, lang);
  const cargoShort = cargo.split("·")[0].replace(/\(.*\)/, "").trim();

  const penaltyTone =
    case_.penaltySource === "contract"
      ? "text-green"
      : case_.penaltySource === "estimate"
      ? "text-amber-dim"
      : "text-dim";
  const penaltyBadge =
    case_.penaltySource === "contract"
      ? t("合同条款", "CONTRACT")
      : case_.penaltySource === "estimate"
      ? t("估算", "ESTIMATE")
      : "";

  return (
    <div className="panel-raised border-amber-dim/60 px-4 py-3">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="label-kicker text-amber">
          /// {t("AI 提取的 4 个参数 · 这是你下注的基础", "AI-EXTRACTED · 4 INPUTS THE POLICY IS ANCHORED TO")}
        </div>
        <div className="text-[9px] text-faint tracking-widest">
          {t(
            "上传的提单 / 合同 / L/C 解析为以下 4 项, 之后的对冲、保费、赔付都来自它们",
            "Uploaded B/L · contract · L/C → these 4 fields. Every hedge, premium, and payout downstream depends on them.",
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
        {/* ① Route */}
        <div className="panel p-2.5 bg-panel-2/60">
          <div className="text-[9px] text-faint tracking-widest mb-1">
            ① {t("路线 (起 → 终)", "ROUTE (ORIG → DEST)")}
          </div>
          <div className="text-text leading-snug">
            <span className="text-green">●</span> {case_.origin.name}
          </div>
          <div className="text-faint text-[9px] my-0.5 pl-2">↓</div>
          <div className="text-text leading-snug">
            <span className="text-amber">●</span> {case_.destination.name}
          </div>
          <div className="mt-1 text-[10px] text-faint tabular-nums">
            {t("航程 ", "Transit ")}
            {case_.baselineTransitDays} {t("天", "d")}
          </div>
        </div>

        {/* ② Cargo */}
        <div className="panel p-2.5 bg-panel-2/60">
          <div className="text-[9px] text-faint tracking-widest mb-1">
            ② {t("货品", "CARGO")}
          </div>
          <div className="text-text leading-snug">{cargoShort}</div>
          <div className="text-[10px] text-faint mt-1 leading-snug">{case_.quantity}</div>
          <div className="text-[10px] text-faint">HS {case_.hsCode}</div>
        </div>

        {/* ③ Cargo value */}
        <div className="panel p-2.5 bg-panel-2/60">
          <div className="text-[9px] text-faint tracking-widest mb-1">
            ③ {t("货值", "CARGO VALUE")}
          </div>
          <div className="text-amber tabular-nums text-lg font-semibold leading-tight">
            {fmtMoneyLong(case_.cargoValueUsd, case_.currency)}
          </div>
          <div className="text-[10px] text-faint mt-1">
            {case_.incoterms}
          </div>
        </div>

        {/* ④ Penalty per day */}
        <div className="panel p-2.5 bg-panel-2/60 border-l-2 border-amber-dim">
          <div className="flex items-baseline justify-between mb-1">
            <div className="text-[9px] text-amber-dim tracking-widest">
              ④ {t("晚 1 天 → 赔多少", "PENALTY / DAY LATE")}
            </div>
            {penaltyBadge && (
              <span className={`text-[8px] px-1 py-px border tracking-widest ${case_.penaltySource === "contract" ? "border-green-dim text-green" : "border-amber-dim text-amber-dim"}`}>
                {penaltyBadge}
              </span>
            )}
          </div>
          <div className={`tabular-nums text-lg font-semibold leading-tight ${penaltyTone === "text-amber-dim" ? "text-amber-bright" : penaltyTone}`}>
            {fmtMoney(case_.contractPenaltyPerDayUsd, case_.currency)}
          </div>
          <div className="text-[10px] text-faint mt-1 leading-snug">
            {t("买方违约金条款", "Buyer's LD clause")}
            {" · "}
            {t("缓冲 ", "buffer ")}
            {case_.bufferDays}
            {t(" 天", "d")}
          </div>
        </div>
      </div>

      <div className="mt-2.5 text-[10px] text-faint leading-relaxed">
        <span className="text-amber-dim tracking-widest">{t("说明 · ", "NOTE · ")}</span>
        {t(
          "我们能下任何对冲, 都是基于上面这 4 个数。它们决定了 (a) 在哪些海峡建仓 (b) 保费多少 (c) 触发器在多少天打开 (d) 一次最多赔多少。",
          "Every hedge we place is anchored on these 4 numbers. They determine (a) which chokepoints we cover, (b) the premium, (c) the day count that opens triggers, and (d) the cap per claim.",
        )}
      </div>
    </div>
  );
}
