# Forward-Only Roadmap

本文只记录从当前基线开始还要推进的工程 phase。
仓库初始化、目录分层和最小工具链基线已经建立，不再把这些重复写成待执行 phase。

## 当前基线

- React + TypeScript + Vite 前端骨架已建立
- `src/` 已按 `app / pages / features / entities / shared` 拆分
- 角色锚点、题目 schema、余弦匹配基础函数已落到代码
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

## Phase 3: 内容校准与粉丝向润色

**Goal:** 用更贴近 MyGO 名场面的题目和结果文案替换通用版本，并对角色锚点做粉丝标注校准。
**Requirements**: [FAN-01, FAN-02, FAN-03]
**Depends on:** Phase 2
**Plans:** 2 plans

Plans:
- [ ] 03-01 — 批量替换题库为 MyGO 场景改写题，并校验三轴覆盖度
- [ ] 03-02 — 校准角色锚点与隐藏角色触发逻辑，补齐梗化结果文案
