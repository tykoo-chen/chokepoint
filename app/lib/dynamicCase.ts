"use client";
import { Case, Factor } from "./cases";
import type { Shipment } from "./schemas";
import type { DecomposeResult } from "./schemas";

const KEY = "chokepoint:dynamic-case";

/**
 * Convert AI-extracted Shipment + decomposed factors into the Case shape used everywhere.
 */
export function buildDynamicCase(shipment: Shipment, decomp: DecomposeResult): Case {
  const factors: Factor[] = decomp.factors.map((f, i) => ({
    id: `dyn-${i}-${f.category}`,
    category: f.category,
    labelZh: f.labelZh,
    polymarketSlug: f.polymarketSlug,
    polymarketSide: f.polymarketSide,
    marketQuestionZh: f.marketQuestionZh,
    rationaleZh: f.rationaleZh,
    severity: f.severity,
    probability: 0.5, // hydrated from /api/markets at runtime
    volume24h: 0,
  }));

  // Estimate transit waypoints — at minimum, origin and destination.
  // For demo purposes we use a great-circle approximation by inserting a
  // midpoint per chokepoint the AI flagged.
  const CHOKEPOINT_LATLNG: Record<string, { lat: number; lng: number; name: string }> = {
    HORMUZ: { lat: 26.57, lng: 56.25, name: "Hormuz" },
    BAB_EL_MANDEB: { lat: 12.58, lng: 43.33, name: "Bab el-Mandeb" },
    SUEZ: { lat: 30.42, lng: 32.35, name: "Suez Canal" },
    MALACCA: { lat: 2.5, lng: 101.4, name: "Malacca" },
    TAIWAN_STRAIT: { lat: 24.5, lng: 119.5, name: "Taiwan Strait" },
    SOUTH_CHINA_SEA: { lat: 15.0, lng: 114.0, name: "SCS" },
    CAPE: { lat: -34.36, lng: 18.48, name: "Cape of Good Hope" },
  };

  const waypoints = [
    { lat: shipment.origin.lat, lng: shipment.origin.lng, name: shipment.origin.name },
    ...shipment.chokepointIds.map((id) => CHOKEPOINT_LATLNG[id]).filter(Boolean),
    { lat: shipment.destination.lat, lng: shipment.destination.lng, name: shipment.destination.name },
  ];

  const docLabel: Record<string, string> = {
    bill_of_lading: "提单",
    sale_contract: "销售合同",
    charter_party: "租船合同",
    letter_of_credit: "信用证",
    commercial_invoice: "商业发票",
    packing_list: "装箱单",
    insurance_certificate: "保险凭证",
    none: "无文件 (演示)",
  };
  const docsSeenZh = (shipment.documentsSeenZh ?? []).map((d) => docLabel[d] ?? d);

  return {
    id: "dynamic",
    title: shipment.titleZh,
    subtitle: shipment.subtitle,
    cargo: shipment.cargo,
    hsCode: shipment.hsCode,
    cargoValueUsd: shipment.cargoValueUsd,
    currency: shipment.currency,
    quantity: shipment.quantity,
    origin: shipment.origin,
    destination: shipment.destination,
    waypoints,
    baselineTransitDays: shipment.baselineTransitDays,
    bufferDays: shipment.bufferDays,
    contractPenaltyPerDayUsd: shipment.contractPenaltyPerDayUsd,
    penaltySource: shipment.penaltySource,
    penaltySourceNoteZh: shipment.penaltySourceNoteZh,
    documentsSeenZh: docsSeenZh,
    chokepointIds: shipment.chokepointIds,
    factors,
    ship: shipment.ship,
    etd: shipment.etd,
    eta: shipment.eta,
    incoterms: shipment.incoterms,
    buyer: shipment.buyer,
    documentLabel: shipment.documentLabel,
    realContext: shipment.realContext,
    painPointZh: shipment.painPointZh,
    clientZh: shipment.buyer,
    sources: [],
  };
}

export function saveDynamicCase(c: Case) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // ignore
  }
}

export function loadDynamicCase(): Case | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Case;
  } catch {
    return null;
  }
}

export function clearDynamicCase() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
