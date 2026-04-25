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
  return (
    <div className="panel-raised p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-kicker">/// {t("准备投保", "READY TO BIND")}</div>
          <div className="mt-1 text-sm text-dim leading-relaxed">
            {t("报价锁定 15 分钟。点击后你会看到保费具体", "Quote locked for 15 minutes. Click to see exactly")}
            <span className="text-amber">
              {" "}
              {t("分别下单到哪些市场", "which markets your premium funds")}
            </span>
            {t("。", ".")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-faint">{t("保费", "PREMIUM")}</div>
          <div className="text-2xl text-amber tabular-nums">{fmtMoney(risk.premiumUsd, currency)}</div>
          <div className="text-[10px] text-faint">
            {t("保额 ", "LIMIT ")}
            {fmtMoney(risk.recommendedCoverageUsd, currency)}
          </div>
        </div>
      </div>
      <Link
        href={`/split?case=${caseId}`}
        className="mt-4 btn-amber w-full py-3 text-sm tracking-[0.3em] relative overflow-hidden flex items-center justify-center"
      >
        <span className="relative z-10">
          {t("▸ 一键投保 · 看钱花在哪", "▸ ONE-CLICK INSURE · SEE THE SPLIT")}
        </span>
      </Link>
      <div className="mt-2 text-[10px] text-faint text-center tracking-widest">
        {t("承保 · CHOKEPOINT RE · LLOYD'S 辛迪加 4812", "Underwritten by CHOKEPOINT RE · Lloyd's Syndicate 4812")}
      </div>
    </div>
  );
}
