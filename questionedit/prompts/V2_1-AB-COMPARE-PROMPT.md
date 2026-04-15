# V2.1 A/B/C 自动化优化验证提示词

下面这段提示词用于让代理在 `/home/carl/MYGObti/questionedit` 内自动生成 `A/B/C` 三个候选版本，并调用现有评估脚本批量跑对比表。目标是优先解决 `长崎爽世 vs 丰川祥子`。

---

你现在是一个“题库小步迭代优化代理”。

工作目录固定为：

- `/home/carl/MYGObti/questionedit`

你必须直接执行，不要只写计划，不要停在建议层。

## 目标

基于当前基线文件：

- `/home/carl/MYGObti/questionedit/questionnewV2.md`

做出 `A/B/C` 三个候选版本，并用现有评估脚本批量跑对比，输出一个可直接决策的比较表。

本轮只优先解决最重大的问题：

- `长崎爽世 vs 丰川祥子`

不要同时大修所有角色，不要推翻 `3D + latent tie-breaker` 架构，不要上 4D 主模型。

## 你必须先读取这些文件

- `/home/carl/MYGObti/questionedit/questionnewV2.md`
- `/home/carl/MYGObti/questionedit/questionnewV1.md`
- `/home/carl/MYGObti/questionedit/plans/v2-modification-plan.md`
- `/home/carl/MYGObti/questionedit/reports/V2-EVAL-REPORT.md`
- `/home/carl/MYGObti/questionedit/eval_question_v2.py`
- `/home/carl/MYGObti/questionedit/README.md`

## 候选版本要求

请在：

- `/home/carl/MYGObti/questionedit/candidates`

生成以下三个版本：

1. `questionnewV2_1A.md`
   - 只做参数级微调
   - 优先改 `tieBreakerRule.lambda.priorityPair`
   - 不改题面
   - 推荐目标：从 `0.12` 调到 `0.14`

2. `questionnewV2_1B.md`
   - 在 A 的基础上，只改 1 道 latent 题
   - 优先重写 `Q18`
   - 目标：更清晰地区分“接管局面”和“兜底承担”
   - 保持 `delta=[0,0,0]`，只改 `latentDelta` 与题面

3. `questionnewV2_1C.md`
   - 在 B 的基础上，再改 1 道主轴题
   - 优先改 `Q14`
   - 目标：补主轴层面上 `爽世 vs 祥子` 的靠近姿态差异
   - 不要顺手多改别的题

## 修改约束

1. 每个版本都必须在文件中清楚标注：
   - 相对基线改了什么
   - 修改目的是什么

2. 每个版本只允许做该版本规定的最小修改：
   - A = 参数
   - B = 参数 + 1 道 latent 题
   - C = 参数 + 1 道 latent 题 + 1 道主轴题

3. 题面必须保持 MyGO 风格，但不要写成角色脸谱 flag。

4. latent 题必须继续满足：
   - 不污染 3D 主轴
   - `delta` 全为 `[0,0,0]`
   - 只通过 `latentDelta` 计分

5. 不要修改评估脚本的核心指标定义，除非是为了支持批量比较输出。

## 自动化执行任务

### 任务 1：生成候选版本

创建：

- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1A.md`
- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1B.md`
- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1C.md`

### 任务 2：批量评估

复用：

- `/home/carl/MYGObti/questionedit/eval_question_v2.py`

至少完成以下方式之一：

- 方式 A：直接多次调用现有脚本，并把结果汇总
- 方式 B：补一个轻量批处理脚本，例如：
  - `/home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py`

但无论你选哪种方式，都必须最终产出统一对比结果。

### 任务 3：生成对比结果

输出：

- `/home/carl/MYGObti/questionedit/reports/V2_1-COMPARISON.md`
- `/home/carl/MYGObti/questionedit/reports/V2_1-COMPARISON.json`

## 对比报告必须包含的核心指标

对以下版本同时比较：

- `baseline = questionnewV2.md`
- `A = questionnewV2_1A.md`
- `B = questionnewV2_1B.md`
- `C = questionnewV2_1C.md`

必须比较这些指标：

1. `长崎爽世 vs 丰川祥子`
   - pair-only accuracy
   - full-model accuracy
   - tie-breaker trigger rate
   - 若可得，base -> final 的提升幅度

2. `长崎爽世`
   - 轻噪声回收率

3. `丰川祥子`
   - 轻噪声回收率

4. 全局分布
   - 8 角色最终占比
   - 是否出现 `<5%` 的近消失角色
   - 是否出现 `>20%` 的吸星角色

5. tie-breaker 健康度
   - overall trigger rate
   - flip rate within triggered

6. 其他高风险角色对不能明显恶化：
   - `若叶睦 vs 高松灯`
   - `三角初华 vs 椎名立希`
   - `千早爱音 vs 高松灯`

## 决策规则

优先级按下面顺序判断：

1. 首先看 `爽世 vs 祥子` 是否改善
2. 再看 `爽世/祥子` 轻噪声回收率是否改善
3. 再看是否引入新的全局分布灾难
4. 再看其他高风险角色对是否被明显打坏

## 通过线

若某个候选版本满足以下条件，则优先推荐：

- `爽世 vs 祥子` pair-only accuracy 明显高于 baseline
- `爽世` 与 `祥子` 的轻噪声回收率都提升
- tie-breaker trigger rate 仍在合理范围，参考 `8%~12%`
- 没有角色占比低于 `5%`
- 没有角色占比高于 `20%`

如果没有任何版本完全达标，也必须选出“最值得继续迭代”的那个版本，并说明原因。

## 输出格式要求

你的最终回复必须包含：

1. 你创建了哪些文件
2. 每个版本具体改了什么
3. 一张紧凑的版本对比表
4. 你推荐继续推进哪一个版本
5. 若仍不达标，给出下一轮最小补丁建议

不要只贴代码，不要只贴脚本输出，要给出基于数据的判断。

---

## 推荐执行提醒

- 优先用脚本和本地文件，不要凭直觉改题。
- 如果批量对比脚本还不存在，可以补一个最小可用版本，但不要把任务扩展成大重构。
- 如果发现 `questionnewV2.md` 的结构需要鲁棒解析，沿用现有评估脚本的处理方式。
