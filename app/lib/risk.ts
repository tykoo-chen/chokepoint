import type { Case, Chokepoint } from "./cases";

export type DelayScenario = {
  days: number;
  probability: number;
  lossUsd: number;
  label: string;
};

export type RiskModel = {
  combinedDisruptionProb: number;
  p50DelayDays: number;
  p90DelayDays: number;
  p99DelayDays: number;
  expectedLossUsd: number;
  scenarios: DelayScenario[];
  recommendedCoverageUsd: number;
  premiumUsd: number;
  triggers: Trigger[];
};

export type Trigger = {
  code: string;
  description: string;
  source: string;
  payoutUsd: number;
  threshold: string;
};

function overIndemnity(case_: Case, delayDays: number): number {
  const beyondBuffer = Math.max(0, delayDays - case_.bufferDays);
  const penalty = beyondBuffer * case_.contractPenaltyPerDayUsd;
  const carryCost = beyondBuffer * case_.cargoValueUsd * 0.00012;
  const workingCap = beyondBuffer * case_.cargoValueUsd * 0.00018;
  return Math.round(penalty + carryCost + workingCap);
}

export function buildRiskModel(case_: Case, chokepoints: Chokepoint[]): RiskModel {
  const worst = chokepoints.reduce((m, c) => Math.max(m, c.probability), 0);
  const combinedDisruptionProb = 1 - chokepoints.reduce((p, c) => p * (1 - c.probability * 0.6), 1);

  const severityDays = (s: Chokepoint["severity"]) =>
    s === "critical" ? 24 : s === "high" ? 14 : s === "med" ? 8 : 3;
  const worstSeverityDays = chokepoints.reduce((m, c) => Math.max(m, severityDays(c.severity)), 3);
  const E = combinedDisruptionProb * worstSeverityDays + 2;

  const p50 = Math.max(1, Math.round(E * 0.45));
  const p90 = Math.max(Math.round(E * 1.15), case_.bufferDays + 3);
  const p99 = Math.max(Math.round(E * 1.85), case_.bufferDays + 10);

  const scenarios: DelayScenario[] = [
    { days: p50, probability: 0.5, lossUsd: overIndemnity(case_, p50), label: "P50" },
    { days: p90, probability: 0.1, lossUsd: overIndemnity(case_, p90), label: "P90" },
    { days: p99, probability: 0.01, lossUsd: overIndemnity(case_, p99), label: "P99" },
  ];

  const expectedLossUsd = Math.round(
    scenarios.reduce((sum, s) => sum + s.probability * s.lossUsd, 0) * 1.8,
  );

  const recommendedCoverageUsd = Math.round(scenarios[1].lossUsd / 50_000) * 50_000;
  const premiumUsd = Math.round(recommendedCoverageUsd * (0.018 + worst * 0.025));

  const triggers: Trigger[] = [
    {
      code: "DELAY.ETA.10D",
      description: "ETA delay ≥ 10 days vs. B/L baseline",
      source: "AIS (Spire) × Port arrivals",
      payoutUsd: Math.round(recommendedCoverageUsd * 0.2),
      threshold: "10 days",
    },
    {
      code: "DELAY.ETA.20D",
      description: "ETA delay ≥ 20 days vs. B/L baseline",
      source: "AIS (Spire) × Port arrivals",
      payoutUsd: Math.round(recommendedCoverageUsd * 0.5),
      threshold: "20 days",
    },
    {
      code: "DELAY.ETA.30D",
      description: "ETA delay ≥ 30 days vs. B/L baseline",
      source: "AIS (Spire) × Port arrivals",
      payoutUsd: recommendedCoverageUsd,
      threshold: "30 days",
    },
    ...chokepoints.slice(0, 2).map((c) => ({
      code: `CHOKE.${c.id}`,
      description: `${c.name} transit disruption confirmed`,
      source: "IMF PortWatch + Lloyd's List",
      payoutUsd: Math.round(recommendedCoverageUsd * 0.3),
      threshold: c.marketQuestion,
    })),
  ];

  return {
    combinedDisruptionProb,
    p50DelayDays: p50,
    p90DelayDays: p90,
    p99DelayDays: p99,
    expectedLossUsd,
    scenarios,
    recommendedCoverageUsd,
    premiumUsd,
    triggers,
  };
}

export type Currency = "USD" | "GBP" | "CNY" | "EUR";

const SYMBOL: Record<Currency, string> = { USD: "$", GBP: "£", CNY: "¥", EUR: "€" };
// Internal numbers are in USD; convert on display.
const RATE_FROM_USD: Record<Currency, number> = { USD: 1, GBP: 0.79, EUR: 0.92, CNY: 7.2 };

export function toCurrency(usd: number, ccy: Currency): number {
  return usd * RATE_FROM_USD[ccy];
}

export function fmtMoney(usd: number, ccy: Currency = "USD"): string {
  const v = toCurrency(usd, ccy);
  const sym = SYMBOL[ccy];
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`;
  if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(0)}K`;
  return `${sym}${v.toFixed(0)}`;
}

export function fmtMoneyLong(usd: number, ccy: Currency = "USD"): string {
  const v = toCurrency(usd, ccy);
  const sym = SYMBOL[ccy];
  return `${sym}${Math.round(v).toLocaleString(ccy === "CNY" ? "zh-CN" : "en-GB")}`;
}

// legacy aliases — kept so the Split page doesn't have to be rewritten
export function fmtUsd(n: number): string {
  return fmtMoney(n, "USD");
}
export function fmtUsdLong(n: number): string {
  return fmtMoneyLong(n, "USD");
}

export function fmtPct(n: number, digits = 0): string {
  return `${(n * 100).toFixed(digits)}%`;
}
