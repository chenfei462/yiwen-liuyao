# 《易问六爻》第 2 阶段：MVP 0.2 规则解释与证据树

## 阶段目标

第 2 阶段对应计划书中的 `MVP 0.2，第 5-8 周`，目标是在 MVP 0.1 起卦、排盘和历史记录闭环上，验证确定性规则解释能力。阶段内只生成用神模板、旺衰背景、动变提示、旬空、世应和证据树，不接入 AI 长解读、流式输出、追问、课程、分享图、付费或后台管理。

## 已落地能力

- Rule Engine v0：从 `chart_json + question/scenario + date_context` 生成 `yongshen`、`evidence_tree`、`counter_evidence`、`verdict` 和 `action_tips`。
- 用神模板：覆盖事业、财务、感情、考试、失物、其他 6 个首批场景；感情场景默认按世应观察，不做强性别取用。
- 月建基线：`/api/readings/cast` 支持 `month_branch`；未传入时由 2024-2027 节气月建表推导，超出范围要求显式传入。
- 规则卡种子：覆盖 `B-YS`、`B-WR`、`B-DV`、`B-XK`、`B-SY`、`B-HC` 六类 B 级规则，每条证据可追溯 `rule_id` 和来源。
- H5 结果页：展示月建、用神高亮、关键依据、反证、规则来源和安全提示。

## 阶段边界

- AI 不参与排盘事实、规则证据或结论生成。
- 高风险问题只返回安全边界，不生成承诺式断语或规则解释。
- 当前服务端本地开发仍保留 `.data/readings.json` 兜底；PostgreSQL/JSONB schema 已按第 2 阶段固化，供部署环境迁移使用。

## 验收门槛

- 合规允许的问题完成排盘后，`POST /api/readings/analyze` 返回至少 3 条关键证据和可追溯 `rule_id`。
- 事业、财务、感情、考试、失物、其他的用神模板都有单元测试。
- 旺衰、日月冲合、旬空、动变、世应和安全拦截均有自动化测试。
- `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 必须通过。
