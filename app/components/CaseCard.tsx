"use client";
import { Case } from "@/app/lib/cases";
import { fmtMoney } from "@/app/lib/risk";
import Link from "next/link";

export default function CaseCard({ c, index }: { c: Case; index: number }) {
  const isHeadline = c.id === "xbot-jebelali";
  return (
    <Link
      href={`/map?case=${c.id}`}
      className={`group relative panel-raised p-5 flex flex-col gap-4 transition-colors ${
        isHeadline ? "border-amber hover:border-amber-bright" : "hover:border-amber-dim"
      }`}
    >
      <div
        className={`absolute top-0 right-0 px-2 py-0.5 border-l border-b text-[10px] tracking-widest ${
          isHeadline ? "bg-amber/20 border-amber-dim text-amber" : "bg-amber/10 border-line text-amber-dim"
        }`}
      >
        {isHeadline ? `真实 · APR 2026` : `LEC · #0${index + 1}`}
      </div>

      <div>
        <div className="label-kicker mb-1">{c.clientZh ?? "航次"}</div>
        <div className="text-lg text-text leading-tight">{c.title}</div>
        <div className="text-[11px] text-faint tracking-wider mt-0.5">{c.subtitle}</div>
      </div>

      {c.painPointZh && (
        <div className="text-[11px] text-dim leading-relaxed border-l-2 border-amber-dim pl-2">
          {c.painPointZh}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <div>
          <div className="text-faint">货品</div>
          <div className="text-dim truncate">{c.cargo.split(",")[0].replace(/\(.*\)/, "")}</div>
        </div>
        <div>
          <div className="text-faint">货值</div>
          <div className="text-amber tabular-nums">{fmtMoney(c.cargoValueUsd, c.currency)}</div>
        </div>
        <div>
          <div className="text-faint">航程</div>
          <div className="text-dim tabular-nums">{c.baselineTransitDays} 天</div>
        </div>
        <div>
          <div className="text-faint">缓冲</div>
          <div className="text-dim tabular-nums">{c.bufferDays} 天</div>
        </div>
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {c.chokepointIds.slice(0, 3).map((cp) => (
            <span key={cp} className="text-[9px] px-1.5 py-0.5 border border-line text-faint tracking-wider">
              {cp}
            </span>
          ))}
          {c.chokepointIds.length > 3 && (
            <span className="text-[9px] px-1.5 py-0.5 text-faint">+{c.chokepointIds.length - 3}</span>
          )}
        </div>
        <span className="text-amber text-[11px] tracking-widest group-hover:text-amber-bright">
          运行 →
        </span>
      </div>
    </Link>
  );
}
