# Beta 0.8 验收报告

## 验收范围

本报告覆盖第 3 阶段：AI 流式解读、追问、RAG 知识卡、安全分类、输出校验、反馈入口和移动端结果页展示。

## 功能验收

- `/api/readings/explain` 已支持结构化 final 与 SSE 流式事件。
- `/api/readings/messages` 已支持 5 类推荐追问和自由追问。
- `/api/knowledge/cards` 已支持按规则、术语、场景和 reading 上下文检索。
- H5 结果页已展示规则证据、AI 解读、知识卡引用、追问和反馈入口。
- 未配置 `OPENAI_API_KEY` 时默认走 fake provider，自动化测试不依赖真实模型。

## 数据验收

- 知识库种子包含 50 张 `approved` 知识卡。
- 练习种子包含 20 个例题。
- AI 输出必须含 `knowledge_card_refs` 与 `model_metadata`。
- 追问消息保存 `reading_id`、角色、内容、安全标签和追问类型。

## 安全验收

- 高风险初始化问题不进入排盘解读链路。
- 高风险追问不调用模型，返回安全提示。
- AI 输出 Schema 拒绝缺失 `evidence_id` 的关键证据。
- 输出合规校验拦截“必然、保证、包准、改命、消灾、一定复合、一定发财”等承诺词。

## 回归门槛

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 剩余风险

- 本地实现使用内存加 `.data` 文件兜底，PostgreSQL + pgvector 仍是数据库基线文档，未在本地强依赖真实数据库。
- OpenAI Responses API 适配层已实现，但未在无密钥环境执行真实模型调用。
- 成本、延迟、拒答率当前以审计字段和环境变量口径预留，尚未接入正式监控看板。
