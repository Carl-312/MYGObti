# fronted1 第二阶段重启设计提示词

你现在不是“风格延续代理”，而是一个“前端视觉重启与 SVG 叙事化改造代理”。

工作目录固定为：

- `/home/carl/MYGObti`

你必须直接执行，不要只写建议，不要停在分析层。

这轮任务允许你明确放弃上一轮已经落地的那套“暗色档案 / 酒红旧金 / wiki 资料页”方向。

## 这轮任务的核心目标

你要把当前首页的设计方向，明确切换成更接近 `fronted1.html` 里这些特征的视觉体系：

- 卡通化的角色头像 SVG / 小图标
- 贴纸感、徽章感、事件牌、对话标记、漫画式小装饰
- 更轻、更鲜明、更像 Band Story 事件页的视觉气质
- 页面中明确存在“角色小头像 + 小标签 + 小道具 + 漫画感 UI 元素”
- 不是纯资料页，而是“角色剧情入口 + 卡面信息 + 事件页气泡 + 轻漫画叙事”

简单说：

- 放弃“高冷档案感”
- 转向“二次元事件页 + 贴纸化 SVG + 卡通角色入口”

但仍然：

- 不复制 Fandom DOM
- 不复制 Fandom CSS
- 不改现有题库逻辑、评分逻辑、分享逻辑

## 唯一风格参照来源

- `/home/carl/MYGObti/frontend-design/fronted1.html`

你必须从这个文件里提取的重点，不再是“资料页布局感”，而是下面这些更具体的前端语言：

### 1. 角色小头像 SVG

`fronted1.html` 里已经明确存在大量角色小头像 SVG / 小 icon：

- `Tomori (icon)`
- `Soyo (icon)`
- `Taki (icon)`
- `Anon (icon)`

这些不是大图海报，而是适合在页面里反复使用的小型、卡通化角色元素。

你要把这种“角色 icon 可反复出现在页面多个位置”的设计语言，转译到 React 页面里。

### 2. 小型副标题图标 / subtitle SVG

`fronted1.html` 里还存在很多 `36x36` 左右的小 SVG 图标，用在标题、副标题、卡片角标附近。

你要借用这种思路，不是照搬原图，而是自己在项目里实现类似用途的 SVG 装饰组件，例如：

- 标题前的小徽记
- 章节卡片角上的装饰 icon
- metrics / badge / CTA 附近的小贴纸图形
- 对话区角标 / 结果区信号 icon

### 3. 卡面 / 漫画 / 事件图标的轻松感

`fronted1.html` 里除了正文大图，还混有很多：

- 卡片 icon
- 小道具 icon
- 带标题的事件卡图
- 更偏“收藏卡 / 活动页 / 小漫画入口”的视觉内容

你不能继续把页面做成偏“严肃档案系统”，而要做得更像：

- 乐队活动页
- 角色事件入口
- 动画 / 卡牌 / 轻剧情专题页

### 4. 页面里必须出现 SVG 装饰层

这轮不接受“只是换一套颜色和边框”。

你必须明确把 SVG 或可复用矢量装饰语言引入页面，例如：

- 角色圆形/方形头像章
- 星星、闪光、音符、贴纸、箭头、对话尾巴、手写圈线
- 标题角花、波浪边、章牌、纸胶带、卡通强调符号
- 结果区 / 题目区的漫画式小提示 icon

这些可以是：

- React 内联 SVG
- 独立 SVG 组件
- 纯 CSS + SVG 组合

但不能只是普通 div 装饰。

## 明确放弃上一轮风格

你必须把下面这些视为“本轮不再优先”的旧方向：

1. 过强的 wiki / 档案馆 / 冷资料页气质
2. 过深的暗色舞台感
3. 酒红 + 旧金主导的沉重表面
4. 大面积严肃边框资料卡
5. 只靠渐变和玻璃拟态撑视觉

如果旧结构还能用，可以保留结构。

但风格上必须明显变轻、变活、变卡通、变角色化。

## 本轮只优先做首页，不要求一次改完整站

你可以先只深改首页。

优先顺序必须改成下面这样：

1. 首页 hero / masthead
2. 首页 preview / chat / metrics
3. 首页角色入口 / cast 展示区
4. 首页 CTA / badge / 公告条
5. 如果还有余力，再轻触答题页入口视觉

也就是说：

- 可以先不深改结果页
- 可以先不重做全部 question frame
- 先把首页做成新的母体

## 你必须先读这些文件

### 风格母体

- `/home/carl/MYGObti/frontend-design/fronted1.html`
- `/home/carl/MYGObti/frontend-design/COMPONENT-EXTRACTION.md`

### 当前运行页面

- `/home/carl/MYGObti/src/pages/home/HomePage.tsx`
- `/home/carl/MYGObti/src/app/styles.css`
- `/home/carl/MYGObti/src/app/App.tsx`

### 当前共享展示组件

- `/home/carl/MYGObti/src/shared/ui/story-design/StoryDesign.tsx`
- `/home/carl/MYGObti/src/shared/ui/story-design/story-design.css`
- `/home/carl/MYGObti/src/shared/ui/story-design/index.ts`

如果你需要新增“SVG 装饰组件”，优先新增到共享 UI，而不是塞进页面文件里硬写死。

## 这轮盘点重点不一样

你必须先盘点下面这些东西是否已经存在：

- `hero / masthead / badge / preview / metrics`
- `cast rail / character icon / avatar badge`
- `chat bubble / sticker / CTA icon / decorative chip`
- `announcement banner / section title ornament`
- `svg decoration layer / inline icon system`

盘点时必须判断：

1. 哪些结构已经存在，只是风格错了
2. 哪些确实缺少“角色 icon / SVG 贴纸层”
3. 哪些区域可以直接改成首页第一阶段落点

## 你这轮真正要从 fronted1 提取的，是这些视觉原则

### 1. 首页不是“剧情档案首页”，而是“角色事件页入口”

- 第一屏要更像动画活动专题页
- 不是厚重资料页
- 要有更直接的角色 presence
- 要让人一眼觉得“这是 MyGO 的角色向趣味测试入口”

### 2. 视觉中心要从“框”转向“角色 + SVG 元素”

- 不是靠大块 panel 压住页面
- 而是靠角色 icon、贴纸、徽章、漫画感小组件形成记忆点
- 小型 SVG 元素应该贯穿标题、按钮、标签、角色区、提示区

### 3. 卡片要更像“事件卡 / 贴纸卡 / 角色小页面”

- 卡片边缘可以更活泼
- 局部允许不对称
- 允许轻微倾斜、角标、装饰贴纸、浮动 icon
- 不要再全是规整厚重资料框

### 4. 配色要更像角色活动页，而不是深色舞台剧

允许使用：

- 奶油白
- 蜜桃粉
- 糖果蓝
- 柔和黄
- 珊瑚橙
- 角色点缀色

允许局部保留暗色作为对比，但不能继续让整体沉下去。

### 5. 文字层级要更像日系专题页

- 大标题要更像活动标题 / 特集入口
- 小标题要更像角色 tag / episode label
- badge 要更像贴纸标签，不是系统状态牌
- CTA 要更像进入剧情 / 进入测试 / 开始配对

## 本轮必须新增或明确增强的东西

至少完成下面这些中的大部分：

### A. 首页 SVG 组件层

至少做出 2 到 4 个可复用的 SVG/矢量装饰组件，类型可以是：

- `CharacterIconBadge`
- `SparkleSticker`
- `StoryBadgeIcon`
- `ComicArrow`
- `MusicNoteSticker`
- `SpeechTail`
- `EpisodeSeal`

命名可以不同，但必须真的存在“可复用 SVG 组件层”。

### B. 首页 hero 重启

hero 必须明显换风格：

- 不再是偏档案海报
- 而是更偏角色活动页 / 漫画化专题页
- 至少在 hero 中放入角色 icon、贴纸装饰、角标、章节 label、卡通化 SVG 元素

### C. 首页 cast / preview 重启

至少有一个区域要变成更明确的：

- 角色小头像入口
- 角色贴纸列
- 角色 icon rail
- 角色小卡片区

不能只有纯文字列表。

### D. CTA / badge / banner 重启

按钮、公告条、badge 至少要有一部分接入新的 SVG / 卡通视觉语言。

## 实施策略

优先采用下面三种手段：

1. 重写 / 强化 `src/app/styles.css`
2. 重塑 `src/shared/ui/story-design/*`
3. 新增少量共享 SVG UI 组件

如果需要新增目录，优先考虑：

```text
src/shared/ui/story-svg/
```

或

```text
src/shared/ui/decorative-svg/
```

但必须轻量，不要过度抽象。

## 明确禁止

1. 不要直接搬 `fronted1.html` 里的 base64 SVG
2. 不要复制 Fandom 的 icon DOM
3. 不要只换颜色却不加 SVG 结构
4. 不要继续沿用“旧方案只是微调”的思路
5. 不要把首页做成幼稚低龄卡通，要保持精致和完成度
6. 不要引入新的 UI 库
7. 不要破坏现有业务逻辑

## 这轮至少要完成的执行任务

### 任务 1：重新盘点首页结构

至少明确：

- 哪些首页区块可保留结构
- 哪些必须换风格
- 哪些缺 SVG 组件层

### 任务 2：做一轮首页视觉重启

至少完成：

- 1 次 hero 重启
- 1 次 preview / chat / metrics 重启
- 1 次 cast / character 区重启
- 1 次按钮 / badge / banner 重启

### 任务 3：引入 SVG 语言

至少完成：

- 2 个以上可复用 SVG 或矢量装饰组件
- 在首页至少 3 个不同位置实际使用它们

### 任务 4：验证

至少验证：

- 页面仍可正常构建
- 首页桌面端和移动端都能看
- 现有交互没有坏

## 最终输出要求

最终回复必须包含：

1. 你放弃了哪些旧风格原则
2. 你从 `fronted1.html` 提取了哪些 SVG / 卡通化元素
3. 你新增了哪些 SVG 或装饰组件
4. 你先改了首页哪些部分
5. 验证结果如何

## 执行风格要求

- 先盘点，再落地
- 明确放弃旧风格，不要犹豫
- 优先把首页做成新的视觉母体
- 把 `fronted1.html` 当作“角色 icon 与卡通专题页语言来源”
- 不是复制模板，而是重建一个更适合当前 React 项目的前端表达
