# Next Long Task Prompt

推荐下一条长任务直接执行 Phase 2 Wave 2，也就是 02-02，而不是重新回到规划或重复做 02-01。

原因：

- Phase 1 已完成，主页到答题到结果闭环已经打通
- Phase 2 的 phase 目录、`02-CONTEXT.md`、`02-01-PLAN.md`、`02-02-PLAN.md` 已建立完成，且 `02-01-SUMMARY.md` 已存在
- 02-01 已完成，结果页结构和隐藏祥子展示策略已经稳定，当前顺序上的下一步就是 02-02
- 当前最需要的是把“可晒图传播”的 poster 导出和移动端分享态真正落到代码，而不是重复处理结果页基础结构

## 推荐路由

优先直接用 `$gsd-execute-phase 2 --wave 2` 执行；如果你还是想走自然语言路由，也可以用 `$gsd-do`，预期会命中 `/gsd-execute-phase`。

## 可直接复用的提示词

```text
$gsd-execute-phase 2 --wave 2
```

如果你更希望保留自然语言上下文，也可以直接复制这条：

```text
$gsd-do 执行 Phase 2「结果展示与分享海报」的 Wave 2，也就是 02-02。基于已经稳定的 `02-CONTEXT.md`、`02-01-SUMMARY.md` 和 `02-02-PLAN.md`，实现独立 poster 子树、前端 PNG 导出、移动端分享 CTA 以及不支持/失败/取消时的清晰降级状态，继续保持纯前端、移动端优先，并延续隐藏祥子只作为彩蛋信号的分轨表达。
```

## 执行时应继承的上下文

- 保持 React + TypeScript + Vite
- 继续使用纯前端，不引入后端、登录、数据库
- 延续当前单页状态机思路，不为分享能力新开路由
- 结果页继续兼容当前 `evaluateQuizResult(...)` 的 `ranking / tieBreak / hiddenMatch` 输出
- 优先复用已经落地的结果 hero / highlights / hidden signal 结构来生成海报
- 隐藏祥子要继续显式展示，但不能覆盖公开 top result
