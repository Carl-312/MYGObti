# V2.1D 主线切换后残余风险排查提示词

你现在是一个“主线收口后残余污染清理代理”。

工作目录固定为：

- `/home/carl/MYGObti/questionedit`

你必须直接执行，不要只写建议，不要停在分析层。

## 任务目标

当前主线已经切到 `V2.1D`。

你的任务不是继续做 A/B/C/E 实验，而是检查“切到 D 之后，项目里是否还残留会误导后续工作的旧 V2 语义、旧脚本语义、旧提示词、旧报告结论、旧默认路径假设”。

这轮可以采用简单粗暴的收口方式，优先避免污染，而不是追求优雅。

## 当前主线定义

你必须把以下事实视为已确定前提，不要回退：

- 主程序：`/home/carl/MYGObti/questionedit/questionnewV2.md`
- 当前正确基线：`/home/carl/MYGObti/questionedit/candidates/questionnewV2_1D.md`
- 主模型仍是 `3D`
- 保留 `latent tie-breaker`
- 不开 `4D`
- 当前关键参数：
  - `tieBreakerRule.enabledWhenTop2DiffBelow = 0.10`
  - `tieBreakerRule.lambda.priorityPair = 0.14`

## 你必须先读这些文件

- `/home/carl/MYGObti/questionedit/questionnewV2.md`
- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1D.md`
- `/home/carl/MYGObti/questionedit/candidates/questionnewV2_1baseline.md`
- `/home/carl/MYGObti/questionedit/eval_question_v2.py`
- `/home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py`
- `/home/carl/MYGObti/questionedit/README.md`
- `/home/carl/MYGObti/questionedit/candidates/README.md`
- `/home/carl/MYGObti/questionedit/prompts`
- `/home/carl/MYGObti/questionedit/reports`

如果需要继续补读，只能读与“残余污染”直接相关的文件。

## 你重点要查什么

### 1. 主线定义残留

检查是否还有地方把下面这些旧说法当成当前事实：

- `questionnewV2.md` 还是旧 baseline
- 当前冻结版还是 `C`
- baseline 仍默认指向根目录主文件，而不是历史快照
- 仍把 `0.08 / 0.12` 当成当前 tie-breaker 参数

### 2. 提示词污染

检查 `prompts/` 里是否还有会把代理重新带回旧轨道的内容，例如：

- 继续要求基于 `C` 迭代
- 继续把 `questionnewV2.md` 当作未扶正的旧 V2
- 继续围绕 `A/B/C` 做实验，而忽略 `D` 已扶正

### 3. 报告污染

检查 `reports/` 里是否还保留会误导后续工作的旧结论：

- “V2 暂不合格”
- “当前推荐冻结版是 C”
- “只比较 baseline / A / B / C”
- 任何与当前 D 主线冲突的结论

这轮允许你直接删掉旧报告正文，改成占位符。

### 4. 脚本语义残留

检查脚本是否还存在“能跑，但语义已经过期”的问题，例如：

- 输出标题仍写 `A/B/C`
- 把旧阈值当成展示文案
- 把历史 baseline 和当前主线混在一起

### 5. 文档入口污染

检查 README、目录说明、候选说明里，是否还把旧报告当权威结论入口。

## 允许的简单粗暴操作

为了避免旧语义继续污染项目，你可以直接做这些事：

1. 把旧 prompt 改成占位符或跳转说明
2. 把旧报告改成空占位符
3. 把 README 中对旧报告的“结论性口吻”改成“待重写 / 待复核”
4. 保留文件名不动，但清空正文
5. 在明显容易误导的地方直接加“不要引用旧结论”的提示

## 不允许做的事

1. 不要回退 `D`
2. 不要改题库行为本身，除非你发现脚本或文档在偷偷引用旧参数
3. 不要顺手开新一轮题目实验
4. 不要因为清理旧报告而把评估脚本弄坏
5. 不要恢复 `C` 为主线

## 你至少要完成的执行任务

### 任务 1：定位残余污染

列出：

- 还残留在哪些文件
- 每个残留会误导什么
- 哪些属于“高优先级污染”

### 任务 2：直接清理

至少完成：

- 新旧 prompt 对齐
- 报告目录去污染
- README 入口去污染

### 任务 3：验证

至少验证：

- `eval_question_v2.py` 默认 source 仍正确
- `batch_compare_v2_candidates.py` 仍能清楚区分历史 baseline 与当前主线
- `prompts/` 中不再有把人直接带回 `C` 主线的默认提示
- `reports/` 不再保留会被误当成当前事实的旧结论正文

## 输出要求

最终回复必须包含：

1. 你清理掉了哪些残余污染
2. 哪些文件被改成占位符
3. 哪些行为保持不变
4. 还有哪些真正残余风险没解决
5. 如果下一步还要继续做检查，应该先查什么

## 执行风格要求

- 优先收口，不要发散
- 优先避免误导，不要执着于保留旧报告正文
- 如果旧信息和当前主线冲突，宁可先清空，也不要继续挂在项目里
