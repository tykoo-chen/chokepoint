"use client";
import { Case, L, Scenario } from "@/app/lib/cases";
import { useLang, useT } from "@/app/lib/i18n";
import { fmtMoney } from "@/app/lib/risk";

/**
 * The buyer-first replacement for P50 / P90 / P99.
 *
 * Each case carries 4 named scenarios (Normal / Coin-flip / Tail / Worst).
 * For each: probability, days late, $ loss to the buyer, what the policy
 * pays back, and a 1-2 sentence story in 2nd-person voice. Probabilities
 * sum to 1 across the 4 scenarios.
 *
 * Why this beats the actuarial framing: a procurement manager doesn't think
 * "P90 delay = 19 days". They think "if we're unlucky, what happens, how
 * bad, and what does the policy do." This panel answers exactly that.
 */
export default function ScenarioPanel({ case_ }: { case_: Case }) {
  const t = useT();
  const { lang } = useLang();
  const scenarios = case_.scenarios ?? [];
  if (scenarios.length === 0) return null;

  const ccy = case_.currency;
  const policyHolder = case_.policyHolder;
  const holderName = policyHolder?.partyName ?? "";

  // Expected loss = Σ p × loss; expected payout = Σ p × payout
  const expLoss = scenarios.reduce((s, sc) => s + sc.probability * sc.lossUsd, 0);
  const expPayout = scenarios.reduce((s, sc) => s + sc.probability * sc.payoutUsd, 0);

  return (
    <div className="panel-raised">
      <div className="px-4 py-3 border-b border-line flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="label-kicker text-amber">
            /// {holderName
              ? t(`${holderName} · 你这一票, 4 种可能的下游剧本`, `${holderName} · 4 possible downstream stories for this voyage`)
              : t("你这一票, 4 种可能的下游剧本", "4 possible downstream stories for this voyage")}
          </div>
          <div className="text-[10px] text-faint mt-0.5">
            {t(
              "每种情景都对应 (a) 你晚多少天 (b) 你赔多少钱 (c) 保单兜回来多少",
              "Each scenario shows (a) days you're late (b) what you owe (c) what the policy pays back",
            )}
          </div>
        </div>
        <div className="text-[10px] text-faint tabular-nums">
          {t("4 档概率合计 ", "4 scenarios sum to ")}
          {(scenarios.reduce((s, sc) => s + sc.probability, 0) * 100).toFixed(0)}%
        </div>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {scenarios.map((s) => (
          <ScenarioRow key={s.id} s={s} ccy={ccy} lang={lang} />
        ))}
      </div>

      {/* Bottom strip: expected loss + expected payout + the punchline */}
      <div className="px-4 py-3 bg-panel-2/40 border-t border-line">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
          <div>
            <div className="text-[10px] text-faint tracking-widest">
              {t("均摊到这一票, 你预期掏", "EXPECTED HIT PER VOYAGE")}
            </div>
            <div className="text-amber tabular-nums text-base mt-0.5">
              {fmtMoney(Math.round(expLoss), ccy)}
            </div>
            <div className="text-[10px] text-faint mt-0.5 leading-snug">
              {t("Σ 概率 × 损失 · 这是你不买保单的位置", "Σ prob × loss · this is your unhedged spot")}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint tracking-widest">
              {t("保单均摊给你赔回", "EXPECTED PAYBACK")}
            </div>
            <div className="text-green tabular-nums text-base mt-0.5">
              {fmtMoney(Math.round(expPayout), ccy)}
            </div>
            <div className="text-[10px] text-faint mt-0.5 leading-snug">
              {t("Σ 概率 × 赔付", "Σ prob × payout")}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-faint tracking-widest">
              {t("剩你自己扛", "YOU SELF-BEAR")}
            </div>
            <div className="text-amber-dim tabular-nums text-base mt-0.5">
              {fmtMoney(Math.round(Math.max(0, expLoss - expPayout)), ccy)}
            </div>
            <div className="text-[10px] text-faint mt-0.5 leading-snug">
              {t("尾部缺口 + 自留份额", "tail gap + retained share")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({
  s,
  ccy,
  lang,
}: {
  s: Scenario;
  ccy: Case["currency"];
  lang: "zh" | "en";
}) {
  const t = useT();
  const name = L(s.nameZh, s.nameEn, lang);
  const story = L(s.storyZh, s.storyEn, lang);
  const tone =
    s.id === "A"
      ? { dot: "bg-green", text: "text-green", probBar: "bg-green/30" }
      : s.id === "B"
        ? { dot: "bg-amber-dim", text: "text-amber-dim", probBar: "bg-amber-dim/30" }
        : s.id === "C"
          ? { dot: "bg-amber", text: "text-amber", probBar: "bg-amber/30" }
          : { dot: "bg-red", text: "text-red", probBar: "bg-red/30" };

  const fullyCovered = s.lossUsd > 0 && s.payoutUsd >= s.lossUsd;
  const gap = Math.max(0, s.lossUsd - s.payoutUsd);

  return (
    <div className="px-4 py-3 grid grid-cols-12 gap-3 items-start text-[11px]">
      <div className="col-span-12 md:col-span-3 flex items-baseline gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} mt-1`} />
        <div>
          <div className={`text-[10px] ${tone.text} tracking-widest`}>
            {t(`剧本 ${s.id}`, `SCENARIO ${s.id}`)} ·{" "}
            <span className="tabular-nums">{(s.probability * 100).toFixed(0)}%</span>
          </div>
          <div className="text-text leading-tight mt-0.5">{name}</div>
          {/* tiny prob bar */}
          <div className="mt-1 h-0.5 w-20 bg-line/40 overflow-hidden">
            <div
              className={`h-full ${tone.probBar}`}
              style={{ width: `${Math.min(100, s.probability * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="col-span-6 md:col-span-2">
        <div className="text-[9px] text-faint tracking-widest">
          {t("晚多少天", "DAYS LATE")}
        </div>
        <div className={`tabular-nums mt-0.5 ${s.daysLate === 0 ? "text-green" : tone.text}`}>
          {s.daysLate === 0 ? t("准时", "on time") : `+${s.daysLate} ${t("天", "d")}`}
        </div>
      </div>

      <div className="col-span-6 md:col-span-2">
        <div className="text-[9px] text-faint tracking-widest">
          {t("你赔", "YOU OWE")}
        </div>
        <div className={`tabular-nums mt-0.5 ${s.lossUsd === 0 ? "text-faint" : "text-amber"}`}>
          {s.lossUsd === 0 ? "—" : fmtMoney(s.lossUsd, ccy)}
        </div>
      </div>

      <div className="col-span-6 md:col-span-2">
        <div className="text-[9px] text-faint tracking-widest">
          {t("保单兜", "POLICY PAYS")}
        </div>
        <div className={`tabular-nums mt-0.5 ${s.payoutUsd === 0 ? "text-faint" : "text-green"}`}>
          {s.payoutUsd === 0 ? "—" : fmtMoney(s.payoutUsd, ccy)}
        </div>
        {gap > 0 && (
          <div className="text-[9px] text-amber-dim mt-0.5">
            {t("缺 ", "gap ")}
            {fmtMoney(gap, ccy)}
          </div>
        )}
        {fullyCovered && s.payoutUsd > 0 && (
          <div className="text-[9px] text-green mt-0.5">{t("全兜 (净 0)", "fully bailed (net 0)")}</div>
        )}
      </div>

      <div className="col-span-12 md:col-span-3 text-dim leading-relaxed">{story}</div>
    </div>
  );
}
