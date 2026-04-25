"use client";
import { Case, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney, fmtMoneyLong, RiskModel } from "@/app/lib/risk";

export default function PlainLanguage({ case_, risk }: { case_: Case; risk: RiskModel }) {
  const t = useT();
  const { lang } = useLang();
  const premium = risk.premiumUsd;
  const limit = risk.recommendedCoverageUsd;
  const ratio = (limit / premium).toFixed(1);
  const ccy = case_.currency;

  const cargo = L(case_.cargo, case_.cargoEn, lang);
  const buyer = L(case_.buyer, case_.buyerEn, lang);
  const painPoint = L(case_.painPointZh, case_.painPointEn, lang);
  const penaltyNote = L(case_.penaltySourceNoteZh, case_.penaltySourceNoteEn, lang);
  const cargoShort = cargo.split("·")[0].replace(/\(.*\)/, "").trim();
  const buyerShort = buyer ? buyer.split("·")[0].trim() : "";

  return (
    <div className="panel-raised p-5 border-amber-dim bg-panel-2/40">
      <div className="flex items-center justify-between mb-3">
        <div className="label-kicker text-amber">
          /// {t("这张保单 · 用人话讲", "THIS POLICY · IN PLAIN ENGLISH")}
        </div>
        <div className="text-[10px] text-faint">
          {t("NO JARGON · 给 CFO 看的版本", "NO JARGON · CFO-friendly version")}
        </div>
      </div>

      {lang === "zh" ? (
        <p className="text-[13px] text-text leading-relaxed">
          你这票 <span className="text-amber">{fmtMoneyLong(case_.cargoValueUsd, ccy)}</span> 的{" "}
          {cargoShort}, 原计划 {case_.baselineTransitDays} 天从{" "}
          <span className="text-dim">{case_.origin.name}</span> 到{" "}
          <span className="text-dim">{case_.destination.name}</span>。
          {buyerShort ? (
            <>
              买方 <span className="text-dim">{buyerShort}</span>{" "}
            </>
          ) : null}
          只有 <span className="text-amber">{case_.bufferDays} 天</span>缓冲, 晚一天罚{" "}
          <span className="text-amber">{fmtMoney(case_.contractPenaltyPerDayUsd, ccy)}</span>
          {case_.penaltySource === "estimate" ? (
            <span className="text-[10px] text-amber-dim ml-1">(估算)</span>
          ) : case_.penaltySource === "contract" ? (
            <span className="text-[10px] text-green ml-1">(合同)</span>
          ) : null}
          。
        </p>
      ) : (
        <p className="text-[13px] text-text leading-relaxed">
          Your <span className="text-amber">{fmtMoneyLong(case_.cargoValueUsd, ccy)}</span> shipment
          of {cargoShort}, originally {case_.baselineTransitDays} days from{" "}
          <span className="text-dim">{case_.origin.name}</span> to{" "}
          <span className="text-dim">{case_.destination.name}</span>.
          {buyerShort ? (
            <>
              {" "}
              Buyer <span className="text-dim">{buyerShort}</span>
            </>
          ) : null}
          {" "}has only <span className="text-amber">{case_.bufferDays} days</span> of buffer; each day
          late costs{" "}
          <span className="text-amber">{fmtMoney(case_.contractPenaltyPerDayUsd, ccy)}</span>
          {case_.penaltySource === "estimate" ? (
            <span className="text-[10px] text-amber-dim ml-1">(estimate)</span>
          ) : case_.penaltySource === "contract" ? (
            <span className="text-[10px] text-green ml-1">(from contract)</span>
          ) : null}
          .
        </p>
      )}

      {case_.penaltySource === "estimate" && penaltyNote && (
        <div className="mt-2 px-3 py-2 border border-amber-dim/50 bg-amber/5 text-[11px] text-amber-dim leading-relaxed">
          ⚠ {t("罚则数为估算 · ", "Penalty is an estimate · ")}
          {penaltyNote}
        </div>
      )}

      {painPoint && (
        <div className="mt-3 text-[12px] text-dim leading-relaxed border-l-2 border-amber-dim pl-3">
          <span className="text-amber-dim text-[10px] tracking-widest">
            {t("真实痛点 · ", "REAL PAIN · ")}
          </span>
          {painPoint}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="panel p-3">
          <div className="label-kicker mb-1 text-green-dim">{t("你花", "YOU PAY")}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-amber tabular-nums">{fmtMoney(premium, ccy)}</span>
            <span className="text-[10px] text-faint">
              {t("一次性保费", "one-time premium")}
            </span>
          </div>
          <div className="text-[11px] text-dim mt-1 leading-relaxed">
            {t(
              `相当于货值的 ${((premium / case_.cargoValueUsd) * 100).toFixed(2)}%。跟花一点钱给车上保险的逻辑一样, 比传统货运险贵一点但`,
              `That's ${((premium / case_.cargoValueUsd) * 100).toFixed(2)}% of cargo value. Same logic as buying car insurance — slightly more than traditional cargo cover, but `,
            )}
            <span className="text-amber">
              {t("保的风险完全不同", "covers a completely different risk")}
            </span>
            {t("。", ".")}
          </div>
        </div>

        <div className="panel p-3">
          <div className="label-kicker mb-1 text-amber-dim">{t("你保", "YOU GET")}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-amber tabular-nums">{fmtMoney(limit, ccy)}</span>
            <span className="text-[10px] text-faint">
              {t("最多赔付", "max payout")}
            </span>
          </div>
          <div className="text-[11px] text-dim mt-1 leading-relaxed">
            {t(
              `出事时你最多能拿回来这么多。杠杆 ${ratio}x — 花 1 块钱最多换回 ${ratio} 块钱的赔付。`,
              `Max recovery if triggers fire. Leverage ${ratio}x — every $1 of premium can return up to $${ratio}.`,
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="label-kicker mb-2">{t("什么情况下赔?", "WHEN DOES IT PAY?")}</div>
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-start gap-3">
            <span className="text-green mt-0.5">①</span>
            <div className="text-dim">
              {t("船晚到 ", "Vessel late by ")}
              <span className="text-amber">{t("≥ 10 天", "≥ 10 days")}</span>
              {" → "}
              {t("立即赔 ", "instant payout ")}
              <span className="text-amber">
                {fmtMoney(Math.round(limit * 0.2), ccy)}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber mt-0.5">②</span>
            <div className="text-dim">
              {t("船晚到 ", "Vessel late by ")}
              <span className="text-amber">{t("≥ 20 天", "≥ 20 days")}</span>
              {" → "}
              {t("再赔 ", "additional ")}
              <span className="text-amber">
                {fmtMoney(Math.round(limit * 0.3), ccy)}
              </span>
              {" "}
              {t(`(累计 ${fmtMoney(Math.round(limit * 0.5), ccy)})`,
                 `(cumulative ${fmtMoney(Math.round(limit * 0.5), ccy)})`)}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red mt-0.5">③</span>
            <div className="text-dim">
              {t("船晚到 ", "Vessel late by ")}
              <span className="text-amber">{t("≥ 30 天", "≥ 30 days")}</span>
              {" → "}
              {t("封顶赔 ", "max payout ")}
              <span className="text-amber">{fmtMoney(limit, ccy)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 border border-line bg-panel-2/70 text-[11px] text-dim leading-relaxed">
        <div className="text-[10px] text-green tracking-widest mb-1">
          {t("凭什么赔得这么快 ·", "WHY IT PAYS SO FAST ·")}
        </div>
        {t(
          "不看定损材料, 只看两个独立数据源:",
          "No loss adjusters, just two independent data sources:",
        )}
        <span className="text-amber">
          {" "}
          {t("船上的 AIS 定位", "the vessel's AIS position")}
        </span>{" "}
        +
        <span className="text-amber">
          {" "}
          {t(`${case_.destination.name} 的港到港记录`, `${case_.destination.name} port-arrival records`)}
        </span>
        {t(
          '。两边都确认"晚了", 智能合约触发, 72 小时内打款, 不用跟理赔员扯皮。',
          '. When both confirm "late", a smart contract triggers and pays within 72 hours — no haggling with adjusters.',
        )}
      </div>

      <div className="mt-3 text-[10px] text-faint leading-relaxed">
        <span className="text-amber-dim">⚠ {t("说清楚:", "To be clear:")}</span>{" "}
        {t(
          `如果船准时到, 这 ${fmtMoney(premium, ccy)} 就是花掉了, 跟车险没出险一样。传统货运险的 ICC-A 条款明文排除 delay loss — 我们补的就是这块。`,
          `if the vessel arrives on time, the ${fmtMoney(premium, ccy)} premium is gone — same as paying car insurance and not crashing. ICC-A traditional cargo cover explicitly excludes delay loss — that's exactly the gap we fill.`,
        )}
      </div>
    </div>
  );
}
