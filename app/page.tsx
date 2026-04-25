import CaseCard from "./components/CaseCard";
import TopBar from "./components/TopBar";
import Ticker from "./components/Ticker";
import UploadBox from "./components/UploadBox";
import { CASES } from "./lib/cases";

export default function Home() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <TopBar screen="录入 · INTAKE" threat={7} />
      <Ticker />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col gap-8">
        <section className="flex flex-col gap-3 pt-4">
          <div className="label-kicker">/// 给跨境进口商 / 项目部署商的参数化延迟保障</div>
          <h1 className="text-3xl md:text-4xl leading-tight">
            你的货没坏, 但晚了两周 —
            <br />
            <span className="text-amber">
              促销窗口错过了 / 项目现场 40 位工程师空等 / 客户按天罚款。
            </span>
          </h1>
          <p className="text-dim text-sm max-w-2xl leading-relaxed">
            传统货运险(ICC-A)<span className="text-amber">明文排除 delay loss</span> ——
            船没沉、货也没坏, 晚到造成的生意损失它不赔。
            上传提单, AI 读航线, 匹配活跃海峡/天气/政治风险,
            拉 Polymarket · Kalshi · AIS 实时信号, 20 秒给出一张"晚几天赔多少"的参数化保单。
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-faint tracking-widest">
            <span className="px-2 py-0.5 border border-line">AIS · Spire</span>
            <span className="px-2 py-0.5 border border-line">IMF PortWatch</span>
            <span className="px-2 py-0.5 border border-line">Polymarket Gamma API</span>
            <span className="px-2 py-0.5 border border-line">Kalshi</span>
            <span className="px-2 py-0.5 border border-line">Lloyd&apos;s List</span>
            <span className="px-2 py-0.5 border border-line">Baltic Exchange FFA</span>
            <span className="px-2 py-0.5 border border-amber-dim text-amber-dim">DEMO · 模拟数据</span>
          </div>
        </section>

        <section>
          <UploadBox />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <div className="label-kicker">/// 三个 LEC 风格示例 · 2026 年 4 月真实背景</div>
            <div className="text-[10px] text-faint tracking-widest">
              <span className="text-amber">#01</span> 霍尔木兹 · 当下最硬约束
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
            <div className="label-kicker mb-2">01 · AI 风险 Copilot</div>
            <div className="text-sm text-dim leading-relaxed">
              读取提单/合同, 识别航线、货值、交期, 匹配活跃 chokepoint, 拟合损失分布。
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-kicker mb-2">02 · 参数化赔付</div>
            <div className="text-sm text-dim leading-relaxed">
              AIS 船位 + 到港数据 + 市场信号多源交叉触发, 不看定损单, 72 小时到账。
            </div>
          </div>
          <div className="panel p-4">
            <div className="label-kicker mb-2">03 · 自动对冲引擎</div>
            <div className="text-sm text-dim leading-relaxed">
              保费拆单, 分别下到 Polymarket / Kalshi / FFA / 再保险, 自动建仓。
            </div>
          </div>
        </section>

        <footer className="pt-6 pb-8 border-t border-line text-[10px] text-faint tracking-widest flex items-center justify-between">
          <div>CHOKEPOINT · 参数化航运延迟保障 · DEMO MODE · 模拟数据</div>
          <div>BUILT FOR TRACK 3 · GLOBAL PRODUCTS</div>
        </footer>
      </main>
    </div>
  );
}
