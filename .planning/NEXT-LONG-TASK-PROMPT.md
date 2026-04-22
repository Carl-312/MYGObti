# Next Long Task Prompt

推荐下一条长任务直接执行 Phase `02.3` 的第二个计划 `02.3-02`。`02.3-01` 已经把新模板壳层、legacy migration boundary 和常驻 QA chrome 接进了 `apps/web`，下一步该把聊天消息原子和角色资源 contract 抽出来，为真正的聊天式答题迁移做底座。

原因：

- `apps/web` 现在已经不再裸跑旧页面，而是先经过新的 template shell，再挂载 legacy intro / quiz / result 边界
- 浏览器里已经能明确看到“新壳层已接入、旧主链路仍保留”的迁移边界，后续不必继续在单个 `HomePage` 巨型文件里堆条件分支
- `FRONTEND-04` 的执行节奏已经锁进页面 chrome 与本阶段文档：`npm run dev:api`、`npm run dev:web` 要常驻，逐 plan 浏览器验收
- 下一步最该补的是 `DialogueRow` / `DialogueList` 风格的聊天消息底座、角色头像 / Live2D manifest contract，而不是提前删 legacy 流程

## 推荐路由

优先继续用 `$gsd-do` 进入执行语义，明确对准 `02.3-02`。

## 可直接复用的提示词

标准执行版：

```text
$gsd-do 执行 Phase 02.3「模板驱动的前端重构与渐进迁移」的第二个计划 02.3-02。基于已经接入的 template shell 和 legacy migration boundary，把聊天消息原子、角色头像/Live2D manifest 解析 contract 和后续答题/结果页共用的展示底座补到 `apps/web`，但不要提前删除当前 legacy quiz flow。继续保持 `npm run dev:api` 与 `npm run dev:web` 常驻，并在浏览器对新的消息原子和资源槽位做手动验收。
```

如果希望把边界说得更硬一些，可以用增强版：

```text
$gsd-do 执行 Phase 02.3「模板驱动的前端重构与渐进迁移」的第二个计划 02.3-02。请在不改变 `apps/api` 内容接口、`packages/quiz-core` 匹配 contract 和当前结果语义的前提下，把 `frontend-design/mygo-fronted` 里的聊天消息原子与角色素材约定迁入 `apps/web`。要求：1）建立可复用的 `DialogueRow` / `DialogueList` 风格消息组件与动效语义；2）把 `apps/web/public/round-icons/manifest.json` 与 `apps/web/public/live2d/manifest.json` 接成统一资源 contract；3）保持当前 legacy intro / answering / result boundary 可回退，并继续遵守“常驻 dev server + 浏览器逐 plan 验收”。
```

## 执行时应继承的上下文

- `apps/web` 已有新的 template shell、顶部/底部 QA chrome 和 migration boundary 提示
- 旧 `HomePage` 已拆成 intro / answering / completed 三个阶段视图组件，后续计划应按边界逐段替换
- `frontend-design/mygo-fronted` 仍是模板参考，不是运行时入口
- `packages/quiz-core` 继续是 quiz contract 与匹配算法真源，不能在 `apps/web` 复制逻辑
- 当前 `apps/api` 内容服务与 Vite proxy 联调链路保持不变
- `apps/web/public/live2d/manifest.json` 与 `apps/web/public/round-icons/manifest.json` 已经是下一步资源 contract 的真源
- 继续保持 `npm run dev:api` 和 `npm run dev:web` 常驻，不要退回“改完再临时启动”的节奏

## 提示词设计意图

- `02.3-01` 已经完成基础壳层和迁移边界，下一步该把真正可复用的聊天与素材底座做出来
- 要反复强调“保留 legacy flow 可回退”，避免在 `02.3-02` 就把旧链路删早
- 要把 manifest contract 提前抽出来，给 `02.3-03/04` 的聊天答题页和结果页复用
- 浏览器验收仍是硬门槛，不能只靠 typecheck/build 判断迁移成功
