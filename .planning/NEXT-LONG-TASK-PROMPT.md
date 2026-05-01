# Next Long Task Prompt

推荐下一条长任务直接处理“手机端结果页适配不能破坏海报分享”这件事，不要继续把页面响应式和海报导出排版绑在一起。

## 推荐路由

优先继续用 `$gsd-do` 进入执行语义。

如果要直接指定一个更硬的执行入口，推荐用 `$gsd-quick --validate`，因为这次不是大范围重构，而是基于现有链路做低成本稳定修复。

## 可直接复用的提示词

标准执行版：

```text
$gsd-do 修复 MyGObti 手机端结果页的海报适配问题。背景：此前为了给结果页增加手机端左右安全边距，修改了 `apps/web/src/pages/home/result/result-page.css` 与 `apps/web/src/pages/preview/result-preview.css`，但这次修改破坏了海报分享预览。请基于当前实现做低成本修复，不要重写导出链路，也不要新做第二套海报组件。保留现有 `ResultPoster` + `html-to-image` 方案，目标是把“页面响应式”和“海报版式”彻底解耦：页面外层继续做手机端适配，但海报本体按固定画布处理，页面里只做缩放预览。请先确认根因，再实施最小改动方案，并完成浏览器验收与分享/导出回归。
```

增强约束版：

```text
$gsd-do 修复 MyGObti 手机端结果页的海报适配问题。必要上下文如下：
1. 当前导出链路在 `apps/web/src/features/share/lib/exportPoster.ts` 里固定使用 `540 x 720` 导出尺寸。
2. 当前海报 DOM 在 `apps/web/src/features/share/ui/result-poster.css` 里仍是 `width: 100%`，会跟随手机 viewport 变化。
3. 当前结果页分享区在 `apps/web/src/pages/home/result/result-page.css` 里使用 `.result-report__poster-stage { width: min(100%, 34rem); }` 做预览容器。
4. 这意味着“手机上看到的海报预览版式”和“真正导出的海报版式”不是同一套约束，所以一改页面边距或容器宽度就容易把分享海报搞坏。

请按以下策略实现：
- 不要改成 Canvas 重绘，不要引入第二套 poster template，不要做高成本重构。
- 保留 `ResultPoster` 作为唯一海报 DOM。
- 把海报本体改成固定画布思维：内部版式按固定宽高工作，不跟随 viewport 重排。
- 在结果页里给海报外面包一层手机端预览壳，只负责缩放显示，不负责改内部排版。
- 页面层仍可继续保留手机端安全边距、share 区块纵向堆叠、按钮触达优化。
- 如果导出仍有不稳定，优先在导出前补 `document.fonts.ready` 和海报内图片加载完成等待，不要扩大范围。

重点文件优先看这里：
- `apps/web/src/pages/home/result/ResultStageSection.tsx`
- `apps/web/src/pages/home/result/result-page.css`
- `apps/web/src/features/share/ui/ResultPoster.tsx`
- `apps/web/src/features/share/ui/result-poster.css`
- `apps/web/src/features/share/lib/exportPoster.ts`
- `apps/web/src/pages/preview/result-preview.css`

验收要求：
- `375 / 390 / 430` 宽度下，结果页左右不贴边，分享区不挤爆。
- 海报预览不再出现角色图和文案重叠、高度塌陷、底部信息被挤掉的问题。
- 导出的图片仍保持稳定的 `540 x 720` 成品语义。
- `/preview/results` 至少切 3 个角色做浏览器回归。
- 原生分享与保存海报按钮都要回归验证。

额外约束：
- 当前仓库是 dirty worktree，不要回滚无关改动。
- 现有工作区里已修改的 poster/result 相关文件要在其基础上修，不要另起炉灶。
```

## 下个会话必须继承的上下文

- 当前问题记录在 `troubleshooting.md`，里面已经说明“给结果页做手机端安全边距时，破坏了海报分享预览”。
- 结果页与海报主链路来自 Phase `02.3-04`，并且该阶段总结里已经明确保留现有 `ResultPoster` 与分享/导出链路，不要换实现。
- 当前真正的海报导出尺寸是固定的：`540 x 720`。
- 当前真正不稳定的地方，不是普通结果页响应式本身，而是“预览态海报布局”和“导出态海报布局”耦合在一起。
- `/preview/results` 已存在，可直接作为多角色、多宽度浏览器 QA 入口。
- 当前仓库工作区不是干净状态，`apps/web/src/features/share/**`、`apps/web/src/pages/home/result/**`、`apps/web/src/pages/preview/result-preview.css` 有未提交改动；另外 `questioncollectionV1.md`、`start.md` 当前是删除状态，`troubleshooting.md` 是未跟踪文件。后续会话不要误判为需要恢复这些文件。

## 提示词设计意图

- 让下个会话先把根因锁死在“固定导出画布 vs 流式预览布局耦合”上，而不是继续泛泛地调响应式。
- 强约束“低成本修复”，避免跑偏成海报系统重写。
- 把真正需要动的文件和验收宽度提前写死，减少下个会话重新摸索的时间。
- 把 dirty worktree 说明清楚，避免下一位 agent 误回滚当前现场。
