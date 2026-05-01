站在 `Game Narrative Designer` 的视角来看，当前页面的 `Copywriting` 存在严重的 `System-driven` 痕迹。文本过于强调“测试机制”本身（如“轴”、“答案”、“生成”），破坏了玩家查看结果时的 `Immersion`。

这类性格测试应用的核心是 `Emotional Design`，文本应该像是在给玩家递交一份“灵魂鉴定书”，而不是系统吐出的“运行日志”。

以下是直接可供 `Agent` 使用的 `Prompt` 格式修改指令，聚焦于消除生硬感：

---

### UI Text Refactoring Directives for Agent

**Role**: You are an expert `UX Writer` optimizing a React-based personality test web app.
**Task**: Update the text nodes in the specified components to enhance narrative immersion and remove robotic, system-level explanations.

#### 1. `Hero Section` (头部结果区)
* **Target Text**: `"结果已生成 公开榜首 99%"`
* **Refactor To**: `"同步测算完毕 | 契合度 99%"` 或 `"灵魂共振等级：99%"`
* **Rationale**: “公开榜首”在单人测试语境下逻辑不自洽，玩家会困惑“榜单在哪”。应转换为 `Match Rate` 或 `Synchronization` 概念。

#### 2. `Explanation Component` (结果解释区)
* **Target Text 1**: `"这次为什么会测成 若叶睦"`
* **Refactor To**: `"你的性格切片：若叶睦"`
* **Target Text 2**: `"这是根据你这轮答案得到的最接近角色。下面会展开你们相似的地方。"`
* **Refactor To**: `"基于潜意识的抉择，你们的底层逻辑在以下方面达成了共识："`
* **Rationale**: 原文过于像 `Machine Translation`，暴露了背后的判断逻辑（“根据答案”、“最接近角色”），打破了第四面墙。需要用更具洞察力的 `Flavor Text` 包装。

#### 3. `Dimension Chart Section` (三轴维度区)
* **Target Text 1**: `"三轴解释"`
* **Refactor To**: `"性格维度拆解"`
* **Target Text 2**: `"你和 若叶睦 在哪几条轴上最接近"`
* **Refactor To**: `"你与角色的思维同频点"`
* **Rationale**: “轴” (`Axis`) 是纯粹的 `Data Visualization` 术语，过于理性和干瘪。在性格测试中应替换为 `Dimension` 或 `Traits` 等更具人文色彩的词汇。

#### 4. `Call-to-Action (CTA) Module` (分享与操作区)
* **Target Text 1**: `"把这次人格测试结果保存下来或直接发出去"`
* **Refactor To**: `"生成你的专属性格档案"` 或 `"揭露你的真实成分"`
* **Target Text 2**: `"海报会带上你的角色结果和三轴摘要。"`
* **Refactor To**: *[直接删除该节点]*
* **Target Text 3 (海报底部)**: `"这是一张值得直接保存和转发的人格测试结果海报"`
* **Refactor To**: `"MyGOBTI 绝密档案归档"` 或 *[直接删除]*
* **Rationale**: 严重的 `Over-explaining`。现代移动端用户不需要系统来教育他们 `Share Button` 和 `Export` 功能会产出什么。海报底部的自夸式文本极大地拉低了页面的高级感。

#### 5. `Candidate List Component` (候选榜单区)
* **Target Text**: `"候选榜单"` / `"除了第一名，你还和谁最接近"`
* **Refactor To**: `"其他潜在人格"` / `"与你产生共鸣的其他角色"`
* **Rationale**: “第一名”这种表述属于竞技类 `UI`，不符合性格测试的属性。

#### 6. `Reset State Component` (重置测试区)
* **Target Text**: `"想换一套答案，再测一次？重新测试会清空这轮答案，然后从第 1 题重新开始。"`
* **Refactor To**: `"重置时间线？ / 重新开始推演将清空当前记忆。"`
* **Rationale**: 原文像是在阅读使用说明书。利用一点微小的叙事包装能让重新测试的 `User Flow` 更有趣。

---

如果把这套 `Copywriting` 的调性继续往 MyGO 的原生语境里推（比如把“重置测试”改成“迷失东京，重新组建乐队”），你认为会增加受众的代入感，还是会因为“梗浓度过高”而劝退圈外的路人玩家？