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
.primary-button:hover {
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
.primary-button:active {
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
    box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hero-steps:hover,
.hero-preview:hover,
.result-panel:hover,
.signal-card:hover {
  transform: translateY(-3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 32px 72px rgba(0, 0, 0, 0.32),
    0 0 24px rgba(218, 185, 255, 0.08);
}

/* result-page.css — 结果报告卡片 hover */
.result-report__section,
.result-report__signal-card,
.result-report__relation-card {
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.result-report__section:hover,
.result-report__signal-card:hover,
.result-report__relation-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 28px 74px rgba(23, 24, 38, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.68);
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
/* 修改 .option-tile--active (L1985-1994) 增加左条 */
.option-tile--active {
  border-left: 3px solid var(--accent);
  /* 保留其余现有属性 */
}
```

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
| R1（按钮微交互） | ⏳ 待执行 | primary edge glow, ghost hover, :active 状态 |
| R2（卡片层次） | ⏳ 待执行 | hover 浮起, inset 高光增强, glow 色修正 |
| R3（可访问性） | ⏳ 待执行 | :focus-visible, disabled 0.38, tabular-nums |
| R4（文字精修） | ⏳ 待执行 | text-shadow 增强, kicker 0.7rem, 竖条 |
| R5（进阶收尾） | ⏳ 待执行 | @property 进度条, 计数占位, SVG currentColor |