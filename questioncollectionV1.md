# Question Collection V1

> 注：这是早期 15 题收集草稿，当前前端运行时题库已切到 `questionedit/questionnewV2.md` 的 `V2.1D` 主线。这里保留作历史写题参考，不应直接当成现行题库。

## 目标

为早期 Phase 1 的本地题库准备数据草稿，先追求风格统一与可识别度，再逐步补满当时设想的 15 题。

## 写题原则

- 要保留足够的剧情细节，让 MyGO 粉丝能认出“这是哪个场景”
- 不直接照抄台词，要改写成“朋友在 LINE 群聊里问你会怎么做”的语气
- 每题只表达一个核心冲突，不把多个情绪揉在一起
- 每题 4 个选项，分别拉开三轴上的差异
- 文案允许毒舌，但不能落到现实身份攻击

## 题目模板

```md
### QXX
- 场景提示：
- 题干：
- 选项 A：
  - 倾向：
  - delta：
- 选项 B：
  - 倾向：
  - delta：
- 选项 C：
  - 倾向：
  - delta：
- 选项 D：
  - 倾向：
  - delta：
```

## 当前状态

- 这是历史状态记录，不再反映当前运行时实现
- 当前真实题库位于 `questionedit/questionnewV2.md`
- 当前前端运行时已不再直接手写维护 `src/entities/question/model/questions.ts` 的旧示例题库
- 如果只是要继续当前主线，请停止沿本文补题，改读 `questionedit/questionnewV2.md`
