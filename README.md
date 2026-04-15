# MyGObti

一个基于《BanG Dream! It's MyGO!!!!!》角色特质的恶搞人格测试 H5 项目。

当前仓库采用“轻量代码骨架 + 最小 GSD 执行层”的启动方式：

- 产品原始说明保留在 `start.md`
- 题库收集草稿保留在 `questioncollectionV1.md`
- `.planning/` 只负责后续 agent 的执行文档，不重复写 PRD
- 当前代码基线只搭建前端壳、分层目录与核心类型，不提前堆业务细节

## 当前技术选择

- 前端：React + TypeScript + Vite
- 部署目标：纯静态 H5
- 数据来源：本地内容文件，不依赖后端

## 快速开始

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run typecheck
npm run build
```

## 目录结构

- `src/app/`：应用入口、全局样式、应用壳
- `src/pages/`：页面级组合
- `src/features/`：交互能力，例如答题引擎、结果匹配
- `src/entities/`：角色、题目等领域实体
- `src/shared/`：跨层类型与基础工具
- `docs/`：当前实现和目录约定
- `.planning/`：GSD 规划与 phase 执行文档

## 文档映射

- 产品想法与玩法真源：`start.md`
- 题目收集与写法约束：`questioncollectionV1.md`
- 工程分层说明：`docs/ARCHITECTURE.md`
- 工程执行路线：`.planning/ROADMAP.md`

## 说明

`start.md` 里的 “Phase 1 / Phase 2” 是产品阶段表述。
`.planning/ROADMAP.md` 里的 phase 是工程执行阶段表述。
为了从零启动更稳，这里采用“先搭骨架，再做 MVP”的工程节奏。

