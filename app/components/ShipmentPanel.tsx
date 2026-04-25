"use client";
import { Case, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney, fmtMoneyLong } from "@/app/lib/risk";

export default function ShipmentPanel({ case_ }: { case_: Case }) {
  const t = useT();
  const { lang } = useLang();

  const cargo = L(case_.cargo, case_.cargoEn, lang);
  const buyer = L(case_.buyer, case_.buyerEn, lang);
  const penaltyNote = L(case_.penaltySourceNoteZh, case_.penaltySourceNoteEn, lang);
  const docsSeen =
    lang === "en" && case_.documentsSeenEn?.length
      ? case_.documentsSeenEn
      : case_.documentsSeenZh ?? [];

  const rows: [string, string][] = [
    [t("船舶", "VESSEL"), case_.ship],
    [t("提单", "B/L"), case_.documentLabel],
    [
      t("起运", "ORIGIN"),
      case_.origin.name ?? `${case_.origin.lat.toFixed(2)}, ${case_.origin.lng.toFixed(2)}`,
    ],
    [
      t("目的", "DEST."),
      case_.destination.name ?? `${case_.destination.lat.toFixed(2)}, ${case_.destination.lng.toFixed(2)}`,
    ],
    [t("开航", "ETD"), case_.etd],
    [t("预抵", "ETA"), case_.eta],
    [t("术语", "TERMS"), case_.incoterms],
    [t("买方", "BUYER"), buyer],
  ];

  return (
    <div className="panel-raised">
      <div className="px-4 py-2.5 border-b border-line flex items-center justify-between">
        <div className="label-kicker">/// {t("航次信息", "SHIPMENT")}</div>
        <div className="text-[10px] text-amber tracking-widest">{t("AI 已提取", "AI EXTRACTED")}</div>
      </div>
      <div className="px-4 pt-3 pb-3">
        <div className="text-sm text-text leading-snug">{cargo}</div>
        <div className="flex items-baseline gap-3 mt-1">
          <div className="text-[11px] text-faint">HS {case_.hsCode}</div>
          <div className="text-[11px] text-dim">{case_.quantity}</div>
        </div>
        <div className="mt-3 p-2 border border-line bg-panel-2/50 flex items-baseline justify-between">
          <div className="text-[10px] text-faint tracking-widest">{t("货值", "CARGO VALUE")}</div>
          <div className="text-lg text-amber tabular-nums">
            {fmtMoneyLong(case_.cargoValueUsd, case_.currency)}
          </div>
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
          <div className="text-faint">{t("航程", "TRANSIT")}</div>
          <div className="text-dim tabular-nums">{case_.baselineTransitDays}d</div>
        </div>
        <div>
          <div className="text-faint">{t("缓冲", "BUFFER")}</div>
          <div className="text-dim tabular-nums">{case_.bufferDays}d</div>
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-faint">{t("违约金", "PENALTY")}</span>
            <PenaltyBadge source={case_.penaltySource} t={t} />
          </div>
          <div className="text-dim tabular-nums">
            {fmtMoney(case_.contractPenaltyPerDayUsd, case_.currency)}/d
          </div>
        </div>
      </div>
      {(penaltyNote || docsSeen.length > 0) && (
        <div className="border-t border-line px-4 py-2 text-[10px] leading-relaxed">
          {docsSeen.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {docsSeen.map((d) => (
                <span
                  key={d}
                  className="text-[9px] px-1.5 py-0.5 border border-line text-faint tracking-wider"
                >
                  📄 {d}
                </span>
              ))}
            </div>
          )}
          {penaltyNote && (
            <div className="text-faint">
              <span className="text-amber-dim">{t("罚则来源 · ", "PENALTY SOURCE · ")}</span>
              {penaltyNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PenaltyBadge({
  source,
  t,
}: {
  source?: "contract" | "estimate";
  t: (zh: string, en: string) => string;
}) {
  if (source === "contract") {
    return (
      <span className="text-[8px] px-1 py-px border border-green-dim text-green tracking-widest">
        {t("合同", "CONTRACT")}
      </span>
    );
  }
  if (source === "estimate") {
    return (
      <span className="text-[8px] px-1 py-px border border-amber-dim text-amber-dim tracking-widest">
        {t("估算", "ESTIMATE")}
      </span>
    );
  }
  return null;
}
