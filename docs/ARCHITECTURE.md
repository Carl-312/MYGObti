# Architecture

## 目标

这个仓库仍然是一个轻量 H5 小项目，但现在已经稳定为“web 壳 + 只读内容服务 + quiz-core 共享 contract”的 workspace 结构。
Phase `02.1` 完成前后端分离，Phase `02.2` 完成主入口文档收口；当前重点是保持边界清晰，不往企业中台方向膨胀。

补充说明：当前仍明确不引入数据库、登录系统、CMS 或写接口。

## 分层职责

- `apps/web`
  - React + Vite 前端应用
  - 负责初始化加载、答题流程、结果展示、分享导出和 UI 适配
- `apps/api`
  - Fastify 只读内容服务
  - 负责 canonical Markdown 解析、缓存和 `/api/*` 输出
- `packages/quiz-core`
  - 共享 quiz 类型、匹配算法和前后端 contract
- `questionedit`
  - 题库编辑、候选版本、评估脚本与报告
  - 不直接作为浏览器运行时入口
- `.planning`
  - ROADMAP、STATE、PROJECT 和各 phase 文档
  - 负责后续 agent 的执行上下文，而不是产品说明全文

## 当前边界

- 运行时 canonical 数据源固定为 `questionedit/questionnewV2.md`，当前主线版本固定为 `V2.1D`
- 浏览器不再直接导入 Markdown；web 通过 `/api/quiz/meta` 与 `/api/quiz/content` 读取运行时内容
- `apps/web` 只做展示适配与交互状态，不再维护第二份 canonical 题库真相
- 历史产品草案已经退出当前仓库主入口，不参与现行运行时定义
- 当前实现不引入数据库、不引入账号系统、不引入 CMS、不引入写接口
- `.planning/` 只负责执行文档，不能变成产品说明副本

## 当前运行形态

- `apps/web`
  - 继续承载 React + Vite 移动端 H5 体验
  - 启动时先读取 `/api/quiz/meta` 与 `/api/quiz/content`
  - 使用 `VITE_API_BASE_URL` 作为运行时 API 前缀
- `apps/api`
  - 采用 Fastify + TypeScript 提供只读内容 API
  - 接管 canonical 题库解析、版本化输出和健康检查
  - 本地开发默认监听 `3001`，由 Vite `server.proxy` 代理 `/api`
- `packages/quiz-core`
  - 抽出共享的 quiz 类型、匹配算法和前后端公用 contract
- `questionedit/`
  - 保留为题库编辑与校准素材区
  - 运行时真源通过 API 暴露给前端，而不是让浏览器直接读取 Markdown
- `README.md` / `docs/ARCHITECTURE.md` / `.planning/*.md`
  - 共同构成仓库主入口说明，后续如再改目录边界必须同步更新

## 启动与联调

### 本地开发

1. 启动 API：`npm run dev:api`
2. 启动 Web：`npm run dev:web`
3. 打开 `http://127.0.0.1:5173`

默认配置下：

- web 运行时请求前缀：`/api`
- Vite 代理目标：`http://127.0.0.1:3001`
- API 可直接访问：`http://127.0.0.1:3001/api/quiz/meta` 和 `http://127.0.0.1:3001/api/quiz/content`

### Web 环境变量

- `VITE_API_BASE_URL`
  - 浏览器运行时请求前缀
  - 默认 `/api`
- `VITE_API_PROXY_TARGET`
  - Vite 开发代理目标
  - 默认 `http://127.0.0.1:3001`

`apps/web/src/vite-env.d.ts` 已声明上述变量类型，避免前端读取环境变量时丢失提示。

## 部署建议

- 同域部署时：让反向代理把 `/api/*` 转发到 `apps/api`，web 保持 `VITE_API_BASE_URL=/api`
- 分域部署时：把 `VITE_API_BASE_URL` 设成完整 API 地址，例如 `https://api.example.com/api`
- 当前 `apps/api` 依然是无状态、只读、文件驱动的 Node 服务，不需要数据库迁移
- 结果计算逻辑仍在前端通过 `packages/quiz-core` 执行，避免在 web 侧复制评分逻辑或制造第二份 contract

## 后续扩展建议

- 如果题库和文案体量变大，可继续扩展 `apps/api` 的只读内容层，但优先保持 contract 稳定
- 如果 `questionedit/` 继续承担题库真源，优先补自动生成或校验脚本，避免再出现“文档已切主线但前端还在旧版本”的双轨漂移
- 如果结果海报复杂，可以在后续 phase 继续增强分享 feature 层
- 如果需要更多视觉原子组件，再补 `apps/web` 内部的 shared UI 层，但不要把这个小项目拆成过重的设计系统工程
