"use client";
import { Case } from "@/app/lib/cases";
import { fmtMoney, fmtMoneyLong } from "@/app/lib/risk";

export default function ShipmentPanel({ case_ }: { case_: Case }) {
  const rows: [string, string][] = [
    ["船舶", case_.ship],
    ["提单", case_.documentLabel],
    ["起运", case_.origin.name ?? `${case_.origin.lat.toFixed(2)}, ${case_.origin.lng.toFixed(2)}`],
    ["目的", case_.destination.name ?? `${case_.destination.lat.toFixed(2)}, ${case_.destination.lng.toFixed(2)}`],
    ["开航", case_.etd],
    ["预抵", case_.eta],
    ["术语", case_.incoterms],
    ["买方", case_.buyer],
  ];
  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// 航次信息</div>
        <div className="text-[10px] text-amber tracking-widest">AI 已提取</div>
      </div>
      <div className="px-4 pt-3 pb-3">
        <div className="text-sm text-text leading-snug">{case_.cargo}</div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-[11px] text-faint">HS {case_.hsCode}</div>
          <div className="text-[11px] text-dim">{case_.quantity}</div>
        </div>
        <div className="mt-3 p-2 border border-line bg-panel-2/50 flex items-baseline justify-between">
          <div className="text-[10px] text-faint tracking-widest">货值</div>
          <div className="text-lg text-amber tabular-nums">{fmtMoneyLong(case_.cargoValueUsd, case_.currency)}</div>
        </div>
      </div>
      <div className="border-t border-line divide-y divide-[var(--line)]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex px-4 py-1.5 text-[11px]">
            <div className="w-14 text-faint">{k}</div>
            <div className="flex-1 text-dim truncate">{v}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-2 grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <div className="text-faint">航程</div>
          <div className="text-dim tabular-nums">{case_.baselineTransitDays}d</div>
        </div>
        <div>
          <div className="text-faint">缓冲</div>
          <div className="text-dim tabular-nums">{case_.bufferDays}d</div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-faint">违约金</span>
            <PenaltyBadge source={case_.penaltySource} />
          </div>
          <div className="text-dim tabular-nums">
            {fmtMoney(case_.contractPenaltyPerDayUsd, case_.currency)}/d
          </div>
        </div>
      </div>
      {(case_.penaltySourceNoteZh || case_.documentsSeenZh?.length) && (
        <div className="border-t border-line px-4 py-2 text-[10px] leading-relaxed">
          {case_.documentsSeenZh && case_.documentsSeenZh.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {case_.documentsSeenZh.map((d) => (
                <span
                  key={d}
                  className="text-[9px] px-1.5 py-0.5 border border-line text-faint tracking-wider"
                >
                  📄 {d}
                </span>
              ))}
            </div>
          )}
          {case_.penaltySourceNoteZh && (
            <div className="text-faint">
              <span className="text-amber-dim">罚则来源 · </span>
              {case_.penaltySourceNoteZh}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PenaltyBadge({ source }: { source?: "contract" | "estimate" }) {
  if (source === "contract") {
    return (
      <span className="text-[8px] px-1 py-px border border-green-dim text-green tracking-widest">
        合同
      </span>
    );
  }
  if (source === "estimate") {
    return (
      <span className="text-[8px] px-1 py-px border border-amber-dim text-amber-dim tracking-widest">
        估算
      </span>
    );
  }
  return null;
}
