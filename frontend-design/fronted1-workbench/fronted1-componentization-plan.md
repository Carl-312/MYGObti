# `fronted1.html` 组件化拆分方案

当前这份方案文档已经整理到 [`frontend-design/fronted1-workbench/`](/home/carl/MYGObti/frontend-design/fronted1-workbench)。
配套的清洗数据文件现在位于 [`fronted1.cleaned.json`](/home/carl/MYGObti/frontend-design/fronted1-workbench/fronted1.cleaned.json)。

## 先说结论

这份 [`fronted1.html`](/home/carl/MYGObti/frontend-design/fronted1.html) 不是一个正常的前端页面源码，而是从 Fandom 保存下来的整页快照。

它当前混在一起的内容有三类：

1. 真正要保留的内容层
2. Fandom 平台壳子
3. 广告、社交分享、弹窗、翻译插件浮层等噪音

所以不要直接把这个 HTML 拆 React 组件。正确顺序应该是：

1. 先抽取正文数据
2. 再用 React 组件重建展示层
3. 最后根据产品需要决定保留哪些辅助模块

## 当前文件里真正有价值的结构

从 `.mw-parser-output` 开始，正文主体基本可以归纳为：

1. 关联页签
   - `MyGO!!!!!`
   - `Band Story (You are here)`
   - `Discography`
   - `Events`

2. 作品标题
   - `MyGO!!!!!/Band Story`
   - 封面标题 `It's MyGO!!!!!`

3. 故事简介
   - `Anon transfers into Haneoka...`

4. 章节导航
   - `Chapter 01` 到 `Chapter 41`

5. 单章节内容
   - 章节标题，例如 `Returns - Cold Rain`
   - 章节摘要
   - 场景标题，例如 `Haneoka Girls' Academy Courtyard`
   - 对话内容
   - 角色头像

## 应该直接过滤掉的内容

下面这些都不应该进入组件层：

1. 整站导航
   - `global-navigation`
   - `fandom-community-header`
   - `Explore`
   - `Recent Images`
   - `Follow Us`

2. 广告和赞助内容
   - `Advertisement`
   - `Sponsored by`
   - `google_ads_*`
   - `fandom-ad`
   - 任意广告 `iframe`

3. 社交分享和站点功能
   - Reddit/Facebook/Twitter 分享按钮
   - `highlight__*`
   - 登录、编辑、diff、评论入口

4. 第三方插件浮层
   - `imt-*` 开头的沉浸式翻译浮球
   - 额外挂载的弹窗、tooltip、portal、modal

5. 快照遗留物
   - 大量内联 `style`
   - `svg symbol` 雪碧图
   - 隐藏 `iframe`
   - 跟踪或占位容器

## 推荐拆分方式

仓库当前前端是 `Vite + React + TypeScript`，建议把这份快照当成“内容来源”，目标目录可以这样拆：

```text
frontend-design/
  fronted1-workbench/
    fronted1.cleaned.json
    fronted1-componentization-plan.md
    README.md

apps/web/src/features/band-story/
  components/
    BandStoryPage.tsx
    BandStoryHeader.tsx
    RelatedPageTabs.tsx
    StoryHero.tsx
    ChapterSidebar.tsx
    ChapterContent.tsx
    EpisodePreview.tsx
    SceneMarker.tsx
    DialogueList.tsx
    DialogueRow.tsx
  data/
    fronted1Story.ts
  model/
    types.ts
  lib/
    normalizeBandStoryData.ts
```

## 每个组件负责什么

### `BandStoryPage.tsx`

页面装配层，只做数据读取和布局拼装：

- 读取清洗后的 JSON
- 管理当前章节状态
- 组合头部、侧边栏、正文

### `BandStoryHeader.tsx`

只负责页面标题区：

- 主标题
- 副标题
- 简介文案

### `RelatedPageTabs.tsx`

把原始页面里的 “Associated pages” 做成纯净导航：

- 只保留 label 和 href
- 不带 wiki 平台样式

### `StoryHero.tsx`

展示封面图、故事简介、作品信息：

- 封面图
- 简介
- 可选 metadata

### `ChapterSidebar.tsx`

章节列表组件：

- `Chapter 01` 到 `Chapter 41`
- 当前选中状态
- 支持移动端折叠

### `ChapterContent.tsx`

单章节渲染入口：

- 章节标题
- 摘要
- 场景段落
- 对话列表

### `EpisodePreview.tsx`

专门处理章节头图和摘要，避免和正文对话混在一起。

### `SceneMarker.tsx`

专门显示场景切换标题，例如：

- `Haneoka Girls' Academy Courtyard`

### `DialogueList.tsx` / `DialogueRow.tsx`

这是最值得复用的部分。每句台词抽成统一数据：

```ts
type DialogueLine = {
  speaker: string;
  text: string;
  avatar?: string;
  mood?: string;
};
```

之后不管是：

- 视觉小说样式
- 聊天记录样式
- 卡片式分镜样式

都能复用这套数据结构。

## 推荐的数据结构

建议先把 HTML 清洗成下面这种 JSON：

```ts
type BandStoryData = {
  title: string;
  subtitle?: string;
  intro?: string;
  relatedPages: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  chapters: Array<{
    id: string;
    label: string;
    title?: string;
    summary?: string;
    sceneMarkers: string[];
    dialogues: Array<{
      speaker: string;
      text: string;
      avatar?: string;
    }>;
  }>;
};
```

## 为什么不要继续保留“HTML 组件化”

直接把原 HTML 拆组件会有几个问题：

1. DOM 污染太严重
   - 组件会被大量无意义 class 和内联样式绑死

2. 数据和展示耦合
   - 章节标题、台词、头像都埋在快照 DOM 里，不利于复用

3. 可维护性很差
   - 下次换一个 Fandom 页面，DOM 结构很可能变

4. 无法真正过滤广告噪音
   - 因为广告、浮层、平台功能都和正文混在一个 HTML 里

## 推荐迁移顺序

1. 用脚本从 `fronted1.html` 抽取正文数据
2. 生成 `frontend-design/fronted1-workbench/fronted1.cleaned.json`
3. 在 `apps/web/src/features/band-story/` 下建立组件
4. 先做静态渲染
5. 再补交互，例如章节切换、移动端目录、检索

## 这次已经补的基础能力

我另外加了一个清洗脚本：

- [extract_fandom_story.py](/home/carl/MYGObti/scripts/extract_fandom_story.py)

它的目标就是先把 Fandom 快照中的正文提出来，绕开广告、平台壳子和插件浮层。

示例用法：

```bash
python3 scripts/extract_fandom_story.py \
  frontend-design/fronted1.html \
  --output frontend-design/fronted1-workbench/fronted1.cleaned.json
```

如果你下一步愿意，我可以继续直接把它落成 React 组件目录和首版页面骨架。
