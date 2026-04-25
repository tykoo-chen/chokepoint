export type LatLng = { lat: number; lng: number; name?: string };

export type Chokepoint = {
  id: string;
  name: string;
  nameZh: string;
  lat: number;
  lng: number;
  marketQuestion: string;
  marketQuestionZh: string;
  marketSource: string;
  /**
   * When set, the "disruption" probability is derived live from this Polymarket event.
   * For YES-framed "returns to normal" markets we take (1 - YES). For YES-framed
   * "effectively closed" markets we take YES directly. Signal below.
   */
  polymarketSlug?: string;
  polymarketSide?: "YES" | "NO_IS_DISRUPTION"; // NO_IS_DISRUPTION → use (1 - YES)
  probability: number;
  probability24hDelta: number;
  severity: "low" | "med" | "high" | "critical";
  volume24h: number;
  realNews?: string;
  lastTickMs: number;
};

/** A single non-chokepoint factor the shipment is exposed to (weather / price / policy). */
export type Factor = {
  id: string;
  category: "weather" | "price" | "policy" | "macro";
  labelZh: string;
  // Polymarket binding
  polymarketSlug: string;
  polymarketSide: "YES" | "NO"; // which side represents "bad for this shipment"
  marketQuestionZh: string;
  rationaleZh: string; // why this particular shipment is exposed to this factor
  severity: "low" | "med" | "high" | "critical";
  // live-refreshed
  probability: number;
  volume24h: number;
};

export type Case = {
  id: string;
  title: string;
  subtitle: string;
  cargo: string;
  hsCode: string;
  cargoValueUsd: number;
  currency: "USD" | "GBP" | "CNY" | "EUR";
  quantity: string;
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  altRoute?: LatLng[];
  altRouteLabel?: string;
  baselineTransitDays: number;
  bufferDays: number;
  contractPenaltyPerDayUsd: number;
  /** "contract" = real clause in user-uploaded doc · "estimate" = industry typical */
  penaltySource?: "contract" | "estimate";
  penaltySourceNoteZh?: string;
  documentsSeenZh?: string[];
  chokepointIds: string[];
  factors?: Factor[]; // extra factor exposures beyond chokepoints
  ship: string;
  etd: string;
  eta: string;
  incoterms: string;
  buyer: string;
  documentLabel: string;
  realContext?: string;
  painPointZh?: string;
  clientZh?: string;
  sources?: { label: string; url: string }[];
};

// Probabilities reflect real April 2026 prediction-market prices and news reporting.
// HORMUZ: Polymarket "Hormuz normal by May 15" ~15% YES → 85% disrupted in shipment window.
// BAB_EL_MANDEB: Post-Oct-2025 ceasefire paused attacks, but Feb-2026 Iran war re-activated threat.
// CAPE: Redirected Asia-Europe traffic share high; adds ~12 transit days.
export const CHOKEPOINTS: Record<string, Chokepoint> = {
  HORMUZ: {
    id: "HORMUZ",
    name: "Strait of Hormuz",
    nameZh: "霍尔木兹海峡",
    lat: 26.57,
    lng: 56.25,
    marketQuestion: "Hormuz traffic returns to normal by May 15, 2026?",
    marketQuestionZh: "霍尔木兹 5 月 15 日前恢复正常通行?",
    marketSource: "Polymarket · live",
    polymarketSlug: "strait-of-hormuz-traffic-returns-to-normal-by-may-15",
    polymarketSide: "NO_IS_DISRUPTION",
    probability: 0.855, // seed from 2026-04-24 snapshot; live-refreshed
    probability24hDelta: +0.04,
    severity: "critical",
    volume24h: 149_000,
    realNews: "April 19: only 3 vessels transited Hormuz; Iran charging $1M+ toll during brief re-openings",
    lastTickMs: 0,
  },
  BAB_EL_MANDEB: {
    id: "BAB_EL_MANDEB",
    name: "Bab el-Mandeb",
    nameZh: "曼德海峡 / 红海南口",
    lat: 12.58,
    lng: 43.33,
    marketQuestion: "Bab el-Mandeb effectively closed by deadline?",
    marketQuestionZh: "曼德海峡短期内被胡塞武装有效封闭?",
    marketSource: "Polymarket · live",
    polymarketSlug: "bab-el-mandeb-strait-effectively-closed-by",
    polymarketSide: "YES",
    probability: 0.08, // seed; live-refreshed
    probability24hDelta: +0.03,
    severity: "high",
    volume24h: 83_000,
    realNews: "USS George H.W. Bush rerouting around Cape; Houthis threaten to close Bab el-Mandeb",
    lastTickMs: 0,
  },
  SUEZ: {
    id: "SUEZ",
    name: "Suez Canal",
    nameZh: "苏伊士运河",
    lat: 30.42,
    lng: 32.35,
    marketQuestion: "2k+ container transits of Suez in H1 2026?",
    marketQuestionZh: "苏伊士运河 H1 2026 集装箱船通行 ≥ 2000 艘?",
    marketSource: "Polymarket · live",
    polymarketSlug: "2k-container-ship-transits-of-suez-canal-in-h1-2026",
    polymarketSide: "NO_IS_DISRUPTION",
    probability: 0.978, // seed from 2.2% YES → 97.8% disruption signal
    probability24hDelta: +0.02,
    severity: "high",
    volume24h: 18_000,
    realNews: "Red Sea rerouting cut Suez transits ~60% vs pre-crisis baseline; 2k H1 target essentially ruled out",
    lastTickMs: 0,
  },
  MALACCA: {
    id: "MALACCA",
    name: "Strait of Malacca",
    nameZh: "马六甲海峡",
    lat: 2.5,
    lng: 101.4,
    marketQuestion: "Malacca transit delay > 48h from any cause in Q2 2026?",
    marketQuestionZh: "马六甲二季度任意原因延误 48 小时以上?",
    marketSource: "Kalshi",
    probability: 0.11,
    probability24hDelta: 0.0,
    severity: "low",
    volume24h: 188_000,
    lastTickMs: 0,
  },
  TAIWAN_STRAIT: {
    id: "TAIWAN_STRAIT",
    name: "Taiwan Strait",
    nameZh: "台湾海峡",
    lat: 24.5,
    lng: 119.5,
    marketQuestion: "Will China invade Taiwan by Dec 31, 2027?",
    marketQuestionZh: "2027 年 12 月底前中国大陆对台发起军事行动?",
    marketSource: "Polymarket · live",
    polymarketSlug: "will-china-invade-taiwan-by-december-31-2027",
    polymarketSide: "YES",
    probability: 0.17,
    probability24hDelta: +0.01,
    severity: "med",
    volume24h: 15_800,
    lastTickMs: 0,
  },
  SOUTH_CHINA_SEA: {
    id: "SOUTH_CHINA_SEA",
    name: "South China Sea · typhoon",
    nameZh: "南海 · 台风走廊",
    lat: 15.0,
    lng: 114.0,
    marketQuestion: "Named typhoon disrupts SCS shipping in May 2026?",
    marketQuestionZh: "5 月台风在南海航运走廊造成扰动?",
    marketSource: "Kalshi weather",
    probability: 0.32,
    probability24hDelta: +0.02,
    severity: "med",
    volume24h: 92_000,
    realNews: "JMA early-season outlook: above-average May typhoon activity across WNP",
    lastTickMs: 0,
  },
  CAPE: {
    id: "CAPE",
    name: "Cape of Good Hope · reroute",
    nameZh: "好望角 · 绕行通道",
    lat: -34.36,
    lng: 18.48,
    marketQuestion: "Share of Asia-Europe traffic rerouted via Cape > 70% in April?",
    marketQuestionZh: "4 月亚欧航线绕行好望角占比 > 70%?",
    marketSource: "Polymarket",
    probability: 0.82,
    probability24hDelta: +0.02,
    severity: "med",
    volume24h: 144_000,
    realNews: "Maersk, Hapag, MSC extend Cape routing through Q2 2026",
    lastTickMs: 0,
  },
};

// LEC-flavored cases. LEC Beverages is Tsingtao UK sole distributor (real).
// LEC Robotics is XBOT UK sole distributor (real) and is publicly expanding to EU / Middle East / LatAm.
export const CASES: Case[] = [
  {
    id: "saudi-crude-yantai",
    title: "沙特原油 → 烟台 · 多市场共振",
    subtitle: "FLAGSHIP · MULTI-FACTOR · RAS TANURA → YTG",
    cargo: "Arabian Light Crude (沙特阿美轻质原油)",
    hsCode: "2709.00",
    cargoValueUsd: 128_000_000,
    currency: "USD",
    quantity: "2,000,000 BBL · VLCC",
    origin: { lat: 26.64, lng: 50.16, name: "Ras Tanura, SA" },
    destination: { lat: 37.45, lng: 121.4, name: "Yantai, CN" },
    waypoints: [
      { lat: 26.64, lng: 50.16 },
      { lat: 26.57, lng: 56.25, name: "Hormuz" },
      { lat: 15.0, lng: 68.0 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: 22.0, lng: 115.0 },
      { lat: 37.45, lng: 121.4 },
    ],
    altRoute: [
      { lat: 26.64, lng: 50.16 },
      { lat: 26.57, lng: 56.25, name: "Hormuz" },
      { lat: 5.5, lng: 115.0, name: "Lombok (bypass)" },
      { lat: 22.0, lng: 135.0 },
      { lat: 37.45, lng: 121.4 },
    ],
    altRouteLabel: "走 Lombok 绕 Malacca (+3d, 避过柔佛海峡风险)",
    baselineTransitDays: 24,
    bufferDays: 6,
    contractPenaltyPerDayUsd: 280_000,
    chokepointIds: ["HORMUZ", "MALACCA"],
    factors: [
      {
        id: "wx-hurricane-us",
        category: "weather",
        labelZh: "美国飓风季 · 墨西哥湾",
        polymarketSlug: "will-a-hurricane-make-landfall-in-the-us-by-may-31",
        polymarketSide: "YES",
        marketQuestionZh: "5 月 31 日前美国本土是否遭飓风登陆?",
        rationaleZh: "一旦飓风登陆德州 / 路易斯安那, 美国页岩油产量下滑, 精炼厂停产 → Brent/WTI 走高 → 炼厂向沙特抢货 → 买方可能拒收或重新议价, 与本票到港时间赛跑。",
        severity: "med",
        probability: 0.068,
        volume24h: 180,
      },
      {
        id: "price-wti-atl",
        category: "price",
        labelZh: "WTI 原油极端价",
        polymarketSlug: "crude-oil-all-time-high-by-april-30",
        polymarketSide: "YES",
        marketQuestionZh: "4 月底前原油突破历史高点?",
        rationaleZh: "如果油价暴涨, 炼厂利润率(crack spread) 压缩, 买方可能推迟提货或重议 FOB/CIF 差价; 这条对应 basis 风险。",
        severity: "med",
        probability: 0.012,
        volume24h: 123_000,
      },
      {
        id: "policy-ru-ukr",
        category: "policy",
        labelZh: "俄乌停火 · 影响俄油回流",
        polymarketSlug: "russia-x-ukraine-ceasefire-by-may-31-2026",
        polymarketSide: "YES",
        marketQuestionZh: "5 月 31 日前俄乌达成停火?",
        rationaleZh: "停火一旦落地, 制裁解除预期 → 俄油回欧洲 / 减少流入中国 → Urals 折扣扩大 → 中石化可能转而买便宜的俄油, 沙特溢价崩塌, 本票合同可能被重新议价。",
        severity: "high",
        probability: 0.0415,
        volume24h: 97_000,
      },
      {
        id: "macro-fed-jun",
        category: "macro",
        labelZh: "美联储 6 月利率决议",
        polymarketSlug: "fed-decision-in-june-825",
        polymarketSide: "YES",
        marketQuestionZh: "美联储 6 月是否按兵不动?",
        rationaleZh: "Fed 不降息 → 美元强势 → 新兴市场货币承压 + 全球原油需求回落 → 炼厂下修采购量; 间接影响本票结算和库存节奏。",
        severity: "med",
        probability: 0.835,
        volume24h: 524_000,
      },
    ],
    ship: "VLCC SEAWAYS CAPTAIN / IMO 9821144",
    etd: "2026-04-26",
    eta: "2026-05-20",
    incoterms: "CFR Yantai",
    buyer: "Sinopec Yantai Refinery · 中石化烟台炼厂",
    documentLabel: "Charter Party · VLCC-SC-2104",
    clientZh: "中石化 / 大宗商品交易台",
    painPointZh:
      "这票 $128M 不是被一个风险影响, 而是被 4 个看似无关的市场同时挤压 — 霍尔木兹、美国飓风、油价、俄乌停火, 每个都能推迟提货或重议合同。AI 要做的是把这 4 个独立维度拆清楚, 再分别对冲。",
    realContext:
      "2026-04-24 实况: 霍尔木兹基本封锁 + 大西洋飓风季临近 + WTI 尾部风险活跃市场 $1.4M 24h vol + 俄乌停火谈判反复。一票标准沙特原油同时挂了 4 个独立 Polymarket 合约。",
    sources: [
      { label: "Polymarket · WTI April", url: "https://polymarket.com/event/what-price-will-wti-hit-in-april-2026" },
      { label: "Polymarket · US hurricane by May 31", url: "https://polymarket.com/event/will-a-hurricane-make-landfall-in-the-us-by-may-31" },
      { label: "Polymarket · Russia-Ukraine ceasefire by May", url: "https://polymarket.com/event/russia-x-ukraine-ceasefire-by-may-31-2026" },
      { label: "Polymarket · Hormuz by May 15", url: "https://polymarket.com/event/strait-of-hormuz-traffic-returns-to-normal-by-may-15" },
    ],
  },
  {
    id: "xbot-jebelali",
    title: "XBOT 服务机器人 → 迪拜 · 霍尔木兹直击",
    subtitle: "REAL · APR 2026 · SZX → JEBEL ALI",
    cargo: "XBOT 服务 / 清洁机器人 · 40 台 + 安装包",
    hsCode: "8479.89",
    cargoValueUsd: 1_520_000, // ~£1.2M
    currency: "GBP",
    quantity: "40 台 · 2 x 40ft HC",
    origin: { lat: 22.54, lng: 114.06, name: "Shenzhen, CN" },
    destination: { lat: 25.01, lng: 55.06, name: "Jebel Ali, UAE" },
    waypoints: [
      { lat: 22.54, lng: 114.06 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: 15.0, lng: 72.0 },
      { lat: 26.57, lng: 56.25, name: "Hormuz" },
      { lat: 25.01, lng: 55.06 },
    ],
    altRoute: [
      { lat: 22.54, lng: 114.06 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: 12.58, lng: 43.33, name: "Bab el-Mandeb" },
      { lat: 24.0, lng: 38.0, name: "Jeddah trans-ship" },
      { lat: 22.0, lng: 52.0, name: "陆路经沙特 → UAE" },
      { lat: 25.01, lng: 55.06 },
    ],
    altRouteLabel: "改走 Jeddah 转沙特陆运 (+11d, 需 ATA 文件 + 保税过境)",
    baselineTransitDays: 22,
    bufferDays: 4,
    contractPenaltyPerDayUsd: 190_000, // ~£150K/d client LD
    chokepointIds: ["HORMUZ", "BAB_EL_MANDEB", "MALACCA"],
    ship: "MSC KIRA / IMO 9751332",
    etd: "2026-04-24",
    eta: "2026-05-16",
    incoterms: "DAP Jebel Ali",
    buyer: "Majid Al Futtaim · Mall of the Emirates 扩建店",
    documentLabel: "House B/L · SZX-JEA-88104",
    clientZh: "LEC Robotics · 中东扩张项目",
    painPointZh:
      "中东购物节启用日期合同锁死, 晚 1 天罚款 £150K + 40 位工程师窝工 + 客户启用仪式推迟。",
    realContext:
      "2026-04-24 实况:美伊战事第 55 天, 霍尔木兹海峡自 2 月 28 日起基本关闭, 4 月 19 日仅 3 艘船通行; Polymarket 显示 5 月 31 日前恢复正常概率仅 33%。Jebel Ali 进港都必须过这道海峡 — 这是 LEC 机器人业务扩张到中东的最硬约束。",
    sources: [
      { label: "CNBC · Hormuz 基本关闭", url: "https://www.cnbc.com/2026/04/22/iran-war-strait-hormuz-tanker-ship-trump-blockade.html" },
      { label: "Polymarket · Hormuz 5/15 前恢复", url: "https://polymarket.com/event/strait-of-hormuz-traffic-returns-to-normal-by-may-15" },
      { label: "Al Jazeera · 伊朗再关海峡", url: "https://www.aljazeera.com/news/2026/4/18/iran-closes-strait-of-hormuz-again-over-us-blockade-of-its-ports" },
      { label: "Kalshi · Hormuz 7 月前恢复", url: "https://www.cnbc.com/2026/04/23/kalshi-bettors-see-strait-of-hormuz-traffic-normal-by-july.html" },
    ],
  },
  {
    id: "tsingtao-felixstowe",
    title: "青岛啤酒 → Felixstowe · 夏季促销窗口",
    subtitle: "REAL BIZ · QINGDAO → FELIXSTOWE (UK)",
    cargo: "青岛啤酒 · 500ml 罐装 · 混合 SKU",
    hsCode: "2203.00",
    cargoValueUsd: 610_000, // ~£480K goods value
    currency: "GBP",
    quantity: "6 x 40ft · ≈ 110,000 箱",
    origin: { lat: 36.07, lng: 120.38, name: "Qingdao, CN" },
    destination: { lat: 51.96, lng: 1.32, name: "Felixstowe, UK" },
    waypoints: [
      { lat: 36.07, lng: 120.38 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: 12.58, lng: 43.33, name: "Bab el-Mandeb" },
      { lat: 30.42, lng: 32.35, name: "Suez Canal" },
      { lat: 36.0, lng: 15.0, name: "Mediterranean" },
      { lat: 51.96, lng: 1.32 },
    ],
    altRoute: [
      { lat: 36.07, lng: 120.38 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: -34.36, lng: 18.48, name: "Cape of Good Hope" },
      { lat: 14.0, lng: -17.0, name: "West Africa" },
      { lat: 51.96, lng: 1.32 },
    ],
    altRouteLabel: "全程绕好望角 (+12d, 避开红海; 目前主流班轮都在这么走)",
    baselineTransitDays: 32,
    bufferDays: 14, // summer promo prep buffer
    contractPenaltyPerDayUsd: 9_500, // ~£7.5K/d stockout + promo penalty
    chokepointIds: ["BAB_EL_MANDEB", "SUEZ", "CAPE", "MALACCA"],
    ship: "MAERSK ALGOL / IMO 9778122",
    etd: "2026-04-18",
    eta: "2026-05-20",
    incoterms: "CIF Felixstowe",
    buyer: "LEC Beverages Group · Tsingtao UK 渠道分销",
    documentLabel: "B/L · FEL-MAE-20260518",
    clientZh: "LEC Beverages · 青岛啤酒英国独家分销",
    painPointZh:
      "夏季促销档期和 Costco / LWC / Wing Yip 合同提前 4 个月锁定。晚到 = 断货 + 渠道罚款 + 错过最值钱的销售窗口。",
    realContext:
      "2026-04-24 实况: 红海因胡塞武装威胁 + 伊朗战事, 亚洲-欧洲主流班轮持续绕行好望角, 苏伊士通行量较危机前下降约 40%, Asia-UK 航程普遍比正常延长 10-14 天。Maersk / Hapag / MSC 在 Q2 仍维持好望角路由。",
    sources: [
      { label: "Polymarket · 好望角绕行比例", url: "https://polymarket.com/event/cape-of-good-hope-rerouting" },
      { label: "Kalshi · 苏伊士通行量", url: "https://kalshi.com" },
      { label: "Al Jazeera · 红海局势", url: "https://www.aljazeera.com/news/2026/4/18/iran-closes-strait-of-hormuz-again-over-us-blockade-of-its-ports" },
      { label: "LEC Beverages · Tsingtao UK 官方公告", url: "https://lecbeverages.com" },
    ],
  },
  {
    id: "xbot-heathrow",
    title: "XBOT 清洁机器人 → Heathrow T5 投产",
    subtitle: "REAL BIZ · SZX → LHR via Southampton",
    cargo: "XBOT 商用清洁机器人 · 50 台 + 调试套件",
    hsCode: "8479.89",
    cargoValueUsd: 1_080_000, // ~£850K
    currency: "GBP",
    quantity: "50 台 · 1 x 40ft HC",
    origin: { lat: 22.54, lng: 114.06, name: "Shenzhen, CN" },
    destination: { lat: 50.9, lng: -1.4, name: "Southampton → LHR, UK" },
    waypoints: [
      { lat: 22.54, lng: 114.06 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: -34.36, lng: 18.48, name: "Cape of Good Hope" },
      { lat: 14.0, lng: -17.0 },
      { lat: 50.9, lng: -1.4 },
    ],
    altRoute: [
      { lat: 22.54, lng: 114.06 },
      { lat: 2.5, lng: 101.4, name: "Malacca" },
      { lat: 30.42, lng: 32.35, name: "Suez (冒险)" },
      { lat: 36.0, lng: 15.0 },
      { lat: 50.9, lng: -1.4 },
    ],
    altRouteLabel: "走苏伊士抢速度 (-10d, 但需买 war-risk 加费)",
    baselineTransitDays: 38,
    bufferDays: 7,
    contractPenaltyPerDayUsd: 100_000, // £80K/d LD after buffer
    chokepointIds: ["CAPE", "BAB_EL_MANDEB", "SUEZ", "MALACCA"],
    ship: "HAPAG-LLOYD AL AIN / IMO 9783422",
    etd: "2026-04-16",
    eta: "2026-05-24",
    incoterms: "DAP Heathrow",
    buyer: "Heathrow Airport Ltd · Terminal 5 商用升级",
    documentLabel: "B/L · SZX-SOU-261128",
    clientZh: "LEC Robotics · XBOT UK 独家分销",
    painPointZh:
      "机场 T5 投产日合同锁死, 40 位驻场工程师已动员; 设备晚 1 天 = £80K 罚款 + 工程师窝工 + 客户推迟 go-live。",
    realContext:
      "红海危机导致 Asia-UK 主流航线绕好望角, 比正常多 12 天。Heathrow 类项目最怕的不是货坏, 而是 go-live 日期被迫推迟, 连带下游商业合同全推迟。",
    sources: [
      { label: "LEC Robotics · 英国独家分销", url: "https://lecrobotics.com" },
      { label: "XBOT 官网 · LEC 合作", url: "https://xbotww.com" },
      { label: "Maersk 4月航班公告 · 绕好望角", url: "https://www.maersk.com" },
    ],
  },
];

export function caseById(id: string | null | undefined): Case {
  // Dynamic case (AI-extracted from a user upload) lives in localStorage.
  if (id === "dynamic" && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("chokepoint:dynamic-case");
      if (raw) return JSON.parse(raw) as Case;
    } catch {
      // fall through
    }
  }
  return CASES.find((c) => c.id === id) ?? CASES[0];
}

export function chokepointsFor(c: Case): Chokepoint[] {
  return c.chokepointIds.map((id) => CHOKEPOINTS[id]).filter(Boolean);
}
