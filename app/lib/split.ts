import { Case, Chokepoint, Factor } from "./cases";
import { RiskModel } from "./risk";

export type Venue =
  | "Polymarket"
  | "Kalshi"
  | "Metaculus"
  | "Baltic Exchange"
  | "ICE"
  | "CME"
  | "Swiss Re"
  | "Self";

export type Leg = {
  id: string;
  venue: Venue;
  instrument: string;
  questionZh: string;
  questionEn?: string;
  side: "YES" | "NO" | "Long" | "Short" | "Capital" | "Fee";
  price: number; // 0..1 for event contracts; spot for futures (indicative)
  notionalUsd: number; // $ allocated
  payoutIfHitUsd: number; // max $ back if it hits
  triggersZh: string;
  triggersEn?: string;
  rationaleZh: string;
  rationaleEn?: string;
  icon: string;
  colorHex: string;
};

const USD_CNY = 7.2;

export function usdToCny(usd: number): number {
  return usd * USD_CNY;
}

export function fmtCny(n: number): string {
  if (n >= 10_000) return `¥${(n / 10_000).toFixed(n >= 100_000 ? 1 : 2)}万`;
  return `¥${Math.round(n).toLocaleString("zh-CN")}`;
}

function categoryZh(c: Factor["category"]): string {
  switch (c) {
    case "weather": return "天气";
    case "price": return "原料价格";
    case "policy": return "政策";
    case "macro": return "宏观";
  }
}
function categoryEn(c: Factor["category"]): string {
  switch (c) {
    case "weather": return "Weather";
    case "price": return "Price";
    case "policy": return "Policy";
    case "macro": return "Macro";
  }
}
function categoryIcon(c: Factor["category"]): string {
  switch (c) {
    case "weather": return "🌀";
    case "price": return "Ξ";
    case "policy": return "⚖";
    case "macro": return "📉";
  }
}
function categoryColor(c: Factor["category"]): string {
  switch (c) {
    case "weather": return "#7dffb1";
    case "price": return "#ffb347";
    case "policy": return "#c084fc";
    case "macro": return "#4fc3f7";
  }
}

/** Build the premium split into actual market orders. */
export function buildSplit(case_: Case, chokepoints: Chokepoint[], risk: RiskModel): Leg[] {
  const P = risk.premiumUsd;
  const legs: Leg[] = [];

  const usesHormuz = chokepoints.some((c) => c.id === "HORMUZ");
  const usesBab = chokepoints.some((c) => c.id === "BAB_EL_MANDEB");
  const usesCape = chokepoints.some((c) => c.id === "CAPE");
  const usesSuez = chokepoints.some((c) => c.id === "SUEZ");
  const usesTyphoon = chokepoints.some((c) => c.id === "SOUTH_CHINA_SEA");
  const usesTaiwan = chokepoints.some((c) => c.id === "TAIWAN_STRAIT");
  const usesMalacca = chokepoints.some((c) => c.id === "MALACCA");

  // --- Layer 1 · Prediction markets (~32% of premium) --------------------
  if (usesHormuz) {
    legs.push({
      id: "pm-hormuz-may",
      venue: "Polymarket",
      instrument: "HORMUZ-NORMAL-MAY31",
      questionZh: "霍尔木兹 5 月 31 日前恢复正常通行?",
      questionEn: "Hormuz traffic returns to normal by May 31?",
      side: "NO",
      price: 0.33,
      notionalUsd: Math.round(P * 0.15),
      payoutIfHitUsd: Math.round((P * 0.15) / 0.33),
      triggersZh: "5 月 31 日收盘仍未恢复正常 → 每股 NO 赔 $1",
      triggersEn: "Resolves NO at May 31 close → each NO share pays $1",
      rationaleZh: "直接对冲本单运输窗口内的海峡持续封锁。",
      rationaleEn: "Direct hedge against Hormuz remaining shut during this voyage's window.",
      icon: "◉",
      colorHex: "#4fc3f7",
    });
    legs.push({
      id: "pm-hormuz-jun",
      venue: "Polymarket",
      instrument: "HORMUZ-NORMAL-JUN30",
      questionZh: "霍尔木兹 6 月 30 日前恢复正常?",
      questionEn: "Hormuz traffic returns to normal by June 30?",
      side: "NO",
      price: 0.45,
      notionalUsd: Math.round(P * 0.08),
      payoutIfHitUsd: Math.round((P * 0.08) / 0.45),
      triggersZh: "6 月 30 日仍未恢复 → 每股 NO 赔 $1",
      triggersEn: "Still not normal by June 30 → each NO share pays $1",
      rationaleZh: "延长对冲期限, 如果危机拖延可接力赔付。",
      rationaleEn: "Extends hedge horizon — covers payout if the crisis drags on.",
      icon: "◉",
      colorHex: "#4fc3f7",
    });
  }

  if (usesBab) {
    legs.push({
      id: "pm-bab-attacks",
      venue: "Polymarket",
      instrument: "HOUTHI-ATTACKS-Q2",
      questionZh: "胡塞武装二季度重启对红海商船攻击?",
      questionEn: "Houthi attacks on Red Sea commercial ships resume in Q2?",
      side: "YES",
      price: 0.42,
      notionalUsd: Math.round(P * 0.06),
      payoutIfHitUsd: Math.round((P * 0.06) / 0.42),
      triggersZh: "胡塞宣布恢复攻击 + UKMTO 事件确认 → YES 结算 $1",
      triggersEn: "Houthi resume attacks + UKMTO incident confirmed → YES settles at $1",
      rationaleZh: "覆盖备选航线(经红海)的政治风险。",
      rationaleEn: "Covers political risk on the alternate Red Sea route.",
      icon: "◉",
      colorHex: "#4fc3f7",
    });
  }

  if (usesCape) {
    legs.push({
      id: "km-cape-share",
      venue: "Kalshi",
      instrument: "CAPE-REROUTE-SHARE-APR",
      questionZh: "4 月亚欧航线经好望角比例 > 70%?",
      questionEn: "Asia-EU April routings via Cape > 70%?",
      side: "YES",
      price: 0.82,
      notionalUsd: Math.round(P * 0.05),
      payoutIfHitUsd: Math.round((P * 0.05) / 0.82),
      triggersZh: "月度 Clarksons 数据结算 > 70% → YES 结算 $1",
      triggersEn: "Monthly Clarksons data resolves > 70% → YES settles at $1",
      rationaleZh: "当货主被迫绕行好望角时, 这里赔付抵销多出的运距成本。",
      rationaleEn: "If we're forced around the Cape, this leg pays back the extra distance cost.",
      icon: "▸",
      colorHex: "#4fc3f7",
    });
  }

  if (usesSuez) {
    legs.push({
      id: "km-suez-low",
      venue: "Kalshi",
      instrument: "SUEZ-TRANSITS-LOW-APR",
      questionZh: "苏伊士 4 月任意一周日均通行 < 40 艘?",
      questionEn: "Suez April: daily transits < 40 in any week?",
      side: "YES",
      price: 0.5,
      notionalUsd: Math.round(P * 0.03),
      payoutIfHitUsd: Math.round((P * 0.03) / 0.5),
      triggersZh: "任一周 SCA 官方日均 < 40 艘 → 结算 $1",
      triggersEn: "Any week's SCA official avg < 40 → settles at $1",
      rationaleZh: "苏伊士低通行量是本航线延误的强先导指标。",
      rationaleEn: "Low Suez transits is a leading indicator for delays on this lane.",
      icon: "▸",
      colorHex: "#4fc3f7",
    });
  }

  if (usesTyphoon) {
    legs.push({
      id: "km-typhoon",
      venue: "Kalshi",
      instrument: "WNP-TYPHOON-MAY",
      questionZh: "5 月南海命名台风扰动商业航线 ≥ 48 小时?",
      questionEn: "Named typhoon disrupts SCS shipping ≥ 48h in May?",
      side: "YES",
      price: 0.35,
      notionalUsd: Math.round(P * 0.08),
      payoutIfHitUsd: Math.round((P * 0.08) / 0.35),
      triggersZh: "JMA 发布警报 + 港口关闭 ≥ 48 小时",
      triggersEn: "JMA issues warning + port closure ≥ 48h",
      rationaleZh: "气象事件直接导致船期延误, 独立于地缘风险。",
      rationaleEn: "Weather events drive direct schedule slippage, independent of geopolitics.",
      icon: "🌀",
      colorHex: "#7dffb1",
    });
  }

  if (usesTaiwan) {
    legs.push({
      id: "pm-taiwan-drill",
      venue: "Polymarket",
      instrument: "TWSTRAIT-DRILL-24H",
      questionZh: "2026 年台湾海峡军事活动封闭商业航道 > 24 小时?",
      questionEn: "Taiwan Strait military activity closes commercial lane > 24h in 2026?",
      side: "YES",
      price: 0.18,
      notionalUsd: Math.round(P * 0.04),
      payoutIfHitUsd: Math.round((P * 0.04) / 0.18),
      triggersZh: "PLA 公告 + 路透社报道确认",
      triggersEn: "PLA announcement + Reuters confirmation",
      rationaleZh: "尾部风险 · 价格低廉但赔付倍数高。",
      rationaleEn: "Tail-risk leg · cheap price, high payout multiple.",
      icon: "◉",
      colorHex: "#4fc3f7",
    });
  }

  if (usesMalacca) {
    legs.push({
      id: "km-malacca-delay",
      venue: "Kalshi",
      instrument: "MALACCA-Q2-DELAY-48H",
      questionZh: "马六甲二季度任意事件导致延误 ≥ 48 小时?",
      questionEn: "Malacca Q2: any event causing ≥ 48h delay?",
      side: "YES",
      price: 0.12,
      notionalUsd: Math.round(P * 0.03),
      payoutIfHitUsd: Math.round((P * 0.03) / 0.12),
      triggersZh: "MPA 通告 + Lloyd's List 确认",
      triggersEn: "MPA bulletin + Lloyd's List confirmation",
      rationaleZh: "廉价尾部保险, 覆盖近目的港最后一段风险。",
      rationaleEn: "Cheap tail insurance for the last leg into destination port.",
      icon: "▸",
      colorHex: "#4fc3f7",
    });
  }

  // --- Layer 1b · Extra factor markets (weather / price / policy / macro) ---
  if (case_.factors && case_.factors.length > 0) {
    const factorBudget = P * 0.18;
    const perFactor = factorBudget / case_.factors.length;
    for (const f of case_.factors) {
      const price = f.polymarketSide === "YES" ? f.probability : 1 - f.probability;
      const safePrice = Math.max(0.02, Math.min(0.98, price));
      const payout = Math.round(perFactor / safePrice);
      legs.push({
        id: `pm-${f.id}`,
        venue: "Polymarket",
        instrument: f.polymarketSlug,
        questionZh: f.marketQuestionZh,
        side: f.polymarketSide,
        price: safePrice,
        notionalUsd: Math.round(perFactor),
        payoutIfHitUsd: payout,
        triggersZh: `${categoryZh(f.category)} · 市场结算为 ${f.polymarketSide} → 每股赔 $1`,
        triggersEn: `${categoryEn(f.category)} · market resolves ${f.polymarketSide} → each share pays $1`,
        rationaleZh: f.rationaleZh,
        rationaleEn: f.rationaleEn ?? f.rationaleZh,
        icon: categoryIcon(f.category),
        colorHex: categoryColor(f.category),
      });
    }
  }

  // --- Layer 2 · Freight / commodity hedge ~24% ---------------------------
  legs.push({
    id: "ffa-td3c",
    venue: "Baltic Exchange",
    instrument: "TD3C · MEG-China · June VLCC",
    questionZh: "中东湾 → 中国 VLCC 运价 (Worldscale)",
    questionEn: "Middle East Gulf → China VLCC freight rate (Worldscale)",
    side: "Long",
    price: 82.5,
    notionalUsd: Math.round(P * 0.14),
    payoutIfHitUsd: Math.round(P * 0.14 * 1.7),
    triggersZh: "运价结算 > WS 105 → 盈利线性递增",
    triggersEn: "Settles > WS 105 → P&L scales linearly",
    rationaleZh: "如果霍尔木兹绕行, MEG-China 运价会飙升, 这条对冲运价上涨。",
    rationaleEn: "If Hormuz forces a detour, MEG-China rates spike — this hedges that surge.",
    icon: "Ξ",
    colorHex: "#ffb347",
  });
  legs.push({
    id: "brent-jun",
    venue: "ICE",
    instrument: "Brent · Jun26 · $95 Call",
    questionZh: "Brent 6 月看涨期权 · 行权 $95",
    questionEn: "Brent June call · strike $95",
    side: "Long",
    price: 3.2,
    notionalUsd: Math.round(P * 0.06),
    payoutIfHitUsd: Math.round(P * 0.06 * 2.4),
    triggersZh: "Brent 期货价 > $95 → 内在价值增长",
    triggersEn: "Brent futures > $95 → intrinsic value rises",
    rationaleZh: "危机推高油价, 对冲客户同时承受的商品价格风险。",
    rationaleEn: "Crisis pushes crude up — hedges the buyer's commodity-price exposure on the same trade.",
    icon: "Ξ",
    colorHex: "#ffb347",
  });

  // --- Layer 3 · Reinsurance ~22% ----------------------------------------
  legs.push({
    id: "swiss-re",
    venue: "Swiss Re",
    instrument: "Stop-loss treaty · attachment $500K",
    questionZh: "单笔赔付超过 $500K 的超额部分",
    questionEn: "Single-claim excess above $500K",
    side: "Capital",
    price: 1,
    notionalUsd: Math.round(P * 0.22),
    payoutIfHitUsd: Math.round(P * 0.22 * 5),
    triggersZh: "单笔赔付 > $500K 时, 再保分担 85%",
    triggersEn: "Single payout > $500K → reinsurer cedes 85%",
    rationaleZh: "极端情景下, 再保险承接尾部, 避免我们自己裸承。",
    rationaleEn: "In extreme scenarios, reinsurance absorbs the tail so we don't carry naked risk.",
    icon: "▮",
    colorHex: "#ff9a3c",
  });

  // --- Layer 4 · Retained capital ~16% -----------------------------------
  legs.push({
    id: "self-capital",
    venue: "Self",
    instrument: "平台自有承保资本",
    questionZh: "基础自留层 · 赔付第一层",
    questionEn: "Base retention layer · first-dollar attachment",
    side: "Capital",
    price: 1,
    notionalUsd: Math.round(P * 0.16),
    payoutIfHitUsd: Math.round(P * 0.16 * 1.5),
    triggersZh: "第一美元即用, 承担前 $250K 赔付",
    triggersEn: "First-dollar exposure, absorbs the first $250K of loss",
    rationaleZh: "保持利益一致 · 我们也赔进去, 客户不怕我们躺平。",
    rationaleEn: "Skin in the game — we pay alongside the customer, so we can't ghost on a claim.",
    icon: "▮",
    colorHex: "#ffb347",
  });

  // --- Layer 5 · Platform + oracle fees ~6% ------------------------------
  legs.push({
    id: "fees",
    venue: "Self",
    instrument: "AIS 数据 · PortWatch · Chokepoint 平台费",
    questionZh: "数据源费 + 智能合约 Gas + 平台",
    questionEn: "Data feed + oracle gas + platform overhead",
    side: "Fee",
    price: 1,
    notionalUsd: Math.round(P * 0.06),
    payoutIfHitUsd: 0,
    triggersZh: "固定成本, 无论是否触发",
    triggersEn: "Fixed cost, charged whether or not triggers fire",
    rationaleZh: "让 AIS 数据源、预言机、平台 7x24 运转。",
    rationaleEn: "Keeps AIS feeds, oracles, and the platform running 24/7.",
    icon: "·",
    colorHex: "#7b8896",
  });

  return legs;
}

export function sumNotional(legs: Leg[]): number {
  return legs.reduce((s, l) => s + l.notionalUsd, 0);
}

export function sumPayout(legs: Leg[]): number {
  return legs.reduce((s, l) => s + l.payoutIfHitUsd, 0);
}

/** Scenario narratives. */
export type Scenario = {
  id: string;
  titleZh: string;
  titleEn: string;
  narrativeZh: string;
  narrativeEn: string;
  hitLegIds: string[];
};

export function scenariosFor(case_: Case, chokepoints: Chokepoint[], legs: Leg[]): Scenario[] {
  const hasHormuz = chokepoints.some((c) => c.id === "HORMUZ");
  const hasBab = chokepoints.some((c) => c.id === "BAB_EL_MANDEB");
  const hasCape = chokepoints.some((c) => c.id === "CAPE");
  const hasTyphoon = chokepoints.some((c) => c.id === "SOUTH_CHINA_SEA");

  const all = legs.map((l) => l.id);
  const scenarios: Scenario[] = [];

  scenarios.push({
    id: "nothing",
    titleZh: "A · 一切顺利",
    titleEn: "A · All clear",
    narrativeZh: "船准时到港, 什么都没发生。保费没用上, 跟你买了车险没出险一样。",
    narrativeEn:
      "Vessel arrives on schedule, nothing fires. Premium is sunk cost — same as paying car insurance and never crashing.",
    hitLegIds: [],
  });

  if (hasHormuz) {
    scenarios.push({
      id: "hormuz-persists",
      titleZh: "B · 霍尔木兹持续封锁",
      titleEn: "B · Hormuz stays shut",
      narrativeZh: "5 月 31 日前海峡未恢复, 船被迫改道经 Yanbu + 好望角, 晚到 25 天。",
      narrativeEn:
        "Hormuz hasn't reopened by May 31; vessel reroutes via Yanbu + Cape, arrives 25 days late.",
      hitLegIds: ["pm-hormuz-may", hasCape ? "km-cape-share" : "", "ffa-td3c", "brent-jun", "self-capital"].filter(Boolean),
    });
  }

  if (hasBab) {
    scenarios.push({
      id: "bab-resume",
      titleZh: "C · 胡塞武装重启攻击",
      titleEn: "C · Houthis resume attacks",
      narrativeZh: "绕行红海的备选航线也成高危区, 保费中下在 BAB_EL_MANDEB 的仓位集中赔付。",
      narrativeEn:
        "Red Sea alternate route becomes a high-risk corridor; the BAB_EL_MANDEB legs of the premium pay out heavily.",
      hitLegIds: ["pm-bab-attacks", "km-suez-low", "ffa-td3c", "self-capital"].filter((i) => all.includes(i)),
    });
  }

  if (hasTyphoon) {
    scenarios.push({
      id: "typhoon",
      titleZh: "D · 南海台风",
      titleEn: "D · South China Sea typhoon",
      narrativeZh: "一场命名台风关闭港口 60 小时, 货延误到港。天气市场和自留层赔付。",
      narrativeEn:
        "A named typhoon closes the port for 60 hours, cargo lands late. Weather market + retention layer pay.",
      hitLegIds: ["km-typhoon", "self-capital"].filter((i) => all.includes(i)),
    });
  }

  scenarios.push({
    id: "worst",
    titleZh: "Z · 最坏情景 · 全触发",
    titleEn: "Z · Worst case · all triggers fire",
    narrativeZh: "霍尔木兹持续 + 红海袭击 + 运价飙升。所有对冲同时赔付, 再保险承接尾部。",
    narrativeEn:
      "Hormuz stays shut + Red Sea attacks + freight rates spike. Every hedge fires simultaneously, reinsurance absorbs the tail.",
    hitLegIds: all.filter((id) => id !== "fees"),
  });

  return scenarios;
}
