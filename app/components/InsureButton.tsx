"use client";
import { useT } from "@/app/lib/i18n";
import { Currency, fmtMoney, RiskModel } from "@/app/lib/risk";
import Link from "next/link";

export default function InsureButton({
  risk,
  caseId,
  currency,
}: {
  risk: RiskModel;
  caseId: string;
  currency: Currency;
}) {
  const t = useT();

  const ratio = (risk.recommendedCoverageUsd / risk.premiumUsd).toFixed(1);

  return (
    <div className="panel-raised p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="label-kicker">/// {t("准备投保", "READY TO BIND")}</div>
          <div className="mt-1 text-[12px] text-dim leading-relaxed">
            {t(
              "报价锁定 15 分钟。这张保单是这样工作的:",
              "Quote locked for 15 minutes. Here's how the policy works, in plain English:",
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-faint">{t("保费", "PREMIUM")}</div>
          <div className="text-2xl text-amber tabular-nums leading-none">{fmtMoney(risk.premiumUsd, currency)}</div>
          <div className="text-[10px] text-faint mt-1">
            {t("保额 ", "LIMIT ")}
            {fmtMoney(risk.recommendedCoverageUsd, currency)}
          </div>
        </div>
      </div>

      {/* Plain-language summary */}
      <div className="mt-3 grid grid-cols-1 gap-1.5 text-[11px] text-dim">
        <div className="flex gap-2">
          <span className="text-amber flex-shrink-0">①</span>
          <div>
            {t("你现在付", "You pay ")}
            <span className="text-amber tabular-nums">{fmtMoney(risk.premiumUsd, currency)}</span>
            {t(", 锁定一张参数化保单。如果船没事, 这笔钱不退 (跟车险一样)。", " right now to bind a parametric policy. If the voyage runs clean, this premium isn't refundable (same as car insurance).")}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-amber flex-shrink-0">②</span>
          <div>
            {t(
              `如果船晚到 10 / 20 / 30 天 — 自动赔 ${fmtMoney(Math.round(risk.recommendedCoverageUsd * 0.2), currency)} / ${fmtMoney(Math.round(risk.recommendedCoverageUsd * 0.5), currency)} / ${fmtMoney(risk.recommendedCoverageUsd, currency)}, 不审单不查勘, 72 小时到账。`,
              `If the vessel is 10 / 20 / 30 days late, you get an automatic payout of ${fmtMoney(Math.round(risk.recommendedCoverageUsd * 0.2), currency)} / ${fmtMoney(Math.round(risk.recommendedCoverageUsd * 0.5), currency)} / ${fmtMoney(risk.recommendedCoverageUsd, currency)} respectively. No claim form, no surveyor — money lands within 72 hours.`,
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-amber flex-shrink-0">③</span>
          <div>
            {t(
              `点下面那个按钮以后, 你会看到我们怎么把这 ${fmtMoney(risk.premiumUsd, currency)} 拆到 5 个不同的市场和再保险层 — 完全透明。`,
              `Click the button and you'll see exactly how we split this ${fmtMoney(risk.premiumUsd, currency)} across 5 markets and reinsurance layers — fully transparent.`,
            )}
          </div>
        </div>
      </div>

      <Link
        href={`/split?case=${caseId}`}
        className="mt-4 btn-amber w-full py-3 text-sm flex items-center justify-center"
        style={{ letterSpacing: "0.2em" }}
      >
        <span>{t("▸ 一键投保 · 看钱花在哪", "▸ ONE-CLICK INSURE")}</span>
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="panel py-1.5">
          <div className="text-[9px] text-faint tracking-widest">{t("杠杆", "LEVERAGE")}</div>
          <div className="text-amber tabular-nums text-sm">{ratio}x</div>
        </div>
        <div className="panel py-1.5">
          <div className="text-[9px] text-faint tracking-widest">{t("赔付时效", "PAYOUT")}</div>
          <div className="text-green tabular-nums text-sm">≤ 72h</div>
        </div>
        <div className="panel py-1.5">
          <div className="text-[9px] text-faint tracking-widest">{t("触发器源", "TRIGGER SRC")}</div>
          <div className="text-dim tabular-nums text-sm">2× {t("源", "src")}</div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-faint text-center tracking-widest">
        {t("承保 · JUSTINCASE RE · LLOYD'S 辛迪加 4812", "Underwritten by JUSTINCASE RE · Lloyd's Syndicate 4812")}
      </div>
    </div>
  );
}
