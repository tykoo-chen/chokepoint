"use client";
import { Currency, fmtMoney, RiskModel } from "@/app/lib/risk";
import Link from "next/link";

export default function InsureButton({ risk, caseId, currency }: { risk: RiskModel; caseId: string; currency: Currency }) {
  return (
    <div className="panel-raised p-5">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label-kicker">/// 准备投保</div>
          <div className="mt-1 text-sm text-dim leading-relaxed">
            报价锁定 15 分钟。点击后你会看到保费具体
            <span className="text-amber"> 分别下单到哪些市场</span>。
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-faint">保费</div>
          <div className="text-2xl text-amber tabular-nums">{fmtMoney(risk.premiumUsd, currency)}</div>
          <div className="text-[10px] text-faint">保额 {fmtMoney(risk.recommendedCoverageUsd, currency)}</div>
        </div>
      </div>
      <Link
        href={`/split?case=${caseId}`}
        className="mt-4 btn-amber w-full py-3 text-sm tracking-[0.3em] relative overflow-hidden flex items-center justify-center"
      >
        <span className="relative z-10">▸ 一键投保 · 看钱花在哪</span>
      </Link>
      <div className="mt-2 text-[10px] text-faint text-center tracking-widest">
        承保 · CHOKEPOINT RE · LLOYD&apos;S 辛迪加 4812
      </div>
    </div>
  );
}
