"use client";
import { Case, L } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney } from "@/app/lib/risk";
import Link from "next/link";

export default function CaseCard({ c, index }: { c: Case; index: number }) {
  const t = useT();
  const { lang } = useLang();
  // Headline = first card (saudi-crude is the flagship)
  const isHeadline = c.id === "saudi-crude-yantai";

  const title = L(c.title, c.titleEn, lang);
  const cargo = L(c.cargo, c.cargoEn, lang);
  const painPoint = L(c.painPointZh, c.painPointEn, lang) ?? "";
  const client = L(c.clientZh, c.clientEn, lang);

  const cargoShort = cargo.split("·")[0].replace(/\(.*\)/, "").trim();

  return (
    <Link
      href={`/quote?case=${c.id}`}
      className={`group relative panel-raised p-5 flex flex-col gap-3.5 transition-colors ${
        isHeadline ? "border-amber hover:border-amber-bright" : "hover:border-amber-dim"
      }`}
    >
      <div
        className={`absolute top-0 right-0 px-2 py-0.5 border-l border-b text-[10px] tracking-widest ${
          isHeadline ? "bg-amber/20 border-amber-dim text-amber" : "bg-amber/10 border-line text-amber-dim"
        }`}
      >
        {isHeadline ? t("真实 · APR 2026", "REAL · APR 2026") : `LEC · #0${index + 1}`}
      </div>

      <div>
        <div className="label-kicker mb-1">{client ?? t("航次", "VOYAGE")}</div>
        <div className="text-lg text-text leading-tight">{title}</div>
        <div className="text-[11px] text-faint tracking-wider mt-0.5">{c.subtitle}</div>
      </div>

      {painPoint && (
        <div className="text-[11px] text-dim leading-relaxed border-l-2 border-amber-dim pl-2">
          {painPoint}
        </div>
      )}

      {/* The 4 essentials AI extracts — these are the parametric bet inputs */}
      <div className="text-[10px] text-amber-dim tracking-widest">
        {t("AI 提取的下注基础", "AI-EXTRACTED BET INPUTS")}
      </div>

      {/* Route line */}
      <div className="panel p-2 bg-panel-2/50 text-[11px]">
        <div className="text-[9px] text-faint tracking-widest mb-1">
          ① {t("路线", "ROUTE")}
        </div>
        <div className="flex items-center gap-1.5 text-dim text-[11px]">
          <span className="text-green flex-shrink-0">●</span>
          <span className="truncate">{c.origin.name}</span>
          <span className="text-faint flex-shrink-0">→</span>
          <span className="text-amber flex-shrink-0">●</span>
          <span className="truncate">{c.destination.name}</span>
        </div>
      </div>

      {/* 3-cell grid: cargo / value / penalty per day */}
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-[9px] text-faint tracking-widest">
            ② {t("货品", "CARGO")}
          </div>
          <div className="text-dim truncate mt-0.5">{cargoShort}</div>
        </div>
        <div>
          <div className="text-[9px] text-faint tracking-widest">
            ③ {t("货值", "VALUE")}
          </div>
          <div className="text-amber tabular-nums mt-0.5">
            {fmtMoney(c.cargoValueUsd, c.currency)}
          </div>
        </div>
        <div className="border-l-2 border-amber-dim pl-2">
          <div className="text-[9px] text-amber-dim tracking-widest">
            ④ {t("晚 1 天罚", "PENALTY/DAY")}
          </div>
          <div className="text-amber tabular-nums mt-0.5">
            {fmtMoney(c.contractPenaltyPerDayUsd, c.currency)}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-line flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {c.chokepointIds.slice(0, 3).map((cp) => (
            <span
              key={cp}
              className="text-[9px] px-1.5 py-0.5 border border-line text-faint tracking-wider"
            >
              {cp}
            </span>
          ))}
          {c.chokepointIds.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 text-faint">
              +{c.chokepointIds.length - 3}
            </span>
          )}
        </div>
        <span className="text-amber text-[11px] tracking-widest group-hover:text-amber-bright">
          {t("运行 →", "RUN →")}
        </span>
      </div>
    </Link>
  );
}
