信息已收束。以下是完整的迭代打磨报告。

---

## UI 排版与样式打磨 — 细颗粒度规划

### 一、已扫描文件清单（第 1-4 轮共 9 个文件）

| # | 文件 | 行数 | 阅读范围 |
|---|---|---|---|
| 1 | `app/App.tsx` | ~318 | 全文 |
| 2 | `pages/home/HomePage.tsx` | ~347 | 前 200 |
| 3 | `app/styles.css` | **2365** | 全文分段读完 |
| 4 | `pages/home/sections/HomePageSections.tsx` | 383 | 全文 |
| 5 | `pages/home/result/ResultStageSection.tsx` | 333 | 全文 |
| 6 | `app/shell/PageShell.tsx` | 41 | 全文 |
| 7 | `pages/home/result/result-page.css` | 578 | 全文 |
| 8 | `index.html` | 14 | 全文 |
| 9 | 字体引用（Grep 全项目） | — | 全量 |

---

### 二、发现的核心问题（按严重程度排序）

#### P0 — 字体完全未加载

`index.html` 里没有 `<link>`，CSS 里没有 `@font-face` 或 `@import`。声明的四款字体全部降级为系统回退：

| CSS 变量 | 声明字体 | 实际回退 |
|---|---|---|
| `--font-display` | ZCOOL KuaiLe | 系统无衬线 |
| `--font-sans` | Noto Sans CJK SC | 微软雅黑 / PingFang |
| `--font-mono` | Space Mono, IBM Plex Mono | Menlo / Consolas |

**影响**：display 标题没有个性字体，整站气质完全由系统字体决定，与设计意图脱节。

#### P1 — 背景装饰层冗余堆叠

当前暗色背景至少有 **7 层重叠**：

1. `:root` background（渐变 + glow）
2. `body` background（渐变 + glow）
3. `body::before`（网格 + 径向光）
4. `body::after`（暗角遮罩）
5. `.page-shell__background`（渐变 + glow，和 body 几乎重复）
6. `.page-shell__noise`
7. `.page-shell__scanlines`

其中 `:root`、`body`、`.page-shell__background` 三层的渐变内容几乎相同，造成性能浪费和颜色不可预测。

#### P2 — 暗/亮色调割裂

- 外壳（shell / hero-stage）= 深色暗夜系
- 内容卡片（hero-copy / quiz-room / intro-room）= 白底微暖色
- 结果页（result-report）= 独立亮色系，使用 `color-mix` + accent 色

三种色调没有共用过渡变量，跳转时气质不统一。

#### P3 — 断点体系不一致

| 文件 | 断点 |
|---|---|
| `styles.css` | 980px, 760px |
| `result-page.css` | 1120px, 760px |

结果页在 980px~1120px 之间会出现布局不协调——主站已折叠为单列，但结果页还保持双列。

#### P4 — 信息密度过高

首屏 `hero-stage` 内同时展示：masthead（标题 + logline + announcement-banner + badge + archive-meta）、hero-copy（eyebrow + lede + 4 fact-cards + 2 buttons + action-note + 3 timeline-items）、hero-preview（2 badges + chat-preview + 3 metrics + footer-note）、disclaimer。大量信息重复表达同一件事（"这是人格测试，N 题，M 分钟"）。

#### P5 — font-family 声明不一致

存在两种写法混用：
- `font-family: var(--font-mono)` — 正确，走变量
- `font-family: "Space Mono", "IBM Plex Mono", monospace` — 硬编码，绕过变量

涉及 `styles.css`（3 处）、`dialogue.css`（2 处）、`character-assets.css`（2 处）。

---

### 三、迭代打磨路线（建议按序执行）

#### 第 1 轮：字体加载与统一（P0 + P5）

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 1.1 | `index.html` | 添加 Google Fonts `<link>` 预加载 ZCOOL KuaiLe + Noto Sans SC + Space Mono |
| 1.2 | `styles.css` :root | 审核 `--font-display` / `--font-sans` / `--font-mono` 变量值 |
| 1.3 | 全局 Grep 替换 | 将所有硬编码 `font-family: "Space Mono"...` / `"IBM Plex Mono"...` 统一为 `var(--font-mono)` |
| 1.4 | 验证 | 检查 display 标题、正文、等宽标签三种场景的渲染效果 |

**预计改动文件**：`index.html`、`styles.css`、`dialogue.css`、`character-assets.css`（共 4 文件）

#### 第 2 轮：背景层去重与色调统一（P1 + P2）

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 2.1 | `styles.css` :root / body | 删除 `:root` 的 background（它不应该负责视觉），保留 `body` 作为唯一静态背景 |
| 2.2 | `styles.css` body::before / ::after | 合并为单一伪元素或确认各层职责不重叠 |
| 2.3 | `styles.css` .page-shell__background | 决定它是否替代 body background（如果是，则 body 只保留纯色底） |
| 2.4 | `styles.css` + `result-page.css` | 引入共享过渡变量（如 `--card-bg`、`--card-border`），让暗壳卡片和结果页卡片共享一组基础 token |

**预计改动文件**：`styles.css`、`result-page.css`（共 2 文件）

#### 第 3 轮：断点对齐（P3）

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 3.1 | `result-page.css` | 将 1120px 断点统一到 980px，与主站一致 |
| 3.2 | `styles.css` | 审核 760px 断点内容，确认两个文件在此断点的行为一致 |
| 3.3 | 添加 | 考虑增加 480px 极窄屏断点（当前完全没有处理） |

**预计改动文件**：`result-page.css`、`styles.css`（共 2 文件）

#### 第 4 轮：首屏信息精简 + 布局重构（P4）✅ 已完成

**4A — 信息精简**

删除所有重复表达"N题/N分钟/角色+三轴"的结构块：

| 步骤 | 改动范围 | 实际操作 |
|---|---|---|
| 4.1 | `HomePageSections.tsx` | 删除 `masthead__archive`（announcement-banner + badge + archive-meta）、`hero-copy__fact-grid`（4 张 fact-card）、`hero-preview__metrics`（3 格）、`hero-preview__footer-note` |
| 4.2 | `styles.css` | 删除对应 12 个 CSS 类块，修复 6 处复合选择器，清理 760px / 480px 断点中的冗余规则 |
| 4.3 | hero-preview | 保留 badges + chat-preview 两块，去掉 metrics 和 footer-note |

**4B — 布局重构：CTA 优先**

原有的"masthead 大标题 + hero-grid 双列（左：按钮，右：预览）"改为"居中 CTA 优先 + 辅助信息下沉"：

| 新结构 | 说明 |
|---|---|
| `hero-cta-block`（居中全宽） | label-row → h1 → logline → **大按钮**（68px 高）→ action-note |
| `hero-sub`（双列卡片区） | 左：`hero-preview`（badges + chat），右：`hero-steps`（流程步骤） |

**新增 CSS 类**：

| 类名 | 用途 |
|---|---|
| `.hero-cta-block` | 居中 CTA 容器，`text-align: center` |
| `.hero-cta-block__label-row` | 标签行（居中 flex） |
| `.hero-cta-block__logline` | 副标题，替代旧 `masthead__logline` |
| `.hero-cta-block__actions` | 按钮行（居中 flex） |
| `.primary-button--hero` | 大号主按钮（min-height 68px，font-size 1.2rem） |
| `.hero-sub` | 辅助信息双列网格 |
| `.hero-steps` | 流程步骤卡片（替代旧 `hero-copy` 左列） |
| `.hero-steps__kicker` | 步骤区标签 |

**删除 CSS 类**：`masthead`（布局容器）、`masthead__title-block`、`masthead__label-row`、`masthead h1`、`masthead__logline`、`hero-grid`、`hero-copy`（卡片）、`hero-copy__lede`、`hero-copy__stickers/seal/sparkle/arrow`、`hero-copy__eyebrow`、`hero-copy__actions`（已移入 cta-block）、`hero-copy__story-link`、`hero-copy__timeline`（wrapper）

**断点行为**：

| 断点 | 行为 |
|---|---|
| ≥981px | cta 居中，hero-sub 双列 |
| ≤980px | hero-sub 折单列 |
| ≤760px | cta padding 收缩，hero-sub 单列，hero-steps border-radius 缩小 |
| ≤480px | cta 极窄，按钮全宽，primary-button--hero 降为 58px |

**实际改动文件**：`HomePageSections.tsx`、`styles.css`（共 2 文件）

#### 第 5 轮：排版微调与气质统一

| 步骤 | 内容 |
|---|---|
| 5.1 | 统一 border-radius 层级（当前从 16px 到 32px 共 8 种值，建议收敛到 3-4 种 token） |
| 5.2 | 统一 section 内间距（当前 padding 从 12px 到 28px 随意使用，建议收敛到 spacing scale） |
| 5.3 | 统一标签样式（eyebrow / section-kicker / chip 存在多套相似但不同的实现） |
| 5.4 | 审核 `pulse-glow` 动画和 hover 过渡，确保交互反馈一致 |

---

### 四、依赖关系

```
第1轮(字体) ← 无依赖，可立即开始
第2轮(背景) ← 无依赖，可与第1轮并行
第3轮(断点) ← 依赖第2轮（背景结构确定后再调断点）
第4轮(信息精简) ← 依赖第1轮（字体到位后才能评估信息密度）
第5轮(微调) ← 依赖第1-4轮全部完成
```

---

### 五、当前进度

| 轮次 | 状态 | 核心改动 |
|---|---|---|
| 第 1 轮（字体） | ✅ 完成 | Google Fonts 加载，全局 `var(--font-mono)` 统一 |
| 第 2 轮（背景） | ✅ 完成 | body::before/after 删除，:root background 删除，shared card tokens 加入 :root |
| 第 3 轮（断点） | ✅ 完成 | result-page.css 1120px→980px，两文件新增 480px 断点 |
| 第 4 轮（精简+重构） | ✅ 完成 | 冗余块删除，CTA 优先布局，开始按钮居中放大 |
| 第 5 轮（微调） | ✅ 完成 | --radius-* token 4级体系、padding 对称化、kicker 选择器合并、pulse-glow 去重、IBM Plex Mono 硬编码清零 |

**全部 5 轮已完成。** 下一阶段：进入视觉精细打磨（边缘光晕、组件细化、微交互）。


---

## 第六阶段：视觉精细打磨

### 一、扫描报告 — 当前实现行数标注

> 注：本扫描报告保留为第六阶段实施前基线；R1 完成状态见下方「R1 实施记录」与「当前进度」。

#### `styles.css`（共 2183 行）

| 目标 ID | 相关选择器 / 特性 | 行号 | 现状 |
|---|---|---|---|
| A1 edge glow | `.primary-button` hover | L683-687 共享 `translateY(-2px)` | 无内描边发光 |
| A1 pulse-glow | `@keyframes pulse-glow` | L2090-2103 | 仅 box-shadow 脉冲，无 hover rim light |
| A1 primary 渐变 | `.primary-button`（暗色版） | L1949-1955 | 渐变色 + 静态 box-shadow |
| A2 ghost hover | `.ghost-button` | L1957-1962 | 仅共享 hover translateY，**无背景/边框过渡** |
| A3 active | — | **缺失** | 全文无 `:active` 伪类 |
| B1 card hover | `.hero-steps` / `.result-panel` / `.signal-card` | L567-630, L1184-1187, L1239-1264 | **无任何 hover 效果** |
| B2 inset highlight | 主卡片统一声明 | L1851-1853 | 已有 `inset 0 1px 0 rgba(255,255,255,0.08)` |
| B3 glow 一致性 | `.hero-stage__glow--left/right` | L467-481 | 使用旧色 `rgba(255,141,134)` / `rgba(111,168,255)`，**与 accent 色不匹配** |
| B3 shell glow | `.page-shell__glow--violet/rose` | L128-142 | ✅ 已匹配 accent |
| C1 h1 text-shadow | 暗色标题统一 | L1869 | 已有 `text-shadow: 0 0 24px rgba(218,185,255,0.14)` 但强度偏低 |
| C2 kicker 字号 | `.section-kicker` 等合并选择器 | L588-592 | 当前 `0.82rem`（需降至 `0.7rem`） |
| C3 tabular-nums | — | **缺失** | 全项目无 `font-variant-numeric` |
| D1 progress @property | `.progress-rail` / `.progress-rail__fill` | L1964-1976 | 静态渐变，**无 @property** |
| D2 option-tile 竖条 | `.option-tile--active` | L1985-1994 | border-color 变化，**无左侧竖条** |
| D3 score 计数动画 | `.result-room__score` | L2003-2008 | 纯静态显示，**无动画标记** |
| E1 SVG currentColor | TSX 内联 SVG | 项目共 41 处 fill/stroke | **未使用 currentColor** |
| E2 :focus-visible | — | **缺失** | styles.css 无任何 :focus-visible（仅 dialogue.css 有局部定义） |
| E3 disabled opacity | `button:disabled` | L85-88 | `opacity: 0.45`（需统一为 `0.38`） |

#### `result-page.css`（共 641 行）

| 目标 ID | 相关选择器 | 行号 | 现状 |
|---|---|---|---|
| B1 card hover | `.result-report__section` / signal-card / relation-card | L7-19, L110-117, L364-394 | **无 hover 效果** |
| B2 inset highlight | `.result-report__hero/section/footer` | L18 | 已有 `inset 0 1px 0 rgba(255,255,255,0.62)` — 亮色版本，较强 |
| C2 kicker 字号 | `.result-report__headline-meta span` 等 | L134 | `0.76rem`（结果页偏小，也需调整） |
| E2 :focus-visible | — | **缺失** | 无 |

---

### 二、评估矩阵

| 目标 | 描述 | 文件 | 难度 | 视觉收益 | 建议轮次 |
|---|---|---|---|---|---|
| A3 | 按钮 `:active` 状态（scale + shadow 收缩） | styles.css | 低 | 高 | 🥇 R1 |
| A1 | primary-button hover edge glow（visionOS rim light） | styles.css | 中 | 高 | 🥇 R1 |
| A2 | ghost-button hover 背景微发光 + 边框过渡 | styles.css | 低 | 中 | 🥇 R1 |
| B1 | 卡片 hover 浮起（translateY + shadow） | styles.css + result-page.css | 低 | 高 | 🥈 R2 |
| B2 | 卡片内侧高光线统一增强 | styles.css | 低 | 中 | 🥈 R2 |
| B3 | hero-stage__glow 色相修正 | styles.css | 低 | 中 | 🥈 R2 |
| E2 | :focus-visible 统一焦点环 | styles.css | 低 | 高（可访问性） | 🥉 R3 |
| E3 | disabled opacity 统一 0.38 | styles.css | 低 | 低 | 🥉 R3 |
| C3 | tabular-nums 防数字抖动 | styles.css | 低 | 中 | 🥉 R3 |
| C1 | h1 text-shadow 增强 glow | styles.css | 低 | 中 | R4 |
| C2 | kicker 字号统一 0.7rem | styles.css + result-page.css | 低 | 中 | R4 |
| D2 | option-tile 选中态左侧竖条 | styles.css | 低 | 中 | R4 |
| D1 | progress-rail @property 动态渐变 | styles.css | 高 | 中 | R5 |
| D3 | result-room__score 计数动画占位 | styles.css | 低 | 低 | R5 |
| E1 | SVG fill/stroke → currentColor | TSX 组件 | 中 | 中 | R5 |

---

### 三、逐轮改动规划

#### R1 — 按钮微交互三件套（A1 + A2 + A3）

**A1: primary-button hover edge glow**

```css
/* 在 .primary-button 暗色块（L1949）之后添加 */
.primary-button:hover:not(:disabled) {
  box-shadow:
    0 18px 40px rgba(218, 185, 255, 0.28),
    0 0 32px rgba(255, 175, 215, 0.18),
    inset 0 0 0 1.5px rgba(255, 255, 255, 0.28),   /* visionOS rim light */
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
  filter: brightness(1.06);
}
```

**A2: ghost-button hover 补全**

```css
/* 在 .ghost-button（L1957-1962）之后添加 */
.ghost-button:hover:not(:disabled) {
  border-color: rgba(218, 185, 255, 0.36);
  background: rgba(218, 185, 255, 0.08);
  box-shadow:
    0 0 20px rgba(218, 185, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

**A3: 按钮 :active 状态（全局）**

```css
/* 新增全局按钮 active */
.primary-button:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow:
    0 8px 18px rgba(218, 185, 255, 0.14),
    0 0 16px rgba(255, 175, 215, 0.08);
  filter: brightness(0.96);
  transition-duration: 80ms;
}

.ghost-button:active:not(:disabled) {
  transform: scale(0.97);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  transition-duration: 80ms;
}
```

**R1 实施记录（2026-04-23）**

| 目标 | 状态 | 实际改动 |
|---|---|---|
| A1 primary hover edge glow | ✅ 完成 | `.primary-button:hover:not(:disabled)` 增加外发光、rim light 内描边与 `brightness(1.06)` |
| A2 ghost hover 补全 | ✅ 完成 | `.ghost-button:hover:not(:disabled)` 增加 accent 边框、微发光背景与内侧高光 |
| A3 按钮 active 状态 | ✅ 完成 | primary / ghost active 增加 `scale(0.97)`、阴影收缩与 80ms 按压反馈 |
| 过渡补强 | ✅ 完成 | `.primary-button, .ghost-button` 的 transition 补入 `filter 180ms ease` |

---

#### R2 — 卡片层次三件套（B1 + B2 + B3）

**B1: 卡片 hover 浮起**

```css
/* styles.css — 主卡片 hover */
.hero-steps,
.hero-preview,
.result-panel,
.signal-card {
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 260ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (hover: hover) and (pointer: fine) {
  .hero-steps:hover,
  .hero-preview:hover,
  .result-panel:hover,
  .signal-card:hover {
    transform: translateY(-3px);
    border-color: rgba(218, 185, 255, 0.24);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 32px 72px rgba(0, 0, 0, 0.32),
      0 0 24px rgba(218, 185, 255, 0.08);
  }
}

/* result-page.css — 结果报告卡片 hover */
.result-report__section,
.result-report__signal-card,
.result-report__relation-card {
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 260ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (hover: hover) and (pointer: fine) {
  .result-report__section:hover,
  .result-report__signal-card:hover,
  .result-report__relation-card:hover {
    transform: translateY(-3px);
    box-shadow:
      0 28px 74px rgba(23, 24, 38, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.68);
  }
}
```

**B2: 卡片内侧高光增强 — 统一为 0.10**

```css
/* 修改 styles.css L1851 的 inset shadow */
/* 从 rgba(255,255,255,0.08) → rgba(255,255,255,0.10) */
```

**B3: hero-stage__glow 色相修正**

```css
/* styles.css L467-481 修正 */
.hero-stage__glow--left {
  background: rgba(218, 185, 255, 0.24); /* 旧: rgba(255, 141, 134, 0.24) → accent violet */
}

.hero-stage__glow--right {
  background: rgba(124, 232, 255, 0.22); /* 旧: rgba(111, 168, 255, 0.24) → accent cyan */
}
```

**R2 实施记录（2026-04-23）**

| 目标 | 状态 | 实际改动 |
|---|---|---|
| B1 主站卡片 hover 浮起 | ✅ 完成 | `.hero-steps` / `.hero-preview` / `.result-panel` / `.signal-card` 增加 transform、border-color、shadow 过渡；hover 仅在 `(hover: hover) and (pointer: fine)` 生效 |
| B1 结果页卡片 hover 浮起 | ✅ 完成 | `.result-report__section` / `.result-report__signal-card` / `.result-report__relation-card` 增加同节奏 hover 浮起与亮色阴影 |
| B2 卡片内侧高光增强 | ✅ 完成 | 主暗色卡片统一 inset highlight 从 `0.08` 增强到 `0.10` |
| B3 hero glow 色相修正 | ✅ 完成 | 左侧 glow 改为 accent violet，右侧 glow 改为 accent cyan，和 shell glow 体系对齐 |

---

#### R3 — 可访问性与稳定性（E2 + E3 + C3）

**E2: 全局 :focus-visible 焦点环**

```css
/* 新增到 styles.css 全局区域 */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
.primary-button:focus-visible,
.ghost-button:focus-visible,
.option-tile:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

**E3: disabled 统一 0.38**

```css
/* 修改 styles.css L87 */
/* button:disabled { opacity: 0.45 } → opacity: 0.38 */

/* 新增通用禁用 */
.primary-button:disabled,
.ghost-button:disabled,
.option-tile:disabled {
  opacity: 0.38;
  pointer-events: none;
}
```

**C3: tabular-nums**

```css
/* 新增到 styles.css 全局区域 */
.result-room__score strong,
.progress-summary strong,
.ranking-list em,
.result-poster__scoreband strong,
.result-report__headline-meta strong,
.result-report__ranking-meta em {
  font-variant-numeric: tabular-nums;
}
```

**R3 实施记录（2026-04-23）**

| 目标 | 状态 | 实际改动 |
|---|---|---|
| E2 全局焦点环 | ✅ 完成 | 增加 `:focus-visible`，并覆盖 button / a / `.primary-button` / `.ghost-button` / `.option-tile` |
| E3 disabled 统一 | ✅ 完成 | `button:disabled` 透明度从 `0.45` 调整为 `0.38`；primary / ghost / option disabled 统一 `opacity: 0.38` 与 `pointer-events: none` |
| C3 tabular-nums | ✅ 完成 | 分数、进度、排行、海报 scoreband、结果报告 meta 数字使用 `font-variant-numeric: tabular-nums` |

---

#### R4 — 文字层级精修（C1 + C2 + D2）

**C1: h1 text-shadow 增强**

```css
/* 修改 styles.css L1869 */
/* 从 text-shadow: 0 0 24px rgba(218, 185, 255, 0.14) */
/* → text-shadow: 0 0 32px rgba(218, 185, 255, 0.24), 0 0 64px rgba(218, 185, 255, 0.08) */
```

**C2: kicker 统一 0.7rem**

```css
/* 修改 styles.css L589: font-size 0.82rem → 0.7rem */
/* 修改 result-page.css L134: font-size 0.76rem → 0.7rem */
```

**D2: option-tile 选中态左侧竖条**

```css
/* 修改 .option-tile--active 增加左条；使用 inset shadow 避免 border-left 引发布局抖动 */
.option-tile--active {
  box-shadow:
    inset 3px 0 0 var(--accent),
    /* 保留其余现有 shadow */;
  /* 保留其余现有属性 */
}
```

**R4 实施记录（2026-04-23）**

| 目标 | 状态 | 实际改动 |
|---|---|---|
| C1 h1 text-shadow 增强 | ✅ 完成 | 暗色标题统一改为双层 glow：`32px` 主光 + `64px` 外扩散 |
| C2 kicker 统一 0.7rem | ✅ 完成 | 主站 kicker / eyebrow 标签与结果报告 meta 小标签统一到 `0.7rem` |
| D2 option-tile 选中竖条 | ✅ 完成 | `.option-tile--active` 增加 `inset 3px 0 0 var(--accent)` 左侧竖条，避免改变布局尺寸 |

---

#### R5 — 进阶收尾（D1 + D3 + E1）

**D1: progress-rail @property 动态渐变**

```css
@property --rail-hue {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.progress-rail__fill {
  --rail-hue: 0deg;
  background: linear-gradient(
    calc(90deg + var(--rail-hue)),
    #dab9ff 0%, #ffafd7 50%, #00dfc1 100%
  );
  animation: rail-shift 3s ease-in-out infinite alternate;
}

@keyframes rail-shift {
  to { --rail-hue: 12deg; }
}
```

**D3: score 计数动画占位**

```css
/* 在 .result-room__score strong 后新增 */
.result-room__score--animate strong {
  /* JS 接入后启用 counter animation，当前仅作标记 */
  will-change: contents;
}
```

**E1: SVG currentColor** — 需逐个修改 TSX 内联 SVG 的 `fill` / `stroke` 属性为 `currentColor`，属于组件层改动，建议配合组件 review 一并处理。

**R5 实施记录（2026-04-23）**

| 目标 | 状态 | 实际改动 |
|---|---|---|
| D1 progress-rail @property | ✅ 完成 | 增加 `--rail-hue` 注册属性、`rail-shift` 动画与动态渐变；保留 width 过渡，并在 `prefers-reduced-motion: reduce` 下关闭动画 |
| D3 score 计数动画占位 | ✅ 完成 | 新增 `.result-room__score--animate strong { will-change: contents; }`，为后续 JS 计数动画预留标记 |
| E1 SVG currentColor | ✅ 完成 | `StoryBadgeIcon` 与 `ComicArrow` 改为继承 `currentColor`；多色插画类 SVG 保留固定色，避免破坏角色/故事资产 |

---

### 四、依赖关系

```
R1（按钮微交互）← 无依赖，立即开始
R2（卡片层次） ← 无依赖，可与 R1 并行
R3（可访问性）  ← 无依赖，可与 R1/R2 并行
R4（文字精修）  ← 建议 R1 完成后（按钮文字视觉协调）
R5（进阶收尾）  ← 依赖 R1-R4 全部完成
```

### 五、当前进度

| 轮次 | 状态 | 核心改动 |
|---|---|---|
| R1（按钮微交互） | ✅ 完成 | primary edge glow, ghost hover, :active 状态；补入 filter 过渡与 disabled 防护 |
| R2（卡片层次） | ✅ 完成 | hover 浮起, inset 高光增强, glow 色修正；hover 限定在精细指针设备 |
| R3（可访问性） | ✅ 完成 | :focus-visible, disabled 0.38, tabular-nums |
| R4（文字精修） | ✅ 完成 | text-shadow 增强, kicker 0.7rem, 竖条 |
| R5（进阶收尾） | ✅ 完成 | @property 进度条, 计数占位, SVG currentColor |

---

## 页面切分记录（2026-04-23）

### 目标

将原本首页内联展开的测试流程拆到独立测试页，首页只保留入口、介绍、视觉展示和免责声明。

### 实施结果

| 项目 | 状态 | 改动 |
|---|---|---|
| 独立测试路由 | ✅ 完成 | 新增 `/test` 路由，由 `TestPage` 承载答题、结果、分享、重新开始逻辑 |
| 首页入口化 | ✅ 完成 | `HomePage` 只保留首屏入口内容；不再渲染答题流或结果区 |
| 开始测试跳转 | ✅ 完成 | 首页“开始测试”改为路由跳转到 `/test`；旧 `/?start=1` 兼容重定向到 `/test` |
| 测试主体迁移 | ✅ 完成 | 原免责声明下方的测试说明、答题流程、结果展示迁移到测试页主体 |
| 重置流程 | ✅ 完成 | 测试页“重新开始测试”清空答案、结果和提示，并停留在 `/test` 第 1 题 |
| 锚点清理 | ✅ 完成 | 首页旧 `#test-brief` 入口移除，改为 `/test` 路由链接 |
| 回归测试 | ✅ 完成 | 新增 App 路由测试，覆盖首页不显示答题流、开始测试进入 `/test`、旧 start query 重定向 |

### 修改文件

- `apps/web/src/app/App.tsx`
- `apps/web/src/app/App.test.tsx`
- `apps/web/src/pages/home/HomePage.tsx`
- `apps/web/src/pages/home/copy.ts`
- `apps/web/src/pages/home/sections/HomePageSections.tsx`
- `apps/web/src/pages/test/TestPage.tsx`
- `apps/web/src/test/setup.ts`

---

## 第七阶段：Design DNA v1.0 对齐

### 〇、架构决策：CSS Variables 路线 vs Tailwind 路线

DNA 规范以 Tailwind 语法描述 token（`from-mygo-neon-purple`、`rounded-2xl`、`backdrop-blur-md`），但当前项目 **未使用 Tailwind**，全部样式基于 `:root` CSS 变量 + BEM 类。

**结论：保持 CSS 变量 + BEM 路线，不引入 Tailwind。**

理由：
1. 项目已有 2200+ 行成熟的 CSS 系统，迁移到 Tailwind 工作量极大且回报有限
2. 移动端 H5 不需要 Tailwind 的原子化优势
3. DNA 的 token 名（`mygo-*`）可直接映射为 `--mygo-*` CSS 变量

DNA 中的 Tailwind 约定将按以下方式映射：

| DNA (Tailwind) | 实施 (CSS Variables) |
|---|---|
| `mygo-bg` | `--mygo-bg: linear-gradient(180deg, #121414 0%, #1a1c2e 100%)` |
| `mygo-surface` | `--mygo-surface: rgba(26, 33, 62, 0.6)` + `backdrop-filter: blur(12px)` |
| `mygo-neon-purple` | `--mygo-neon-purple: #dab9ff` / `--mygo-neon-purple-sat: #9b5de5` |
| `rounded-2xl` | `--mygo-radius: 1rem` / `--mygo-radius-sm: 0.75rem` |
| `space-y-8` | gap / margin token `--mygo-space-section: 2rem` |
| `backdrop-blur-md` | `backdrop-filter: blur(12px)` |

---

### 一、DNA Compliance Audit — 偏差清单

对照 DNA v1.0 逐条审计现有代码库，标注合规 / 偏差 / 缺失。

#### 1. Color Tokens

| DNA Token | DNA 值 | 现有对应变量 | 偏差 |
|---|---|---|---|
| `mygo-bg` | `linear-gradient(180deg, #121414, #1a1c2e)` | `--bg-0: #090b14` / body 渐变 `#090b14→#101522→#171b2b` | ⚠️ 色相偏蓝偏深，DNA 要求中性深灰绿 |
| `mygo-surface` | `#1a213e/60 + backdrop-blur-md` | `--surface: rgba(17,21,35,0.74)` | ⚠️ 透明度偏高（0.74 vs 0.60），组件层未统一使用 backdrop-blur |
| `mygo-neon-purple` | `#dab9ff` (light) / `#9b5de5` (sat) | `--accent: #dab9ff` | ✅ 浅色一致；⚠️ 饱和版 `#9b5de5` 无对应变量 |
| `mygo-neon-pink` | `#ffafd7` (light) / `#f15bb5` (sat) | `--accent-deep: #ffafd7` | ✅ 浅色一致；⚠️ 饱和版 `#f15bb5` 无对应变量 |
| `mygo-neon-green` | `#00dfc1` | `--accent-warm: #00dfc1` | ✅ 一致 |
| `mygo-text` | `#e2e2e2` | `--text-main: #eef0ff` | ⚠️ 偏蓝偏亮，DNA 要求中性灰白 |
| `mygo-text-muted` | `#8888aa` | `--text-faint: rgba(170,176,214,0.64)` | ⚠️ 用 rgba 带透明度，且偏蓝 |
| `mygo-glow-purple` | `rgba(155,93,229,0.6)` | 无专用变量 | ❌ 缺失 |
| `mygo-glow-pink` | `rgba(255,175,215,0.4)` | 无专用变量 | ❌ 缺失 |
| `border-white/10` | `rgba(255,255,255,0.1)` | 分散使用 0.06~0.14 不等 | ⚠️ 未统一 |

**硬编码 hex 统计：** `styles.css` 32处 / `dialogue.css` 8处 / `result-page.css` 9处 / `character-assets.css` + TSX 若干

#### 2. Typography

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| 中文正文 16px，行高 1.6 | `:root { line-height: 1.5 }` | ⚠️ 行高 1.5 vs DNA 1.6 |
| ZCOOL KuaiLe 时 `letter-spacing: 0.05em` | 暗色标题 `letter-spacing: -0.04em` | ❌ 负间距，与 DNA 相反 |
| 禁止引入规范外字体 | `--font-sans` 含 `Source Han Sans SC` / `PingFang SC` 等回退 | ✅ 回退栈合理 |
| 英文/数字用 Space Mono | 已统一 `var(--font-mono)` | ✅ |

#### 3. Surfaces & Cards

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| `mygo-surface + backdrop-blur-md + rounded-2xl + border-white/10` | 暗色卡片用多层线性+径向渐变，部分无 blur | ⚠️ 背景过复杂；blur 不统一 |
| hover: border → neon-purple + glow box-shadow | 已有 hover 浮起，但 border-color 用 `rgba(218,185,255,0.24)` | ⚠️ hover border 应该更亮 |
| 圆角统一 `rounded-2xl (1rem)` | `--radius-lg: 28px`、`--radius-md: 20px` 等 | ❌ DNA 是 1rem，现有最小 12px |
| 小元素 `rounded-xl (0.75rem)` | 混用 | ⚠️ 需收敛 |

#### 4. Buttons

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| primary: `from-neon-purple to-neon-pink` + 呼吸灯 2.5s | 渐变含三色（purple → pink → cyan）；pulse-glow 存在 | ⚠️ DNA 只要紫→粉，不含 cyan；脉冲参数需核对 |
| ghost: `bg-transparent + border-neon-purple + hover:bg-neon-purple/20` | `background: rgba(255,255,255,0.04)` + `backdrop-filter` | ⚠️ 非全透明，DNA 要求 transparent |
| active: `scale(0.95) 0.1s` | `scale(0.97)` + `80ms` | ⚠️ 幅度和时间微偏 |
| focus-visible: `ring-2 ring-neon-purple ring-offset-2 ring-offset-mygo-bg` | `outline: 2px solid var(--accent)` + `offset 2px` | ⚠️ DNA 要求 ring-offset 带背景色，当前无 offset 色 |

#### 5. Motion

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| 页面进入 opacity 0→1, y 20→0, 0.4s easeOut | `PageTransition.tsx` 用 framer-motion | ✅ 需核对参数 |
| 列表 stagger: 0.08s | `DialogueList` 有 stagger | ✅ 需核对具体值 |
| CTA 呼吸灯 box-shadow 2.5s | `@keyframes pulse-glow` 存在 | ⚠️ 用 CSS @keyframes，DNA 要求用 framer-motion |
| 单动画 ≤ 0.5s | `pulse-glow` 周期远超 0.5s | ⚠️ 呼吸灯例外？需明确 |
| 禁止 bounce/elastic | 无 bounce/elastic | ✅ |
| 禁止 CSS @keyframes 做交互动画 | `pulse-glow`（按钮交互）、`bubble-rise`（装饰） | ⚠️ pulse-glow 违规；bubble-rise 可归为装饰豁免 |
| 禁止 transition-all | 无 `transition: all` | ✅ |

#### 6. Texture Overlay

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| 噪点: 256x256 tiled PNG, opacity 0.05 | CSS radial-gradient 模拟噪点, opacity 0.14 | ❌ 非真实噪点图；透明度是 DNA 的 2.8 倍 |
| 扫描线: opacity 0.03 | opacity 0.1 | ❌ 透明度是 DNA 的 3.3 倍 |

#### 7. Layout

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| `max-w-md mx-auto px-4 py-6` | 无统一 max-width 约束 | ⚠️ 首页全宽铺开 |
| 区块间 `space-y-8` (2rem) | 间距不统一 | ⚠️ |
| 卡片内 `p-5` (1.25rem) | 12px~28px 混用 | ⚠️ |
| 元素间 `gap-3` (0.75rem) | 各处 gap 值不一 | ⚠️ |

#### 8. Chat Bubble (DialogueRow)

| DNA 规则 | 现状 | 偏差 |
|---|---|---|
| 左气泡: `bg-mygo-surface + rounded-2xl rounded-tl-sm` | `rgba(24,29,45,0.94)` + `0.7rem 1.2rem 1.2rem 1.2rem` | ⚠️ 背景非 surface token；圆角接近但数值不同 |
| 右气泡: `from-neon-purple to-neon-pink + rounded-tr-sm + 白色文字` | `linear-gradient(135deg, #dab9ff, #ffafd7 64%, #7ce8ff)` + `color: #0b0f19` | ❌ 多了 cyan；文字色是暗色不是白色 |
| 选中动画: `translateX ±20px + fade-in 0.3s` | framer-motion 存在 | ✅ 需核对参数 |

#### 9. 严重违规汇总

| 违规等级 | 条目 | 数量 |
|---|---|---|
| ❌ 缺失/严重偏差 | glow token 缺失、letter-spacing 反向、圆角体系、噪点非 PNG、扫描线过亮、右气泡色/文字色 | 7 |
| ⚠️ 可调偏差 | 背景色相、surface 透明度、行高、hover border 亮度、按钮渐变三色→双色、active scale、focus ring、间距体系、backdrop-blur 缺失 | 12 |
| ✅ 合规 | neon-green、Space Mono、无 bounce、无 transition-all、framer-motion 已接入 | 5 |

---

### 二、逐轮改动规划

#### DNA-R1 — Token 重铸：`:root` 变量对齐 DNA（P0 基础层）

**目标**：建立 `--mygo-*` 变量体系，所有后续改动基于此。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 1.1 | `styles.css` `:root` | 新增 DNA token 变量块，与旧变量并存（渐进过渡） |
| 1.2 | `styles.css` `:root` | 修正行高 `1.5 → 1.6` |
| 1.3 | `styles.css` `:root` | 新增圆角 token `--mygo-radius: 1rem` / `--mygo-radius-sm: 0.75rem` |
| 1.4 | `styles.css` `:root` | 新增间距 token `--mygo-space-section: 2rem` / `--mygo-space-card: 1.25rem` / `--mygo-space-element: 0.75rem` |

**新增变量清单**：

```css
/* === MyGObti Design DNA v1.0 Token Layer === */
--mygo-bg:              linear-gradient(180deg, #121414 0%, #1a1c2e 100%);
--mygo-surface:         rgba(26, 33, 62, 0.6);
--mygo-neon-purple:     #dab9ff;
--mygo-neon-purple-sat: #9b5de5;
--mygo-neon-pink:       #ffafd7;
--mygo-neon-pink-sat:   #f15bb5;
--mygo-neon-green:      #00dfc1;
--mygo-text:            #e2e2e2;
--mygo-text-muted:      #8888aa;
--mygo-glow-purple:     rgba(155, 93, 229, 0.6);
--mygo-glow-pink:       rgba(255, 175, 215, 0.4);
--mygo-border:          rgba(255, 255, 255, 0.1);
--mygo-radius:          1rem;
--mygo-radius-sm:       0.75rem;
--mygo-space-section:   2rem;
--mygo-space-card:      1.25rem;
--mygo-space-element:   0.75rem;
```

**旧变量迁移映射**（一对一别名，后续逐步替换引用）：

| 旧变量 | 新变量 | 是否可直接 alias |
|---|---|---|
| `--accent` | `--mygo-neon-purple` | ✅ 值一致 |
| `--accent-deep` | `--mygo-neon-pink` | ✅ 值一致 |
| `--accent-warm` / `--accent-mint` / `--accent-green` | `--mygo-neon-green` | ✅ 值一致 |
| `--text-main` | `--mygo-text` | ❌ 值变化 `#eef0ff → #e2e2e2` |
| `--text-faint` | `--mygo-text-muted` | ❌ rgba → hex |
| `--surface` | `--mygo-surface` | ❌ 透明度和色相变化 |
| `--bg-0` ~ `--bg-2` | `--mygo-bg` | ❌ 渐变结构变化 |

**预计改动文件**：`styles.css`（1 文件）

---

#### DNA-R2 — 背景层重构：暗色统一 + 噪点/扫描线合规

**目标**：背景渐变对齐 DNA；噪点换真实 PNG；扫描线透明度降至 0.03。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 2.1 | `public/` | 生成或放入 256×256 噪点 PNG（noise-256.png） |
| 2.2 | `styles.css` `.page-shell__background` | 渐变改为 `--mygo-bg`（`#121414 → #1a1c2e`） |
| 2.3 | `styles.css` `.page-shell__noise` | 从 CSS radial-gradient 改为 `background-image: url(/noise-256.png)` + `background-repeat: repeat` + `background-size: 256px 256px` + `opacity: 0.05` + `position: fixed` |
| 2.4 | `styles.css` `.page-shell__scanlines` | `opacity: 0.1 → 0.03` |
| 2.5 | `NoiseOverlay.tsx` | 如需调整组件结构（应该无需，仅 CSS 层改动） |
| 2.6 | shell glow 色斑 | 保留 violet/rose 色斑但调色对齐 `--mygo-glow-purple` / `--mygo-glow-pink` |

**预计改动文件**：`styles.css`、`public/noise-256.png`（2 文件）

---

#### DNA-R3 — Surface & Card 体系对齐

**目标**：所有暗色卡片统一为 `mygo-surface + backdrop-blur-md + rounded-2xl + border-white/10`。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 3.1 | `styles.css` 全局卡片声明 | 统一 `.masthead__mini-badge`、`.hero-preview__chat`、`.option-tile`、`.signal-card` 等暗色卡片的背景为 `var(--mygo-surface)` + `backdrop-filter: blur(12px)` |
| 3.2 | `styles.css` | 圆角统一使用 `var(--mygo-radius)` = 1rem（取代 18px/20px/24px/28px）；小元素用 `var(--mygo-radius-sm)` = 0.75rem |
| 3.3 | `styles.css` | 所有暗色卡片 border 统一为 `1px solid var(--mygo-border)`（= `rgba(255,255,255,0.1)`） |
| 3.4 | `styles.css` hover 态 | hover border-color 改为 `var(--mygo-neon-purple)` + `box-shadow: 0 0 20px var(--mygo-glow-purple)` |
| 3.5 | `chat-quiz.css` | `.chat-quiz__panel` / `.chat-quiz__sidebar-card` / `.chat-quiz__status-card` 对齐到 surface token |
| 3.6 | `dialogue.css` | `.dialogue-list` 和 `.dialogue-bubble--left` 对齐到 surface token |
| 3.7 | 间距对齐 | 卡片内 padding 统一 `var(--mygo-space-card)` = 1.25rem；元素间 gap 统一 `var(--mygo-space-element)` = 0.75rem |

**预计改动文件**：`styles.css`、`chat-quiz.css`、`dialogue.css`（3 文件）

---

#### DNA-R4 — Typography 精修

**目标**：对齐 DNA 字体规则。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 4.1 | `styles.css` 暗色标题选择器 | `letter-spacing: -0.04em → 0.05em`（ZCOOL KuaiLe 应使用正间距） |
| 4.2 | `styles.css` `:root` | `line-height: 1.5 → 1.6` |
| 4.3 | `styles.css` | 确认正文 `font-size: 16px`（当前由浏览器默认保证，但需确认无覆盖） |
| 4.4 | `styles.css` | `--text-main` 值从 `#eef0ff` 切换为 `--mygo-text`（`#e2e2e2`） |
| 4.5 | `styles.css` | `--text-faint` 从 `rgba(170,176,214,0.64)` 切换为 `--mygo-text-muted`（`#8888aa`） |
| 4.6 | `result-page.css` | 标题/正文色从 `#11151d` 等亮色系暗文切换（见 DNA-R6 结果页暗化） |

**预计改动文件**：`styles.css`、`result-page.css`（2 文件）

---

#### DNA-R5 — 按钮系统重构

**目标**：primary / ghost / icon 三种按钮完全对齐 DNA 规范。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 5.1 | `styles.css` `.primary-button` | 渐变从三色（purple→pink→cyan）改为双色 `linear-gradient(to right, var(--mygo-neon-purple), var(--mygo-neon-pink))` |
| 5.2 | `styles.css` `.primary-button` | 呼吸灯改为 framer-motion 驱动（需配合 TSX），或保留 CSS @keyframes 但限定仅用于此非交互装饰效果。DNA 原文"CTA 呼吸灯"归为装饰类动画，可在 CSS 保留但标注例外 |
| 5.3 | `styles.css` `.ghost-button` | `background: rgba(255,255,255,0.04)` → `background: transparent`；`border-color` 使用 `var(--mygo-neon-purple)`；hover 态 `background: rgba(var(--mygo-neon-purple-rgb), 0.2)` |
| 5.4 | `styles.css` `.primary-button:active` / `.ghost-button:active` | `scale(0.97) → scale(0.95)`；`80ms → 100ms` |
| 5.5 | `styles.css` focus-visible | 改为 `outline: 2px solid var(--mygo-neon-purple); outline-offset: 2px;`（并添加模拟 ring-offset 的 box-shadow 背景色隔离） |
| 5.6 | 新增 icon button | `.icon-button { border-radius: 9999px; }` + 同 ghost 逻辑 |

**预计改动文件**：`styles.css`（1 文件，可能涉及 TSX 组件添加 icon-button class）

---

#### DNA-R6 — 结果页暗化（最大工程量）

**目标**：`result-page.css` 从亮色主题全面转为暗色主题。DNA 明确 "禁止亮色/白色背景"。

这是整个 DNA 对齐中 **工作量最大** 的改动——结果页当前为完全独立的亮色设计系统。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 6.1 | `result-page.css` 全局色 | `.result-report__hero/section/footer` 背景从 `rgba(255,255,255,0.96)` → `var(--mygo-surface)` + `backdrop-filter: blur(12px)` |
| 6.2 | `result-page.css` 边框 | 所有 `color-mix(...)` 白底边框 → `var(--mygo-border)` |
| 6.3 | `result-page.css` 文字色 | `color: #11151d` → `var(--mygo-text)`；`rgba(33,37,49,0.7)` → `var(--mygo-text-muted)` |
| 6.4 | `result-page.css` 内嵌卡片 | `.result-report__headline-meta div` 等白底子卡片 → 深色变体 `var(--mygo-surface)` |
| 6.5 | `result-page.css` | `.result-report__axis-track` 轨道背景暗化 |
| 6.6 | `result-page.css` | `.result-report__axis-marker--user` 从 `#11151d` → `var(--mygo-neon-purple)` 或其他 accent |
| 6.7 | `result-page.css` | `.result-report__chip` 已是深色 `rgba(17,20,29,0.92)` → 保持，调整文字色 |
| 6.8 | `result-page.css` | hover 效果从亮色阴影改为 neon glow |
| 6.9 | `result-page.css` | `.result-report__hero-card` 内嵌深色卡已合规，保持 |
| 6.10 | `result-page.css` | status 状态色（success/warning/error）从浅色底改为暗色 + accent 边框 |
| 6.11 | `ResultStageSection.tsx` | `--result-accent` 注入逻辑保持，但 `color-mix` 引用都需改为暗色体系 |

**accent 机制保留**：结果页的 `--result-accent` 动态色系统是好的设计，暗化时保留此机制，将 `color-mix` 的 base 从白色换为深色。

**预计改动文件**：`result-page.css`、`ResultStageSection.tsx`（2 文件）

---

#### DNA-R7 — Chat Bubble 对齐

**目标**：`DialogueRow` 气泡样式完全对齐 DNA。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 7.1 | `dialogue.css` `.dialogue-bubble--left` | 背景 → `var(--mygo-surface)` + `backdrop-filter: blur(12px)` |
| 7.2 | `dialogue.css` `.dialogue-bubble--left` | 圆角 → `1rem 1rem 1rem 0.25rem`（rounded-2xl + rounded-tl-sm） |
| 7.3 | `dialogue.css` `.dialogue-bubble--sent` | 渐变从三色 → 双色 `linear-gradient(to right, var(--mygo-neon-purple), var(--mygo-neon-pink))` |
| 7.4 | `dialogue.css` `.dialogue-bubble--sent` | 文字色从 `#0b0f19`（暗色）→ `#ffffff`（白色），DNA 明确要求右气泡白色文字 |
| 7.5 | `dialogue.css` `.dialogue-bubble--right` | 圆角 → `1rem 0.25rem 1rem 1rem`（rounded-2xl + rounded-tr-sm） |
| 7.6 | `dialogue.css` | 硬编码 hex 清理（`#f3f4ff`、`#ff8d86`、`#0b0f19` 等）→ token 变量 |
| 7.7 | `dialogue.css` `.dialogue-bubble--choice` | 选中后动画核对：`translateX(±20px) + fade-in 0.3s` |

**预计改动文件**：`dialogue.css`、可能微调 `DialogueBubble.tsx`（1-2 文件）

---

#### DNA-R8 — Motion 合规审计

**目标**：确保所有动画符合 DNA 运动规范。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 8.1 | `styles.css` | `@keyframes bubble-rise`：装饰性动画，归入豁免类（噪点/扫描线同类），保留 |
| 8.2 | `styles.css` | `@keyframes pulse-glow`：CTA 呼吸灯。DNA 说交互动画用 framer-motion，但此为装饰循环。**决策**：保留 CSS @keyframes，但注释标注 DNA 豁免理由 |
| 8.3 | `styles.css` | `@keyframes rail-shift`：进度条装饰动画，保留 |
| 8.4 | `PageTransition.tsx` | 核对进入动画参数：opacity 0→1, y 20→0, duration 0.4s, ease easeOut |
| 8.5 | `DialogueList.tsx` | 核对 stagger 值：`staggerChildren: 0.08` |
| 8.6 | `styles.css` 全局按钮 hover | `box-shadow transition` 核对为 `0.3s`（DNA 要求 0.3s） |
| 8.7 | `styles.css` 全局按钮 active | `transition-duration` 核对为 `0.1s`（DNA 要求 0.1s） |
| 8.8 | `styles.css` pulse-glow | 核对周期为 `2.5s ease-in-out infinite`（DNA 明确值） |

**预计改动文件**：`styles.css`、可能微调 `PageTransition.tsx` / `DialogueList.tsx`（1-3 文件）

---

#### DNA-R9 — Layout 间距节奏 + 移动端验证

**目标**：全局间距对齐 DNA 节奏；验证 375px 断点。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 9.1 | `styles.css` | 内容区添加 `max-width: 28rem`（md = 448px ≈ max-w-md）+ `margin: 0 auto` + `padding: 1rem 1.5rem`（移动端 `px-4 py-6` ≈ 1rem 1.5rem） |
| 9.2 | `styles.css` | 区块间距 → `gap` 或 margin 使用 `var(--mygo-space-section)` = 2rem |
| 9.3 | `chat-quiz.css` | 答题页内间距对齐 |
| 9.4 | `result-page.css` | 结果页间距对齐 |
| 9.5 | 全文件 | 验证 375px / 390px / 428px 三个关键宽度下的布局，确保无溢出 |

**预计改动文件**：`styles.css`、`chat-quiz.css`、`result-page.css`（3 文件）

---

#### DNA-R10 — 硬编码 Hex 清零 + `filter:drop-shadow` 消除

**目标**：全项目零硬编码颜色值；glow 全部走 box-shadow。

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 10.1 | `styles.css` | 逐一替换 32 处硬编码 hex → `var(--mygo-*)` |
| 10.2 | `dialogue.css` | 替换 8 处 |
| 10.3 | `result-page.css` | 替换 9 处（部分在 R6 已处理） |
| 10.4 | `character-assets.css` L89 | `filter: drop-shadow(...)` → `box-shadow: ...`（注意 drop-shadow 对 PNG 轮廓有效而 box-shadow 对盒模型有效，可能需要包一层容器） |
| 10.5 | TSX 内联色 | `characterAssets.ts` 的 `CHARACTER_ACCENTS` 为角色动态色，保留硬编码但注释标注为 "动态色例外" |
| 10.6 | 全局 Grep 验证 | 确认 CSS 中无 `#` hex 值残留（`:root` 定义块的例外） |

**预计改动文件**：`styles.css`、`dialogue.css`、`result-page.css`、`character-assets.css`（4 文件）

---

### 三、依赖关系与执行顺序

```
DNA-R1 (Token 重铸) ← 无依赖，最先执行，所有后续改动的基础
DNA-R2 (背景层)     ← 依赖 R1
DNA-R3 (Surface)    ← 依赖 R1
DNA-R4 (Typography) ← 依赖 R1
DNA-R5 (按钮)       ← 依赖 R1
                       ↓ R1 完成后 R2~R5 可并行
DNA-R6 (结果页暗化) ← 依赖 R1 + R3（surface 体系确定后再改结果页）
DNA-R7 (Chat Bubble) ← 依赖 R1 + R3
DNA-R8 (Motion)     ← 依赖 R5（按钮参数确定后核对动画）
DNA-R9 (Layout)     ← 依赖 R3 + R6（卡片和结果页结构定型后调间距）
DNA-R10 (Hex 清零)  ← 依赖 R1~R9 全部完成（最后扫尾）
```

**建议执行波次**：

| 波次 | 轮次 | 预计复杂度 |
|---|---|---|
| Wave 1 | R1 (Token) | 低 — 仅添加变量 |
| Wave 2 | R2 (背景) + R4 (字体) + R5 (按钮) | 中 — 三路并行 |
| Wave 3 | R3 (Surface) | 中 — 大范围选择器修改 |
| Wave 4 | R6 (结果页暗化) | **高** — 最大工程量 |
| Wave 5 | R7 (Chat) + R8 (Motion) | 中 — 两路并行 |
| Wave 6 | R9 (Layout) + R10 (Hex 清零) | 中 — 收尾扫描 |

---

### 四、Do / Don't 检查清单（每轮验收用）

```
[  ] 所有新增/修改颜色走 --mygo-* token
[  ] 卡片用 var(--mygo-surface) + backdrop-filter: blur(12px)
[  ] 发光只用 box-shadow，无 filter:drop-shadow
[  ] 交互动画用 framer-motion（装饰循环动画 @keyframes 需注释豁免理由）
[  ] 每个组件在 375px 视口无溢出
[  ] 无亮色/白色背景
[  ] 无 transition-all
[  ] 无 bounce/elastic 缓动
[  ] 无硬编码 hex（:root 定义区例外）
[  ] 无规范外字体
[  ] 单个交互动画 ≤ 0.5s
[  ] ZCOOL KuaiLe 字体使用 letter-spacing: 0.05em
```

---

### 五、当前进度

| 轮次 | 状态 | 核心改动 |
|---|---|---|
| DNA-R1（Token 重铸） | ⏳ 待执行 | `:root` 新增 `--mygo-*` 变量体系 + 行高修正 |
| DNA-R2（背景层） | ⏳ 待执行 | 渐变对齐 + 噪点 PNG + 扫描线降透明度 |
| DNA-R3（Surface） | ⏳ 待执行 | 卡片统一 surface + blur + radius + border |
| DNA-R4（Typography） | ⏳ 待执行 | letter-spacing 修正 + 文字色切换 |
| DNA-R5（按钮） | ⏳ 待执行 | 渐变双色 + ghost 全透明 + active 0.95 |
| DNA-R6（结果页暗化） | ⏳ 待执行 | 整页从亮色→暗色主题 |
| DNA-R7（Chat Bubble） | ⏳ 待执行 | 气泡圆角/色/文字对齐 DNA |
| DNA-R8（Motion） | ⏳ 待执行 | 动画参数核对 + pulse-glow 周期修正 |
| DNA-R9（Layout） | ⏳ 待执行 | max-w-md 居中 + 间距节奏统一 |
| DNA-R10（Hex 清零） | ⏳ 待执行 | 全项目硬编码颜色消除 |
