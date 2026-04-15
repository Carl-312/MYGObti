# questionedit 目录说明

当前目录按“题库源码 / 计划说明 / 候选版本 / 评估输出 / 实验提示”拆分，方便继续做 `V2.1` 这类小步迭代。

## 当前状态

- 当前推荐冻结版：`candidates/questionnewV2_1C.md`
- 当前最重要结论：
  - 单纯上调 `priorityPair lambda` 只有轻微收益
  - `Q18` 的 latent 补丁比纯参数微调更有效，但增益仍有限
  - `Q18 + Q14` 的组合补丁是本轮最有效方案
  - 在当前 `C` 的基础上，继续对 `Q14` 中间档位做 `0.1` 级微调会明显变差，不建议继续沿这条线推进
- 结论汇总文档：
  - [V2_1-FINAL-SUMMARY.md](/home/carl/MYGObti/questionedit/reports/V2_1-FINAL-SUMMARY.md)
  - [V2_1-COMPARISON.md](/home/carl/MYGObti/questionedit/reports/V2_1-COMPARISON.md)
  - [V2_1C-Q14-MID-COMPARISON.md](/home/carl/MYGObti/questionedit/reports/V2_1C-Q14-MID-COMPARISON.md)

## 当前结构

- [questionnewV1.md](/home/carl/MYGObti/questionedit/questionnewV1.md)
  - V1 基线题库。
- [questionnewV2.md](/home/carl/MYGObti/questionedit/questionnewV2.md)
  - 当前 V2 工作稿，也是 `eval_question_v2.py` 默认评估对象。
- [eval_question_v2.py](/home/carl/MYGObti/questionedit/eval_question_v2.py)
  - 单版本评估脚本，默认读取 `questionnewV2.md`，输出到 `reports/`。
- [batch_compare_v2_candidates.py](/home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py)
  - 批量比较 `baseline / A / B / C` 的脚本。
- [batch_compare_v2_q14_mid_iterations.py](/home/carl/MYGObti/questionedit/batch_compare_v2_q14_mid_iterations.py)
  - 批量比较冻结版 `C` 与 `C1 / C2` 两次 `Q14` 中间档位微调的脚本。

## 子目录

- [plans](/home/carl/MYGObti/questionedit/plans)
  - 方案和改造计划。
  - 当前文件：[v2-modification-plan.md](/home/carl/MYGObti/questionedit/plans/v2-modification-plan.md)
- [notes](/home/carl/MYGObti/questionedit/notes)
  - 讨论稿、建议稿、零散记录。
  - 当前文件：[suggestion.md](/home/carl/MYGObti/questionedit/notes/suggestion.md)
- [reports](/home/carl/MYGObti/questionedit/reports)
  - 评估结果输出。
  - 当前文件：
    - [V2-EVAL-REPORT.md](/home/carl/MYGObti/questionedit/reports/V2-EVAL-REPORT.md)
    - [V2-EVAL-SUMMARY.json](/home/carl/MYGObti/questionedit/reports/V2-EVAL-SUMMARY.json)
    - [V2_1-FINAL-SUMMARY.md](/home/carl/MYGObti/questionedit/reports/V2_1-FINAL-SUMMARY.md)
    - [V2_1-COMPARISON.md](/home/carl/MYGObti/questionedit/reports/V2_1-COMPARISON.md)
    - [V2_1C-Q14-MID-COMPARISON.md](/home/carl/MYGObti/questionedit/reports/V2_1C-Q14-MID-COMPARISON.md)
- [prompts](/home/carl/MYGObti/questionedit/prompts)
  - 给代理/模型执行实验的提示词模板。
- [candidates](/home/carl/MYGObti/questionedit/candidates)
  - 用于存放 `questionnewV2_1A.md`、`questionnewV2_1B.md`、`questionnewV2_1C.md` 及后续小步试验稿。

## 建议命名

- 候选版本：
  - `candidates/questionnewV2_1A.md`
  - `candidates/questionnewV2_1B.md`
  - `candidates/questionnewV2_1C.md`
  - `candidates/questionnewV2_1C1.md`
  - `candidates/questionnewV2_1C2.md`
- 对比结果：
  - `reports/V2_1-COMPARISON.md`
  - `reports/V2_1-COMPARISON.json`
  - `reports/V2_1C-Q14-MID-COMPARISON.md`
  - `reports/V2_1C-Q14-MID-COMPARISON.json`

## 常用命令

单版本评估：

```bash
python3 /home/carl/MYGObti/questionedit/eval_question_v2.py \
  --source /home/carl/MYGObti/questionedit/questionnewV2.md
```

评估候选版本：

```bash
python3 /home/carl/MYGObti/questionedit/eval_question_v2.py \
  --source /home/carl/MYGObti/questionedit/candidates/questionnewV2_1A.md \
  --output-report /home/carl/MYGObti/questionedit/reports/V2_1A-EVAL-REPORT.md \
  --output-json /home/carl/MYGObti/questionedit/reports/V2_1A-EVAL-SUMMARY.json
```

批量比较 `baseline / A / B / C`：

```bash
python3 /home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py
```

批量比较冻结版 `C` 与 `Q14` 中间档位两次微调：

```bash
python3 /home/carl/MYGObti/questionedit/batch_compare_v2_q14_mid_iterations.py
```
