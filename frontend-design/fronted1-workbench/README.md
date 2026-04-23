# fronted1 Workbench

这个目录收纳 `fronted1` 这轮 Fandom 页面整理产物，职责分得更清楚：

- `fronted1.cleaned.json`
  清洗后的正文数据，只保留 band story 的内容层。
- `fronted1-componentization-plan.md`
  把快照内容拆成 React 组件与数据模型的设计说明。

原始快照 `fronted1.html` 仍保留在上一级 `frontend-design/`，因为它是抓取源文件，不属于组件化产物本身。

`scripts/extract_fandom_story.py` 继续放在仓库级 `scripts/`，因为它是可复用的数据提取工具；这个工作目录只是它当前这次输出的落点。

重新生成这份 JSON 时，推荐直接写回这里：

```bash
python3 scripts/extract_fandom_story.py \
  frontend-design/fronted1.html \
  --output frontend-design/fronted1-workbench/fronted1.cleaned.json
```

当前 `apps/web/src/features/band-story/data/fronted1Story.ts` 会静态导入这里的 JSON，作为 band story 首版页面骨架的数据源。
