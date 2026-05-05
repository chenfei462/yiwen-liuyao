# 《易问六爻》第 3 阶段计划：Beta 0.8

## 阶段目标

第 3 阶段对应计划书第 9-12 周，目标是在 MVP 0.2 的确定性排盘、用神、证据树基础上验证 AI 流式解释、追问、RAG 知识卡和双层安全策略。

AI 的职责限定为解释和改写语气，只能读取 `question + scenario + chart_json + evidence_tree + knowledge_cards + safety_status`。排盘事实、用神、旺衰、动变和证据树仍由确定性引擎生成。

## 已实现范围

- 新增 `AiReadingOutputSchema`，要求 AI 输出包含 `summary`、关键证据、反证、行动提示、安全提示、知识卡引用和模型元数据。
- 新增 AI Orchestrator，默认使用 fake provider；配置 `OPENAI_API_KEY` 后可走 OpenAI Responses API，模型由 `OPENAI_MODEL` 控制。
- 新增知识库最小版，内置 50 张已审核知识卡和 20 个练习样例，检索按 `rule_id`、证据规则、场景和关键词打分。
- 新增 `/api/readings/explain`，支持 SSE 事件 `safety`、`retrieval`、`delta`、`final`、`error`。
- 新增 `/api/readings/messages`，支持推荐追问和自由追问，并保存最小消息上下文。
- 新增 `/api/knowledge/cards`，只返回 `status = approved` 的知识卡。
- H5 结果页新增 AI 解读区、四种语气模式、知识卡引用、推荐追问、自由追问和反馈入口。

## 安全策略

- 模型调用前先走确定性风险分类；高风险问题直接返回安全提示，不进入模型。
- 模型输出后执行承诺词校验，拦截“必然、保证、包准、改命、消灾、一定复合、一定发财”等表达。
- AI 输出必须引用至少一个 `evidence_id` 和至少一个 `knowledge_card_id`。
- 医疗、法律、金融投资、自伤、未成年人、改运消灾付费、情感控制等问题不生成承诺式解读。

## 环境变量

- `OPENAI_API_KEY`：生产调用 OpenAI 时必填。
- `OPENAI_MODEL`：默认 `gpt-5.4-mini`。
- `OPENAI_EMBEDDING_MODEL`：默认规划为 `text-embedding-3-small`。
- `AI_PROVIDER=fake`：强制使用本地 fake provider。
- `AI_STREAM_TIMEOUT_MS`、`AI_MAX_INPUT_TOKENS`、`AI_MAX_DAILY_CALLS`：成本和延迟护栏的后续落点。

## 第 9-12 周执行口径

- 第 9 周：知识卡 schema、知识卡和练习种子、RAG 检索与 fake embedder 测试。
- 第 10 周：AI Orchestrator、OpenAI 适配器、结构化输出 Schema、`/api/readings/explain` 与流式结果 UI。
- 第 11 周：追问菜单、`/api/readings/messages`、消息持久化、安全前置拦截、输出合规校验和免责声明模板。
- 第 12 周：反馈入口、审计日志字段、成本/延迟/拒答率指标口径、移动端回归和 Beta 0.8 验收报告。

## 不进入本阶段

语音、分享图、课程、会员、后台管理、公开运营发布、AI 改写排盘事实、完整向量数据库依赖和真实线上成本仪表盘不进入第 3 阶段。
