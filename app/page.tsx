"use client";
import CaseCard from "./components/CaseCard";
import TopBar from "./components/TopBar";
import Ticker from "./components/Ticker";
import UploadBox from "./components/UploadBox";
import { CASES } from "./lib/cases";
import { useT } from "./lib/i18n";

export default function Home() {
  const t = useT();
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar screen={t("录入 · INTAKE", "INTAKE")} threat={7} />
      <Ticker />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        <section className="flex flex-col gap-3 pt-4">
          <div className="label-kicker">
            /// {t(
              "给跨境进口商 / 项目部署商的参数化延迟保障",
              "Parametric delay cover for cross-border importers & project deployers",
            )}
          </div>
          <h1 className="text-3xl md:text-4xl leading-tight">
            {t("你的货没坏, 但晚了两周 —", "Your cargo isn't damaged — it's just two weeks late.")}
            <br />
            <span className="text-amber">
              {t(
                "促销窗口错过了 / 项目现场 40 位工程师空等 / 客户按天罚款。",
                "Promo window missed · 40 engineers idle on-site · daily LD penalties stacking.",
              )}
            </span>
          </h1>
          <p className="text-dim text-sm max-w-2xl leading-relaxed">
            {t(
              "传统货运险(ICC-A)",
              "Traditional cargo cover (ICC-A) ",
            )}
            <span className="text-amber">
              {t("明文排除 delay loss", "explicitly excludes delay loss")}
            </span>
            {t(
              " — 船没沉、货也没坏, 晚到造成的生意损失它不赔。上传提单, AI 读航线, 匹配活跃海峡/天气/政治风险, 拉 Polymarket · Kalshi · AIS 实时信号, 20 秒给出一张「晚几天赔多少」的参数化保单。",
              ". Ship not sunk, cargo intact — yet the business loss from being late goes unpaid. Upload a B/L, our AI reads the route, matches active chokepoint / weather / policy risks, pulls Polymarket · Kalshi · AIS live signals, and in 20 seconds prices a parametric policy that pays per day late.",
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-faint tracking-widest">
            <span className="px-2 py-0.5 border border-line">AIS · Spire</span>
            <span className="px-2 py-0.5 border border-line">IMF PortWatch</span>
            <span className="px-2 py-0.5 border border-line">Polymarket Gamma API</span>
            <span className="px-2 py-0.5 border border-line">Kalshi</span>
            <span className="px-2 py-0.5 border border-line">Lloyd&apos;s List</span>
            <span className="px-2 py-0.5 border border-line">Baltic Exchange FFA</span>
            <span className="px-2 py-0.5 border border-amber-dim text-amber-dim">
              {t("DEMO · 模拟数据", "DEMO · MOCK DATA")}
            </span>
          </div>
        </section>

        <section>
          <UploadBox />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="label-kicker">
              /// {t(
                "三个 LEC 风格示例 · 2026 年 4 月真实背景",
                "Three LEC-style examples · grounded in April 2026 events",
              )}
            </div>
            <div className="text-[10px] text-faint tracking-widest">
              <span className="text-amber">#01</span>{" "}
              {t("霍尔木兹 · 当下最硬约束", "Hormuz · the hardest constraint right now")}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CASES.map((c, i) => (
              <CaseCard key={c.id} c={c} index={i} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="panel p-4">
            <div className="label-kicker mb-2">01 · {t("AI 风险 Copilot", "AI RISK COPILOT")}</div>
            <div className="text-sm text-dim leading-relaxed">
              {t(
                "读取提单/合同, 识别航线、货值、交期, 匹配活跃 chokepoint, 拟合损失分布。",
                "Reads B/L & contracts, identifies route / value / dates, matches active chokepoints, fits a loss distribution.",
              )}
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-kicker mb-2">02 · {t("参数化赔付", "PARAMETRIC PAYOUT")}</div>
            <div className="text-sm text-dim leading-relaxed">
              {t(
                "AIS 船位 + 到港数据 + 市场信号多源交叉触发, 不看定损单, 72 小时到账。",
                "AIS position + port arrivals + market signals cross-trigger automatically. No adjusters, payout within 72 hours.",
              )}
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-kicker mb-2">03 · {t("自动对冲引擎", "AUTO HEDGE ENGINE")}</div>
            <div className="text-sm text-dim leading-relaxed">
              {t(
                "保费拆单, 分别下到 Polymarket / Kalshi / FFA / 再保险, 自动建仓。",
                "Premium splits across Polymarket / Kalshi / FFA / reinsurance — auto-executed positions.",
              )}
            </div>
          </div>
        </section>

        <footer className="pt-6 pb-8 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
          <div>
            CHOKEPOINT · {t("参数化航运延迟保障 · DEMO MODE · 模拟数据", "Parametric shipping delay cover · DEMO MODE · mock data")}
          </div>
          <div>BUILT FOR TRACK 3 · GLOBAL PRODUCTS</div>
        </footer>
      </main>
    </div>
  );
}
