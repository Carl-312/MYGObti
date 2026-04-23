# fronted1.html 拆解研究

这个 `fronted1.html` 不是“可直接搬进 React”的前端模板，而是 Fandom 站点壳 + 页面正文 + SingleFile 内联资源的混合体。  
真正值得复用的不是整页，而是正文里几类稳定的内容组件。

## 先丢掉什么

- Fandom 全站导航、社区头部、登录入口、广告位、推荐流
- cookie / sticky header / 浮层 / 分享条
- SingleFile 注入的超大内联样式、svg、base64 资源
- 站点级 tabs、tooltip、carousel 外壳

这些部分会让 HTML 体积巨大，但对你自己的站点设计复用价值很低。

## 真正可复用的设计原子

从页面内容看，最值得抽的是这 6 类：

1. `StorySectionFrame`
   用来装一个章节，包含 kicker、标题、摘要、角标。
2. `StoryFactGrid`
   对应 wiki 里 infobox / facts / metadata 的信息块。
3. `StoryMetricStrip`
   对应“集数 / 角色 / 时间 / 标签”这类横向指标条。
4. `DialogueSceneCard`
   对应正文里最有辨识度的 `storytext` 对话场景。
5. `CharacterSpotlightRail`
   对应角色头像 + 名字 + 一句话定位。
6. `StoryGalleryGrid`
   对应卡面、截图、插图、章节封面的图库卡片。

## 和你现有站点的结合点

你当前 `src` 里的首页已经有：

- Hero 区
- 结果卡片
- 角色列表
- 类似聊天气泡的预览区

所以这次拆出来的组件，最适合补这几个方向：

- 首页增加 “MyGO 世界观 / 乐队故事入口”
- 结果页增加 “角色剧情切片” 和 “关系阅读卡”
- 后续单独做角色页 / 世界观页 / 故事页

## 推荐目录

```text
src/
  shared/ui/story-design/
    StoryDesign.tsx
    story-design.css
    index.ts
```

原因是这些组件偏展示层，不绑定 quiz 业务，放 `shared/ui` 最稳。

## 推荐拆解顺序

### 第 1 层：先抽“布局容器”

- `StorySectionFrame`
- `StoryFactGrid`
- `StoryMetricStrip`

这一步解决你未来页面的骨架统一问题。

### 第 2 层：再抽“叙事内容”

- `DialogueSceneCard`
- `CharacterSpotlightRail`

这一步把这个抓取页最有辨识度的部分留下来。

### 第 3 层：最后抽“媒体内容”

- `StoryGalleryGrid`

这一步方便后面接卡图、角色图、章节图。

## fronted1.html 的内容映射

可以粗暴理解成下面这套映射：

- 页面标题区 -> `StorySectionFrame`
- infobox / 基本资料 -> `StoryFactGrid`
- 章节信息 / 标签 -> `StoryMetricStrip`
- `storytext` 连续对话 -> `DialogueSceneCard`
- 角色头像组 -> `CharacterSpotlightRail`
- 相关图片 / 卡面 -> `StoryGalleryGrid`

## 不建议直接复用的部分

- 原页面 CSS class 名
- 原页面 DOM 层级
- 原页面图片 URL 的懒加载写法
- inline style 坐标定位

原因很简单：这些写法全都强绑定 Fandom 站点结构，带进 React 后维护成本会很高。

## 下一步建议

最稳的做法不是继续切原 HTML，而是：

1. 用这批共享组件先在 `src` 里建立自己的设计语言。
2. 后面只从抓取页提取“内容数据”。
3. 用你自己的 React 组件重新渲染。

这样后面你做角色页、剧情页、设定页，都能复用同一套 UI。
