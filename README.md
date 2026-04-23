# MyGObti

一个基于《BanG Dream! It's MyGO!!!!!》角色气质的恶搞人格测试 H5 项目。

当前仓库已经完成轻量前后端分离，并在主入口层面收口到实际 workspace 结构：

- `apps/web`：React + Vite 前端，负责答题体验、结果展示与海报导出
- `apps/api`：Fastify 只读内容服务，负责解析 canonical 题库并输出 `/api/*`
- `packages/quiz-core`：共享 quiz 类型、contract 与匹配算法
- `.planning/`：GSD 执行文档，不重复写产品 PRD

## 当前事实

- 当前运行时 canonical 题库真源：`questionedit/questionnewV2.md`
- 当前主线版本：`V2.1D`
- 当前实际答题规模：20 题，其中 `Q17-Q19` 为 latent tie-break 题，`Q20` 为反向校验题
- 当前阶段仍然没有账号系统、数据库、CMS 或写接口

## 快速开始

```bash
npm install
```

本地联调时，先启动 API：

```bash
npm run dev:api
```

再启动 Web：

```bash
npm run dev:web
```

也可以直接用：

```bash
npm run dev
```

常用校验命令：

```bash
npm run typecheck
npm run build
```

备份当前仓库快照：

```bash
npm run backup:snapshot
```

默认会把快照写到仓库外的 `$HOME/git-backups/MYGObti/<timestamp>/`，并显式排除 `.git-backups/`、`node_modules/`、`dist/`、`.planning/tmp/`，避免把备份目录或构建产物再次打包进去。

Web 单独验收：

```bash
npm run typecheck --workspace apps/web
npm run build --workspace apps/web
```

默认情况下：

- API 监听 `http://127.0.0.1:3001`
- Web 监听 `http://127.0.0.1:5173`
- Web 开发环境会通过 Vite `server.proxy` 把 `/api/*` 代理到 `VITE_API_PROXY_TARGET`
- `VITE_API_PROXY_TARGET` 默认值是 `http://127.0.0.1:3001`

## Web 环境变量

`apps/web` 读取两个 `VITE_` 变量：

- `VITE_API_BASE_URL`
  - 浏览器运行时请求前缀
  - 默认值是 `/api`
  - 分域部署时可设为 `https://your-api.example.com/api`
- `VITE_API_PROXY_TARGET`
  - 仅用于 Vite 开发代理目标
  - 默认值是 `http://127.0.0.1:3001`

示例：

```bash
# apps/web/.env.local
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:3001
```

## 目录地图

- `apps/web/`：前端应用与 UI 代码
- `apps/api/`：只读内容服务
- `packages/quiz-core/`：共享算法和类型
- `questionedit/`：题库编辑、候选稿、评估脚本与报告
- `frontend-design/`：设计试验材料，不是运行时真源
- `docs/`：当前工程结构与运行边界说明
- `.planning/`：ROADMAP、STATE、phase 文档等执行真源

## 文档与真源映射

- 运行时内容真源：`questionedit/questionnewV2.md`
- 共享运行时 contract / 算法真源：`packages/quiz-core`
- 架构说明：`docs/ARCHITECTURE.md`
- 工程阶段路线：`.planning/ROADMAP.md`
- 当前项目框架：`.planning/PROJECT.md`
- 当前状态续接点：`.planning/STATE.md`
- 历史产品草案：`start.md`
- 历史题库收集草稿：`questioncollectionV1.md`

## 部署说明

- `apps/web` 可以作为静态站点部署，但需要把 `VITE_API_BASE_URL` 指到可访问的 API 前缀
- `apps/api` 是轻量只读 Node 服务，当前暴露 `GET /api/health`、`GET /api/quiz/meta`、`GET /api/quiz/content`
- 如果 web 与 api 同域部署，推荐让反向代理把 `/api/*` 转发给 `apps/api`
- 这个阶段仍然不引入数据库、登录、后台写入或管理台

## 说明

`start.md` 里的 “Phase 1 / Phase 2” 是产品阶段表述。
`.planning/ROADMAP.md` 里的 phase 是工程执行阶段表述。

补充说明：

- `start.md` 和 `questioncollectionV1.md` 里保留了早期草案，不应直接当作运行时事实。
- 现在浏览器读取的是 `apps/api` 输出的 canonical JSON，不再直接读取本地 Markdown，也不在 web 侧复制匹配算法。
