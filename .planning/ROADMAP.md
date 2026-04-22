# Forward-Only Roadmap

本文只记录从当前基线开始还要推进的工程 phase。
仓库初始化、目录分层和最小工具链基线已经建立，不再把这些重复写成待执行 phase。

## 当前基线

- React + TypeScript + Vite 前端骨架已建立
- 仓库已稳定为 `apps/web + apps/api + packages/quiz-core` 的轻量 workspace
- `apps/web/src/` 已按 `app / pages / features / entities / shared` 拆分
- 角色锚点、题目 schema、只读内容 API 与共享匹配基础函数已落到代码
- `.planning/` 已建立最小执行层，不额外扩展复杂运营目录

## Phase 1: MVP 答题核心闭环

**Goal:** 实现从首页进入答题、完成 15 题向量累计、执行角色匹配并输出基础结果数据的最小闭环，保持纯前端、无后端。
**Requirements**: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CONTENT-01, CONTENT-02, CONTENT-03, UX-01, UX-02, UX-03]
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01 — 补齐角色与题库数据 contract，固化计分与模糊边界匹配规则
- [x] 01-02 — 实现移动端答题流程、题目切换、答案状态与进度展示
- [x] 01-03 — 产出基础结果视图模型，并完成首页到结果页的闭环联调

## Phase 2: 结果展示与分享海报

**Goal:** 在已有匹配结果基础上，完成角色结果页、三轴可视化与基础分享海报生成，让 MVP 达到“可晒图传播”状态。
**Requirements**: [RESULT-01, RESULT-02, RESULT-03]
**Depends on:** Phase 1
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01 — 实现结果页视觉结构、角色文案区域与再次测试入口
- [x] 02-02 — 实现基础分享海报导出，并补齐移动端分享态与失败态

## Phase 02.1: 前后端分离与内容服务化改造

**Goal:** 把当前纯前端 H5 演进为 `apps/web + apps/api + packages/quiz-core` 的轻量分离架构，让 canonical 题库与角色内容从浏览器本地 raw import 转为后端内容服务，同时保持无登录、无数据库、移动端优先。
**Requirements**: [ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, UX-02, UX-03]
**Depends on:** Phase 2
**Plans:** 3 plans

Plans:
- [x] 02.1-01 — 重组仓库为 `apps/web + apps/api + packages/quiz-core`，迁移共享领域模型与构建脚本
- [x] 02.1-02 — 实现 Fastify 内容服务，接管 canonical 题库解析并暴露版本化只读 API
- [x] 02.1-03 — 前端改为通过 API + Vite proxy 读取内容，完成联调、回归与部署说明

## Phase 02.2: 仓库主入口收口与文档对齐

**Goal:** 收口根目录入口、清理明显遗留物，并把 README / 架构文档 / `.planning` 核心真源同步到当前 workspace 现实，避免后续 agent 继续按旧单包路径误判仓库结构。
**Requirements**: [ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05]
**Depends on:** Phase 02.1
**Plans:** 1/1 plans complete

Plans:
- [x] 02.2-01 — 归档 Git 快照，清理根级空遗留文件，并同步 README / 架构文档 / GSD 主入口真源

## Phase 02.3: 模板驱动的前端重构与渐进迁移

**Goal:** 以 `frontend-design/mygo-fronted` 为新模板，把 `apps/web` 的首页、答题、结果主链路做成渐进式迁移而不是一步重写；答题体验改成类似 LINE 群聊的消息流，结果页接入 8 个角色的圆形头像与 Live2D 静态图插槽，并要求在 web/api 开发服务器常驻的前提下逐 plan 浏览器验收。
**Requirements**: [FRONTEND-01, FRONTEND-02, FRONTEND-03, FRONTEND-04, RESULT-01, RESULT-02, RESULT-03, UX-01, UX-02, UX-03, ARCH-03, ARCH-04]
**Depends on:** Phase 02.2
**Plans:** 1/5 plans executed

Plans:
- [x] 02.3-01 — 引入模板基础设施、动效依赖与新前端壳层，建立可渐进替换的 UI scaffold
- [ ] 02.3-02 — 抽离角色素材解析与聊天 UI 原子，打通圆形头像、Live2D 插槽和 `DialogueRow` 动效 contract
- [ ] 02.3-03 — 逐步把答题主链路迁到 LINE 式聊天界面，保留现有评分状态机、回退能力与 API 内容读取
- [ ] 02.3-04 — 重构结果页为模板化角色报告，接入 8 角色素材槽位并保持分享海报链路
- [ ] 02.3-05 — 在常驻 dev server 下完成浏览器验收、回归、旧实现清理与文档收口

## Phase 3: 内容校准与粉丝向润色

**Goal:** 用更贴近 MyGO 名场面的题目和结果文案替换通用版本，并对角色锚点做粉丝标注校准。
**Requirements**: [FAN-01, FAN-02, FAN-03]
**Depends on:** Phase 02.3
**Plans:** 2 plans

Plans:
- [ ] 03-01 — 批量替换题库为 MyGO 场景改写题，并校验三轴覆盖度
- [ ] 03-02 — 校准角色锚点与隐藏角色触发逻辑，补齐梗化结果文案
