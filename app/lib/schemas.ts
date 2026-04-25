import { z } from "zod";

export const LatLngSchema = z.object({
  name: z.string().describe("Port / city name in English, e.g. 'Ras Tanura, SA'"),
  lat: z.number().describe("Latitude in decimal degrees, -90..90"),
  lng: z.number().describe("Longitude in decimal degrees, -180..180"),
});

export const ShipmentSchema = z.object({
  cargo: z
    .string()
    .describe("Cargo description in Chinese with English brand in parens, e.g. 'Arabian Light Crude (沙特轻质原油)'"),
  cargoType: z
    .enum([
      "crude",
      "refined_oil",
      "lng",
      "lpg",
      "container",
      "drybulk",
      "coal",
      "iron_ore",
      "metal_concentrate",
      "agricultural",
      "chemical",
      "machinery",
      "electronics",
      "vehicles",
      "other",
    ])
    .describe("Coarse cargo class. Use 'other' if unclear."),
  hsCode: z.string().describe("HS commodity code, e.g. '2709.00'. Best guess if not on document."),
  cargoValueUsd: z.number().describe("Total cargo value in USD."),
  currency: z.enum(["USD", "GBP", "CNY", "EUR"]).describe("Original invoice currency."),
  quantity: z.string().describe("Quantity description like '2,000,000 BBL · VLCC' or '200 MT · 8 x 20ft'."),
  origin: LatLngSchema,
  destination: LatLngSchema,
  baselineTransitDays: z.number().int().describe("Expected transit days under normal conditions."),
  bufferDays: z
    .number()
    .int()
    .describe("Buyer's inventory / runway buffer in days before stockout. Best estimate if not on doc."),
  contractPenaltyPerDayUsd: z
    .number()
    .describe(
      "Late-delivery liquidated damages per day in USD. If documents include actual penalty clauses, USE THE REAL NUMBER. If not visible, give an industry-typical estimate.",
    ),
  penaltySource: z
    .enum(["contract", "estimate"])
    .describe(
      "How was contractPenaltyPerDayUsd determined?  'contract' = found explicit liquidated-damages / demurrage / SLA clause in uploaded docs.  'estimate' = no penalty doc uploaded, used industry typical.",
    ),
  penaltySourceNoteZh: z
    .string()
    .describe(
      "1 sentence in Chinese explaining the penalty number's source.  If 'contract': cite which document and clause.  If 'estimate': note industry baseline used (e.g. '货值 0.22% / 天 大宗原油基准, 实际请补 SPA / Charter Party').",
    ),
  penaltySourceNoteEn: z
    .string()
    .optional()
    .describe(
      "Same as penaltySourceNoteZh but in English. Required when the user's UI is in English.",
    ),
  documentsSeenZh: z
    .array(
      z.enum([
        "bill_of_lading",
        "sale_contract",
        "charter_party",
        "letter_of_credit",
        "commercial_invoice",
        "packing_list",
        "insurance_certificate",
        "none",
      ]),
    )
    .describe(
      "Which document types were visible in the user's upload(s).  Use 'none' if user only triggered demo mode without uploading.",
    ),
  ship: z.string().describe("Vessel name + IMO if available, otherwise best label."),
  etd: z.string().describe("ETD as YYYY-MM-DD."),
  eta: z.string().describe("ETA as YYYY-MM-DD."),
  incoterms: z.string().describe("Incoterms, e.g. 'CIF Yantai' or 'FOB Ras Tanura'."),
  buyer: z.string().describe("Buyer / consignee in Chinese (or origin language)."),
  buyerEn: z
    .string()
    .optional()
    .describe("Same buyer in English. Required when UI lang is English."),
  documentLabel: z
    .string()
    .describe("Label like 'Bill of Lading · NGB-9847221' or 'Charter Party · VLCC-XX-1234'."),
  titleZh: z
    .string()
    .describe("Short Chinese title for the shipment, like '沙特原油 → 烟台 · 多市场共振'."),
  titleEn: z
    .string()
    .optional()
    .describe("Same title in English, like 'Saudi crude → Yantai · multi-market resonance'."),
  cargoEn: z
    .string()
    .optional()
    .describe("Cargo description in English."),
  subtitle: z
    .string()
    .describe("Short uppercase EN subtitle, like 'CRUDE · RAS TANURA → YTG'."),
  painPointZh: z
    .string()
    .describe(
      "One-paragraph Chinese summary of the real business pain — what concretely goes wrong if this shipment is late, with numbers if possible.",
    ),
  painPointEn: z
    .string()
    .optional()
    .describe("Same painPointZh in English. Required when UI lang is English."),
  realContext: z
    .string()
    .describe(
      "Short Chinese context on why this shipment is exposed to current real-world risks (geopolitics, weather, market conditions). Reference today's events.",
    ),
  realContextEn: z
    .string()
    .optional()
    .describe("Same realContext in English. Required when UI lang is English."),
  chokepointIds: z
    .array(z.enum(["HORMUZ", "BAB_EL_MANDEB", "SUEZ", "MALACCA", "TAIWAN_STRAIT", "SOUTH_CHINA_SEA", "CAPE"]))
    .describe("Maritime chokepoints this voyage transits. Empty array if none apply."),
});

export type Shipment = z.infer<typeof ShipmentSchema>;

export const FactorRefSchema = z.object({
  category: z.enum(["weather", "price", "policy", "macro"]),
  labelZh: z.string().describe("Short Chinese label for this factor"),
  labelEn: z.string().optional().describe("Same label in English."),
  polymarketSlug: z.string().describe("Exact Polymarket event slug from the search tool"),
  polymarketSide: z
    .enum(["YES", "NO"])
    .describe(
      "Which side of the market means BAD for this shipment. If 'returns to normal' market — pick NO. If 'attack happens' market — pick YES.",
    ),
  marketQuestionZh: z.string().describe("Market question translated to Chinese, ≤ 30 chars."),
  marketQuestionEn: z.string().optional().describe("Original English market question, ≤ 30 chars."),
  rationaleZh: z
    .string()
    .describe(
      "1-2 sentence Chinese explanation of WHY this market price affects THIS specific shipment's outcome.",
    ),
  rationaleEn: z
    .string()
    .optional()
    .describe("Same rationale in English. Required when UI lang is English."),
  severity: z.enum(["low", "med", "high", "critical"]).describe("How impactful for this shipment."),
});

export const DecomposeSchema = z.object({
  factors: z
    .array(FactorRefSchema)
    .describe("Between 3 and 6 factor markets that meaningfully affect this shipment."),
});

export type DecomposeResult = z.infer<typeof DecomposeSchema>;
