# Farmer Agent 仓库说明

这个仓库是 `Farmer Agent` 的源码仓库，不是给终端用户看的说明页。

这里主要服务 3 件事：

- 我自己看源码和维护项目
- 本地开发 / 调试
- 一键部署到 `farmeragent.forum`

## 当前项目状态

这套项目已经不是单纯静态页了，当前包含：

- `farm-remix/`：前端页面
- `server/`：Node 后端
- `Postgres`：正式状态存储
- `BSC RPC`：服务端链上访问
- `scripts/`：部署脚本

线上地址：

- [https://farmeragent.forum](https://farmeragent.forum)

线上运行方式：

- Caddy 反代
- systemd 托管
- 仅监听 `127.0.0.1:3105`

## 目录结构

```text
farm-remix/                 前端页面与静态资源
server/index.mjs            主服务入口
server/lib/config.mjs       环境变量加载
server/lib/state-store.mjs  状态存储层（Postgres / JSON）
scripts/deploy-farmeragent.sh
scripts/remote-deploy-farmeragent.sh
.env.example                环境变量模板
```

## 本地开发

安装依赖：

```bash
npm install
```

启动：

```bash
npm start
```

开发热更新：

```bash
npm run dev
```

本地入口：

- `http://localhost:3000`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/goo`
- `http://localhost:3000/airdrop`
- `http://localhost:3000/cloud/agents`
- `http://localhost:3000/cloud/credits`

## 环境变量

本地读取：

- 项目根目录 `.env`

线上读取：

- `/opt/farmeragent/.env`

模板见：

- [.env.example](/Users/jeffyuan/Desktop/elizaok.com/.env.example)

当前已经接入的关键变量：

- `DATABASE_URL`
- `BSC_RPC_URL`
- `BSC_WS_URL`
- `OPENAI_API_KEY` 预留，当前未正式启用

## 当前已接入页面

- `/dashboard`
- `/goo`
- `/airdrop`
- `/cloud/agents`
- `/cloud/credits`

## 主要接口

- `GET /api/health`
- `GET /api/dashboard/overview`
- `GET /api/goo/agents`
- `POST /api/goo/agents/spawn`
- `POST /api/goo/agents/:id/acquire`
- `GET /api/airdrop/status`
- `GET /api/airdrop/check`
- `POST /api/airdrop/claim`
- `GET /api/cloud/session`
- `GET /api/cloud/agents`
- `POST /api/cloud/agents/:id/action`
- `GET /api/cloud/credits/overview`
- `GET /api/cloud/credits/ledger`
- `GET /api/cloud/credits/auto-topup`
- `PATCH /api/cloud/credits/auto-topup`

## 部署

本地一键部署到线上：

```bash
bash scripts/deploy-farmeragent.sh
```

或者双击：

- [update-farmeragent.command](/Users/jeffyuan/Desktop/elizaok.com/update-farmeragent.command)

部署流程会做这些事：

1. 打包当前仓库代码
2. 上传到服务器
3. 上传本地 `.env` 到服务器安全位置
4. 保留线上运行态数据快照
5. 安装依赖
6. 重启 `farmeragent` 服务
7. 校验线上健康状态

## 仓库里不应该出现的东西

这些不要提交：

- `.env`
- 任何 API key / token / 私钥
- `server/data/state.json`
- 服务器上的运行态文件

这些已经在 `.gitignore` 里处理：

- 旧站根目录镜像
- 本地依赖目录
- 本地环境变量文件
- 本地运行态数据

## 现在还没做完的事

真正要补的不是页面皮肤，而是产品底层：

1. 给 Postgres 拆正式表结构，不再只用单 JSON 状态块
2. 接真实业务 API
3. 接真正的 AI provider
4. 接真正链上执行
5. 做管理员权限、监控、备份、审计

## 备注

这个 README 只写“维护和开发需要知道的事”。

如果后面要做给外部用户看的仓库首页，再单独写一份更对外的 README 或项目文档，不和这份混在一起。
