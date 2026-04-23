# V2.1D 上下文去污染 + 轻量优化瘦身提示词

你现在是一个“上下文去污染 + 轻量优化收口代理”。

工作目录固定为：

- `/home/carl/MYGObti`

你必须直接执行，不要只写建议，不要停在分析层。

## 任务目标

当前项目已经存在两类问题：

1. 历史文档、历史提示词、历史实现痕迹容易把代理带回旧轨道，造成上下文污染
2. 在当前主线已经能跑的前提下，代码里还有一些可做的小型优化、轻量瘦身和语义收口

你的任务不是重构整个项目，不是开新功能，不是重做题库，而是：

- 先切断旧上下文对当前工作的误导
- 再做一轮轻度规划
- 然后落地少量高收益、低风险的代码优化与瘦身

这轮优先“收口、减噪、降复杂度”，而不是追求大而全。

## 当前主线定义

你必须把以下事实视为已确定前提，不要回退：

- 当前前端运行时 canonical 数据源：`/home/carl/MYGObti/questionedit/questionnewV2.md`
- 当前正确基线：`/home/carl/MYGObti/questionedit/candidates/questionnewV2_1D.md`
- 当前主线版本：`V2.1D`
- 当前实际答题规模：`20` 题
- 主模型仍是 `3D`
- 保留 `latent tie-breaker`
- 不开 `4D`
- 当前关键参数：
  - `tieBreakerRule.enabledWhenTop2DiffBelow = 0.10`
  - `tieBreakerRule.lambda.priorityPair = 0.14`

## 你必须先读这些文件

### 运行时真实链路

- `/home/carl/MYGObti/src/entities/quiz/model/canonicalQuiz.ts`
- `/home/carl/MYGObti/src/entities/question/model/questions.ts`
- `/home/carl/MYGObti/src/entities/character/model/characters.ts`
- `/home/carl/MYGObti/src/features/quiz-engine/model/match.ts`
- `/home/carl/MYGObti/src/shared/types/quiz.ts`
- `/home/carl/MYGObti/src/app/App.tsx`
- `/home/carl/MYGObti/src/pages/home/HomePage.tsx`

### 当前题库真源

- `/home/carl/MYGObti/questionedit/questionnewV2.md`
- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1D.md`

### 当前入口文档

- `/home/carl/MYGObti/README.md`
- `/home/carl/MYGObti/docs/ARCHITECTURE.md`
- `/home/carl/MYGObti/questionedit/README.md`

### 仅用于识别污染来源的历史材料

- `/home/carl/MYGObti/start.md`
- `/home/carl/MYGObti/questioncollectionV1.md`
- `/home/carl/MYGObti/questionedit/prompts`

如果需要继续补读，只能读与“上下文污染”或“轻量优化落点”直接相关的文件。

## 你的执行顺序

### 阶段 1：上下文去污染

你必须先识别：

1. 哪些文件仍在暗示旧 15 题、旧 0.08、旧隐藏 flag、旧手写题库路径
2. 哪些文档虽然保留，但应该明确标成“历史草稿 / 不可直接引用”
3. 哪些代码注释、命名、展示文案仍会把人误导到旧模型

这一阶段你可以做：

- 改文档口径
- 改注释
- 改提示词跳转说明
- 改容易误导的命名或说明文案

这一阶段不要做：

- 大规模重构
- 新增复杂抽象
- 改题库内容本身

### 阶段 2：轻度规划

在完成去污染后，你需要做一个非常轻量的内部规划，只允许关注下面三类优化：

1. 重复代码过多
2. 明显冗余字段、冗余转换、冗余中间层
3. 命名、类型、模块边界已经能优化，但不需要大改架构

规划必须满足：

- 只挑 1 到 3 个小优化点
- 每个优化点都要是“低风险、高收益、可快速验证”
- 不要发散成“未来可以如何大改”

### 阶段 3：直接落地轻量优化

你至少要完成 1 到 3 个小优化，优先顺序如下：

1. 运行时链路里的冗余或重复
2. 结果页 / 匹配层里明显可以瘦身的代码
3. 文档与代码之间重复维护、容易再次漂移的地方

允许的轻量优化示例：

- 去掉无意义重复映射
- 抽小型纯函数，减少重复逻辑
- 收紧类型，减少“半旧半新”的状态
- 合并明显重复的展示文案逻辑
- 删除不再需要的旧实现残留
- 给关键模块加一句短注释，明确“谁是真源，谁只是消费层”

## 你重点要避免的事

1. 不要把当前主线重新拉回 `start.md` 的旧实现假设
2. 不要把任务升级成“大重构”
3. 不要因为优化而改题目语义、角色锚点或评分参数
4. 不要新增复杂生成系统，除非已有小改动无法解决明显漂移问题
5. 不要为了“瘦身”牺牲可读性
6. 不要顺手开新实验或改 `A/B/C/E`

## 你至少要完成的执行任务

### 任务 1：定位污染源

列出：

- 哪些文件仍容易造成上下文污染
- 每个污染点会误导什么
- 哪些是高优先级

### 任务 2：完成去污染

至少完成：

- 文档入口去污染
- 代码或提示词里容易误导当前主线的旧语义去污染

### 任务 3：完成轻量优化

至少完成：

- 1 个真实代码优化
- 1 个真实瘦身或收口动作

### 任务 4：验证

至少验证：

- 当前运行时仍然指向 `questionedit/questionnewV2.md`
- 构建或类型检查通过
- 没有把项目重新带回旧 15 题 / 旧隐藏 flag 轨道
- 当前文档入口能明确告诉后续代理什么是“当前事实”

## 输出要求

最终回复必须包含：

1. 你清掉了哪些上下文污染
2. 你做了哪些轻量优化 / 瘦身
3. 哪些行为保持不变
4. 哪些地方你刻意没动，为什么没动
5. 还有哪些残余风险以后可以再查

## 执行风格要求

- 优先收口，不要发散
- 优先降低误导，不要追求花哨
- 先去污染，再优化
- 轻量规划即可，不要把本轮任务做成 roadmap
- 如果某个优化会明显扩大改动面，宁可跳过，改做更小更稳的点
