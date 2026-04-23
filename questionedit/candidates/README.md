# candidates 说明

这个目录专门存放小步快跑的候选稿，避免把根目录塞满。

## 当前状态

- 当前正确基线：`questionnewV2_1D.md`
- 历史 baseline 快照：`questionnewV2_1baseline.md`
- 当前主线已经扶正到根目录 `questionnewV2.md` 与这里的 `questionnewV2_1D.md`，后续工作默认从 `D` 出发。
- 如果只是继续整理当前主线，不要再顺手新增 `E` 或其他历史延长线编号。
- 当前不要把 `A / B / C / C1 / C2` 当作“推荐继续推进”的入口，它们只保留为历史样本。
- 已验证不建议继续推进：
  - `questionnewV2_1C1.md`
    - 只把 `Q14.B` 从 `-0.2` 调到 `-0.1`
    - 结果：`爽世/祥子` 与双角色轻噪声回收都明显下降
  - `questionnewV2_1C2.md`
    - 只把 `Q14.D` 从 `+0.4` 调到 `+0.5`
    - 结果：同样明显下降
- `questionnewV2_1D.md`
  - 继承 `C`，只把 `enabledWhenTop2DiffBelow` 从 `0.08` 放宽到 `0.10`
  - 当前主线已扶正到这个版本
- 因此，当前目录里 `C1 / C2` 保留为“已试过但不推荐”的反例样本，便于后续避免重复试错。

历史版本命名说明：

- `questionnewV2_1A.md`
  - 参数微调版，例如只改 `priorityPair lambda`
- `questionnewV2_1B.md`
  - 单题补丁版，例如重写 `Q18`
- `questionnewV2_1C.md`
  - 组合补丁版，例如 `Q18 + Q14`
- `questionnewV2_1D.md`
  - 收口版，例如在已验证题面补丁上只做安全参数放宽
- `questionnewV2_1C1.md`
  - 冻结版 `C` 的单点微调实验，例如只改 `Q14.B`
- `questionnewV2_1C2.md`
  - 冻结版 `C` 的单点微调实验，例如只改 `Q14.D`

如果后续还要继续新实验，请先确认确实需要新实验，再以 `D` 为起点另开新稿，不要复用这套 `A/B/C` 历史分支语义来描述当前主线。

每个候选稿都应在文件顶部或 `meta.note` 里注明：

- 修改目标
- 与基线相比改了哪些题 / 哪些参数
- 预期改善哪组高风险角色对
- 若是失败试验，建议注明“为什么失败”，方便后续少走回头路
