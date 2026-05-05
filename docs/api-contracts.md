# V1.0 API 契约

## POST `/api/readings/init`

请求：

```json
{
  "question": "这次面试有没有机会",
  "scenario": "事业",
  "timezone": "Asia/Shanghai"
}
```

响应：

```json
{
  "reading_id": "reading_uuid",
  "safety_status": {
    "status": "allowed",
    "risk_label": "general",
    "notice": "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。"
  },
  "rewrite_suggestions": ["问题越具体越便于学习排盘，例如补充对象、时间范围和你想观察的重点。"]
}
```

## POST `/api/readings/cast`

请求：

```json
{
  "reading_id": "reading_uuid",
  "cast_method": "manual",
  "line_values": [6, 7, 8, 9, 7, 8],
  "cast_time": "2026-04-30",
  "day_ganzhi": "甲戌",
  "month_branch": "辰"
}
```

说明：

- `line_values` 固定 6 条，从初爻到上爻。
- `day_ganzhi` 可选；显式传入时优先，否则由 `cast_time` 推导。
- `month_branch` 可选；显式传入时优先，否则由 2024-2027 节气月建表推导。
- `cast_time` 超出 2024-2027 且未传 `month_branch` 时返回 400。

响应核心字段：

- `cast_time`：起卦日期。
- `day_ganzhi`：日干支。
- `month_branch`：月建地支。
- `month_source`：`explicit | jieqi_table`。
- `base_chart`、`changed_chart`：卦名、上下卦、卦宫、世应、旬空等排盘事实。
- `lines`：从初爻到上爻的爻值、阴阳、动静、纳甲、六亲、六神、变爻地支。

## POST `/api/readings/analyze`

请求：

```json
{
  "reading_id": "reading_uuid",
  "mode": "learning",
  "force_refresh": false
}
```

响应：

```json
{
  "reading_id": "reading_uuid",
  "mode": "learning",
  "rule_version": "mvp-0.2-rule-engine-v0",
  "safety_status": {
    "status": "allowed",
    "risk_label": "general",
    "notice": "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。"
  },
  "question_type": "事业",
  "yongshen": {
    "line_no": 4,
    "liuqin": "官鬼",
    "branch": "午",
    "role": "主用神",
    "reason_rule_id": "B-YS-001",
    "confidence": "高",
    "alternatives": [
      { "line_no": 3, "liuqin": "父母", "branch": "辰", "role": "辅助观察" }
    ]
  },
  "evidence_tree": [
    {
      "id": "reading_uuid:B-YS-001:01",
      "rule_id": "B-YS-001",
      "level": "B",
      "title": "用神模板匹配",
      "line_refs": [4],
      "premise": "事业场景匹配官鬼或世应主线。",
      "conclusion": "以4爻官鬼午作为主用神。",
      "polarity": "+",
      "weight": 0.24,
      "confidence": "高",
      "source_refs": ["计划书 4.4 证据树模型", "计划书 5.4 取用神模板"]
    }
  ],
  "counter_evidence": [],
  "verdict": {
    "tendency": "mixed",
    "confidence": "中",
    "summary": "规则证据支持与反证并存，适合作为反思线索而非现实结论。"
  },
  "action_tips": ["把卦盘结果当作复盘问题结构的工具，不替代现实沟通、专业意见或个人判断。"],
  "safety_notice": "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。"
}
```

安全边界：

- 若 `safety_status.status = blocked`，`yongshen = null`，`evidence_tree = []`，`counter_evidence = []`。
- 若 reading 尚未排盘，返回 `404 chart_not_found`。

## POST `/api/readings/explain`

请求：

```json
{
  "reading_id": "reading_uuid",
  "mode": "learning",
  "stream": true,
  "force_refresh": false
}
```

说明：

- `mode = professional | light | learning | story`。
- AI 只解释 `question + scenario + chart_json + evidence_tree + retrieved_knowledge_cards + safety_status`，不得生成或改写卦盘事实。
- 测试环境和未配置 `OPENAI_API_KEY` 时走 fake provider；生产配置 `OPENAI_API_KEY` 后走 Responses API。
- 高风险问题不调用模型，直接返回安全事件与拒答型 final。

SSE 事件：

- `safety`：确定性安全分类。
- `retrieval`：本次引用的审核知识卡。
- `delta`：分段输出 `summary | key_evidence | counter_evidence | action_tips | safety_notice`。
- `final`：完整结构化输出。
- `error`：流式错误。

`stream = false` 时直接返回 final JSON：

```json
{
  "summary": "本次解读只基于已生成的证据树与知识卡，适合作为学习观察。",
  "key_evidence": [
    { "evidence_id": "reading_uuid:B-YS-001:01", "plain_explanation": "关键证据 B-YS-001 显示：以4爻官鬼午作为主用神。" }
  ],
  "counter_evidence": ["当前证据树未给出强反证，仍需保留现实不确定性。"],
  "action_tips": ["把卦盘结果当作复盘问题结构的工具，不替代现实沟通、专业意见或个人判断。"],
  "safety_notice": "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。",
  "knowledge_card_refs": ["kc-B-YS-001-01"],
  "model_metadata": {
    "provider": "fake",
    "model": "fake-beta-0.8",
    "generated_at": "2026-05-01T00:00:00.000Z"
  }
}
```

## POST `/api/readings/messages`

请求：

```json
{
  "reading_id": "reading_uuid",
  "message": "为什么取这个用神？",
  "followup_type": "why_yongshen"
}
```

说明：

- `followup_type = why_yongshen | key_rule | counter_evidence | timing | learning_mode | free_text`。
- 每次追问必须绑定当前 `reading_id`，并复用同一证据树与可引用知识卡。
- 医疗、法律、金融、自伤、未成年人、改运消灾、情感控制等高风险追问不调用模型。
- 响应格式为 SSE，与 `/api/readings/explain` 相同。

## GET `/api/knowledge/cards`

查询参数：

- `reading_id`：按当前卦例证据树检索。
- `rule_id`：按规则卡检索。
- `term`：按术语/标题/正文检索。
- `scenario`：按场景检索。
- `limit`：默认最多 8 条。

响应：

```json
{
  "cards": [
    {
      "id": "kc-B-YS-001-01",
      "title": "事业场景取官鬼",
      "term": "用神",
      "rule_id": "B-YS-001",
      "scenario": "事业",
      "content": "事业类问题以官鬼为主线，父母作为流程、文书和制度辅助观察。",
      "source_refs": ["计划书 5.4 取用神模板"],
      "status": "approved"
    }
  ]
}
```

## GET `/api/learning/terms`

支持 `term, rule_id, scenario, limit` 查询，只返回 `status = approved` 的术语卡。

响应：

```json
{
  "terms": [
    {
      "id": "term-001-kc-B-YS-001-01",
      "term": "用神",
      "rule_id": "B-YS-001",
      "definition": "传统六爻中，求职位、录取、岗位压力时常以官鬼为主线...",
      "source_refs": ["计划书 5.4 取用神模板"],
      "status": "approved"
    }
  ]
}
```

## GET `/api/learning/cards/[id]`

返回单张 approved 知识卡详情，包含白话解释、例子、反例和安全提示；未审核或被拒绝内容返回 404。

## GET `/api/learning/exercises`

支持 `term, rule_id, difficulty, limit` 查询。

`difficulty = beginner | intermediate | advanced`。

## POST `/api/learning/progress`

请求：

```json
{
  "subject_id": "kc-B-YS-001-01",
  "subject_type": "knowledge_card",
  "completed": true,
  "score": 90,
  "badge": "用神入门"
}
```

## POST `/api/readings/share`

生成脱敏公开分享对象。高风险 reading 返回 `422 share_blocked`。

响应：

```json
{
  "share_id": "share_uuid",
  "share_url": "/share/share_uuid",
  "card_payload": {
    "base_chart": "乾为天",
    "changed_chart": "乾为天",
    "question_preview": "问题已脱敏",
    "key_points": ["以4爻官鬼午作为主用神。"],
    "safety_notice": "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。"
  }
}
```

## GET `/api/share/[share_id]`

读取公开匿名分享内容，只返回 `share_id, share_url, visibility, card_payload, created_at`，不返回原始问题、用户标识或追问记录。

## POST `/api/readings/favorite`

请求：

```json
{
  "reading_id": "reading_uuid",
  "favorite": true
}
```

## POST `/api/readings/tags`

请求：

```json
{
  "reading_id": "reading_uuid",
  "tags": ["面试", "复盘"]
}
```

## POST `/api/readings/feedback`

请求：

```json
{
  "reading_id": "reading_uuid",
  "feedback_type": "helpful",
  "comment": "证据解释清楚"
}
```

## GET `/api/me/progress`

返回匿名用户的会员权益、收藏、标签和学习进度摘要。

## Admin API

- `GET /api/admin/audit-logs`
- `GET /api/admin/feedback`
- `PATCH /api/admin/knowledge/cards/[id]`
- `GET /api/admin/metrics`

后台接口用于公开测试期数据核查；正式发布前需要接入真实账号权限。

## GET `/api/readings/history`

响应：

```json
{
  "history": [
    {
      "reading_id": "reading_uuid",
      "question_preview": "这次面试有没有机会...",
      "scenario": "事业",
      "cast_method": "manual",
      "base_chart": "乾为天",
      "changed_chart": "乾为天",
      "cast_time": "2026-04-30",
      "day_ganzhi": "甲戌",
      "month_branch": "辰",
      "month_source": "jieqi_table",
      "created_at": "2026-04-30T00:00:00.000Z"
    }
  ]
}
```

## DELETE `/api/readings/history/[reading_id]`

响应：

```json
{
  "deleted": true
}
```

## 固定枚举

- `LineValue = 6 | 7 | 8 | 9`
- `cast_method = coin | manual`
- `scenario = 事业 | 财务 | 感情 | 考试 | 失物 | 其他`
- `mode = professional | light | learning | story`
- `followup_type = why_yongshen | key_rule | counter_evidence | timing | learning_mode | free_text`
- `ContentStatus = draft | approved | rejected`
- `ShareVisibility = public_anonymous | private`
- `MembershipTier = free | member`
- `FeedbackType = unclear | inaccurate | unsafe | helpful`
- `ExerciseDifficulty = beginner | intermediate | advanced`
- `month_branch = 子 | 丑 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥`
## V1.5 Content API

- `GET /api/cases`：查询 approved 案例，支持 `scenario, hexagram, rule_id, yongshen, difficulty, source_type, status, limit`。
- `GET /api/cases/[id]`：读取单个 approved 脱敏案例。
- `POST /api/admin/cases`：创建或更新案例，字段包含 `title, scenario, source_type, difficulty, status, question_preview, base_chart, changed_chart, yongshen, evidence_ids, rule_ids, learning_summary, counter_evidence, source_refs, license_note`。
- `PATCH /api/admin/cases/[id]`：审核或修改案例状态。
- `GET /api/courses`：读取 published 课程。
- `GET /api/courses/[id]`：读取课程课时、关联知识卡、练习和案例。
- `POST /api/courses/progress`：记录 `course_id, lesson_id, completed, score, wrong_question_ids`。
- `GET /api/me/course-progress`：读取匿名课程进度和错题摘要。
- `POST /api/creator/exports`：生成 `article | short_video_script | long_image | chart_snapshot` 素材；高风险 reading 返回 `422 creator_export_blocked`。
- `POST /api/creator/scripts`：短视频脚本便捷接口。
- `GET /api/creator/exports/[id]`：读取已生成素材。
- `GET /api/experiments/assignments`：按 `anonymous_id, surface` 返回稳定实验分组。
- `POST /api/events`：记录增长事件。
- `GET /api/admin/experiments`：查看实验配置。
- `PATCH /api/admin/experiments/[id]`：更新实验状态、名称或 variants。

V1.5 新增枚举：

- `CaseStatus = draft | approved | rejected | archived`
- `CaseSourceType = classic | anonymized_user | editorial`
- `CaseDifficulty = beginner | intermediate | advanced`
- `CourseStatus = draft | published | archived`
- `LessonType = article | quiz | case_review | practice`
- `CreatorExportType = article | short_video_script | long_image | chart_snapshot`
- `ExperimentSurface = home | result | learning | share | course`
- `ExperimentVariant = control | variant_a | variant_b`
- `EventName = cast_completed | explain_completed | followup_sent | share_created | case_opened | course_started | course_completed | creator_exported`

## V2.0 Multi-Client, Voice, Import, Community, and Governance API

### Multi-client

- `POST /api/devices/register`
  - Request: `{ anonymous_id, platform, app_version?, locale? }`
  - Response: `{ device: { device_id, anonymous_id, platform, app_version, locale, capabilities, safety_policy_version, registered_at } }`
- `POST /api/devices/push-settings`
  - Request: `{ device_id, enabled, learning_reminders, community_notifications }`
  - Response: `{ settings }`
- `GET /api/app/bootstrap?platform=web&anonymous_id=anonymous`
  - Response: `{ platform, anonymous_id, api_version, safety_policy_version, feature_flags, capabilities, copy }`

### Voice

- `POST /api/voice/transcribe`
  - Request: `{ audio_text, platform?, save_audio? }`
  - Response: `{ job: { job_id, status, transcript, platform, safety, raw_audio_stored, audio_url, created_at } }`
- `POST /api/voice/readings/explain`
  - Request: `{ reading_id, mode?, voice? }`
  - Response: `{ job }`
- `GET /api/voice/jobs/[id]`
  - Response: `{ job }`

Voice jobs default to `raw_audio_stored = false`. Blocked safety classifications return `status = blocked`.

### Import

- `POST /api/readings/import/preview`
  - Request: `{ source_type, payload }`
  - Response: `{ import_preview: { import_id, source_type, status, editable_fields, errors, ai_generated_chart_fields } }`
- `POST /api/readings/import`
  - Request: `{ source_type, payload }`
  - Response: `{ import_record }`
- `GET /api/readings/import/[id]`
  - Response: `{ import_record }`
- `PATCH /api/readings/import/[id]`
  - Request: `{ status?, payload? }`
  - Response: `{ import_record }`

Import never allows AI-generated chart fields. Invalid or incomplete payloads return editable fields and errors.

### Community

- `GET /api/community/posts`
  - Returns only `published` posts.
- `POST /api/community/posts`
  - Request: `{ post_type, title, body, reading_id?, case_id?, course_id?, knowledge_card_id? }`
  - High-risk readings or blocked text return `422 community_post_blocked`.
- `GET /api/community/posts/[id]`
- `POST /api/community/comments`
  - Request: `{ post_id, body }`
- `POST /api/community/reports`
  - Request: `{ target_type, target_id, reason }`

### Rule Packs and Reviews

- `GET /api/rule-packs`
- `GET /api/rule-packs/[id]`
- `POST /api/admin/rule-packs`
  - Request: `{ id?, name, scope, status?, rule_ids, weight_profile?, validation_case_ids, source_refs, regression_passed? }`
- `PATCH /api/admin/rule-packs/[id]`
  - Request: partial rule pack fields plus `{ status?, regression_passed? }`
  - `status = approved` requires `regression_passed = true`, professional review, and compliance review.
- `POST /api/admin/reviews`
  - Request: `{ target_type, target_id, review_type, decision, note? }`
- `GET /api/admin/review-queue`

### V2.0 enums

- `ClientPlatform = web | h5 | mini_program | ios | android`
- `VoiceJobStatus = queued | processing | completed | failed | blocked`
- `ImportSourceType = pasted_text | structured_json | image_ocr`
- `ImportStatus = draft | parsed | needs_review | accepted | rejected`
- `CommunityPostStatus = draft | pending_review | published | hidden | removed`
- `ReviewType = professional | compliance | privacy | safety`
- `RulePackStatus = draft | testing | approved | rejected | deprecated`
- `RulePackScope = yongshen | wangshuai | dongbian | timing | style | school`

## V3.0 Controlled Ecosystem API

V3.0 keeps the platform in a controlled-opening model. External contributors can submit content and rule packs, but every item must pass platform review, safety checks, and regression gates before it appears in the public ecosystem catalog. Rule packs are declarative only and cannot upload executable code.

### Ecosystem Catalog

- `GET /api/ecosystem/packages`
  - Returns only `published` packages.
- `GET /api/ecosystem/packages/[id]`
  - Returns a published, suspended, or deprecated package for audit/detail views.
- `POST /api/ecosystem/packages/install`
  - Request: `{ package_id }`
  - Response: `{ install }`
- `POST /api/ecosystem/packages/disable`
  - Request: `{ package_id }`
  - Response: `{ install }`

Package installation only affects learning/display and optional rule configuration. It cannot override safety classification, high-risk blocking, chart generation, or platform rule-engine guardrails.

### Contributor Workbench

- `GET /api/me/contributor-dashboard`
  - Response: `{ contributor_id, roles, submission_count, published_count, pending_review_count, simulated_revenue_cents }`
- `POST /api/contributor/submissions`
  - Request: `{ submission_type, title, payload, source_refs }`
  - Response: `{ submission }`
- `GET /api/contributor/submissions`
  - Response: `{ submissions }`
- `GET /api/contributor/submissions/[id]`
  - Response: `{ submission }`
- `PATCH /api/contributor/submissions/[id]`
  - Request: `{ title?, payload?, status? }`
  - Only `draft` and `changes_requested` submissions can be edited.
- `POST /api/contributor/submissions/[id]/submit`
  - Request: `{ confirm_controlled_opening: true }`
  - Response: `{ submission }`

Submissions can use `rule_pack | case | course | knowledge_card | exercise | creator_template`. Public surfaces only show `published` ecosystem packages.

### Review and Publication

- `GET /api/admin/submissions`
- `POST /api/admin/submissions/[id]/reviews`
  - Request: `{ review_gate, decision, note? }`
  - `review_gate = professional | compliance | privacy | safety | regression | editorial`
  - `decision = approved | rejected | changes_requested`
- `POST /api/admin/rule-packs/[id]/regression`
  - Request: `{ validation_case_ids?, force? }`
  - Response: `{ regression }`
- `POST /api/admin/rule-packs/[id]/publish`
  - Request: `{ release_note }`
  - Requires professional, compliance, safety, and regression gates.
- `POST /api/admin/rule-packs/[id]/rollback`
  - Request: `{ target_version, reason }`
- `POST /api/admin/ecosystem/packages/[id]/suspend`
  - Request: `{ reason }`

Published rule-pack evidence must retain `rule_pack_id` and `rule_pack_version` in future evidence-tree records so rule impact can be traced after gray release, rollback, or deprecation.

### Simulated Settlement and Metrics

- `GET /api/contributor/settlements`
  - Response: `{ settlements }`
- `POST /api/contributor/settlements/simulate`
  - Request: `{ contributor_id?, period, mode: "simulated" }`
  - Response: `{ settlement }`
- `GET /api/admin/ecosystem/metrics`
  - Response includes submission count, approval rate, regression failure rate, published package count, install count, suspended package count, complaint count, simulated revenue, and P95 latencies.

V3.0 does not call real payment, revenue share, withdrawal, invoice, tax, KYB, or KYC workflows. The settlement model is for product and operations validation only.

### V3.0 enums

- `ContributorRole = creator | expert | reviewer | admin`
- `SubmissionType = rule_pack | case | course | knowledge_card | exercise | creator_template`
- `SubmissionStatus = draft | submitted | in_review | changes_requested | approved | rejected | published | archived`
- `ReviewGate = professional | compliance | privacy | safety | regression | editorial`
- `EcosystemPackageType = rule_pack | course_pack | case_pack | knowledge_pack | creator_template_pack`
- `EcosystemPackageStatus = draft | testing | approved | published | suspended | deprecated`
- `PackageInstallStatus = installed | disabled | removed`
- `SettlementMode = simulated`
- `SettlementStatus = pending | calculated | frozen | voided`

## V3.5 Scaled Operations API

V3.5 keeps the platform in an operations-readiness and commercial-sandbox mode. It adds ecosystem quality scoring, risk-event handling, SLO and incident tracking, privacy controls, compliance review queues, and simulated billing. It still does not call real payment, revenue share, withdrawal, invoice, tax, KYB, or KYC workflows.

### Ecosystem Quality

- `GET /api/admin/ecosystem/quality`
  - Response: `{ packages, healthy_count, needs_review_count, suspended_count, average_quality_score }`
  - `packages[]` includes `package_id, package_type, title, quality_status, quality_score, safety_score, complaint_count, regression_failure_count, install_retention_rate, user_feedback_score, risk_level, moderation_action, note, reviewed_at`.
- `GET /api/admin/ecosystem/metrics`
  - V3.5 extends this existing endpoint with `install_conversion_rate, content_revisit_count, learning_completion_count, contributor_active_count, review_sla_p95_ms, complaint_resolution_p95_ms`.
- `POST /api/admin/ecosystem/packages/[id]/quality-review`
  - Request: `{ status, quality_score, safety_score, complaint_count, regression_failure_count, install_retention_rate, user_feedback_score, risk_level, moderation_action, note }`
  - Response: `{ review }`
  - `needs_review`, `suspended`, and `deprecated` quality states are hidden from the public ecosystem catalog.
- `GET /api/admin/ecosystem/risk-events`
  - Response: `{ risk_events }`
- `POST /api/admin/ecosystem/risk-events/[id]/resolve`
  - Request: `{ resolution, action }`
  - Response: `{ risk_event }`

### Operations and SLO

- `GET /api/admin/ops/slo`
  - Response: `{ targets, current, open_incident_count }`
  - Targets include charting, first AI delta, ecosystem catalog, and submission review P95.
- `GET /api/admin/ops/incidents`
  - Response: `{ incidents }`
- `POST /api/admin/ops/incidents`
  - Request: `{ title, severity, affected_surface, summary, status? }`
  - Response: `{ incident }`
- `PATCH /api/admin/ops/incidents/[id]`
  - Request: `{ status?, mitigation? }`
  - Response: `{ incident }`

### Commercial Sandbox

- `GET /api/admin/commercial/readiness`
  - Response: `{ mode: "simulated", overall_status, gates, real_money_movement_enabled: false }`
- `POST /api/admin/commercial/simulate-billing`
  - Request: `{ contributor_id?, period, mode: "simulated", include_entitlements? }`
  - Response: `{ billing }`
- `GET /api/contributor/revenue-preview`
  - Response: `{ contributor_id, mode: "simulated", simulation_count, ledger_event_count, total_amount_cents, real_money_movement: false }`

### Privacy and Compliance

- `GET /api/me/privacy-settings`
  - Response: `{ user_id, save_history, allow_personalization, allow_sensitive_review, retain_history_days, export_format, updated_at }`
- `POST /api/me/privacy-settings`
  - Request: `{ save_history?, allow_personalization?, allow_sensitive_review?, retain_history_days?, export_format? }`
- `POST /api/me/data-export`
  - Response: `{ export_job }`
  - Exports do not include raw question text or private followups.
- `GET /api/admin/compliance/reviews`
  - Response: `{ reviews }`
- `POST /api/admin/compliance/reviews/[id]/resolve`
  - Request: `{ resolution, action }`
  - Response: `{ review }`

### V3.5 enums

- `QualityReviewStatus = healthy | needs_review | suspended | deprecated`
- `EcosystemRiskLevel = low | medium | high | critical`
- `ModerationAction = warn | hide | suspend | rollback | reject`
- `CommercialReadinessGate = entitlement | billing_sandbox | tax_profile | kyb_kyc | risk_control | support_process`
- `CommercialReadinessStatus = missing | draft | ready | blocked`
- `IncidentSeverity = sev1 | sev2 | sev3 | sev4`
- `IncidentStatus = open | investigating | mitigated | resolved`
- `PrivacyExportStatus = queued | processing | completed | failed`
