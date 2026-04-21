# 🌾 Farmer Agent (PeasantOS)

> "Planting Crypto, Harvesting Yield. AI Peasant at your service."

欢迎来到 Farmer Agent 的开源代码库！这是建立在 BNB Chain 上的全自动“农业公社”。我们正在打造一个由 AI 驱动的新一代 Yield Farming（流动性挖矿）与风控中枢。

本项目已经跨越了纯前端演示阶段，进化为一个包含 Node 后端、Postgres 存储和真实链上 RPC 监听的全栈工程。

## 🌍 线上预览: https://farmeragent.forum/
## 🐦 推特账号: https://x.com/Farmer_Agent
## 🚜 农场架构 (Architecture)

我们的代码库被划分为以下几个核心产区：

•	farm-remix/ 🌽：前端大棚。包含所有用户可见的控制台、生产队管理和工分账本页面。
•	server/ ⚙️：后院引擎。Node.js 主服务，负责调度 Agent、读取链上数据和处理业务逻辑。
•	server/index.mjs: 引擎总开关
•	server/lib/state-store.mjs: 状态流转中心（连接 Postgres 与本地缓存）
•	scripts/ 📜：后勤脚本。用于一键打包和部署到线上服务器。

## 🛠️ 本地春耕指南 (Local Development)

想在本地启动你的专属拖拉机？只需几步：

1. 准备种子（安装依赖）

```bash
npm install
```

2. 启动引擎（本地热更新开发）

```bash
npm run dev
```

(如果需要跑生产模式，请使用 npm start)

3. 巡视农田（本地入口）

服务启动后，浏览器访问 http://localhost:3000。

你可以直接查看以下核心业务区：

•	/dashboard - 大棚中控（大盘概览与收益飞轮）
•	/goo - 农机竞技场（Agent 优胜劣汰）
•	/airdrop - 丰收庆典（空投分配）
•	/cloud/agents & /cloud/credits - 云端生产队与工分账本

## 🧪 肥料与环境配置 (Environment Variables)

Agent 启动需要依赖外部环境（数据库和链上节点）。请复制仓库中的 .env.example 文件并重命名为 .env，然后填入你的配置：

```bash
# 核心大粮仓 (推荐使用 Supabase 或 Neon)
DATABASE_URL=postgresql://user:password@host:5432/farmeragent?sslmode=require

# 田间天线 (BSC 节点，推荐使用 QuickNode)
BSC_RPC_URL=https://your-provider.example.com/...
BSC_WS_URL=wss://your-provider.example.com/...

# AI 大脑 (预留，当前版本暂未完全启用)
OPENAI_API_KEY=sk-...
```

⚠️ 注意： 绝对不要把你的 .env 文件或任何私钥提交到 Github！仓库的 .gitignore 已经做好了防护，请保持原样。

## 🚀 驶向公社 (Deployment)

如果你想把改好的代码发到线上（基于 Caddy 反代 + systemd 托管，默认监听 127.0.0.1:3105），只需运行：

```bash
bash scripts/deploy-farmeragent.sh
```

(Mac 用户也可以直接双击运行 update-farmeragent.command)

自动化部署会帮你完成： 打包代码 ➡️ 上传服务器 ➡️ 备份线上数据 ➡️ 同步 .env ➡️ 重启服务 ➡️ 健康检查。

## 🗺️ 农夫历：下一步种什么？ (Roadmap)

目前的版本已经搭好了架子，但要让 Agent 真正下地干活，我们接下来的开发重点是产品底层引擎：

•	[ ] 重构粮仓结构： 将 Postgres 的单 JSON 状态块拆分为正式的关系型数据表。

•	[ ] 激活 AI 大脑： 接入真实的 AI Provider (OpenAI / 本地大模型)，让风控评分不再是模拟数据。

•	[ ] 真金白银下地： 接入真实业务 API 与链上智能合约执行，从 Paper Trading（模拟盘）转向实盘操作。

•	[ ] 公社安保系统： 完善管理员权限、运行监控、自动备份与链上审计功能。
