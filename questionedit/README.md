# questionedit 目录说明

当前目录按“题库源码 / 计划说明 / 候选版本 / 评估输出 / 实验提示”拆分，方便继续做 `V2.1` 这类小步迭代。

## 当前状态

- 当前正确基线：`candidates/questionnewV2_1D.md`
- 当前主程序：`questionnewV2.md` 已同步到 `V2.1D`
- 历史 baseline 快照：`candidates/questionnewV2_1baseline.md`
- 当前继续执行入口：
  - 题库正文改动看 `questionnewV2.md`
  - 基线快照核对看 `candidates/questionnewV2_1D.md`
  - 提示词路由先看 `prompts/README.md`
- `plans/v2-modification-plan.md` 现在只保留为历史设计草稿，不要把里面旧 `0.08 / 0.12` 讨论当成当前生效配置
- `reports/` 当前已切换为占位符状态，旧结论正文暂不应作为事实来源引用
- 当前有效事实只保留：
  - 主模型仍是 `3D`
  - 保留 `latent tie-breaker`
  - 不开 `4D`
  - 当前关键参数是 `enabledWhenTop2DiffBelow = 0.10` 与 `priorityPair lambda = 0.14`
- 当前不要把任何 `reports/` 文件当作权威结论入口；它们现在是“待重写 / 待复核”的占位物。

## 当前结构

- [questionnewV1.md](/home/carl/MYGObti/questionedit/questionnewV1.md)
  - V1 基线题库。
- [questionnewV2.md](/home/carl/MYGObti/questionedit/questionnewV2.md)
  - 当前 V2 工作稿，也是 `eval_question_v2.py` 默认评估对象。
- [eval_question_v2.py](/home/carl/MYGObti/questionedit/eval_question_v2.py)
  - 单版本评估脚本，默认读取 `questionnewV2.md`，输出到 `reports/`。
- [batch_compare_v2_candidates.py](/home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py)
  - 批量比较历史 `baseline / A / B / C / D` 的脚本，仅用于回看演化过程，不直接代表当前主线结论。
- [batch_compare_v2_q14_mid_iterations.py](/home/carl/MYGObti/questionedit/batch_compare_v2_q14_mid_iterations.py)
  - 批量比较 `C / C1 / C2` 的历史微调脚本，仅用于复盘 `C` 阶段试验，不应再作为当前路线入口。

## 子目录

- [plans](/home/carl/MYGObti/questionedit/plans)
  - 方案和改造计划。
  - 当前文件：[v2-modification-plan.md](/home/carl/MYGObti/questionedit/plans/v2-modification-plan.md)
  - 注意：该文件当前主要用于复盘历史设计推演，不是现行参数入口。
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
  - 注意：以上文件当前都是占位符，保留文件名只是为了后续重写，不代表这些结论仍然有效。
- [prompts](/home/carl/MYGObti/questionedit/prompts)
  - 给代理/模型执行实验的提示词模板。
  - 当前入口先看：[README.md](/home/carl/MYGObti/questionedit/prompts/README.md)
- [candidates](/home/carl/MYGObti/questionedit/candidates)
  - 用于存放历史 baseline、`questionnewV2_1A.md` ~ `questionnewV2_1D.md` 等历史候选稿。
  - 当前继续工作时，默认应从 `questionnewV2_1D.md` 或根目录 `questionnewV2.md` 出发，不要把 `A/B/C` 当成当前入口。

## 建议命名

- 候选版本：
  - `candidates/questionnewV2_1baseline.md`
  - `candidates/questionnewV2_1A.md`
  - `candidates/questionnewV2_1B.md`
  - `candidates/questionnewV2_1C.md`
  - `candidates/questionnewV2_1D.md`
  - `candidates/questionnewV2_1C1.md`
- `candidates/questionnewV2_1C2.md`
- 如无明确新实验决策，不要继续顺手追加 `E` 或其他延长线编号。
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

批量比较历史 `baseline / A / B / C / D`：

```bash
python3 /home/carl/MYGObti/questionedit/batch_compare_v2_candidates.py
```

注意：这是历史对比工具，输出用于复盘，不应直接当成当前主线结论。

批量比较冻结版 `C` 与 `Q14` 中间档位两次微调：

```bash
python3 /home/carl/MYGObti/questionedit/batch_compare_v2_q14_mid_iterations.py
```

注意：这是 `C` 阶段历史实验复盘脚本，不要据此把后续工作重新拉回 `C` 主线。
