import "@/app/lib/init";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { ShipmentSchema } from "@/app/lib/schemas";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const SYSTEM = `你是一名跨境航运承保 AI。看到 1 - 5 张提单 / 销售合同 / 租船合同 / 信用证 / 发票, 提取关键字段并以严格 JSON 输出。

**关于罚金条款 (重要):**
- 提单 (B/L) 本身**几乎从不写**违约金, 只是承运契约 + 收据 + 物权凭证
- 真实违约金条款在: 销售合同 (SPA), 租船合同 (Charter Party), 信用证 (L/C), 项目合同 (SLA)
- 看到罚款条款 → 用真实数字, penaltySource = "contract", penaltySourceNoteZh 引用条款
- 没看到 → 给行业典型估值, penaltySource = "estimate", penaltySourceNoteZh 注明"无 SPA / Charter, 按行业基准估"

**估值参考 (使用 estimate 时):**
- 大宗原油 / 矿石: 货值 0.05-0.3% / 天
- 项目货 / EPC 设备: 固定 LD $50K-$500K / 天
- JIT 零部件: 按停产损失估
- 医药 / 季节性消费品: 拒收门槛较低, 按 0.5-1% / 天

documentsSeenZh: 列出实际可见的文件类型, 演示模式无文件就填 ["none"]。

其他规则:
- 必填字段缺失时合理估计
- 经纬度精确到小数点后 2 位
- chokepointIds 只能是: HORMUZ / BAB_EL_MANDEB / SUEZ / MALACCA / TAIWAN_STRAIT / SOUTH_CHINA_SEA / CAPE
- bufferDays: 看货品 (生鲜 1-3, 工业品 5-15, 大宗 4-10, 项目货 2-7)
- painPointZh 必须含至少一个数字, 说清晚到伤客户什么生意
- realContext 引用 2026 年 4 月真实地缘 / 宏观

不输出 JSON 以外内容。不编造船名。`;

const FALLBACK_PROMPT = `用户没上传文件 (演示模式)。请生成一个跨境进口商最具代表性的真实案例: 一票来自不稳定地区 (中东 / 非洲 / 东欧) 的高价值货物运到中国港口, 包含霍尔木兹或苏伊士航线。documentsSeenZh = ["none"], penaltySource = "estimate"。`;

type AnyMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function normalizeMediaType(mt: string | undefined): AnyMediaType | null {
  if (mt === "image/jpeg" || mt === "image/png" || mt === "image/gif" || mt === "image/webp") return mt;
  return null;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set on server" },
      { status: 503 },
    );
  }

  type Img = { base64: string; mediaType: AnyMediaType; filename: string; docHint?: string };
  const images: Img[] = [];
  let userPrompt = "";
  let lang: "zh" | "en" = "zh";

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const hint = form.get("hint");
      if (typeof hint === "string") userPrompt = hint;
      const langField = form.get("lang");
      if (langField === "en" || langField === "zh") lang = langField;
      const files = form.getAll("file");
      const docHints = form.getAll("docType");
      for (let i = 0; i < files.length && images.length < 5; i++) {
        const f = files[i];
        if (!(f instanceof File)) continue;
        const mt = normalizeMediaType(f.type) ?? "image/jpeg";
        const buf = Buffer.from(await f.arrayBuffer());
        images.push({
          base64: buf.toString("base64"),
          mediaType: mt,
          filename: f.name,
          docHint: typeof docHints[i] === "string" ? (docHints[i] as string) : undefined,
        });
      }
    } else if (ct.includes("application/json")) {
      const body = (await req.json()) as { hint?: string; lang?: string };
      userPrompt = body.hint ?? "";
      if (body.lang === "en" || body.lang === "zh") lang = body.lang;
    }
  } catch {
    return NextResponse.json({ error: "could not parse request body" }, { status: 400 });
  }

  const langInstruction =
    lang === "en"
      ? "\n\nIMPORTANT: The user's UI is currently English. Fill ALL English fields (titleEn, cargoEn, painPointEn, realContextEn, penaltySourceNoteEn, buyerEn, clientEn, altRouteLabelEn, plus factor labelEn / marketQuestionEn / rationaleEn) with high-quality English. The Chinese fields (titleZh / painPointZh / etc) must STILL be filled with the same content in Chinese. Output BOTH languages."
      : "";

  const client = new Anthropic();

  const userContent: Anthropic.MessageParam["content"] = [];
  if (images.length > 0) {
    for (const img of images) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: img.mediaType, data: img.base64 },
      });
      const label = img.docHint ? `[${img.docHint}] ${img.filename}` : img.filename;
      userContent.push({ type: "text", text: `↑ 文件: ${label}` });
    }
    userContent.push({
      type: "text",
      text: userPrompt
        ? `提取上面 ${images.length} 份文件的关键字段。补充提示: ${userPrompt}`
        : `提取上面 ${images.length} 份文件的关键字段。注意区分提单(只有航次信息)和合同(才有违约金)。`,
    });
  } else {
    userContent.push({ type: "text", text: userPrompt || FALLBACK_PROMPT });
  }

  try {
    const response = await client.messages.parse({
      model: "claude-opus-4-7",
      max_tokens: 8000,
      system: SYSTEM + langInstruction,
      messages: [{ role: "user", content: userContent }],
      output_config: { format: zodOutputFormat(ShipmentSchema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json(
        { error: "model did not return structured output", stop_reason: response.stop_reason },
        { status: 502 },
      );
    }

    return NextResponse.json({
      shipment: response.parsed_output,
      usage: response.usage,
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Anthropic ${err.status}: ${err.message}` },
        { status: 502 },
      );
    }
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
