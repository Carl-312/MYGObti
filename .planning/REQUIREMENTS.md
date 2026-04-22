# Requirements: MyGObti

**Defined:** 2026-04-15
**Core Value:** 用最短答题链路，把 MyGO 角色气质转成可玩、可分享、可二创传播的人格测试体验。

## v1 Requirements

### Core Quiz

- [ ] **CORE-01**: 用户无需登录即可从首页直接开始测试
- [ ] **CORE-02**: 用户可在移动端完成一套 15 题的单选答题流程，并看到进度
- [ ] **CORE-03**: 每个选项都以三轴向量增量方式参与计分
- [ ] **CORE-04**: 系统使用余弦相似度输出角色匹配排序
- [ ] **CORE-05**: 当前两名相似度差值小于 0.08 时，系统执行模糊边界加权判定

### Result Experience

- [ ] **RESULT-01**: 结果页展示角色名、称号、核心吐槽与三轴对比
- [ ] **RESULT-02**: 用户可以一键重新测试
- [x] **RESULT-03**: 结果页可以生成可分享的基础海报

### Content Model

- [ ] **CONTENT-01**: 8 个角色锚点以本地可维护的数据文件存储
- [ ] **CONTENT-02**: 题库以本地 typed 内容文件存储，便于后续替换成 MyGO 场景题
- [ ] **CONTENT-03**: 隐藏角色祥子通过独立 flag 逻辑触发，不与常规坐标匹配直接混用

### UX & Guardrails

- [x] **UX-01**: 首页与结果页明确展示“娱乐向、非心理诊断”的免责声明
- [x] **UX-02**: 整体体验以移动端 H5 为先，不依赖后端
- [ ] **UX-03**: 不采集手机号、邮箱、登录信息等个人数据

## v2 Requirements

### Frontend Experience Rebuild

- **FRONTEND-01**: 前端重构必须基于 `frontend-design/mygo-fronted` 模板做渐进迁移，不允许一次性重写后再整体替换
- **FRONTEND-02**: 做题体验必须呈现为类似 LINE 群聊的连续消息流，并复用 `DialogueRow` 相关动效语义
- **FRONTEND-03**: 结果页与头像系统必须支持 8 个角色的圆形头像与 Live2D 静态图插槽，资源通过本地 manifest 解析
- **FRONTEND-04**: 执行重构 phase 时必须保持 web/api 开发服务器常驻，并在浏览器完成每个计划的手动验收后才允许清理旧实现

### Fan Content Deepening

- **FAN-01**: 题目文案升级为粉丝能识别的剧情场景改写
- **FAN-02**: 结果页毒舌锐评、金句、羁绊信息替换为 MyGO 梗化文案
- **FAN-03**: 角色锚点通过 3-5 位深度粉丝的独立标注校准

### Architecture Evolution

- **ARCH-01**: 项目拆分为可独立启动与部署的前端 Web 和后端 API，但继续保持单仓协作
- **ARCH-02**: 浏览器端不再通过 Vite `?raw` 直接读取 `questionedit/questionnewV2.md`；canonical 内容解析与序列化由后端负责
- **ARCH-03**: 前端通过环境变量配置的 API 基址读取 quiz meta / content，开发态支持 Vite dev server proxy 联调
- **ARCH-04**: 题目、角色、匹配结果相关的类型与评分逻辑在前后端之间共享，避免再次出现双轨真相漂移
- **ARCH-05**: Phase `02.1` 的后端保持文件驱动与只读 API，不引入数据库、登录或后台管理台

## Out of Scope

| Feature | Reason |
|---------|--------|
| 用户账号系统 | 当前体验不需要，且会破坏“点开即测” |
| 后端题库管理台 | 对 MVP 过重，初期本地内容文件足够 |
| AI 聊天或对话式测试 | 与当前 15 题人格测试主线无关 |
| 社交登录或分享登录态 | 非当前目标 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| CONTENT-01 | Phase 1 | Complete |
| CONTENT-02 | Phase 1 | Complete |
| CONTENT-03 | Phase 1 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Complete |
| RESULT-01 | Phase 2 | Complete |
| RESULT-02 | Phase 2 | Complete |
| RESULT-03 | Phase 2 | Complete |
| ARCH-01 | Phase 02.1 | Complete |
| ARCH-02 | Phase 02.1 | Complete |
| ARCH-03 | Phase 02.1 | Complete |
| ARCH-04 | Phase 02.1 | Complete |
| ARCH-05 | Phase 02.1 | Complete |
| FRONTEND-01 | Phase 02.3 | Complete |
| FRONTEND-02 | Phase 02.3 | Pending |
| FRONTEND-03 | Phase 02.3 | Pending |
| FRONTEND-04 | Phase 02.3 | Complete |
| FAN-01 | Phase 3 | Pending |
| FAN-02 | Phase 3 | Pending |
| FAN-03 | Phase 3 | Pending |

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-22 after adding Phase 02.3 frontend rebuild requirements*
