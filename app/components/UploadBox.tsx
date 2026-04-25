"use client";
import { buildDynamicCase, saveDynamicCase } from "@/app/lib/dynamicCase";
import type { DecomposeResult, Shipment } from "@/app/lib/schemas";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DocType =
  | "bill_of_lading"
  | "sale_contract"
  | "charter_party"
  | "letter_of_credit"
  | "commercial_invoice"
  | "other";

const DOC_TYPE_LABELS: { value: DocType; zh: string; hint: string }[] = [
  { value: "bill_of_lading", zh: "提单 B/L", hint: "航线 / 船 / 港口 / 日期" },
  { value: "sale_contract", zh: "销售合同 SPA", hint: "★ 真实违约金条款在这里" },
  { value: "charter_party", zh: "租船合同", hint: "滞期费 demurrage 条款" },
  { value: "letter_of_credit", zh: "信用证 L/C", hint: "硬截止日期 + 拒付条款" },
  { value: "commercial_invoice", zh: "商业发票", hint: "货值 / 单价 / Incoterms" },
  { value: "other", zh: "其他", hint: "" },
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

const STEP_LABELS: Record<StepKey, { label: string; detail: string }> = {
  upload: { label: "UPLOAD · 接收文件", detail: "读取本地文件 → 转 base64" },
  ocr: { label: "OCR · Claude Vision", detail: "Claude Opus 4.7 视觉识别 + 字段提取" },
  ner: { label: "NER · 航运要素", detail: "船名 · 港口 · 日期 · 违约金条款" },
  route: { label: "ROUTE · 匹配 chokepoint", detail: "解析航线经过的海峡 / 通道" },
  search: { label: "MKT.SEARCH · Polymarket", detail: "AI 调用 Gamma API 搜索相关市场" },
  decompose: { label: "AI.DECOMPOSE · 拆出 4 维风险", detail: "天气 / 价格 / 政策 / 宏观" },
  price: { label: "PRICE · 实时定价", detail: "Gamma 价格 + 损失分布拟合" },
  done: { label: "READY", detail: "" },
};

const ORDER: StepKey[] = ["upload", "ocr", "ner", "route", "search", "decompose", "price"];

export default function UploadBox() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [busy, setBusy] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [callLog, setCallLog] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  function advance(to: StepKey) {
    setStepIdx(ORDER.indexOf(to));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: Pending[] = [];
    for (let i = 0; i < files.length && pending.length + next.length < 5; i++) {
      const f = files[i];
      // Default new file's docType: first one is BL, rest are SPA-likely
      const defaultType: DocType =
        pending.length + next.length === 0 ? "bill_of_lading" : "sale_contract";
      next.push({ file: f, docType: defaultType });
    }
    setPending((p) => [...p, ...next]);
  }

  function setDocType(idx: number, t: DocType) {
    setPending((p) => p.map((x, i) => (i === idx ? { ...x, docType: t } : x)));
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
    try {
      let body: BodyInit;
      let headers: Record<string, string> = {};
      if (useDemo) {
        body = JSON.stringify({ hint: "" });
        headers = { "Content-Type": "application/json" };
      } else {
        const fd = new FormData();
        for (const p of pending) {
          fd.append("file", p.file);
          fd.append("docType", p.docType);
        }
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
      setError(`OCR 失败: ${msg}`);
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
        body: JSON.stringify({ shipment }),
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
      setError(`AI 拆解失败: ${msg}`);
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

  return (
    <div className="panel-raised p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="label-kicker">上传 · 多文档支持</div>
          <div className="text-sm text-dim mt-1">
            真实 Claude Opus 4.7 视觉提取 + Polymarket 搜索拆解
          </div>
        </div>
        <div className="text-[10px] text-faint max-w-md leading-relaxed">
          ★ <span className="text-amber">提单本身不写违约金</span> —
          要让 AI 提取真实罚则数, 请同时上传销售合同 (SPA) 或租船合同。只传提单,
          AI 会用行业基准估值并明确标记。
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
                    {opt.zh}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeFile(idx)}
                className="text-faint hover:text-red text-[11px]"
                aria-label="移除"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="text-[10px] text-faint pl-1">
            提示: 第一份默认按"提单 B/L"识别, 第二份起按"销售合同 SPA"。点下拉箭头改类型。
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
              <span className="text-amber">添加文件</span>
              <span className="text-faint">
                {pending.length === 0
                  ? " · PDF / JPG / PNG"
                  : ` · 已 ${pending.length}/5`}
              </span>
            </div>
          </button>
          <button
            onClick={() => runRealPipeline(true)}
            className="btn-ghost px-4 text-[11px] tracking-widest"
          >
            没文件 · 跑 AI 生成
          </button>
        </div>
      )}

      {/* Run button */}
      {!busy && pending.length > 0 && (
        <button
          onClick={() => runRealPipeline(false)}
          className="btn-amber w-full py-3 text-sm tracking-[0.3em]"
        >
          ▸ 提取并拆解 · {pending.length} 份文件
        </button>
      )}

      {/* Pipeline progress */}
      {busy && (
        <div className="border-2 border-dashed border-amber-dim rounded-sm py-6 px-6">
          <div className="flex items-center gap-2 text-[11px] text-faint mb-3">
            <span className="w-2 h-2 rounded-full bg-amber pulse-dot" />
            <span className="text-amber">AI 处理中</span>
            <span className="text-dim">{pending.length} 份文件</span>
          </div>
          {ORDER.map((k, i) => {
            const past = i < stepIdx;
            const active = i === stepIdx;
            const meta = STEP_LABELS[k];
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
                <div key={i} className="text-dim">{line}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red bg-red-dim/10 border border-red-dim/40 px-3 py-2">
          ⚠ {error} · 已自动回落到旗舰 demo 案例
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
