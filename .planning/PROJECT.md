# MyGObti Project Frame

## What This Is

- 一个基于《BanG Dream! It's MyGO!!!!!》角色气质的恶搞人格测试 H5 项目
- 当前代码基线已经覆盖：首页 -> 答题 -> 匹配 -> 结果 -> 海报导出 / 分享降级
- 当前落地实现已经完成 Phase `02.1` 的前后端分离，并在 Phase `02.2` 完成仓库主入口收口
- 在继续做 Phase `3` 的内容润色前，先插入 Phase `02.3` 完成模板驱动的前端重构与渐进迁移
- 运行时仓库结构已经稳定为 `apps/web + apps/api + packages/quiz-core`
- 产品玩法真源保留在 `start.md`，工程执行真源保留在 `.planning/**`

## Core Value

- 用最小工程重量把 MyGO 恶搞人格测试做成一个可玩、可扩写、可分享的小项目
- 先验证“答题 -> 算分 -> 结果 -> 分享”的轻量闭环，再做内容梗化和粉丝向校准

## Requirements

- 当前已实现版本为轻量前后端分离：web 负责交互体验，api 负责运行时 canonical 内容输出
- 以移动端 H5 为首要体验
- 首阶段仍无登录、无数据库、无 CMS
- 题目、角色锚点、结果文案的运行时真源已经迁到后端内容服务，但编辑源仍保留在仓库内
- 隐藏祥子保持独立触发逻辑，不覆盖公开主结果
- 当前阶段优先保持轻量结构，不因为 GSD 引入过重目录或流程
- 根目录主入口文档必须和实际 workspace 形态保持一致，避免误导后续 agent 按旧单包结构工作

## 项目定位

- 这是一个从零开始的轻量 greenfield 项目
- 当前目标不是一次性把全部 GSD 流程跑满，而是建立一个“后续 agent 可持续接手”的最小执行层

## 当前约束

- 当前代码已经完成轻量 Node API 分层，但后续 phase 仍要避免把只读内容服务做成过重后端
- 以移动端 H5 为首要体验
- 首阶段前后端分离不引入数据库、账号系统或后台管理台
- 题目、角色锚点、结果文案仍以仓库内文件维护，但浏览器端不再直接读取 Markdown 真源
- 允许先做可玩的最小闭环，再做内容深挖与梗化润色

## 产品阶段与工程阶段映射

`start.md` 里的产品阶段：

- 产品 Phase 1：答题 -> 算分 -> 结果 -> 分享的 MVP
- 产品 Phase 2：MyGO 场景梗内容深化

`.planning/ROADMAP.md` 里的工程阶段：

- 工程 Phase 1：MVP 答题核心闭环
- 工程 Phase 2：结果展示与分享海报
- 工程 Phase 02.1：前后端分离与内容服务化改造
- 工程 Phase 02.2：仓库主入口收口与文档对齐
- 工程 Phase 02.3：模板驱动的前端重构与渐进迁移
- 工程 Phase 3：内容校准与粉丝向润色

这样拆分的原因是：代码库仍处于零到一初始化阶段，需要把“能持续开发”的骨架先立稳。

## 主入口真源

- `README.md`
  - 新成员进入仓库时的启动入口、目录总览与事实映射
- `docs/ARCHITECTURE.md`
  - 当前 workspace 架构、边界与本地/部署联调方式
- `.planning/PROJECT.md`
  - 项目定位、约束、目录职责与禁止误判
- `.planning/ROADMAP.md`
  - 还要推进的工程 phase 顺序
- `.planning/STATE.md`
  - 最近完成到哪个 phase、下一步应该接哪里

## 目录职责

- `start.md`
  - 产品 PRD 草案与玩法说明
- `questioncollectionV1.md`
  - 题库写作约束与收集草稿
- `apps/web/`
  - React + Vite 前端应用，负责答题体验、结果展示、海报导出与 API 内容消费
- `apps/api/`
  - Fastify 只读内容服务，负责 canonical 解析、缓存与 API 输出
- `packages/quiz-core/`
  - 共享的 quiz 类型、contract 与匹配算法
- `questionedit/`
  - 题库编辑、候选版本、评估脚本与报告，不是运行时应用入口
- `frontend-design/`
  - 视觉工作台与设计试验材料，不是运行时真源
- `docs/`
  - 当前工程结构与实现边界
- `.planning/`
  - GSD 执行层，不复述产品文案

## 当前稳定形态

- `apps/web`
  - React + TypeScript + Vite 前端应用，负责答题体验、结果展示与分享
- `apps/api`
  - Fastify + TypeScript 只读内容服务，负责 canonical 内容解析、序列化与版本化 API
- `packages/quiz-core`
  - 共享的 quiz domain 类型、匹配算法与前后端共用 contract
- `questionedit/`
  - 继续保留为编辑与校准材料区，但不再由浏览器直接 `?raw` 导入作为运行时真源
- `README.md` / `docs/ARCHITECTURE.md` / `.planning/*.md`
  - 已在 Phase `02.2` 收口到当前 workspace 结构；后续变更目录边界时要同步更新

## 当前稳定判断

- 代码基线已选择 React + TypeScript + Vite
- 当前目录结构已经稳定为 `apps/web + apps/api + packages/quiz-core`
- 角色坐标、题目 schema、只读内容 API 与共享匹配逻辑都已落到代码
- 前端运行时下一步优先做模板化重构，但不改变 `apps/api` 内容服务和 `packages/quiz-core` contract 的边界
- 当前 `.planning` 只保留最小必要文件与当前 phase 文档，不做过度运营化扩展
- 根目录不再保留无内容的旧启动占位文件，避免制造第二套入口错觉
- 当前架构改造目标已经落地为“轻量分离”；待 Phase `02.3` 完成前端模板迁移后，Phase `03` 再专注内容本身

## 禁止误判

- 不要把 `.planning/**` 当成产品说明全文
- 不要把这次前后端分离误解成要上数据库、账号系统或 CMS
- 不要把当前小项目拆成过多微层级或复杂微服务
- 不要因为使用 GSD 就强行补建不需要的 phase / milestone / research 目录
- 不要把 `questionedit/`、`frontend-design/` 或历史材料误当成 web/api 的运行时入口
- 不要把“用模板重构前端”误解成允许一步删掉旧页面后再慢慢补；这次必须走渐进迁移与浏览器验收
