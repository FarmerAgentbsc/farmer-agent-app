import { createServer } from "node:http";
import { access } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadAppConfig } from "./lib/config.mjs";
import { createStateStore } from "./lib/state-store.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const projectRoot = resolve(__dirname, "..");
const publicRoot = resolve(projectRoot, "farm-remix");
const dataDir = resolve(projectRoot, "server", "data");
const stateFile = resolve(dataDir, "state.json");
const config = await loadAppConfig(projectRoot);
const port = config.port;
const host = config.host;

const prettyRoutes = {
  "/": "/index.html",
  "/index": "/index.html",
  "/dashboard": "/dashboard.html",
  "/goo": "/goo.html",
  "/goo/compare": "/goo/compare.html",
  "/airdrop": "/airdrop.html",
  "/docs": "/docs.html",
  "/cloud/agents": "/cloud/agents.html",
  "/cloud/credits": "/cloud/credits.html",
  "/en": "/en/index.html",
  "/en/": "/en/index.html",
  "/en/dashboard": "/en/dashboard.html",
  "/en/goo": "/en/goo.html",
  "/en/goo/compare": "/en/goo/compare.html",
  "/en/airdrop": "/en/airdrop.html",
  "/en/docs": "/en/docs.html",
  "/en/cloud/agents": "/en/cloud/agents.html",
  "/en/cloud/credits": "/en/cloud/credits.html"
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon"
};

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function defaultCandidates() {
  return [
    {
      symbol: "SCALLION",
      name: "Scallion LP",
      score: 93,
      liquidityUsd: 10726,
      fdvUsd: 11267,
      vol5mUsd: 555,
      estSizeBnb: 1,
      ageMinutes: 1,
      soil: "rich",
      action: "plant",
      source: "APY Radar",
      pairUrl: "https://www.dextools.io/app/en/bnb/pair-explorer/0x44446e301be5b189d74b1855e63c682a1dc1026d"
    },
    {
      symbol: "POTATO",
      name: "Potato LP",
      score: 79,
      liquidityUsd: 3537,
      fdvUsd: 4421,
      vol5mUsd: 288,
      estSizeBnb: 0.9847,
      ageMinutes: 1,
      soil: "healthy",
      action: "watch",
      source: "APY Radar",
      pairUrl: "https://www.dextools.io/app/en/bnb/pair-explorer/0xcb3679a259a16e7a282248ccbf79418474844444"
    },
    {
      symbol: "BEAN",
      name: "Bean Field",
      score: 63,
      liquidityUsd: 3493,
      fdvUsd: 4189,
      vol5mUsd: 188,
      estSizeBnb: 0.9924,
      ageMinutes: 0,
      soil: "uncertain",
      action: "watch",
      source: "Weather Desk",
      pairUrl: "https://www.dextools.io/app/en/bnb/pair-explorer/0xd0a7bb113a01cb02cd3f55284d29512c15544444"
    }
  ];
}

function defaultPortfolio() {
  return {
    positions: [
      {
        symbol: "SCALLION",
        name: "Scallion LP",
        score: 93,
        heldMinutes: 4,
        positionBnb: 1,
        fdvUsd: 11267,
        liquidityUsd: 10726,
        allocationPct: 50,
        unrealizedPnlUsd: 52.8,
        roiPct: 2.5,
        status: "growing",
        pairUrl: "https://www.dextools.io/app/en/bnb/pair-explorer/0x44446e301be5b189d74b1855e63c682a1dc1026d"
      },
      {
        symbol: "POTATO",
        name: "Potato LP",
        score: 79,
        heldMinutes: 3,
        positionBnb: 0.9847,
        fdvUsd: 4421,
        liquidityUsd: 3537,
        allocationPct: 50,
        unrealizedPnlUsd: 14.4,
        roiPct: 1.2,
        status: "staked",
        pairUrl: "https://www.dextools.io/app/en/bnb/pair-explorer/0xcb3679a259a16e7a282248ccbf79418474844444"
      }
    ],
    watchlist: [
      { name: "Golden Wheat", score: 74, reason: "steady rainfall" },
      { name: "Sunflower LP", score: 70, reason: "stable liquidity" },
      { name: "Garlic Patch", score: 67, reason: "watch for drought" }
    ],
    seedLedger: [
      {
        id: "seed-1",
        name: "Scallion LP",
        status: "planted",
        allocationPct: 50,
        detail: "High soil score. Seeded from the greenhouse shortlist.",
        createdAt: isoMinutesAgo(12)
      },
      {
        id: "seed-2",
        name: "Potato LP",
        status: "staked",
        allocationPct: 50,
        detail: "Healthy field. Fertilizer topped up after first confirmation.",
        createdAt: isoMinutesAgo(9)
      }
    ]
  };
}

function defaultWaterwheel() {
  return {
    totalHarvestUsd: 14777,
    totalHarvestBnb: 0.161,
    restakeBnb: 0.1127,
    repairBnb: 0.0242,
    rationBnb: 0.0242,
    rationPoolUsd: 805,
    reservePct: 15
  };
}

function defaultAirdrop() {
  return {
    snapshotAt: isoMinutesAgo(36 * 60),
    rehearsalRuns: 2,
    totalHarvestUsd: 32742.2,
    kitchen: {
      executionEnabled: false,
      mode: "dry-run",
      perBatchLimit: 20,
      wallet: "0xfA...rm",
      assetSymbol: "TBA",
      assetAddress: "pending-announcement",
      totalAmount: 1200,
      treasuryRemaining: 1200,
      marketValueUsd: 805,
      note: "奖励资产等待公布，当前先以演示模式展示分发流程。 / Reward asset pending announcement. Distribution stays in demo mode for now."
    },
    readiness: [
      { label: "Kitchen Fire", status: "todo", detail: "Enable execution when the coop is ready to distribute live grain." },
      { label: "Festival List", status: "ready", detail: "A dry-run recipient list is already prepared for rehearsal mode." },
      { label: "BNB RPC", status: "ready", detail: "RPC access is available for future live distribution." },
      { label: "Asset Token", status: "todo", detail: "Reward asset is still pending announcement." },
      { label: "Asset Amount", status: "todo", detail: "Final emission size will be announced after harvest accounting closes." },
      { label: "Kitchen Wallet", status: "ready", detail: "Dry-run mode is active, so no live signer is required yet." }
    ],
    recipients: [
      { wallet: "0x1111111111111111111111111111111111111111", alias: "Old Zhao", sharePct: 22.5, amountUsd: 181.13, amountToken: 270, claimed: false },
      { wallet: "0x2222222222222222222222222222222222222222", alias: "Auntie Lin", sharePct: 18.2, amountUsd: 146.51, amountToken: 218, claimed: false },
      { wallet: "0x3333333333333333333333333333333333333333", alias: "Field Captain Wu", sharePct: 15.1, amountUsd: 121.56, amountToken: 181, claimed: false },
      { wallet: "0x4444444444444444444444444444444444444444", alias: "Miller Chen", sharePct: 13.4, amountUsd: 107.87, amountToken: 161, claimed: false },
      { wallet: "0x5555555555555555555555555555555555555555", alias: "Young Luo", sharePct: 11.8, amountUsd: 94.99, amountToken: 142, claimed: false },
      { wallet: "0x6666666666666666666666666666666666666666", alias: "Barn Auntie He", sharePct: 10.0, amountUsd: 80.5, amountToken: 120, claimed: false },
      { wallet: "0x7777777777777777777777777777777777777777", alias: "Canal Keeper Pan", sharePct: 9.0, amountUsd: 72.45, amountToken: 108, claimed: false }
    ],
    ledger: []
  };
}

function seedState() {
  const gooAgents = [
    {
      id: "goo-e258-66c9-8fa6",
      symbol: "KAPP",
      name: "Old Li Tractor",
      strategyLabel: "Steady Auntie",
      status: "dead",
      acquired: true,
      winRate: 35.3,
      plots: 3,
      harvests: 31,
      granaryBnb: 0.1016,
      totalPnlUsd: 15.33,
      score: 54
    },
    {
      id: "goo-ac37-b7f1-cbf5",
      symbol: "THET",
      name: "Aunt Wang Sprinkler",
      strategyLabel: "Quick Sickle",
      status: "starving",
      acquired: false,
      winRate: 17.9,
      plots: 0,
      harvests: 56,
      granaryBnb: 0.0835,
      totalPnlUsd: 7.53,
      score: 38
    },
    {
      id: "goo-b1dd-eb87-6436",
      symbol: "FLUX",
      name: "Harvester 3000",
      strategyLabel: "Night Irrigator",
      status: "starving",
      acquired: false,
      winRate: 13.3,
      plots: 0,
      harvests: 24,
      granaryBnb: 0.003,
      totalPnlUsd: 2.84,
      score: 30
    },
    {
      id: "goo-1d72-ada6-51c9",
      symbol: "MULE",
      name: "Mule Cart",
      strategyLabel: "Barn Bookkeeper",
      status: "dying",
      acquired: false,
      winRate: 7.7,
      plots: 0,
      harvests: 18,
      granaryBnb: 0.0,
      totalPnlUsd: 0.66,
      score: 26
    },
    {
      id: "goo-d8d9-f9ca-7466",
      symbol: "REDS",
      name: "Red Scythe",
      strategyLabel: "Turbo Harvester",
      status: "dying",
      acquired: false,
      winRate: 6.7,
      plots: 0,
      harvests: 30,
      granaryBnb: 0.0,
      totalPnlUsd: -0.82,
      score: 19
    },
    {
      id: "goo-03e1-8b80-37e3",
      symbol: "SOIL",
      name: "Uncle Wu Soil Reader",
      strategyLabel: "Soil Inspector",
      status: "dying",
      acquired: false,
      winRate: 12.4,
      plots: 1,
      harvests: 26,
      granaryBnb: 0.0144,
      totalPnlUsd: -1.44,
      score: 18
    },
    {
      id: "goo-c5f3-4787-638a",
      symbol: "CHEN",
      name: "Young Chen Seeder",
      strategyLabel: "Market Gossip",
      status: "dying",
      acquired: false,
      winRate: 14.8,
      plots: 1,
      harvests: 24,
      granaryBnb: 0.0126,
      totalPnlUsd: 0.94,
      score: 17
    },
    {
      id: "goo-65b3-4198-3745",
      symbol: "BOLT",
      name: "Lightning Thresher",
      strategyLabel: "Storm Chaser",
      status: "dying",
      acquired: false,
      winRate: 9.9,
      plots: 0,
      harvests: 22,
      granaryBnb: 0.0041,
      totalPnlUsd: 0.33,
      score: 16
    }
  ];

  const absorptions = [
    {
      id: "abs-1",
      agentId: "goo-e258-66c9-8fa6",
      agentName: "Old Li Tractor",
      strategyLabel: "Steady Auntie",
      winRate: 35.3,
      timestamp: isoMinutesAgo(52),
      parameterChanges: [
        { param: "kolWeight", before: 1, after: 1.2 },
        { param: "holderWeight", before: 1, after: 1.1 }
      ]
    }
  ];

  const notifications = [
    {
      id: "notif-1",
      type: "respawn",
      severity: "info",
      title: "新农机上线",
      detail: "Young Chen Seeder 刚刚加入生产队，开始勘探新地。",
      timestamp: isoMinutesAgo(44)
    },
    {
      id: "notif-2",
      type: "trailing_stop",
      severity: "warning",
      title: "暴风预警",
      detail: "Scallion LP 的年化回落，系统正在撤出低产地块。",
      timestamp: isoMinutesAgo(30)
    },
    {
      id: "notif-3",
      type: "acquisition",
      severity: "success",
      title: "农机升级完成",
      detail: "Old Li Tractor 已被吸收，主拖拉机的参数得到加强。",
      timestamp: isoMinutesAgo(22)
    },
    {
      id: "notif-4",
      type: "trade_buy",
      severity: "success",
      title: "播种完成",
      detail: "Potato LP 已完成播种，温室仓开始跟踪首轮长势。",
      timestamp: isoMinutesAgo(12)
    },
    {
      id: "notif-5",
      type: "smart_exit",
      severity: "critical",
      title: "霜冻撤资",
      detail: "Bean LP 触发霜冻撤离条件，系统已缩减播种面积。",
      timestamp: isoMinutesAgo(5)
    }
  ];

  const cloudAgents = [
    {
      id: "cloud-agent-1",
      name: "Barn Foreman",
      status: "running",
      chain: "bsc",
      model: "gpt-5",
      version: "1.0.0",
      lastSeenAt: isoMinutesAgo(1),
      currentTask: "Reviewing field candidates",
      budget: { limitUsd: 500, usedUsd: 186.4, remainingUsd: 313.6 },
      wear: { healthPct: 96, cpuPct: 32, memoryPct: 41, errorRate24h: 0.01, restartCount24h: 0 },
      usage: { requests24h: 1820, tokens24h: 240000, cost24hUsd: 18.6 }
    },
    {
      id: "cloud-agent-2",
      name: "Soil Scout",
      status: "running",
      chain: "bsc",
      model: "gpt-5-mini",
      version: "1.0.0",
      lastSeenAt: isoMinutesAgo(2),
      currentTask: "Scanning fresh BSC plots",
      budget: { limitUsd: 220, usedUsd: 74.2, remainingUsd: 145.8 },
      wear: { healthPct: 91, cpuPct: 48, memoryPct: 37, errorRate24h: 0.02, restartCount24h: 1 },
      usage: { requests24h: 960, tokens24h: 126000, cost24hUsd: 7.9 }
    },
    {
      id: "cloud-agent-3",
      name: "Festival Clerk",
      status: "paused",
      chain: "bsc",
      model: "gpt-5-mini",
      version: "1.0.0",
      lastSeenAt: isoMinutesAgo(17),
      currentTask: "Waiting for ration snapshot",
      budget: { limitUsd: 120, usedUsd: 18.1, remainingUsd: 101.9 },
      wear: { healthPct: 99, cpuPct: 6, memoryPct: 19, errorRate24h: 0, restartCount24h: 0 },
      usage: { requests24h: 122, tokens24h: 18000, cost24hUsd: 1.7 }
    }
  ];

  return {
    meta: {
      notificationSeq: notifications.length,
      nextAuthFlow: 1,
      nextSession: 1,
      nextGooSpawn: 9
    },
    authFlows: {},
    appSessions: {},
    gooAgents,
    absorptions,
    notifications,
    cloud: {
      user: {
        id: "user-1",
        name: "Jeff",
        email: "jeff@farmer-agent.local",
        avatarUrl: "/assets/farmer-agent-logo.png"
      },
      org: {
        id: "org-1",
        name: "Farmer Commune"
      },
      agents: cloudAgents,
      creditsOverview: {
        creditBalance: 12850,
        creditBalanceUsd: 128.5,
        monthlyUsedCredits: 3240,
        monthlyUsedUsd: 32.4,
        seedBalance: 8000,
        grainTicketBalance: 4850,
        autoTopupEnabled: true,
        autoTopupThreshold: 2000,
        autoTopupAmount: 10000
      },
      ledger: [
        {
          id: "tx-1",
          type: "usage",
          amountCredits: -320,
          amountUsd: -3.2,
          source: "Barn Foreman",
          description: "Field scouting run",
          createdAt: isoMinutesAgo(8)
        },
        {
          id: "tx-2",
          type: "usage",
          amountCredits: -160,
          amountUsd: -1.6,
          source: "Soil Scout",
          description: "Soil quality analysis",
          createdAt: isoMinutesAgo(31)
        },
        {
          id: "tx-3",
          type: "topup",
          amountCredits: 10000,
          amountUsd: 100,
          source: "Commune treasury",
          description: "Auto top-up refill",
          createdAt: isoMinutesAgo(240)
        }
      ],
      autoTopup: {
        enabled: true,
        threshold: 2000,
        topupAmount: 10000
      }
    },
    candidates: defaultCandidates(),
    portfolio: defaultPortfolio(),
    waterwheel: defaultWaterwheel(),
    airdrop: defaultAirdrop()
  };
}

function hydrateState(rawState) {
  const seeded = seedState();
  const raw = rawState || {};
  const state = {
    ...seeded,
    ...raw,
    meta: { ...seeded.meta, ...(raw.meta || {}) },
    authFlows: raw.authFlows || {},
    appSessions: raw.appSessions || {},
    gooAgents: Array.isArray(raw.gooAgents) && raw.gooAgents.length ? raw.gooAgents : seeded.gooAgents,
    absorptions: Array.isArray(raw.absorptions) ? raw.absorptions : seeded.absorptions,
    notifications: Array.isArray(raw.notifications) && raw.notifications.length ? raw.notifications : seeded.notifications,
    cloud: {
      ...seeded.cloud,
      ...(raw.cloud || {}),
      user: { ...seeded.cloud.user, ...(raw.cloud?.user || {}) },
      org: { ...seeded.cloud.org, ...(raw.cloud?.org || {}) },
      agents: Array.isArray(raw.cloud?.agents) && raw.cloud.agents.length ? raw.cloud.agents : seeded.cloud.agents,
      creditsOverview: { ...seeded.cloud.creditsOverview, ...(raw.cloud?.creditsOverview || {}) },
      ledger: Array.isArray(raw.cloud?.ledger) ? raw.cloud.ledger : seeded.cloud.ledger,
      autoTopup: { ...seeded.cloud.autoTopup, ...(raw.cloud?.autoTopup || {}) }
    },
    candidates: Array.isArray(raw.candidates) && raw.candidates.length
      ? raw.candidates.map((item, index) => ({ ...(seeded.candidates[index % seeded.candidates.length] || {}), ...item }))
      : seeded.candidates,
    portfolio: {
      ...seeded.portfolio,
      ...(raw.portfolio || {}),
      positions: Array.isArray(raw.portfolio?.positions) && raw.portfolio.positions.length ? raw.portfolio.positions : seeded.portfolio.positions,
      watchlist: Array.isArray(raw.portfolio?.watchlist) && raw.portfolio.watchlist.length ? raw.portfolio.watchlist : seeded.portfolio.watchlist,
      seedLedger: Array.isArray(raw.portfolio?.seedLedger) ? raw.portfolio.seedLedger : seeded.portfolio.seedLedger
    },
    waterwheel: { ...seeded.waterwheel, ...(raw.waterwheel || {}) },
    airdrop: {
      ...seeded.airdrop,
      ...(raw.airdrop || {}),
      kitchen: { ...seeded.airdrop.kitchen, ...(raw.airdrop?.kitchen || {}) },
      readiness: Array.isArray(raw.airdrop?.readiness) && raw.airdrop.readiness.length ? raw.airdrop.readiness : seeded.airdrop.readiness,
      recipients: Array.isArray(raw.airdrop?.recipients) && raw.airdrop.recipients.length ? raw.airdrop.recipients : seeded.airdrop.recipients,
      ledger: Array.isArray(raw.airdrop?.ledger) ? raw.airdrop.ledger : seeded.airdrop.ledger
    }
  };

  state.meta.notificationSeq = Math.max(Number(state.meta.notificationSeq || 0), state.notifications.length);
  state.meta.nextAuthFlow = Number(state.meta.nextAuthFlow || 1);
  state.meta.nextSession = Number(state.meta.nextSession || 1);
  state.meta.nextGooSpawn = Math.max(Number(state.meta.nextGooSpawn || 1), state.gooAgents.length + 1);

  const kitchen = state.airdrop.kitchen || {};
  const assetSymbol = String(kitchen.assetSymbol || "").trim().toUpperCase();
  const assetAddress = String(kitchen.assetAddress || "").trim().toLowerCase();
  const isLegacyPlaceholder =
    assetSymbol === "FARM" &&
    (assetAddress === "0xfa0000000000000000000000000000000000rm" || assetAddress === "" || assetAddress === "pending-announcement");

  if (isLegacyPlaceholder) {
    kitchen.assetSymbol = "TBA";
    kitchen.assetAddress = "pending-announcement";
    kitchen.note = "奖励资产等待公布，当前先以演示模式展示分发流程。 / Reward asset pending announcement. Distribution stays in demo mode for now.";
  }

  state.airdrop.readiness = (state.airdrop.readiness || []).map((item) => {
    if (item.label === "Asset Token") {
      return { ...item, detail: "Reward asset is still pending announcement." };
    }
    if (item.label === "Asset Amount") {
      return { ...item, detail: "Final emission size will be announced after harvest accounting closes." };
    }
    return item;
  });

  return state;
}

const stateStore = createStateStore({
  dataDir,
  stateFile,
  seedState,
  hydrateState,
  databaseUrl: config.databaseUrl
});

await stateStore.init();

async function readState() {
  return stateStore.readState();
}

async function writeState(state) {
  return stateStore.writeState(state);
}

let runtimeStatusCache = {
  expiresAt: 0,
  value: null
};

async function probeBscRpc() {
  if (!config.bscRpcUrl) {
    return {
      configured: false,
      ok: false,
      chainId: null,
      latestBlock: null
    };
  }

  const response = await fetch(config.bscRpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: []
    })
  });

  const payload = await response.json().catch(() => ({}));
  return {
    configured: true,
    ok: response.ok && typeof payload.result === "string",
    chainId: "0x38",
    latestBlock: payload.result || null,
    error: payload.error?.message || null
  };
}

async function getRuntimeStatus() {
  if (runtimeStatusCache.value && runtimeStatusCache.expiresAt > Date.now()) {
    return runtimeStatusCache.value;
  }

  const [storage, bsc] = await Promise.all([
    stateStore.health().catch((error) => ({
      ok: false,
      backend: stateStore.backend,
      error: error instanceof Error ? error.message : String(error)
    })),
    probeBscRpc().catch((error) => ({
      configured: Boolean(config.bscRpcUrl),
      ok: false,
      chainId: null,
      latestBlock: null,
      error: error instanceof Error ? error.message : String(error)
    }))
  ]);

  const status = {
    ok: true,
    runtimeReady: storage.ok && (!bsc.configured || bsc.ok),
    storage,
    bsc,
    features: {
      postgresEnabled: stateStore.backend === "postgres",
      bscRpcConfigured: Boolean(config.bscRpcUrl),
      bscWsConfigured: Boolean(config.bscWsUrl),
      openAIConfigured: Boolean(config.openAIApiKey)
    }
  };

  runtimeStatusCache = {
    expiresAt: Date.now() + 30_000,
    value: status
  };

  return status;
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  return raw.split(";").map((chunk) => chunk.trim()).filter(Boolean).reduce((acc, chunk) => {
    const idx = chunk.indexOf("=");
    if (idx === -1) return acc;
    acc[chunk.slice(0, idx)] = decodeURIComponent(chunk.slice(idx + 1));
    return acc;
  }, {});
}

function createNotification(state, payload) {
  state.meta.notificationSeq += 1;
  const notification = {
    id: `notif-${state.meta.notificationSeq}`,
    timestamp: new Date().toISOString(),
    severity: "info",
    ...payload
  };
  state.notifications.unshift(notification);
  state.notifications = state.notifications.slice(0, 80);
  return notification;
}

function buildSignals(state) {
  const signals = state.gooAgents.map((agent) => {
    if (agent.status === "starving") {
      return {
        severity: "warning",
        tokenSymbol: agent.symbol,
        reasons: ["APY fading", "Irrigation required"]
      };
    }
    if (agent.status === "dying") {
      return {
        severity: "critical",
        tokenSymbol: agent.symbol,
        reasons: ["Storm on the field", "Retreat underway"]
      };
    }
    return {
      severity: "ok",
      tokenSymbol: agent.symbol,
      reasons: ["Healthy soil", "No action required"]
    };
  });

  return {
    totalScanned: state.gooAgents.length,
    scannedAt: new Date().toISOString(),
    critical: signals.filter((item) => item.severity === "critical").length,
    warning: signals.filter((item) => item.severity === "warning").length,
    signals
  };
}

function buildGooSummary(state) {
  const agents = state.gooAgents;
  const totalPnlUsd = agents.reduce((sum, agent) => sum + Number(agent.totalPnlUsd || 0), 0);
  const yieldRatePct = agents.length
    ? agents.reduce((sum, agent) => sum + Number(agent.winRate || 0), 0) / agents.length
    : 0;
  return {
    total: agents.length,
    active: agents.filter((agent) => agent.status === "active").length,
    starving: agents.filter((agent) => agent.status === "starving").length,
    dying: agents.filter((agent) => agent.status === "dying").length,
    dead: agents.filter((agent) => agent.status === "dead").length,
    acquired: agents.filter((agent) => agent.acquired).length,
    acquirable: agents.filter((agent) => !agent.acquired && agent.status !== "active").length,
    yieldRatePct: Number(yieldRatePct.toFixed(1)),
    totalPnlUsd: Number(totalPnlUsd.toFixed(2))
  };
}

function buildAirdropSummary(state) {
  const recipients = state.airdrop.recipients;
  const claimedCount = recipients.filter((recipient) => recipient.claimed).length;
  return {
    snapshotAt: state.airdrop.snapshotAt,
    festivalPoolUsd: state.airdrop.kitchen.marketValueUsd,
    registeredVillagers: recipients.length,
    eligibleVillagers: recipients.length,
    sentCount: claimedCount,
    rehearsalRuns: state.airdrop.rehearsalRuns,
    totalHarvestUsd: state.airdrop.totalHarvestUsd,
    recipientListCount: recipients.length
  };
}

function buildDashboardOverview(state) {
  const discovery = {
    scanned: state.candidates.length,
    buyReady: state.candidates.filter((candidate) => candidate.action === "plant").length,
    avgScore: state.candidates.length
      ? Math.round(state.candidates.reduce((sum, candidate) => sum + Number(candidate.score || 0), 0) / state.candidates.length)
      : 0,
    topSignal: state.candidates[0] || null,
    items: state.candidates,
    watchlist: state.portfolio.watchlist
  };
  const portfolioPositions = state.portfolio.positions || [];
  const totalBnb = portfolioPositions.reduce((sum, position) => sum + Number(position.positionBnb || 0), 0);
  const distribution = buildAirdropSummary(state);
  const goo = buildGooSummary(state);
  return {
    generatedAt: new Date().toISOString(),
    discovery,
    portfolio: {
      positions: portfolioPositions,
      totalBnb: Number(totalBnb.toFixed(4)),
      activeCount: portfolioPositions.length,
      seedLedger: state.portfolio.seedLedger
    },
    waterwheel: state.waterwheel,
    distribution: {
      ...distribution,
      readinessDone: state.airdrop.readiness.filter((item) => item.status === "ready").length,
      readinessTotal: state.airdrop.readiness.length,
      recipients: state.airdrop.recipients.slice(0, 7),
      ledger: state.airdrop.ledger.slice(0, 7)
    },
    goo: {
      ...goo,
      topAgents: state.gooAgents.slice().sort((a, b) => Number(b.totalPnlUsd || 0) - Number(a.totalPnlUsd || 0)).slice(0, 8)
    }
  };
}

function findRecipient(state, wallet) {
  const normalized = String(wallet || "").trim().toLowerCase();
  if (!normalized) return null;
  return state.airdrop.recipients.find((recipient) => recipient.wallet.toLowerCase() === normalized) || null;
}

function getAuthenticatedSession(req, state) {
  const cookies = parseCookies(req);
  const sessionId = cookies.farmer_session;
  if (!sessionId) return null;
  return state.appSessions[sessionId] || null;
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function sendHtml(res, statusCode, html, extraHeaders = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    ...extraHeaders
  });
  res.end(html);
}

function sendNotFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function sendMethodNotAllowed(res) {
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function renderMockAuthPage(sessionId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect TractorCloud</title>
  <style>
    body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#080808;color:#f6e70f;display:grid;place-items:center;min-height:100vh}
    .card{width:min(92vw,420px);background:#111;border:1px solid rgba(246,231,15,.18);border-radius:18px;padding:28px;box-shadow:0 20px 50px rgba(0,0,0,.35)}
    h1{margin:0 0 10px;font-size:22px}p{margin:0 0 20px;color:rgba(255,255,255,.7);line-height:1.6}
    button{width:100%;padding:14px 18px;border:none;border-radius:10px;background:#f6e70f;color:#111;font:inherit;font-weight:700;cursor:pointer}
    .sub{margin-top:10px;font-size:12px;color:rgba(255,255,255,.55)}
  </style>
</head>
<body>
  <div class="card">
    <h1>Connect TractorCloud</h1>
    <p>This is the local demo sign-in for Farmer Agent. Click once and the opener will receive a live session cookie.</p>
    <button id="approve">Approve Commune Access</button>
    <div class="sub">Session: ${sessionId}</div>
  </div>
  <script>
    document.getElementById('approve').addEventListener('click', async function() {
      await fetch('/api/eliza-cloud/hosted/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ sessionId: ${JSON.stringify(sessionId)} })
      });
      if (window.opener) {
        window.close();
      } else {
        window.location.href = '/cloud/agents.html';
      }
    });
  </script>
</body>
</html>`;
}

function formatCloudSummary(agents) {
  return {
    total: agents.length,
    running: agents.filter((agent) => agent.status === "running").length,
    paused: agents.filter((agent) => agent.status === "paused").length,
    error: agents.filter((agent) => agent.status === "error").length
  };
}

async function handleApi(req, res, url) {
  const state = await readState();
  const { pathname, searchParams } = url;

  if (req.method === "GET" && pathname === "/api/health") {
    const runtime = await getRuntimeStatus();
    return sendJson(res, 200, {
      ok: true,
      app: "farmer-agent-app",
      runtimeReady: runtime.runtimeReady,
      storage: runtime.storage,
      bsc: runtime.bsc,
      features: runtime.features
    });
  }

  if (req.method === "POST" && pathname === "/api/eliza-cloud/hosted/start") {
    const sessionId = `auth-${state.meta.nextAuthFlow++}`;
    state.authFlows[sessionId] = {
      id: sessionId,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    await writeState(state);
    return sendJson(res, 200, {
      sessionId,
      mode: "cli-session",
      loginUrl: `/auth/mock-cloud?session=${encodeURIComponent(sessionId)}`
    });
  }

  if (req.method === "GET" && pathname === "/api/eliza-cloud/hosted/poll") {
    const sessionId = searchParams.get("session");
    const flow = sessionId ? state.authFlows[sessionId] : null;
    return sendJson(res, 200, { status: flow?.status || "pending" });
  }

  if (req.method === "POST" && pathname === "/api/eliza-cloud/hosted/complete") {
    const body = await parseBody(req);
    const sessionId = body.sessionId;
    if (!sessionId || !state.authFlows[sessionId]) {
      return sendJson(res, 404, { error: "Auth flow not found" });
    }
    const appSessionId = `session-${state.meta.nextSession++}`;
    state.authFlows[sessionId].status = "authenticated";
    state.appSessions[appSessionId] = {
      id: appSessionId,
      userId: state.cloud.user.id,
      orgId: state.cloud.org.id,
      createdAt: new Date().toISOString()
    };
    createNotification(state, {
      type: "respawn",
      severity: "success",
      title: "公社接入成功",
      detail: "TractorCloud 会话已经建立，生产队中控已解锁。"
    });
    await writeState(state);
    return sendJson(
      res,
      200,
      { ok: true, authenticated: true },
      {
        "Set-Cookie": `farmer_session=${encodeURIComponent(appSessionId)}; Path=/; Max-Age=86400; SameSite=Lax`
      }
    );
  }

  if (req.method === "GET" && pathname === "/api/cloud/session") {
    const activeSession = getAuthenticatedSession(req, state);
    if (!activeSession) {
      return sendJson(res, 200, { authenticated: false });
    }
    return sendJson(res, 200, {
      authenticated: true,
      user: state.cloud.user,
      org: state.cloud.org,
      permissions: {
        manageAgents: true,
        manageCredits: true
      }
    });
  }

  if (req.method === "GET" && pathname === "/api/cloud/agents") {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    return sendJson(res, 200, {
      items: state.cloud.agents,
      summary: formatCloudSummary(state.cloud.agents)
    });
  }

  if (req.method === "GET" && pathname.startsWith("/api/cloud/agents/")) {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    const id = pathname.split("/").pop();
    const agent = state.cloud.agents.find((item) => item.id === id);
    if (!agent) return sendJson(res, 404, { error: "Agent not found" });
    return sendJson(res, 200, agent);
  }

  if (req.method === "POST" && /^\/api\/cloud\/agents\/[^/]+\/action$/.test(pathname)) {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    const id = pathname.split("/")[4];
    const agent = state.cloud.agents.find((item) => item.id === id);
    if (!agent) return sendJson(res, 404, { error: "Agent not found" });
    const body = await parseBody(req);
    const action = body.action;
    const nextStatus = {
      start: "running",
      resume: "running",
      restart: "running",
      stop: "paused",
      pause: "paused"
    }[action] || agent.status;
    agent.status = nextStatus;
    agent.lastSeenAt = new Date().toISOString();
    agent.currentTask = `${action || "updated"} from TractorCloud`;
    createNotification(state, {
      type: "respawn",
      severity: "info",
      title: `生产队动作：${agent.name}`,
      detail: `${agent.name} 已执行 ${action || "update"}，当前状态为 ${nextStatus}。`
    });
    await writeState(state);
    return sendJson(res, 200, { ok: true, item: agent });
  }

  if (req.method === "GET" && pathname === "/api/cloud/credits/overview") {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    return sendJson(res, 200, state.cloud.creditsOverview);
  }

  if (req.method === "GET" && pathname === "/api/cloud/credits/ledger") {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    return sendJson(res, 200, { items: state.cloud.ledger });
  }

  if (pathname === "/api/cloud/credits/auto-topup" && req.method === "GET") {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    return sendJson(res, 200, state.cloud.autoTopup);
  }

  if (pathname === "/api/cloud/credits/auto-topup" && req.method === "PATCH") {
    if (!getAuthenticatedSession(req, state)) {
      return sendJson(res, 401, { error: "Authentication required" });
    }
    const body = await parseBody(req);
    state.cloud.autoTopup = {
      ...state.cloud.autoTopup,
      ...body
    };
    state.cloud.creditsOverview.autoTopupEnabled = state.cloud.autoTopup.enabled;
    state.cloud.creditsOverview.autoTopupThreshold = state.cloud.autoTopup.threshold;
    state.cloud.creditsOverview.autoTopupAmount = state.cloud.autoTopup.topupAmount;
    await writeState(state);
    return sendJson(res, 200, state.cloud.autoTopup);
  }

  if (req.method === "GET" && pathname === "/api/elizaok/candidates") {
    return sendJson(res, 200, { items: state.candidates, scannedAt: new Date().toISOString() });
  }

  if (req.method === "GET" && pathname === "/api/dashboard/overview") {
    return sendJson(res, 200, buildDashboardOverview(state));
  }

  if (req.method === "GET" && pathname === "/api/market-intel/signals") {
    return sendJson(res, 200, buildSignals(state));
  }

  if (req.method === "GET" && pathname === "/api/absorption/status") {
    const totalAbsorbed = state.absorptions.length;
    return sendJson(res, 200, {
      totalAbsorbed,
      scoreWeightBoosts: {
        kolWeight: Number((1 + totalAbsorbed * 0.2).toFixed(1)),
        holderWeight: Number((1 + totalAbsorbed * 0.1).toFixed(1))
      },
      absorptions: state.absorptions
    });
  }

  if (req.method === "GET" && pathname === "/api/notifications") {
    return sendJson(res, 200, {
      seq: state.meta.notificationSeq,
      notifications: state.notifications
    });
  }

  if (req.method === "GET" && pathname === "/api/airdrop/status") {
    return sendJson(res, 200, {
      summary: buildAirdropSummary(state),
      kitchen: state.airdrop.kitchen,
      readiness: state.airdrop.readiness,
      recipients: state.airdrop.recipients,
      ledger: state.airdrop.ledger
    });
  }

  if (req.method === "GET" && pathname === "/api/airdrop/check") {
    const wallet = searchParams.get("wallet");
    if (!wallet) {
      return sendJson(res, 400, { error: "wallet query parameter is required" });
    }
    const recipient = findRecipient(state, wallet);
    return sendJson(res, 200, {
      found: Boolean(recipient),
      eligible: Boolean(recipient),
      claimed: Boolean(recipient?.claimed),
      recipient
    });
  }

  if (req.method === "POST" && pathname === "/api/airdrop/claim") {
    const body = await parseBody(req);
    const wallet = body.wallet;
    const recipient = findRecipient(state, wallet);
    if (!recipient) {
      return sendJson(res, 404, { error: "Wallet is not on the harvest list" });
    }
    if (recipient.claimed) {
      return sendJson(res, 409, { error: "Harvest already claimed", recipient });
    }
    recipient.claimed = true;
    recipient.claimedAt = new Date().toISOString();
    const txHash = `0x${randomUUID().replace(/-/g, "").slice(0, 32)}`;
    const entry = {
      id: `ration-${state.airdrop.ledger.length + 1}`,
      wallet: recipient.wallet,
      alias: recipient.alias,
      amountUsd: recipient.amountUsd,
      amountToken: recipient.amountToken,
      assetSymbol: state.airdrop.kitchen.assetSymbol,
      txHash,
      mode: state.airdrop.kitchen.mode,
      createdAt: recipient.claimedAt
    };
    state.airdrop.ledger.unshift(entry);
    state.airdrop.rehearsalRuns += 1;
    createNotification(state, {
      type: "trade_buy",
      severity: "success",
      title: "口粮已发出",
      detail: `${recipient.alias} 已领走 ${recipient.amountToken} ${state.airdrop.kitchen.assetSymbol}。`
    });
    await writeState(state);
    return sendJson(res, 200, { ok: true, recipient, entry });
  }

  if (req.method === "GET" && pathname === "/api/goo/agents") {
    return sendJson(res, 200, {
      agents: state.gooAgents,
      summary: buildGooSummary(state),
      waterwheel: state.waterwheel,
      absorption: {
        totalAbsorbed: state.absorptions.length
      }
    });
  }

  if (req.method === "POST" && pathname === "/api/goo/agents/spawn") {
    const body = await parseBody(req);
    const spawned = {
      id: `goo-spawn-${state.meta.nextGooSpawn++}`,
      symbol: `NEW${state.meta.nextGooSpawn}`,
      name: `Field Rig ${state.meta.nextGooSpawn}`,
      strategyLabel: body.strategy || "Balanced Planter",
      status: "active",
      acquired: false,
      winRate: 11.2,
      plots: 1,
      harvests: 0,
      granaryBnb: Number(body.treasury || 1),
      totalPnlUsd: 0,
      score: 21
    };
    state.gooAgents.push(spawned);
    createNotification(state, {
      type: "respawn",
      severity: "success",
      title: "新雇工入场",
      detail: `${spawned.name} 已加入农机竞技场，策略为 ${spawned.strategyLabel}。`
    });
    await writeState(state);
    return sendJson(res, 200, { ok: true, agent: spawned });
  }

  if (req.method === "POST" && /^\/api\/goo\/agents\/[^/]+\/acquire$/.test(pathname)) {
    const id = pathname.split("/")[4];
    const agent = state.gooAgents.find((item) => item.id === id);
    if (!agent) return sendJson(res, 404, { error: "Agent not found" });
    agent.acquired = true;
    agent.status = "dead";
    const totalAbsorbed = state.absorptions.length + 1;
    const absorption = {
      id: `abs-${totalAbsorbed}`,
      agentId: agent.id,
      agentName: agent.name,
      strategyLabel: agent.strategyLabel,
      winRate: agent.winRate,
      timestamp: new Date().toISOString(),
      parameterChanges: [
        { param: "kolWeight", before: Number((1 + state.absorptions.length * 0.2).toFixed(1)), after: Number((1 + totalAbsorbed * 0.2).toFixed(1)) },
        { param: "holderWeight", before: Number((1 + state.absorptions.length * 0.1).toFixed(1)), after: Number((1 + totalAbsorbed * 0.1).toFixed(1)) }
      ]
    };
    state.absorptions.push(absorption);
    createNotification(state, {
      type: "acquisition",
      severity: "success",
      title: "吸收养分成功",
      detail: `${agent.name} 已被主拖拉机吸收，参数完成一轮升级。`
    });
    await writeState(state);
    return sendJson(res, 200, {
      ok: true,
      absorption: {
        totalAbsorbed,
        parameterChanges: absorption.parameterChanges
      }
    });
  }

  return sendNotFound(res);
}

async function serveStatic(req, res, url) {
  const routePath = prettyRoutes[url.pathname] || url.pathname;
  let target = normalize(decodeURIComponent(routePath));
  if (target === "/" || target === ".") {
    target = "/index.html";
  }
  const fullPath = resolve(publicRoot, `.${target}`);
  if (!fullPath.startsWith(publicRoot)) {
    return sendNotFound(res);
  }

  try {
    await access(fullPath);
    const contentType = mimeTypes[extname(fullPath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(fullPath).pipe(res);
  } catch {
    sendNotFound(res);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if ((url.pathname === "/auth/mock-cloud" || url.pathname === "/auth/eliza-cloud") && req.method === "GET") {
    const sessionId = url.searchParams.get("session") || "manual-local-session";
    return sendHtml(res, 200, renderMockAuthPage(sessionId));
  }

  if (url.pathname.startsWith("/api/")) {
    try {
      return await handleApi(req, res, url);
    } catch (error) {
      console.error(error);
      return sendJson(res, 500, { error: "Internal server error" });
    }
  }

  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    return sendMethodNotAllowed(res);
  }

  return serveStatic(req, res, url);
});

server.listen(port, host, () => {
  console.log(`Farmer Agent app running on http://${host}:${port}`);
  console.log(`State backend: ${stateStore.backend}`);
  if (config.bscRpcUrl) {
    console.log("BSC RPC configured for server-side access");
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    try {
      await stateStore.close();
    } finally {
      process.exit(0);
    }
  });
}
