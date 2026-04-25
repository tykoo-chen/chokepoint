import "@/app/lib/init";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DecomposeSchema, type DecomposeResult, ShipmentSchema, type Shipment } from "@/app/lib/schemas";
import { searchPolymarket } from "@/app/lib/polymarketSearch";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

const SYSTEM = `你是一名 AI 风险拆解师, 必须高效。

任务: 给你一票航次, 找 3-5 个 Polymarket 活跃市场, 每个对应一个独立风险维度。

工作流 (严格):
1. 最多调用 search_polymarket 4 次, 每次用一个不同维度的关键词:
   - weather: "hurricane" 或 "typhoon"
   - price: "WTI" 或 "Brent"
   - policy: "Russia Ukraine" 或 "Iran"
   - macro: "Fed"
2. 每次搜完, 从结果里选**1 个**最相关、成交量最大的市场
3. 4 次搜索后立即 submit_decomposition (3-5 个 factor)

每个 factor:
- polymarketSlug: 必须是 search 返回的真实 slug
- polymarketSide: 哪一侧 (YES/NO) "对这票货坏"
- rationaleZh: 1 句话中文, 说清楚因果传导
- severity: low/med/high/critical
- category: weather/price/policy/macro 各自映射

效率: 不要 search 同一关键词的多个变体。不要超过 4 次 search 调用。立刻收尾。`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set on server" },
      { status: 503 },
    );
  }

  let shipment: Shipment;
  try {
    const body = (await req.json()) as { shipment: Shipment };
    shipment = ShipmentSchema.parse(body.shipment);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const client = new Anthropic();

  let captured: DecomposeResult | null = null;
  const callLog: Array<{ tool: string; input: unknown }> = [];

  const searchTool = betaZodTool({
    name: "search_polymarket",
    description:
      "Search Polymarket Gamma API for active prediction market events. Returns up to 5 matches with current YES / NO prices, 24h volume, liquidity, and end date. Use this to find real, tradeable markets — never invent slugs.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("Keywords (English) like 'hurricane US May', 'WTI April', 'Russia Ukraine ceasefire May'"),
    }),
    run: async (input) => {
      callLog.push({ tool: "search_polymarket", input });
      const hits = await searchPolymarket(input.query, 5);
      return JSON.stringify(hits);
    },
  });

  const submitTool = betaZodTool({
    name: "submit_decomposition",
    description:
      "Submit the final factor decomposition. Call this EXACTLY ONCE after you've gathered all the markets you need. Provide between 3 and 6 factors covering as many of the four categories as possible (weather/price/policy/macro).",
    inputSchema: DecomposeSchema,
    run: async (input) => {
      captured = input;
      callLog.push({ tool: "submit_decomposition", input });
      return "Decomposition recorded. End your turn now — do not call any more tools.";
    },
  });

  const userPrompt = `本票航次:\n${JSON.stringify(shipment, null, 2)}\n\n请用 search_polymarket 工具找相关市场, 然后调用 submit_decomposition 提交 3-6 个 factor。`;

  try {
    const runner = client.beta.messages.toolRunner({
      // Sonnet 4.6 is plenty smart for tool selection + 1-line rationales,
      // and 3-4x faster than Opus on this loop — fits Vercel's 60s ceiling.
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: SYSTEM,
      tools: [searchTool, submitTool],
      messages: [{ role: "user", content: userPrompt }],
      max_iterations: 6,
      output_config: { effort: "low" },
    });
    const final = await runner.runUntilDone();

    if (!captured) {
      return NextResponse.json(
        {
          error: "model did not call submit_decomposition",
          stop_reason: final.stop_reason,
          callLog,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      decomposition: captured,
      callLog,
      usage: final.usage,
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
