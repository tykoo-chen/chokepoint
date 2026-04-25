"use client";
import { Case } from "@/app/lib/cases";
import { fmtMoney, fmtMoneyLong, RiskModel } from "@/app/lib/risk";

export default function PlainLanguage({ case_, risk }: { case_: Case; risk: RiskModel }) {
  const premium = risk.premiumUsd;
  const limit = risk.recommendedCoverageUsd;
  const ratio = (limit / premium).toFixed(1);
  const ccy = case_.currency;

  return (
    <div className="panel-raised p-5 border-amber-dim bg-panel-2/40">
      <div className="flex items-center justify-between mb-3">
        <div className="label-kicker text-amber">/// 这张保单 · 用人话讲</div>
        <div className="text-[10px] text-faint">NO JARGON · 给 CFO 看的版本</div>
      </div>

      <p className="text-[13px] text-text leading-relaxed">
        你这票 <span className="text-amber">{fmtMoneyLong(case_.cargoValueUsd, ccy)}</span> 的{" "}
        {case_.cargo.split("·")[0].replace(/\(.*\)/, "")}, 原计划 {case_.baselineTransitDays} 天从{" "}
        <span className="text-dim">{case_.origin.name}</span> 到{" "}
        <span className="text-dim">{case_.destination.name}</span>。
        {case_.buyer ? <>买方 <span className="text-dim">{case_.buyer.split("·")[0].trim()}</span> </> : null}
        只有 <span className="text-amber">{case_.bufferDays} 天</span>缓冲, 晚一天罚{" "}
        <span className="text-amber">{fmtMoney(case_.contractPenaltyPerDayUsd, ccy)}</span>
        {case_.penaltySource === "estimate" ? (
          <span className="text-[10px] text-amber-dim ml-1">(估算)</span>
        ) : case_.penaltySource === "contract" ? (
          <span className="text-[10px] text-green ml-1">(合同)</span>
        ) : null}
        。
      </p>

      {case_.penaltySource === "estimate" && case_.penaltySourceNoteZh && (
        <div className="mt-2 px-3 py-2 border border-amber-dim/50 bg-amber/5 text-[11px] text-amber-dim leading-relaxed">
          ⚠ 罚则数为估算 · {case_.penaltySourceNoteZh}
        </div>
      )}

      {case_.painPointZh && (
        <div className="mt-3 text-[12px] text-dim leading-relaxed border-l-2 border-amber-dim pl-3">
          <span className="text-amber-dim text-[10px] tracking-widest">真实痛点 · </span>
          {case_.painPointZh}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="panel p-3">
          <div className="label-kicker mb-1 text-green-dim">你花</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-amber tabular-nums">{fmtMoney(premium, ccy)}</span>
            <span className="text-[10px] text-faint">一次性保费</span>
          </div>
          <div className="text-[11px] text-dim mt-1 leading-relaxed">
            相当于货值的 {((premium / case_.cargoValueUsd) * 100).toFixed(2)}%。
            跟花一点钱给车上保险的逻辑一样, 比传统货运险贵一点但<span className="text-amber">保的风险完全不同</span>。
          </div>
        </div>

        <div className="panel p-3">
          <div className="label-kicker mb-1 text-amber-dim">你保</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-amber tabular-nums">{fmtMoney(limit, ccy)}</span>
            <span className="text-[10px] text-faint">最多赔付</span>
          </div>
          <div className="text-[11px] text-dim mt-1 leading-relaxed">
            出事时你最多能拿回来这么多。杠杆 {ratio}x —
            花 1 块钱最多换回 {ratio} 块钱的赔付。
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="label-kicker mb-2">什么情况下赔?</div>
        <div className="space-y-1.5 text-[12px]">
          <div className="flex items-start gap-3">
            <span className="text-green mt-0.5">①</span>
            <div className="text-dim">
              船晚到 <span className="text-amber">≥ 10 天</span> →{" "}
              立即赔 <span className="text-amber">{fmtMoney(Math.round(limit * 0.2), ccy)}</span>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-amber mt-0.5">②</span>
            <div className="text-dim">
              船晚到 <span className="text-amber">≥ 20 天</span> →{" "}
              再赔 <span className="text-amber">{fmtMoney(Math.round(limit * 0.3), ccy)}</span>{" "}
              (累计 {fmtMoney(Math.round(limit * 0.5), ccy)})
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-red mt-0.5">③</span>
            <div className="text-dim">
              船晚到 <span className="text-amber">≥ 30 天</span> →{" "}
              封顶赔 <span className="text-amber">{fmtMoney(limit, ccy)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 border border-line bg-panel-2/70 text-[11px] text-dim leading-relaxed">
        <div className="text-[10px] text-green tracking-widest mb-1">凭什么赔得这么快 ·</div>
        不看定损材料, 只看两个独立数据源:
        <span className="text-amber"> 船上的 AIS 定位</span> +
        <span className="text-amber"> {case_.destination.name} 的港到港记录</span>。
        两边都确认"晚了", 智能合约触发, 72 小时内打款, 不用跟理赔员扯皮。
      </div>

      <div className="mt-3 text-[10px] text-faint leading-relaxed">
        <span className="text-amber-dim">⚠ 说清楚:</span> 如果船准时到, 这 {fmtMoney(premium, ccy)} 就是花掉了,
        跟车险没出险一样。传统货运险的 ICC-A 条款明文排除 delay loss — 我们补的就是这块。
      </div>
    </div>
  );
}
