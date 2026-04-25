"use client";
import { Case, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney, fmtMoneyLong } from "@/app/lib/risk";

/**
 * The inputs every parametric bet downstream is anchored on. Surfaced from
 * the connected enterprise Agent: contract LD comes from the buyer's CLM,
 * the real $/d loss comes from their internal ops finance model.
 *
 * Header strip names the policy holder (the party with delay exposure —
 * buyer for CFR/CIF, seller for DAP/DDP). The 4-grid below is the literal
 * bet basis: route · cargo · value · two-number loss/d (contract LD vs
 * internal real $/d). The internal number is what the policy is sized
 * against, NOT the contract LD.
 */
export default function BetBasisBanner({ case_ }: { case_: Case }) {
  const t = useT();
  const { lang } = useLang();
  const cargo = L(case_.cargo, case_.cargoEn, lang);
  const cargoShort = cargo.split("·")[0].replace(/\(.*\)/, "").trim();
  const ph = case_.policyHolder;
  const holderReason = ph ? L(ph.reasonZh, ph.reasonEn, lang) : "";

  return (
    <div className="panel-raised border-amber-dim/60">
      {/* HOLDER STRIP — who the policy is for */}
      {ph && (
        <div className="px-4 py-2.5 border-b border-amber-dim/30 bg-amber/5 flex items-center gap-3 flex-wrap">
          <span className={`text-[9px] px-1.5 py-px tracking-widest ${ph.party === "buyer" ? "border border-green-dim text-green" : "border border-amber text-amber"}`}>
            {ph.party === "buyer"
              ? t("买方持有 · BUYER", "BUYER HOLDS")
              : t("卖方持有 · SELLER", "SELLER HOLDS")}
          </span>
          <span className="text-[12px] text-text">
            {t("这张保单是给 ", "This policy is for ")}
            <span className="text-amber">{ph.partyName}</span>
            {t(" 买的", "")}
          </span>
          <span className="text-[10px] text-faint flex-1 leading-snug">
            · {holderReason}
          </span>
          <span className="text-[9px] text-faint tracking-widest">
            {case_.incoterms}
          </span>
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="label-kicker text-amber">
            /// {t("AI + 你企业 Agent 提取的下注基础", "AI + your enterprise Agent · the bet basis")}
          </div>
          <div className="text-[9px] text-faint tracking-widest">
            {t(
              "提单 / 合同 / 你 ops 财务模型 → 以下字段。下游每一笔对冲、保费、赔付都来自它们。",
              "B/L · contract · your ops finance model → these fields. Every hedge, premium, and payout downstream depends on them.",
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

          {/* ④ Loss per day late — contract LD + real ops loss (from Agent) */}
          <div className="panel p-2.5 bg-panel-2/60 border-l-2 border-amber-dim">
            <div className="text-[9px] text-amber-dim tracking-widest mb-1">
              ④ {t("晚 1 天 → 你赔多少", "EACH DAY LATE COSTS")}
            </div>
            <PenaltyTwoNumber case_={case_} />
          </div>
        </div>

        <div className="mt-2.5 text-[10px] text-faint leading-relaxed">
          <span className="text-amber-dim tracking-widest">{t("说明 · ", "NOTE · ")}</span>
          {t(
            "保单按 ④ 中「内部真实损失」sized, 不按合同 LD。这是因为你 ops 团队算的「晚 1 天真损失」才是你账上要扛的, 合同 LD 只是其中一部分。",
            "Policy is sized against ④'s 'internal real loss', not the contract LD. The number your ops team calculates IS what hits your books — the contract LD is just one piece of it.",
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The two-number cell for ④. If the case has both `contractPenaltyPerDayUsd`
 * and `internalLossPerDayUsd`, we show them side-by-side with the internal
 * number larger and labeled as the "真实损失/d" — that's the number the
 * policy is built against.
 */
function PenaltyTwoNumber({ case_ }: { case_: Case }) {
  const t = useT();
  const { lang } = useLang();
  const ccy = case_.currency;
  const contract = case_.contractPenaltyPerDayUsd;
  const internal = case_.internalLossPerDayUsd;
  const internalSource = L(case_.internalLossSourceZh, case_.internalLossSourceEn, lang);

  // No internal value — fall back to single-number display
  if (!internal || internal === contract) {
    return (
      <>
        <div className="tabular-nums text-lg font-semibold leading-tight text-amber-bright">
          {fmtMoney(contract, ccy)}
        </div>
        <div className="text-[10px] text-faint mt-1 leading-snug">
          {t("你合同里的 LD", "Your contract LD")}
          {" · "}
          {t("缓冲 ", "buffer ")}
          {case_.bufferDays}
          {t(" 天", "d")}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mt-0.5">
        <div>
          <div className="text-[8px] text-faint tracking-widest">
            {t("合同 LD", "CONTRACT LD")}
          </div>
          <div className="tabular-nums text-sm text-dim mt-0.5">
            {fmtMoney(contract, ccy)}
          </div>
        </div>
        <div className="border-l border-amber-dim pl-2">
          <div className="text-[8px] text-amber tracking-widest flex items-center gap-1">
            {t("真实损失/d", "REAL $/d")}
            <span className="text-[7px] text-amber-dim">▲</span>
          </div>
          <div className="tabular-nums text-base text-amber-bright mt-0.5 font-semibold">
            {fmtMoney(internal, ccy)}
          </div>
        </div>
      </div>
      {internalSource && (
        <div className="text-[9px] text-amber-dim mt-1.5 leading-snug border-t border-amber-dim/30 pt-1">
          ↑ {internalSource}
        </div>
      )}
      <div className="text-[10px] text-faint mt-1 leading-snug">
        {t("缓冲 ", "buffer ")}
        {case_.bufferDays}
        {t(" 天后开始按「真实损失」赔", "d, then policy pays at the 'real $/d' rate")}
      </div>
    </>
  );
}
