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
  labelEn?: string;
  // Polymarket binding
  polymarketSlug: string;
  polymarketSide: "YES" | "NO"; // which side represents "bad for this shipment"
  marketQuestionZh: string;
  marketQuestionEn?: string;
  rationaleZh: string; // why this particular shipment is exposed to this factor
  rationaleEn?: string;
  severity: "low" | "med" | "high" | "critical";
  // Geographic anchor — where this market's "real-world subject" sits.
  // Used to plot the factor on the globe alongside chokepoints.
  lat?: number;
  lng?: number;
  geoLabel?: string;
  // live-refreshed
  probability: number;
  volume24h: number;
};

export type Case = {
  id: string;
  title: string;
  titleEn?: string;
  subtitle: string;
  cargo: string;
  cargoEn?: string;
  hsCode: string;
  cargoValueUsd: number;
  currency: "USD" | "GBP" | "CNY" | "EUR";
  quantity: string;
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  altRoute?: LatLng[];
  altRouteLabel?: string;
  altRouteLabelEn?: string;
  baselineTransitDays: number;
  bufferDays: number;
  contractPenaltyPerDayUsd: number;
  /** "contract" = real clause in user-uploaded doc · "estimate" = industry typical */
  penaltySource?: "contract" | "estimate";
  penaltySourceNoteZh?: string;
  penaltySourceNoteEn?: string;
  documentsSeenZh?: string[];
  documentsSeenEn?: string[];
  chokepointIds: string[];
  factors?: Factor[]; // extra factor exposures beyond chokepoints
  ship: string;
  etd: string;
  eta: string;
  incoterms: string;
  buyer: string;
  buyerEn?: string;
  documentLabel: string;
  realContext?: string;
  realContextEn?: string;
  painPointZh?: string;
  painPointEn?: string;
  clientZh?: string;
  clientEn?: string;
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
    titleEn: "Saudi crude → Yantai · multi-market resonance",
    subtitle: "FLAGSHIP · MULTI-FACTOR · RAS TANURA → YTG",
    cargo: "Arabian Light Crude (沙特阿美轻质原油)",
    cargoEn: "Arabian Light Crude (Saudi Aramco light sweet)",
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
    altRouteLabelEn: "Lombok Strait bypass (+3d, avoids Singapore Strait congestion)",
    baselineTransitDays: 24,
    bufferDays: 6,
    contractPenaltyPerDayUsd: 280_000,
    chokepointIds: ["HORMUZ", "MALACCA"],
    factors: [
      {
        id: "policy-hormuz-blockade",
        category: "policy",
        labelZh: "Trump 是否解除霍尔木兹封锁",
        labelEn: "Trump lifting US Hormuz blockade",
        polymarketSlug: "trump-announces-us-blockade-of-hormuz-lifted-by:0",
        polymarketSide: "NO", // NO = blockade stays = bad for shipment
        marketQuestionZh: "Trump 4 月 30 日前宣布解除对霍尔木兹的封锁?",
        marketQuestionEn: "Will Trump announce US blockade of Hormuz lifted by April 30?",
        rationaleZh: "你这条 VLCC 现在卡的就是这个 — 封锁不解, 你出不来。市场如果给「解封」概率上涨, 你提单按时离港的机会就大; 反之 ETA 直接报废。",
        rationaleEn: "Your VLCC is literally stuck on this. If the lifting probability climbs, your B/L gets out on time; if it doesn't, ETA falls apart.",
        severity: "critical",
        probability: 0.37,
        volume24h: 271_814,
        lat: 27.0,
        lng: 55.0,
        geoLabel: "Persian Gulf · 美军封锁线",
      },
      {
        id: "wx-storm-2026",
        category: "weather",
        labelZh: "大西洋风暴 · 5 月前命名",
        labelEn: "Atlantic storm · named pre-season",
        polymarketSlug: "named-storm-forms-before-hurricane-season-197:0",
        polymarketSide: "YES",
        marketQuestionZh: "5 月 31 日前(飓风季正式开始前)是否有命名风暴?",
        marketQuestionEn: "Named storm forms before hurricane season opens?",
        rationaleZh: "大西洋一旦提前出风暴, 美湾炼厂检修周期被打乱 → WTI 走高 → 中石化 crack spread 受压 → 你这票卸货时可能被重新议价。",
        rationaleEn: "Early Atlantic storms disrupt Gulf refinery turnaround schedules → WTI ticks up → Sinopec's crack spread compresses → your discharge can be renegotiated.",
        severity: "med",
        probability: 0.19,
        volume24h: 775,
        lat: 20.0,
        lng: -50.0,
        geoLabel: "Atlantic basin",
      },
      {
        id: "policy-ru-ukr",
        category: "policy",
        labelZh: "俄乌停火 · 影响俄油回流",
        labelEn: "Russia-Ukraine ceasefire · Russian crude flow",
        polymarketSlug: "russia-x-ukraine-ceasefire-by-april-30-2026:0",
        polymarketSide: "YES", // YES = ceasefire = bad for Saudi premium
        marketQuestionZh: "4 月 30 日前俄乌达成停火?",
        marketQuestionEn: "Russia × Ukraine ceasefire by April 30, 2026?",
        rationaleZh: "停火一旦落地, 制裁解除预期 → 俄油回流 / 减少流入中国 → Urals 折扣扩大 → 中石化可能转而抢便宜俄油, 沙特溢价崩塌, 本票合同可能被重议。",
        rationaleEn: "If a ceasefire lands, sanctions relief expectations rise → Russian crude flows back / less to China → Urals discount widens → Sinopec pivots to cheaper Russian barrels, Saudi premium collapses, this contract gets renegotiated.",
        severity: "high",
        probability: 0.0085,
        volume24h: 122_799,
        lat: 50.45,
        lng: 30.52,
        geoLabel: "Kyiv",
      },
      {
        id: "price-wti-atl",
        category: "price",
        labelZh: "WTI 原油极端价",
        labelEn: "WTI extreme price",
        polymarketSlug: "crude-oil-all-time-high-by-april-30:0",
        polymarketSide: "YES",
        marketQuestionZh: "4 月底前原油突破历史高点?",
        marketQuestionEn: "Crude oil all-time-high by April 30?",
        rationaleZh: "如果油价暴涨, 炼厂利润率(crack spread) 压缩, 买方可能推迟提货或重议 FOB/CIF 差价; 这是 basis 风险这条腿。",
        rationaleEn: "If crude spikes, refiner crack spread compresses → buyer may delay lifting or renegotiate FOB/CIF differential. This is the basis-risk leg.",
        severity: "med",
        probability: 0.011,
        volume24h: 19_888,
        lat: 35.97,
        lng: -96.77,
        geoLabel: "Cushing, OK · WTI",
      },
      {
        id: "macro-fed-jun",
        category: "macro",
        labelZh: "美联储 6 月利率不动",
        labelEn: "Fed holds in June",
        polymarketSlug: "fed-decision-in-june-825:3", // sub-market: "no change in rates"
        polymarketSide: "YES", // YES = hold = strong USD = bad for EM crude demand
        marketQuestionZh: "美联储 6 月会议利率不动?",
        marketQuestionEn: "Will the Fed hold rates in June?",
        rationaleZh: "Fed 不降 → 美元强势 → 新兴市场货币承压 + 全球原油需求回落 → 炼厂下修采购量; 间接影响本票结算和库存节奏。",
        rationaleEn: "Fed holds → strong USD → EM currency pressure + global crude demand softens → refiner cuts purchase volumes; indirectly hits this voyage's settlement pace.",
        severity: "med",
        probability: 0.925,
        volume24h: 206_240,
        lat: 38.9,
        lng: -77.04,
        geoLabel: "Washington DC · Fed",
      },
    ],
    ship: "VLCC SEAWAYS CAPTAIN / IMO 9821144",
    etd: "2026-04-26",
    eta: "2026-05-20",
    incoterms: "CFR Yantai",
    buyer: "Sinopec Yantai Refinery · 中石化烟台炼厂",
    buyerEn: "Sinopec Yantai Refinery",
    documentLabel: "Charter Party · VLCC-SC-2104",
    clientZh: "中石化 / 大宗商品交易台",
    clientEn: "Sinopec / commodity trading desk",
    painPointZh:
      "你这 $128M 的货, 不是被单一风险卡住, 而是被 5 个看似无关的市场同时挤 — Trump 解封锁、大西洋风暴、俄乌停火、WTI 历史高点、Fed 6 月会议。每一个都能让你提货延误或合同被重议。我们做的事就是把这 5 条独立信号一条条拆开, 分别下注。",
    painPointEn:
      "Your $128M cargo isn't squeezed by one risk — it's pressed by 5 seemingly unrelated markets at once: Trump's Hormuz blockade, Atlantic storms, Russia-Ukraine ceasefire, WTI ATH, Fed June. Each can delay lifting or trigger contract renegotiation. Our job is to peel these 5 vectors apart and hedge each.",
    realContext:
      "2026-04-25 实况: 美军封锁霍尔木兹仍未解 (Polymarket 'lifted' 报 63%, 24h vol $272K) + 大西洋提前出风暴概率 19% + WTI 4 月底 ATH 1.1% + 俄乌 4 月停火 0.85% + Fed 6 月不动 92.5%。一张标准沙特原油提单, 同时挂着 5 个独立的 Polymarket 合约。",
    realContextEn:
      "April 25, 2026: US Hormuz blockade still on (Polymarket 'lifted' at 63%, $272K 24h vol) + Atlantic early-season storm 19% + WTI ATH by Apr 30 at 1.1% + RU-UA ceasefire 0.85% + Fed June hold at 92.5%. One standard Saudi-crude B/L is simultaneously exposed to 5 independent Polymarket contracts.",
    sources: [
      { label: "Polymarket · WTI April", url: "https://polymarket.com/event/what-price-will-wti-hit-in-april-2026" },
      { label: "Polymarket · US hurricane by May 31", url: "https://polymarket.com/event/will-a-hurricane-make-landfall-in-the-us-by-may-31" },
      { label: "Polymarket · Russia-Ukraine ceasefire by May", url: "https://polymarket.com/event/russia-x-ukraine-ceasefire-by-may-31-2026" },
      { label: "Polymarket · Hormuz by May 15", url: "https://polymarket.com/event/strait-of-hormuz-traffic-returns-to-normal-by-may-15" },
    ],
  },
  {
    id: "tsingtao-felixstowe",
    title: "青岛啤酒 → Felixstowe · 夏季促销窗口",
    titleEn: "Tsingtao Beer → Felixstowe · summer promo window",
    subtitle: "REAL BIZ · QINGDAO → FELIXSTOWE (UK)",
    cargo: "青岛啤酒 · 500ml 罐装 · 混合 SKU",
    cargoEn: "Tsingtao Beer · 500ml cans · mixed SKUs",
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
    altRouteLabelEn: "Full Cape of Good Hope reroute (+12d, avoids Red Sea; what major liners are doing right now)",
    baselineTransitDays: 32,
    bufferDays: 14, // summer promo prep buffer
    contractPenaltyPerDayUsd: 9_500, // ~£7.5K/d stockout + promo penalty
    chokepointIds: ["BAB_EL_MANDEB", "SUEZ", "CAPE", "MALACCA"],
    factors: [
      {
        id: "wx-storm-2026",
        category: "weather",
        labelZh: "大西洋风暴 · 提前命名",
        labelEn: "Atlantic storm · named pre-season",
        polymarketSlug: "named-storm-forms-before-hurricane-season-197:0",
        polymarketSide: "YES", // early storm = bad for North Atlantic / UK approach
        marketQuestionZh: "5 月 31 日前(飓风季正式开始前)是否有命名风暴?",
        marketQuestionEn: "Named storm forms before hurricane season opens?",
        rationaleZh: "大西洋一旦提前进入风暴模式, 北海 / 英吉利海峡接驳航段会出额外延误, 你这票绕完好望角再撞上 UK 进港等泊, 直接错过 7 月初货架上架。",
        rationaleEn: "An early Atlantic storm season translates to delays on the North Sea / English Channel approach. Even after the Cape detour, you risk port-queue at Felixstowe and miss the early-July shelf set.",
        severity: "med",
        probability: 0.19,
        volume24h: 775,
        lat: 20.0,
        lng: -50.0,
        geoLabel: "Atlantic basin",
      },
      {
        id: "price-wti-may-fuel",
        category: "price",
        labelZh: "WTI 5 月冲 $150 · 燃油涨",
        labelEn: "WTI hits $150 in May · bunker spike",
        polymarketSlug: "what-price-will-wti-hit-in-may-2026:0",
        polymarketSide: "YES",
        marketQuestionZh: "WTI 5 月内冲到 $150?",
        marketQuestionEn: "WTI Crude hits $150 in May?",
        rationaleZh: "WTI 大涨 → 集装箱班轮 BAF (燃油附加费) 跳价 → 你这票 6 个 40ft 的运费比报盘高 15-30% → 现金流被吃掉, 卸货后促销利润变薄。",
        rationaleEn: "WTI spikes → liner BAF (bunker adjustment) jumps → your 6 x 40ft container freight runs 15-30% over quote → cash flow eaten, post-discharge promo margin compressed.",
        severity: "med",
        probability: 0.495,
        volume24h: 587,
        lat: 35.97,
        lng: -96.77,
        geoLabel: "Cushing, OK · WTI",
      },
      {
        id: "macro-boe-apr",
        category: "macro",
        labelZh: "英国央行 4 月利率不动",
        labelEn: "Bank of England holds in April",
        polymarketSlug: "bank-of-england-decision-in-april:2", // sub-market: "no change"
        polymarketSide: "YES", // YES = no cut = bad for UK retail demand
        marketQuestionZh: "英国央行 4 月会议利率不动?",
        marketQuestionEn: "Bank of England holds rates at the April meeting?",
        rationaleZh: "BoE 不降息 → 英国按揭 / 信用卡持续紧 → 夏季啤酒消费意愿下滑 → Costco / LWC 渠道下调订单 → 你提前 4 个月锁定的促销量可能被砍。",
        rationaleEn: "BoE holds → mortgage / credit-card pressure persists → UK summer beer spend softens → Costco / LWC may trim orders → your 4-months-ahead-locked promo volumes get cut.",
        severity: "high",
        probability: 0.981,
        volume24h: 6_667,
        lat: 51.51,
        lng: -0.13,
        geoLabel: "London · BoE",
      },
      {
        id: "policy-ru-ukr-fuel",
        category: "policy",
        labelZh: "俄乌停火 · 燃油下行通道",
        labelEn: "Russia-Ukraine ceasefire · bunker downside",
        polymarketSlug: "russia-x-ukraine-ceasefire-by-april-30-2026:0",
        polymarketSide: "NO", // NO = no ceasefire = bunker stays high = bad
        marketQuestionZh: "4 月 30 日前俄乌达成停火?",
        marketQuestionEn: "Russia × Ukraine ceasefire by April 30, 2026?",
        rationaleZh: "停火一旦落地, 制裁解除 → 全球原油 / 燃料供给宽松 → 集装箱班轮 BAF 回落 → 你下一票运费下降。这条赔的是「停火没来」的世界。",
        rationaleEn: "If a ceasefire lands, sanctions ease → global crude / bunker supply loosens → liner BAF retraces → your next shipment freight drops. This factor pays in the 'no ceasefire' world.",
        severity: "med",
        probability: 0.9915,
        volume24h: 122_799,
        lat: 50.45,
        lng: 30.52,
        geoLabel: "Kyiv",
      },
    ],
    ship: "MAERSK ALGOL / IMO 9778122",
    etd: "2026-04-18",
    eta: "2026-05-20",
    incoterms: "CIF Felixstowe",
    buyer: "LEC Beverages Group · Tsingtao UK 渠道分销",
    buyerEn: "LEC Beverages Group · Tsingtao UK distribution",
    documentLabel: "B/L · FEL-MAE-20260518",
    clientZh: "LEC Beverages · 青岛啤酒英国独家分销",
    clientEn: "LEC Beverages · Tsingtao UK sole distributor",
    painPointZh:
      "夏季促销档期和 Costco / LWC / Wing Yip 合同提前 4 个月锁定。晚到 = 断货 + 渠道罚款 + 错过最值钱的销售窗口。",
    painPointEn:
      "Summer promo windows with Costco / LWC / Wing Yip are locked 4 months ahead. Late arrival = stockout + channel penalty + losing the highest-margin selling window of the year.",
    realContext:
      "2026-04-24 实况: 红海因胡塞武装威胁 + 伊朗战事, 亚洲-欧洲主流班轮持续绕行好望角, 苏伊士通行量较危机前下降约 40%, Asia-UK 航程普遍比正常延长 10-14 天。Maersk / Hapag / MSC 在 Q2 仍维持好望角路由。",
    realContextEn:
      "April 24, 2026: Red Sea remains hostile due to Houthi threats + Iran war. Major Asia-Europe liners continue to reroute via the Cape; Suez transits down ~40% vs pre-crisis. Asia-UK voyages run 10-14 days longer than normal. Maersk / Hapag / MSC keep Cape routing through Q2.",
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
    titleEn: "XBOT cleaning robots → Heathrow T5 go-live",
    subtitle: "REAL BIZ · SZX → LHR via Southampton",
    cargo: "XBOT 商用清洁机器人 · 50 台 + 调试套件",
    cargoEn: "XBOT commercial cleaning robots · 50 units + commissioning kit",
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
    altRouteLabelEn: "Suez sprint (-10d, but requires buying war-risk surcharge)",
    baselineTransitDays: 38,
    bufferDays: 7,
    contractPenaltyPerDayUsd: 100_000, // £80K/d LD after buffer
    chokepointIds: ["CAPE", "BAB_EL_MANDEB", "SUEZ", "MALACCA"],
    factors: [
      {
        id: "wx-storm-2026",
        category: "weather",
        labelZh: "大西洋风暴 · 北大西洋接驳",
        labelEn: "Atlantic storm · UK approach",
        polymarketSlug: "named-storm-forms-before-hurricane-season-197:0",
        polymarketSide: "YES",
        marketQuestionZh: "5 月 31 日前是否有命名风暴?",
        marketQuestionEn: "Named storm forms before hurricane season opens?",
        rationaleZh: "你绕好望角后还要跨北大西洋抵 Southampton, 一旦提前进入风暴季, 接驳延误 + 港口拥堵叠加 → T5 投产日可能被推迟。",
        rationaleEn: "After the Cape detour you still cross the North Atlantic to Southampton. An early storm season stacks transit delays + UK port congestion → T5 go-live slips.",
        severity: "med",
        probability: 0.19,
        volume24h: 775,
        lat: 20.0,
        lng: -50.0,
        geoLabel: "Atlantic basin",
      },
      {
        id: "policy-trump-china",
        category: "policy",
        labelZh: "Trump 访华 · 中英科技进口审查",
        labelEn: "Trump visits China · UK tech import scrutiny",
        polymarketSlug: "will-trump-visit-china-by:4", // sub-market: by June 30
        polymarketSide: "NO", // NO visit = US-China cold = UK customs scrutiny tightens
        marketQuestionZh: "Trump 6 月 30 日前访华?",
        marketQuestionEn: "Will Trump visit China by June 30?",
        rationaleZh: "Trump 不去 → 中美关系冷 → 英国对中国电控设备进口审查趋严 (CAA / DBT 双重抽查) → 海关延误 3-7 天 → T5 投产 LD 触发。",
        rationaleEn: "If Trump doesn't visit → US-China cools → UK tightens scrutiny on Chinese electronic gear (CAA / DBT cross-checks) → customs delay 3-7 days → T5 go-live LD triggers.",
        severity: "high",
        probability: 0.205,
        volume24h: 293_740,
        lat: 39.9,
        lng: 116.39,
        geoLabel: "Beijing",
      },
      {
        id: "macro-boe-apr",
        category: "macro",
        labelZh: "英国央行 4 月利率不动",
        labelEn: "Bank of England holds in April",
        polymarketSlug: "bank-of-england-decision-in-april:2",
        polymarketSide: "YES",
        marketQuestionZh: "英国央行 4 月会议利率不动?",
        marketQuestionEn: "Bank of England holds rates at the April meeting?",
        rationaleZh: "BoE 不降息 → 英国基建 / 商用 capex 紧 → Heathrow 类业主对供应商更鹰派 → 你的 LD 条款被严格执行而不是协商, 晚 1 天 = 真扣 £80K。",
        rationaleEn: "BoE holds → UK infra / commercial capex stays tight → Heathrow-class owners go hawkish on suppliers → your LD gets enforced rather than negotiated, each day late = real £80K.",
        severity: "med",
        probability: 0.981,
        volume24h: 6_667,
        lat: 51.51,
        lng: -0.13,
        geoLabel: "London · BoE",
      },
      {
        id: "policy-ru-ukr-suez",
        category: "policy",
        labelZh: "俄乌停火 · 苏伊士抢速度窗口",
        labelEn: "Russia-Ukraine ceasefire · Suez sprint window",
        polymarketSlug: "russia-x-ukraine-ceasefire-by-april-30-2026:0",
        polymarketSide: "NO", // NO = no ceasefire = Suez stays risky = no sprint option = bad
        marketQuestionZh: "4 月 30 日前俄乌达成停火?",
        marketQuestionEn: "Russia × Ukraine ceasefire by April 30, 2026?",
        rationaleZh: "停火一旦落地, 中东紧张缓和预期 → 苏伊士复航预期上升 → 你下一票可以走苏伊士抢 10 天 → 给项目部留更多缓冲。这条赔的是「停火没来 / 不能走苏伊士」的世界。",
        rationaleEn: "If a ceasefire lands, Middle East tensions ease → Suez normalisation odds rise → next shipment can sprint via Suez (-10d) → more buffer for the project. This factor pays in the 'no ceasefire / Suez stays closed' world.",
        severity: "high",
        probability: 0.9915,
        volume24h: 122_799,
        lat: 50.45,
        lng: 30.52,
        geoLabel: "Kyiv",
      },
    ],
    ship: "HAPAG-LLOYD AL AIN / IMO 9783422",
    etd: "2026-04-16",
    eta: "2026-05-24",
    incoterms: "DAP Heathrow",
    buyer: "Heathrow Airport Ltd · Terminal 5 商用升级",
    buyerEn: "Heathrow Airport Ltd · Terminal 5 commercial upgrade",
    documentLabel: "B/L · SZX-SOU-261128",
    clientZh: "LEC Robotics · XBOT UK 独家分销",
    clientEn: "LEC Robotics · XBOT UK sole distributor",
    painPointZh:
      "机场 T5 投产日合同锁死, 40 位驻场工程师已动员; 设备晚 1 天 = £80K 罚款 + 工程师窝工 + 客户推迟 go-live。",
    painPointEn:
      "Airport T5 go-live date is contract-locked. 40 on-site engineers already mobilised. Each day late = £80K LD + idle engineers + customer's downstream commercial contracts all push.",
    realContext:
      "红海危机导致 Asia-UK 主流航线绕好望角, 比正常多 12 天。Heathrow 类项目最怕的不是货坏, 而是 go-live 日期被迫推迟, 连带下游商业合同全推迟。",
    realContextEn:
      "Red Sea crisis is forcing major Asia-UK liners around the Cape — 12 extra days vs normal. The thing Heathrow-class projects fear isn't damaged cargo, it's go-live being pushed, which cascades into every downstream commercial contract.",
    sources: [
      { label: "LEC Robotics · 英国独家分销", url: "https://lecrobotics.com" },
      { label: "XBOT 官网 · LEC 合作", url: "https://xbotww.com" },
      { label: "Maersk 4月航班公告 · 绕好望角", url: "https://www.maersk.com" },
    ],
  },
];

/** Pick the right localized field, falling back to the Chinese / source field if EN is missing. */
export function L<T>(zh: T, en: T | undefined, lang: "zh" | "en"): T {
  if (lang === "en" && en !== undefined && en !== null && en !== "") return en;
  return zh;
}

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
