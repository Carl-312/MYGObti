# Phase 1: MVP 答题核心闭环 - Context

**Gathered:** 2026-04-15
**Status:** Phase complete; downstream baseline for later phases
**Source:** PRD distilled from `start.md`, implemented MVP closure, and preserved baseline constraints for downstream phases

<domain>
## Phase Boundary

本 phase 只解决 MVP 主链路：

- 首页进入测试
- 15 题单选答题流程
- 三轴向量累计
- 余弦相似度匹配
- 基础结果视图数据

不包含完整海报分享细节，也不做深度粉丝校准流程。

</domain>

<decisions>
## Implementation Decisions

### Locked

- 技术栈固定为 React + TypeScript + Vite
- MVP 维持纯前端实现，不引入后端或登录
- 评分模型固定为三轴向量累计 + 余弦相似度
- 题库、角色锚点、结果文案都先以本地 typed 内容文件管理
- 模糊边界规则固定为“前两名相似度差值 < 0.08 时进行额外判定”
- 隐藏角色祥子采用独立触发 flag，不混入基础排行榜
- 首页与结果页都必须带免责声明

### The agent's Discretion

- Phase 1 内部的页面路由形式，可用单页状态切换或轻量路由
- 进度条、按钮、选中态的具体 UI 细节
- 结果页的具体文案布局，只要先满足 MVP 信息层级
- 是否在本 phase 内为匹配逻辑补最小测试，只要不引入过重配置

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and Content

- `start.md` — 产品玩法、角色锚点、三轴定义、结果页字段和风格约束
- `questioncollectionV1.md` — 题目写法、语气与补题模板

### Engineering Baseline

- `README.md` — 当前仓库目的、启动方式和目录说明
- `docs/ARCHITECTURE.md` — 轻量前端分层职责
- `src/shared/types/quiz.ts` — 领域类型真源
- `src/entities/character/model/characters.ts` — 当前角色锚点数据
- `src/entities/question/model/questions.ts` — 当前题库样例与数据格式
- `src/features/quiz-engine/model/match.ts` — 当前匹配规则基线

</canonical_refs>

<specifics>
## Specific Ideas

- 题目应该保留 MyGO 粉丝能认出的“拉扯感”和群聊感，但不要直接抄剧情台词
- 首页气质可以先保留暗色、聊天界面感，不必一次做满所有视觉花活
- 结果页 Phase 1 先把角色、称号、三轴摘要和一句锐评做通

</specifics>

<deferred>
## Deferred Ideas

- 复杂海报生成与导出
- 雷达图或更重的可视化库接入
- 通过深度搜索收集剧情梗并替换通用题目
- 角色锚点的粉丝标注校准流程

</deferred>

---

*Phase: 01-mvp-quiz-core*
*Context gathered: 2026-04-15 via lightweight bootstrap*
