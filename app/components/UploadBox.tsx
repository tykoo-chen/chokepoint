"use client";
import { buildDynamicCase, saveDynamicCase } from "@/app/lib/dynamicCase";
import { readLangSync, useT } from "@/app/lib/i18n";
import type { DecomposeResult, Shipment } from "@/app/lib/schemas";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DocType =
  | "bill_of_lading"
  | "sale_contract"
  | "charter_party"
  | "letter_of_credit"
  | "commercial_invoice"
  | "other";

const DOC_TYPE_LABELS: { value: DocType; zh: string; en: string }[] = [
  { value: "bill_of_lading", zh: "提单 B/L", en: "Bill of Lading" },
  { value: "sale_contract", zh: "销售合同 SPA", en: "Sale Contract (SPA)" },
  { value: "charter_party", zh: "租船合同", en: "Charter Party" },
  { value: "letter_of_credit", zh: "信用证 L/C", en: "Letter of Credit" },
  { value: "commercial_invoice", zh: "商业发票", en: "Commercial Invoice" },
  { value: "other", zh: "其他", en: "Other" },
];

type Pending = { file: File; docType: DocType };

type StepKey =
  | "upload"
  | "ocr"
  | "ner"
  | "route"
  | "search"
  | "decompose"
  | "price"
  | "done";

const ORDER: StepKey[] = ["upload", "ocr", "ner", "route", "search", "decompose", "price"];

function stepLabels(t: (zh: string, en: string) => string): Record<StepKey, { label: string; detail: string }> {
  return {
    upload: {
      label: t("UPLOAD · 接收文件", "UPLOAD · Receive files"),
      detail: t("读取本地文件 → 转 base64", "Read local file → base64"),
    },
    ocr: {
      label: t("OCR · Claude Vision", "OCR · Claude Vision"),
      detail: t("Claude Opus 4.7 视觉识别 + 字段提取", "Claude Opus 4.7 visual parsing + field extraction"),
    },
    ner: {
      label: t("NER · 航运要素", "NER · Shipment entities"),
      detail: t("船名 · 港口 · 日期 · 违约金条款", "Vessel · Ports · Dates · LD clauses"),
    },
    route: {
      label: t("ROUTE · 匹配 chokepoint", "ROUTE · Match chokepoints"),
      detail: t("解析航线经过的海峡 / 通道", "Identify straits / corridors on the lane"),
    },
    search: {
      label: t("MKT.SEARCH · Polymarket", "MKT.SEARCH · Polymarket"),
      detail: t("AI 调用 Gamma API 搜索相关市场", "AI calls Gamma API to search relevant markets"),
    },
    decompose: {
      label: t("AI.DECOMPOSE · 拆出 4 维风险", "AI.DECOMPOSE · 4 risk vectors"),
      detail: t("天气 / 价格 / 政策 / 宏观", "Weather / Price / Policy / Macro"),
    },
    price: {
      label: t("PRICE · 实时定价", "PRICE · Live pricing"),
      detail: t("Gamma 价格 + 损失分布拟合", "Gamma prices + loss distribution fit"),
    },
    done: { label: "READY", detail: "" },
  };
}

/** Agent connector definitions for the enterprise-data input lane. */
type AgentConnector = {
  id: string;
  labelZh: string;
  labelEn: string;
  glyph: string;
  detailZh: string;
  detailEn: string;
};
const AGENT_CONNECTORS: AgentConnector[] = [
  {
    id: "claude-code",
    labelZh: "Claude Code · MCP",
    labelEn: "Claude Code · MCP",
    glyph: "◆",
    detailZh: "你企业的 Claude Code 工作台 · 直读所有合同 / ERP / 项目台账",
    detailEn: "Your enterprise Claude Code workspace · reads contracts / ERP / project ledger",
  },
  {
    id: "opencloud",
    labelZh: "Open Cloud · Anthropic",
    labelEn: "Open Cloud · Anthropic",
    glyph: "☁",
    detailZh: "Anthropic Open Cloud 企业接口 · 业务模型 + 知识库",
    detailEn: "Anthropic Open Cloud enterprise endpoint · business models + knowledge base",
  },
  {
    id: "erp",
    labelZh: "ERP · SAP / Oracle / 用友 / 金蝶",
    labelEn: "ERP · SAP / Oracle / 用友 / 金蝶",
    glyph: "▤",
    detailZh: "在途订单 + 库存 + 应付应收",
    detailEn: "In-transit orders + inventory + payables/receivables",
  },
  {
    id: "clm",
    labelZh: "合同管理 · CLM",
    labelEn: "CLM · DocuSign / Ironclad",
    glyph: "⚖",
    detailZh: "DocuSign · Ironclad · 法大大 · 提取 LD 条款",
    detailEn: "DocuSign · Ironclad · 法大大 · extract LD clauses",
  },
  {
    id: "ops",
    labelZh: "ops 财务模型",
    labelEn: "Ops finance model",
    glyph: "📉",
    detailZh: "你团队上次更新的「晚 1 天损失多少」表",
    detailEn: "Your team's most recent 'cost-per-day-late' spreadsheet",
  },
  {
    id: "custom",
    labelZh: "自建企业 Agent · MCP server",
    labelEn: "Custom enterprise Agent · MCP server",
    glyph: "▣",
    detailZh: "你自己写的 MCP server · 完全私域",
    detailEn: "Your own MCP server · fully private",
  },
];

/** Mock recommendations the connected Agent surfaces. Real-world this would
 * come from the Agent's call tools; here we hard-link to our 3 demo cases. */
type AgentRec = {
  caseId: string;
  titleZh: string;
  titleEn: string;
  cargoValue: string;
  disruptionPct: string;
};
const AGENT_RECOMMENDATIONS: AgentRec[] = [
  {
    caseId: "saudi-crude-yantai",
    titleZh: "沙特原油 → 中石化烟台炼厂",
    titleEn: "Saudi crude → Sinopec Yantai refinery",
    cargoValue: "$128M",
    disruptionPct: "84.5%",
  },
  {
    caseId: "tsingtao-felixstowe",
    titleZh: "青岛啤酒 → 英国 Felixstowe",
    titleEn: "Tsingtao beer → UK Felixstowe",
    cargoValue: "£480K",
    disruptionPct: "52.1%",
  },
  {
    caseId: "xbot-heathrow",
    titleZh: "XBOT 清洁机器人 → 伦敦希思罗 T5",
    titleEn: "XBOT cleaning robots → London Heathrow T5",
    cargoValue: "£850K",
    disruptionPct: "68.3%",
  },
];

export default function UploadBox() {
  const t = useT();
  const labels = stepLabels(t);

  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [callLog, setCallLog] = useState<string[]>([]);
  /** Which Agent connectors the user has "connected" (mocked). */
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const connectedCount = Object.values(connected).filter(Boolean).length;
  const isAgentMode = connectedCount > 0;

  function advance(to: StepKey) {
    setStepIdx(ORDER.indexOf(to));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Pending[] = [];
    for (let i = 0; i < files.length && pending.length + next.length < 5; i++) {
      const f = files[i];
      const defaultType: DocType =
        pending.length + next.length === 0 ? "bill_of_lading" : "sale_contract";
      next.push({ file: f, docType: defaultType });
    }
    setPending((p) => [...p, ...next]);
  }

  function setDocType(idx: number, dt: DocType) {
    setPending((p) => p.map((x, i) => (i === idx ? { ...x, docType: dt } : x)));
  }

  function removeFile(idx: number) {
    setPending((p) => p.filter((_, i) => i !== idx));
  }

  async function runRealPipeline(useDemo: boolean) {
    setBusy(true);
    setError(null);
    setCallLog([]);

    advance("upload");
    await new Promise((r) => setTimeout(r, 200));

    advance("ocr");
    let shipment: Shipment | null = null;
    const lang = readLangSync();
    try {
      let body: BodyInit;
      let headers: Record<string, string> = {};
      if (useDemo) {
        body = JSON.stringify({ hint: "", lang });
        headers = { "Content-Type": "application/json" };
      } else {
        const fd = new FormData();
        for (const p of pending) {
          fd.append("file", p.file);
          fd.append("docType", p.docType);
        }
        fd.append("lang", lang);
        body = fd;
      }
      const r = await fetch("/api/extract", { method: "POST", body, headers });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${r.status}`);
      }
      const j = (await r.json()) as { shipment: Shipment };
      shipment = j.shipment;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "extract failed";
      setError(t(`OCR 失败: ${msg}`, `OCR failed: ${msg}`));
      await new Promise((r) => setTimeout(r, 800));
      router.push("/map?case=saudi-crude-yantai&from=upload-failed");
      return;
    }

    advance("ner");
    await new Promise((r) => setTimeout(r, 200));
    advance("route");
    await new Promise((r) => setTimeout(r, 150));

    advance("search");
    let decomp: DecomposeResult | null = null;
    try {
      const r = await fetch("/api/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipment, lang }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${r.status}`);
      }
      const j = (await r.json()) as {
        decomposition: DecomposeResult;
        callLog: Array<{ tool: string; input: unknown }>;
      };
      decomp = j.decomposition;
      const log = j.callLog ?? [];
      setCallLog(
        log.map((c) => {
          if (c.tool === "search_polymarket") {
            const input = c.input as { query?: string };
            return `▸ search "${input.query ?? ""}"`;
          }
          if (c.tool === "submit_decomposition")
            return `✓ submit ${(c.input as { factors?: unknown[] }).factors?.length ?? 0} factors`;
          return `· ${c.tool}`;
        }),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "decompose failed";
      setError(t(`AI 拆解失败: ${msg}`, `AI decomposition failed: ${msg}`));
      await new Promise((r) => setTimeout(r, 800));
      router.push("/map?case=saudi-crude-yantai&from=decompose-failed");
      return;
    }

    advance("decompose");
    await new Promise((r) => setTimeout(r, 200));
    advance("price");
    await new Promise((r) => setTimeout(r, 200));

    if (shipment && decomp) {
      const dynCase = buildDynamicCase(shipment, decomp);
      saveDynamicCase(dynCase);
      advance("done");
      router.push("/map?case=dynamic&from=upload");
    }
  }

  function toggleConnector(id: string) {
    setConnected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="panel-raised p-6 flex flex-col gap-4">
      {/* === Lane A · Enterprise Agent connection ============================ */}
      <div className="border border-amber-dim/50 bg-amber/5 rounded-sm p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="label-kicker text-amber">
              /// {t("企业 Agent 接入 · 推荐主路径", "ENTERPRISE AGENT CONNECT · recommended")}
            </div>
            <div className="text-[12px] text-dim mt-1 leading-relaxed max-w-2xl">
              {t(
                "把你企业的 Agent 接进来 (Claude Code MCP / Open Cloud / 自建 MCP server), JUSTINCASE 直接读 ERP / 合同 / 项目台账 / ops 模型。不再需要一份份上传 PDF — 你今天该买哪几票保单, AI 自己告诉你。",
                "Connect your enterprise Agent (Claude Code MCP / Open Cloud / your own MCP server). JUSTINCASE reads ERP / contracts / project ledgers / ops models directly. No more one-PDF-at-a-time — the Agent surfaces today's policy candidates for you.",
              )}
            </div>
          </div>
          <div className="text-[10px] text-faint tracking-widest text-right whitespace-nowrap">
            {isAgentMode ? (
              <span className="text-green">
                ● {t(`已连接 ${connectedCount} 路`, `${connectedCount} CONNECTED`)}
              </span>
            ) : (
              <span className="text-amber-dim">
                ○ {t("未连接 · 演示用", "NOT CONNECTED · demo mode")}
              </span>
            )}
          </div>
        </div>

        {/* Connector grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {AGENT_CONNECTORS.map((c) => {
            const on = !!connected[c.id];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleConnector(c.id)}
                className={`text-left px-3 py-2.5 border rounded-sm transition-colors text-[11px] flex items-start gap-2 ${
                  on
                    ? "border-green bg-green/10"
                    : "border-line bg-panel-2/40 hover:border-amber-dim"
                }`}
              >
                <span className={`text-base mt-0.5 ${on ? "text-green" : "text-amber-dim"}`}>
                  {c.glyph}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`${on ? "text-green" : "text-text"} font-medium truncate`}>
                      {t(c.labelZh, c.labelEn)}
                    </span>
                    <span
                      className={`text-[9px] tracking-widest ${on ? "text-green" : "text-faint"}`}
                    >
                      {on ? t("● 已连", "● ON") : t("○ 接入", "○ CONNECT")}
                    </span>
                  </div>
                  <div className="text-[10px] text-faint leading-snug mt-0.5">
                    {t(c.detailZh, c.detailEn)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Once at least one connector is on, show the Agent's "today's pick" */}
        {isAgentMode && (
          <div className="border-t border-amber-dim/40 pt-3 flex flex-col gap-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div className="text-[11px] text-text">
                <span className="text-amber-dim tracking-widest">
                  {t("AGENT 已读取 · ", "AGENT HAS READ · ")}
                </span>
                <span className="text-amber tabular-nums">23</span>{" "}
                {t("票活动航次", "active voyages")}
                <span className="text-faint mx-1">·</span>
                <span className="text-amber tabular-nums">47</span>{" "}
                {t("份合同", "contracts")}
                <span className="text-faint">{" "}({t("12 含 LD", "12 with LD")})</span>
                <span className="text-faint mx-1">·</span>
                <span className="text-amber tabular-nums">8</span>{" "}
                {t("个项目 go-live", "project go-lives")}
              </div>
              <div className="text-[10px] text-faint">
                {t("Agent 上次同步 · 5 分钟前", "Agent last sync · 5 min ago")}
              </div>
            </div>
            <div className="text-[11px] text-amber-dim tracking-widest">
              ↓ {t("AI 今天发现值得上保单的 3 票", "AI flagged 3 voyages worth covering today")}
            </div>
            <div className="flex flex-col gap-1">
              {AGENT_RECOMMENDATIONS.map((r, idx) => (
                <Link
                  key={r.caseId}
                  href={`/map?case=${r.caseId}`}
                  className="group flex items-center gap-3 px-3 py-2 border border-line bg-panel/60 hover:border-amber transition-colors text-[11px]"
                >
                  <span className="text-amber-dim tabular-nums w-7">[0{idx + 1}]</span>
                  <span className="flex-1 text-text truncate">
                    {t(r.titleZh, r.titleEn)}
                  </span>
                  <span className="text-amber tabular-nums">{r.cargoValue}</span>
                  <span className="text-amber-dim text-[10px]">·</span>
                  <span className="text-amber tabular-nums">
                    {t("出事 ", "trip ")}
                    {r.disruptionPct}
                  </span>
                  <span className="text-amber group-hover:text-amber-bright tracking-widest">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === Lane B · Manual file upload (fallback) ========================== */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label-kicker">
            {t("或者 · 上传单个文件 (备用通道)", "OR · upload a single file (fallback)")}
          </div>
          <div className="text-sm text-dim mt-1">
            {t(
              "真实 Claude Opus 4.7 视觉提取 + Polymarket 搜索拆解",
              "Real Claude Opus 4.7 vision extraction + Polymarket decomposition",
            )}
          </div>
        </div>
        <div className="text-[10px] text-faint max-w-md leading-relaxed">
          ★{" "}
          <span className="text-amber">
            {t("提单本身不写违约金", "B/L itself rarely contains LD clauses")}
          </span>{" "}
          —{" "}
          {t(
            "要让 AI 提取真实罚则数, 请同时上传销售合同 (SPA) 或租船合同。",
            "to extract a real penalty number, also upload the sale contract (SPA) or charter party.",
          )}
        </div>
      </div>

      {/* File list */}
      {!busy && pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((p, idx) => (
            <div key={idx} className="panel p-3 flex items-center gap-3 text-[11px]">
              <span className="text-amber-dim">📄</span>
              <span className="text-dim flex-1 truncate">{p.file.name}</span>
              <select
                value={p.docType}
                onChange={(e) => setDocType(idx, e.target.value as DocType)}
                className="bg-panel-2 border border-line text-dim text-[11px] px-2 py-1 outline-none focus:border-amber-dim"
              >
                {DOC_TYPE_LABELS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.zh, opt.en)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeFile(idx)}
                className="text-faint hover:text-red text-[11px]"
                aria-label={t("移除", "Remove")}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="text-[10px] text-faint pl-1">
            {t(
              '提示: 第一份默认按"提单 B/L"识别, 第二份起按"销售合同 SPA"。点下拉箭头改类型。',
              'Tip: first file defaults to "Bill of Lading", subsequent files default to "Sale Contract (SPA)". Use the dropdown to change.',
            )}
          </div>
        </div>
      )}

      {/* Upload zone */}
      {!busy && (
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={pending.length >= 5}
            className="flex-1 border-2 border-dashed border-line hover:border-amber-dim transition-colors rounded-sm py-6 flex flex-col items-center gap-1 text-center disabled:opacity-40"
          >
            <div className="text-2xl text-amber-dim">⇪</div>
            <div className="text-dim text-sm">
              <span className="text-amber">{t("添加文件", "Add file")}</span>
              <span className="text-faint">
                {pending.length === 0
                  ? " · PDF / JPG / PNG"
                  : ` · ${t(`已 ${pending.length}/5`, `${pending.length}/5 added`)}`}
              </span>
            </div>
          </button>
          <button
            onClick={() => runRealPipeline(true)}
            className="btn-ghost px-4 text-[11px] tracking-widest"
          >
            {t("没文件 · 跑 AI 生成", "No files · run AI demo")}
          </button>
        </div>
      )}

      {/* Run button */}
      {!busy && pending.length > 0 && (
        <button
          onClick={() => runRealPipeline(false)}
          className="btn-amber w-full py-3 text-sm"
          style={{ letterSpacing: "0.2em" }}
        >
          {t(
            `▸ 提取并拆解 · ${pending.length} 份文件`,
            `▸ EXTRACT · ${pending.length} ${pending.length === 1 ? "FILE" : "FILES"}`,
          )}
        </button>
      )}

      {/* Pipeline progress */}
      {busy && (
        <div className="border-2 border-dashed border-amber-dim rounded-sm py-6 px-6">
          <div className="flex items-center gap-2 text-[11px] text-faint mb-3">
            <span className="w-2 h-2 rounded-full bg-amber pulse-dot" />
            <span className="text-amber">{t("AI 处理中", "AI working")}</span>
            <span className="text-dim">
              {pending.length} {t("份文件", pending.length === 1 ? "file" : "files")}
            </span>
          </div>
          {ORDER.map((k, i) => {
            const past = i < stepIdx;
            const active = i === stepIdx;
            const meta = labels[k];
            return (
              <div key={k} className="flex items-center gap-3 text-[11px] py-0.5">
                <span
                  className={`w-4 text-center ${past ? "text-green" : active ? "text-amber blink" : "text-faint"}`}
                >
                  {past ? "✓" : active ? "▸" : "·"}
                </span>
                <span className={`w-44 ${past ? "text-dim" : active ? "text-amber" : "text-faint"}`}>
                  {meta.label}
                </span>
                <span className={`${past || active ? "text-dim" : "text-faint"}`}>
                  {meta.detail}
                </span>
              </div>
            );
          })}
          {callLog.length > 0 && (
            <div className="mt-3 px-3 py-2 border border-line bg-panel-2 text-[10px] text-faint">
              <div className="text-amber-dim tracking-widest mb-1">AI TOOL CALLS</div>
              {callLog.map((line, i) => (
                <div key={i} className="text-dim">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red bg-red-dim/10 border border-red-dim/40 px-3 py-2">
          ⚠ {error} ·{" "}
          {t("已自动回落到旗舰 demo 案例", "Auto-fell-back to flagship demo case")}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,application/pdf"
        onChange={(e) => {
          addFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
}
