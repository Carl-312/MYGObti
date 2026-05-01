## 修改总结

### 问题
结果页面在手机端左右挤满屏幕，需要适配。但修改时破坏了海报分享功能。

### 修复内容

**文件1：`@/home/carl/MYGObti/apps/web/src/pages/home/result/result-page.css`**
- `.result-report` 新增 `padding-inline: 0.75rem`（手机端安全边距）
- 760px+ 增加 `padding-inline: 1rem`
- 980px+ 限制 `max-width: 1200px` + `margin-inline: auto`（仅桌面端居中）

**文件2（修复效果失败）：`@/home/carl/MYGObti/apps/web/src/pages/preview/result-preview.css`**
- `.result-preview` 同样策略：手机端无限制，980px+ 限制宽度

### 策略要点
- **海报安全**：手机端不限制宽度，避免影响 `html-to-image` 导出
- **海报容器** `.result-report__poster-stage` 使用 `width: min(100%, 34rem)` 独立自适应
- 桌面端限制最大宽度，解决内容过宽问题

# 后续从视觉上的修改建议

从前端架构与渲染管线的正交视角来看，移动端海报生成（尤其是在 `375px Viewport` 下）不应被视为普通的网页响应式适配，而应被降维视为一个**静态的 2D 标量场输出任务**。

从你提供的截图来看，海报容器内部发生了严重的层叠上下文（`Stacking Context`）混乱和文档流脱离。角色立绘（Live2D 静态图）与底部的文案（“102%”、“体面得近乎残忍...”）发生了非预期的 `Overlap`，且外层卡片高度似乎未能自适应撑开。

为了让你的 `Agent`（如 Cursor / Windsurf）能够高效且一次性定位问题，不要让它漫无目的地修改 `CSS`，你需要给它提供一套基于**渲染边界**和**状态机**的系统性排查与修复指令。

你可以直接将以下思路转化为 Prompt 喂给你的 `Agent`：

---

### 给 Agent 的系统性 Debug 指令 (Systematic Prompt for Agent)

**"Agent, 这是一个基于 `React` 的移动端海报生成模块。当前在 `375px Viewport` 下，海报 DOM 预览层发生了严重的 UI 崩溃（元素 `Overlap`，高度塌陷）。请严格按照以下三个维度进行排查和重构代码："**

#### 1. 隔离 DOM 预览与 Canvas 渲染管线 (Isolate Pipelines)
* **指令:** 明确指出当前问题属于 `DOM Layout` 崩溃还是 `Canvas Render` 异常。如果是使用类似 `html2canvas` 或原生 `Canvas API` 进行导出，**必须先确保离屏 DOM (Off-screen DOM) 或预览态 DOM 的绝对纯净**。
* **Agent 排查重点:** 检查是否为海报容器设置了固定的 `Aspect Ratio`。如果海报是固定比例（如 9:16），禁止使用百分比高度，强制外层 `Container` 使用 `aspect-ratio`，并在内部使用绝对的标量映射（例如统一使用基于容器宽度的百分比或特定的 `rem` 换算）。

#### 2. 重构层叠上下文与文档流 (Rebuild Stacking Context & Document Flow)
* **指令:** 截图显示角色图像与底部文本发生 `Overlap`。请审查图像的 `CSS Position` 属性。
* **Agent 排查重点:** * **Traceback-First:** 检查是否存在由于 `position: absolute` 导致的父容器高度塌陷（`Height Collapse`）。如果是，将文本区域与图像区域的布局改为严格的 `Flexbox` 纵向排列（`flex-direction: column`），或者使用 `CSS Grid` 划定硬性的 `Row Bounds`。
    * 排查 `z-index` 污染。海报内部的层级必须是自包含的（`Self-contained`），为海报的最外层 `Wrapper` 显式声明 `isolation: isolate;`。

#### 3. 强制的排版与边界控制 (Typography & Boundary Control)
* **指令:** 移动端字体渲染和文本换行极易在不同设备或导出时引发高度不可控。
* **Agent 排查重点:** * 针对文本区块，强制声明 `word-break: break-all;` 和 `white-space: normal;`。
    * 针对图片资源，确保 `img` 标签带有显式的 `width: 100%;` 和 `object-fit: cover;` 或 `contain;`，防止图片异步加载完成前/后撑爆外层 `Flex` 容器（即检查是否缺少 `flex-shrink: 0;`）。

---

### 核心疑点的正交视角分析

不要用“流式网页”的思维做海报。海报本质上是“打印件”。

1.  **图片加载时序 (Asset Loading Timing):** 很多时候海报崩溃是因为 `React` 组件 `Mount` 时，`<img>` 资源尚未完全 `Load`，导致父级 DOM 计算出的高度为 0 或错误值。当图片最终加载出来时，挤占了原本属于下方文本的空间。你可以让 `Agent` 在海报生成逻辑中加入对所有 `Asset` 的 `Promise.all` 预加载校验。
2.  **字体子集化与排布 (Font Subsetting & Layout):** 如果你在海报中使用了特定的 Web Font，在 `Viewport` 较小的移动端，字体文件的延迟加载也会导致宽高的二次计算跳跃（`Layout Shift`）。

目前这个海报的崩溃，是仅仅停留在 `DOM` 层的样式错位，还是在触发 `Canvas` 绘制 / 导出图片时产生了报错（例如 `Tainted Canvas` 或 `DOM-to-Image` 的层级丢失）？


