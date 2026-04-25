"use client";
import { L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtUsd } from "@/app/lib/risk";
import { fmtCny, Leg, usdToCny } from "@/app/lib/split";

export default function MarketLeg({
  leg,
  status,
  highlight,
}: {
  leg: Leg;
  status: "pending" | "placing" | "filled";
  highlight?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const isMarket = leg.side === "YES" || leg.side === "NO";
  const isFuture = leg.side === "Long" || leg.side === "Short";
  const isCapital = leg.side === "Capital" || leg.side === "Fee";

  const sideBadge =
    leg.side === "YES"
      ? "bg-green/15 text-green border-green-dim"
      : leg.side === "NO"
      ? "bg-red/15 text-red border-red-dim"
      : leg.side === "Long"
      ? "bg-amber/15 text-amber border-amber-dim"
      : leg.side === "Short"
      ? "bg-red/15 text-red border-red-dim"
      : "bg-panel-2 text-faint border-line";

  const statusTone =
    status === "filled" ? "text-green" : status === "placing" ? "text-amber blink" : "text-faint";

  const statusText =
    status === "filled"
      ? t("✓ 已建仓", "✓ FILLED")
      : status === "placing"
      ? t("▸ 下单中", "▸ PLACING")
      : t("· 待执行", "· PENDING");

  const question = L(leg.questionZh, leg.questionEn, lang);
  const triggers = L(leg.triggersZh, leg.triggersEn, lang);
  const rationale = L(leg.rationaleZh, leg.rationaleEn, lang);

  const multiplier = leg.payoutIfHitUsd > 0 ? leg.payoutIfHitUsd / leg.notionalUsd : 0;

  return (
    <div
      className={`panel-raised p-3 transition-colors ${highlight ? "border-amber-dim" : ""} ${
        status === "filled" ? "opacity-100" : "opacity-90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-amber text-sm" style={{ color: leg.colorHex }}>
            {leg.icon}
          </span>
          <span className="text-[10px] tracking-widest text-faint">{leg.venue}</span>
          <span className={`text-[9px] tracking-widest px-1.5 py-0.5 border ${sideBadge}`}>
            {leg.side}
          </span>
        </div>
        <div className={`text-[10px] tracking-widest ${statusTone}`}>{statusText}</div>
      </div>

      <div className="mt-1.5 text-[12px] text-text leading-snug">{question}</div>
      <div className="text-[10px] text-faint tracking-widest mt-0.5">{leg.instrument}</div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
        <div className="panel py-1 px-2">
          <div className="text-faint">
            {isMarket
              ? t("市场价", "Market price")
              : isFuture
              ? t("入场价", "Entry price")
              : t("份额", "Share")}
          </div>
          <div className="text-dim tabular-nums">
            {isMarket ? `${(leg.price * 100).toFixed(0)}¢` : isFuture ? leg.price.toFixed(2) : "—"}
          </div>
        </div>
        <div className="panel py-1 px-2">
          <div className="text-faint">{t("投入", "Allocated")}</div>
          <div className="text-amber tabular-nums">{fmtUsd(leg.notionalUsd)}</div>
          <div className="text-faint tabular-nums text-[9px]">
            {fmtCny(usdToCny(leg.notionalUsd))}
          </div>
        </div>
        <div className="panel py-1 px-2">
          <div className="text-faint">
            {isCapital ? t("赔付能力", "Payout power") : t("触发后回收", "If hit, returns")}
          </div>
          <div className="text-green tabular-nums">
            {leg.payoutIfHitUsd > 0 ? fmtUsd(leg.payoutIfHitUsd) : "—"}
          </div>
          {multiplier > 0 && (
            <div className="text-faint tabular-nums text-[9px]">{multiplier.toFixed(1)}x</div>
          )}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-dim leading-relaxed">
        <div className="text-faint tracking-widest text-[9px] mb-0.5">
          {t("触发条件", "TRIGGER")}
        </div>
        {triggers}
      </div>
      <div className="mt-1.5 text-[10px] text-faint leading-relaxed border-t border-line pt-1.5">
        <span className="text-amber-dim tracking-widest text-[9px]">
          {t("为什么买它 · ", "WHY BUY · ")}
        </span>
        {rationale}
      </div>
    </div>
  );
}
