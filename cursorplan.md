信息已收束。以下是完整的迭代打磨报告。

---

## UI 排版与样式打磨 — 细颗粒度规划

### 一、已扫描文件清单（第 1-3 轮共 9 个文件）

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

#### 第 4 轮：首屏信息精简（P4）

| 步骤 | 改动范围 | 内容 |
|---|---|---|
| 4.1 | `HomePageSections.tsx` | 精简 hero 区域：去掉重复的 fact-card 和 announcement-banner，只保留标题 + logline + 主按钮 + 进度提示 |
| 4.2 | `styles.css` | 删除对应的冗余样式 class（masthead\_\_archive、announcement-banner 等） |
| 4.3 | hero-preview | 评估是否保留右侧预览栏，或将关键信息合并到左列 |

**预计改动文件**：`HomePageSections.tsx`、`styles.css`（共 2 文件）

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

### 五、建议下一步

从**第 1 轮（字体加载与统一）**开始——它是投入最小、效果最明显的改动，4 个文件就能让整站气质发生质变。

确认是否从第 1 轮开始？或者你想调整优先级 / 合并某几轮一起做？