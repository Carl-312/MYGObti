# MyGObti

> 一个《BanG Dream! It's MyGO!!!!!》气质人格测试 H5。  
> 也是一个热爱 AI 编程的人，靠提示词、报错、重构和一点点执念，磕磕绊绊搭出来的小项目。

## 这是什么？

MyGObti 是一个基于《BanG Dream! It's MyGO!!!!!》角色气质的恶搞向人格测试 H5。

用户会回答一组带有情境感的问题，系统根据答案构建一个角色倾向向量，再通过匹配算法给出最接近的 MyGO 气质结果。

它不是严肃心理测评。  
它更像是：

> 用一点点心理测评的壳，装一点点二次元的梗，再加一点点 AI 编程人的工程洁癖。

---

## 当前版本状态

当前主线版本：`V2.1D`

当前实际答题规模：

- 共 20 题
- `Q17-Q19`：latent tie-break 题，用来处理角色结果接近时的细微差异
- `Q20`：反向校验题，用来减少“随便点也能很像”的错觉
- 主模型仍是 `3D`
- 保留 latent tie-breaker
- 当前不切到 `4D`

当前项目边界：

- 没有账号系统
- 没有数据库
- 没有 CMS
- 没有写接口
- 没有后台管理系统

简单说：  
**它是一个轻量、可运行、可继续迭代的 H5 测试项目。**

---

## 项目为什么会长成这样？

最早的目标很简单：

> 做一个好玩、能分享、带一点 MyGO 气质的测试页面。

但真正写起来之后，事情开始变得不简单：

- 题库要改
- 结果文案要调
- 角色匹配不能太玄学
- 前端不能复制一份假数据
- API 不能变成未来维护噩梦
- AI 生成的代码需要有人收口
- 项目文档不能每个文件都说自己才是真源

所以这个项目最后被整理成了现在这种结构：

```txt
MYGObti/
├─ apps/
│  ├─ web/              # React + Vite 前端
│  └─ api/              # Fastify 只读内容服务
├─ packages/
│  └─ quiz-core/        # 共享类型、评分、匹配逻辑
├─ questionedit/        # 题库编辑、候选稿、评估脚本
├─ frontend-design/     # 视觉和交互实验材料
├─ docs/                # 架构与配置说明
├─ .planning/           # agent / 工程推进上下文
└─ scripts/             # 本地开发、预览、备份脚本
````

这不是为了显得“架构很高级”。
而是为了避免一个常见灾难：

> 前端一份题库，Markdown 一份题库，算法一份逻辑，README 又说了第四种真相。

MyGObti 当前的原则是：

> **题库有真源，算法有边界，前端只负责体验。**

---

## 技术栈

### Web

`apps/web`

* React 19
* React Router
* Vite
* TypeScript
* `@mygobti/quiz-core`
* `html-to-image`
* `motion`

负责：

* 首页 / 开始体验
* 答题流程
* 结果页
* 海报导出
* 分享相关交互
* 本地预览页

Web 不直接拥有 canonical 题库真相。
运行时内容从 API 获取。

---

### API

`apps/api`

一个轻量 Fastify 只读服务。

负责：

* 健康检查
* 解析 canonical Markdown
* 基于源文件修改时间做内存缓存
* 输出前端消费的 JSON

当前接口：

```txt
GET /api/health
GET /api/quiz/meta
GET /api/quiz/content
```

它不负责：

* 登录
* 鉴权
* 数据库持久化
* 写入接口
* 后台任务
* CMS

这不是缺陷。
这是当前阶段刻意控制复杂度。

---

### Quiz Core

`packages/quiz-core`

这是前后端共享的测试核心。

负责：

* quiz 类型定义
* API response shape
* 向量计算
* cosine similarity
* result ranking
* tie-break 行为
* hidden match signal

核心理念：

> 匹配逻辑不要散落在 UI 里。
> UI 可以变漂亮，算法不能到处复制粘贴。

---

## 题库真源

当前运行时 canonical 题库真源：

```txt
questionedit/questionnewV2.md
```

当前主线版本：

```txt
V2.1D
```

`questionedit/` 不是垃圾桶。
它是这个项目最像“炼丹现场”的地方。

里面会有：

* 题库正文
* 历史候选版本
* 调参记录
* 评估脚本
* prompt 模板
* 旧方案复盘
* 一些曾经看起来很合理、后来被打回去的想法

当前有效事实以 `questionnewV2.md` 和当前文档为准。
不要随手把旧 reports 当成现行结论。

---

## 快速开始

安装依赖：

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

也可以直接使用统一入口：

```bash
npm run dev
```

默认情况下：

```txt
API: http://127.0.0.1:3001
Web: http://127.0.0.1:5173
```

---

## 本地正式预览

使用单入口：

```bash
npm run preview:prod
```

默认会收口成：

```txt
正式预览页: http://127.0.0.1:4173/
API 前缀:   http://127.0.0.1:3001/api
```

这个脚本会尽量处理一些本地开发中很烦的小问题：

* 用正确的 `VITE_API_BASE_URL` 重新构建 Web
* 复用健康的本地 API
* 如果 `4173` 被本仓库旧的 `vite preview` 占用，会尝试回收
* 默认绑定到 `0.0.0.0`
* 输出 WSL / browser / network 等访问地址
* 输出可供脚本解析的 ready 标记

如果你在 WSL / Windows / 浏览器 localhost 之间被折磨过，
你应该知道这件事有多必要。

---

## 常用命令

类型检查：

```bash
npm run typecheck
```

完整构建：

```bash
npm run build
```

Web 单独验收：

```bash
npm run typecheck --workspace apps/web
npm run build --workspace apps/web
```

API 单独验收：

```bash
npm run typecheck --workspace apps/api
npm run build --workspace apps/api
```

quiz-core 单独检查：

```bash
npm run typecheck --workspace @mygobti/quiz-core
```

备份当前仓库快照：

```bash
npm run backup:snapshot
```

默认快照会写到：

```txt
$HOME/git-backups/MYGObti/<timestamp>/
```

并排除：

```txt
.git-backups/
node_modules/
dist/
.planning/tmp/
```

避免备份把备份继续打包，形成一种非常有程序员美感的灾难。

---

## 环境变量

### Web

`apps/web` 主要读取：

```txt
VITE_API_BASE_URL
VITE_API_PROXY_TARGET
```

示例：

```bash
# apps/web/.env.local
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:3001
```

### API

`apps/api` 主要读取：

```txt
PORT
WEB_ORIGIN
```

示例：

```bash
# apps/api/.env
WEB_ORIGIN=https://your-web.example.com
```

分域部署时，记得同时配置：

```bash
VITE_API_BASE_URL=https://your-api.example.com/api
WEB_ORIGIN=https://your-web.example.com
```

---

## 部署说明

当前推荐两种部署方式。

### 方式一：同域部署

让反向代理把：

```txt
/api/*
```

转发到 `apps/api`。

Web 保持：

```txt
VITE_API_BASE_URL=/api
```

这是最省心的形态。

### 方式二：Web / API 分域部署

Web 作为静态站点部署。
API 作为轻量 Node 服务部署。

部署前至少执行：

```bash
npm run build --workspace apps/api
```

API 生产启动入口：

```bash
node dist/server.js
```

然后把 Web 的 API 前缀指向线上 API：

```bash
VITE_API_BASE_URL=https://your-api.example.com/api
```

同时给 API 配置允许访问的前端域名：

```bash
WEB_ORIGIN=https://your-web.example.com
```

---

## 项目目录地图

```txt
apps/web/
```

前端应用与 UI 代码。
负责答题体验、结果展示、海报导出和分享交互。

```txt
apps/api/
```

只读内容服务。
负责解析 canonical 题库，并输出 `/api/*`。

```txt
packages/quiz-core/
```

共享算法和类型。
负责让 Web 与 API 对同一套 quiz contract 达成共识。

```txt
questionedit/
```

题库编辑区。
这里是问题、候选稿、评估脚本和 prompt 实验的主要工作台。

```txt
frontend-design/
```

设计试验材料。
它可以启发 UI，但不是运行时真源。

```txt
docs/
```

工程结构、配置和架构边界说明。

```txt
.planning/
```

ROADMAP、STATE、phase 文档等执行真源。
主要服务于后续 AI agent / 人类开发者续接上下文。

---

## 文档与真源映射

| 内容                   | 当前真源                                               |
| -------------------- | -------------------------------------------------- |
| 运行时题库                | `questionedit/questionnewV2.md`                    |
| 共享类型 / 算法 / contract | `packages/quiz-core`                               |
| 架构说明                 | `docs/ARCHITECTURE.md`                             |
| 工程阶段路线               | `.planning/ROADMAP.md`                             |
| 当前项目框架               | `.planning/PROJECT.md`                             |
| 当前状态续接点              | `.planning/STATE.md`                               |
| 历史候选与评估材料            | `questionedit/candidates/`、`questionedit/reports/` |

---

## 这个项目的气质

MyGObti 不是那种一开始就规划完美的大项目。

它更像是：

1. 先有一个很想做的小点子；
2. 然后让 AI 帮忙写；
3. 然后发现 AI 写得很快，但也很会埋坑；
4. 再开始补文档、拆目录、收边界；
5. 最后变成一个还挺能跑、也还能继续改的小型工程。

所以这个项目里同时存在两种东西：

* 二次元小测试的轻松感
* 工程整理后的克制感

这两种东西并不冲突。
一个好玩的小项目，也可以有清楚的结构。

---

## 给路过的 AI 编程同好

这个项目不适合作为“最佳实践模板”照抄。
但它适合观察一个真实的小项目如何从混乱中逐渐变得可维护。

你可能会看到：

* AI 生成代码后的人工收口
* 文档真源的重新整理
* 题库版本的多轮迭代
* 小项目如何避免过度工程化
* H5 项目如何拆出轻量 API
* 评分逻辑如何从前端里抽到共享包
* prompt、题库、评估脚本如何配合工作

如果你正在用 AI 写自己的小项目，
这个仓库想表达的核心经验大概是：

> AI 可以帮你把东西写出来，
> 但你仍然需要决定：什么是真源，什么是边界，什么现在不做。

---

## 当前不会做什么？

为了保持项目轻量，当前阶段明确不做：

* 用户登录
* 云端保存测试记录
* 数据库
* 后台 CMS
* 管理台
* 复杂权限系统
* 多租户
* 过重的设计系统
* 企业级可观测性

这些东西不是永远不能做。
只是现在没必要。

MyGObti 当前的重点是：

```txt
好玩 > 能跑 > 可维护 > 再慢慢变漂亮
```

---

## License

允许随意修改和编辑。

如需商用，请先联系作者获取授权。
