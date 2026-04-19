# Farmer Agent / 农民 Agent

这是一个已经可以本地跑起来的完整 demo 项目，不再只是静态网页。

## 现在已经具备的能力

- 本地 Node 后端
- 本地登录流
- 生产队页真实读写
- 工分库页真实读写
- 本地 JSON 持久化
- 中文主站 + 英文独立页

本地数据文件在：

- `/Users/jeffyuan/Desktop/elizaok.com/server/data/state.json`

## 启动方式

在项目根目录运行：

```bash
npm start
```

然后打开：

- 中文首页: [http://localhost:3000](http://localhost:3000)
- 中文生产队: [http://localhost:3000/cloud/agents](http://localhost:3000/cloud/agents)
- 中文工分库: [http://localhost:3000/cloud/credits](http://localhost:3000/cloud/credits)
- 英文首页: [http://localhost:3000/en](http://localhost:3000/en)

开发模式：

```bash
npm run dev
```

## 已实现的本地接口

- `GET /api/health`
- `GET /api/cloud/session`
- `GET /api/cloud/agents`
- `GET /api/cloud/agents/:id`
- `POST /api/cloud/agents/:id/action`
- `GET /api/cloud/credits/overview`
- `GET /api/cloud/credits/ledger`
- `GET /api/cloud/credits/auto-topup`
- `PATCH /api/cloud/credits/auto-topup`
- `GET /api/elizaok/candidates`
- `GET /api/market-intel/signals`
- `GET /api/absorption/status`
- `GET /api/notifications`
- `GET /api/goo/agents`
- `POST /api/goo/agents/spawn`
- `POST /api/goo/agents/:id/acquire`
- `GET /api/dashboard/overview`
- `GET /api/airdrop/status`
- `GET /api/airdrop/check?wallet=0x...`
- `POST /api/airdrop/claim`

## 现在已经接上后端的页面

- `/dashboard`
- `/goo`
- `/airdrop`
- `/cloud/agents`
- `/cloud/credits`

这些页面现在都不是纯静态壳子了，会读取本地 JSON 状态并触发真实写入。

## 运行时配置

- 本地开发读取项目根目录 `.env`
- 线上部署读取 `/opt/farmeragent/.env`
- 这些敏感配置不会被打进前端页面里

当前项目已经支持：

- `DATABASE_URL`：使用 `Postgres` 做正式状态存储
- `BSC_RPC_URL` / `BSC_WS_URL`：使用服务端访问 BSC RPC

## 一键更新线上版

如果你要把本地最新版本推到 `farmeragent.forum`，在项目根目录运行：

```bash
bash scripts/deploy-farmeragent.sh
```

或者直接双击：

- `/Users/jeffyuan/Desktop/elizaok.com/update-farmeragent.command`

这个更新流程会：

- 打包当前项目
- 上传到服务器
- 上传本地 `.env` 到服务器安全位置
- 保留线上 `server/data/state.json`
- 安装线上依赖
- 重启 `farmeragent` 服务
- 验证 `https://farmeragent.forum/api/health`

## 以后你给我配置，直接按这个格式

我已经准备好了环境变量模板：

- [.env.example](/Users/jeffyuan/Desktop/elizaok.com/.env.example)

### BSC RPC

你直接把下面任意一种给我就行：

```bash
BSC_RPC_URL=https://your-provider.example.com/xxxxxxxx
```

或者如果有 WebSocket：

```bash
BSC_RPC_URL=https://your-provider.example.com/xxxxxxxx
BSC_WS_URL=wss://your-provider.example.com/xxxxxxxx
```

如果服务商要求 IP 白名单，就把服务器 IP `104.238.141.201` 加进去。

### 数据库

我这边决定直接用 `Postgres`。

最省事的方式是你给我一条完整连接串：

```bash
DATABASE_URL=postgresql://user:password@host:5432/farmeragent?sslmode=require
```

推荐：

- Neon
- Supabase
- Railway Postgres

你后面把 `API / RPC / DATABASE_URL` 发我，我就可以继续把 demo 后端升级成正式数据层。

## 你现在不用买的

以下内容现在都不需要，项目已经能本地完整演示：

- 数据库
- 云登录平台
- SaaS 后台
- 第三方 API 网关

## 真正上线时建议补的服务

### 第一批，最值得先买

- 域名
- 一台服务器或云主机
- 反向代理和 HTTPS
- 一个真正的数据库

推荐组合：

- 域名：Cloudflare / 阿里云 / 腾讯云
- 主机：Railway / Render / Fly.io / 一台轻量云服务器
- 数据库：Postgres

### 第二批，如果你要“真 AI”

- OpenAI API key
- 或其他模型提供商 key

用途：

- 真正驱动生产队 Agent
- 自动分析农田
- 自动生成天气预警 / 风险总结 / 交易解释

### 第三批，如果你要“真链上动作”

- BSC RPC 节点
- 钱包托管或签名方案
- 链上执行安全方案

推荐方向：

- RPC：QuickNode / Alchemy / Ankr / NodeReal
- 钱包：自托管热钱包 + 小额权限隔离，或者 Safe 类多签方案

### 第四批，可选增强

- 行情和池子数据服务
- 错误监控
- 日志平台
- 邮件或通知系统

## 下一步最推荐的工程升级

1. 把现在的 JSON 存储换成 Postgres。
2. 给 Agent 运行记录、账本、用户、会话建表。
3. 把 JSON 持久化升级成 Postgres。
4. 接入真正的 AI 和链上执行。
5. 补上监控、备份、管理员权限和正式分发安全策略。
