# 《易问六爻》第 6 阶段计划：V2.0 社区、多端与专业治理扩展

## Summary

- 阶段定位：V2.0，第 27 周以后，从 V1.5 的内容化增长推进到社区、多端和专业治理扩展。
- 当前实现基线：Web/H5 已具备排盘、证据树、AI 解读、追问、知识卡、课程、案例库、创作者工具、A/B 测试和运营后台 v0。
- 本阶段交付：多端 bootstrap、设备注册、语音问卦、导入排盘、社区共学、规则包市场和审核队列。
- 合规边界：继续保持“传统文化学习 + 娱乐互动”，不做承诺式占断、改运消灾、情感挽回、投资/医疗/法律结论。

## Scope

### 多端扩展

- Web/H5 仍为主实现，小程序/App 壳层复用同一 API、规则引擎、安全分类和审计日志。
- 新增 `/api/app/bootstrap` 返回平台能力、功能开关、安全策略版本和隐私提示。
- 新增设备注册与推送设置接口，推送仅用于学习提醒和社区通知，不改变安全策略。

### 语音问卦

- 新增语音转文字与语音播报任务接口。
- 语音文本走同一风险分类、脱敏与审计流程。
- 默认不保存原始音频；当前记录只保存转写文本、状态、安全分类和是否保存音频的布尔值。

### 导入排盘

- 支持结构化 JSON 和粘贴文本的导入预览；图片 OCR 作为接口枚举预留。
- 导入统一转为 `chart_json` 后进入既有 Chart Engine / Rule Engine。
- 导入失败时返回 `editable_fields + errors`，AI 不得补造卦盘事实。

### 社区共学

- 支持卦例讨论、课程打卡、知识卡评论和错题讨论的帖子模型。
- 帖子默认进入 `pending_review`，审核通过后才进入公开列表。
- 高风险 reading、未脱敏内容和承诺式结论不得公开发布。

### 规则市场与专家审核

- 支持规则包、流派/范围、权重模板、验证案例和来源说明。
- 规则包必须满足专业审核、合规审核和标准卦例回归后才能 `approved`。
- 前台只读取非 `deprecated/rejected` 规则包，证据树后续需记录 `rule_pack_id`。

## API Baseline

- 多端：`POST /api/devices/register`、`POST /api/devices/push-settings`、`GET /api/app/bootstrap`
- 语音：`POST /api/voice/transcribe`、`POST /api/voice/readings/explain`、`GET /api/voice/jobs/[id]`
- 导入：`POST /api/readings/import/preview`、`POST /api/readings/import`、`GET/PATCH /api/readings/import/[id]`
- 社区：`GET/POST /api/community/posts`、`GET /api/community/posts/[id]`、`POST /api/community/comments`、`POST /api/community/reports`
- 规则治理：`GET /api/rule-packs`、`GET /api/rule-packs/[id]`、`POST /api/admin/rule-packs`、`PATCH /api/admin/rule-packs/[id]`、`POST /api/admin/reviews`、`GET /api/admin/review-queue`

## Week Plan

- 第 27-28 周：冻结 V2.0 PRD、多端信息架构、社区规范、语音隐私策略、导入排盘格式和规则市场审核标准。
- 第 29-30 周：实现小程序/App API bootstrap、设备注册、登录态兼容、离线缓存和多端分享能力。
- 第 31-32 周：实现语音问卦 v0，包括语音转文字、语音播报、语音安全分类、音频不保存默认策略和审计日志。
- 第 33-34 周：实现导入排盘 v0，支持文本/JSON 导入、解析预览、字段修正、导入后排盘验收和错误提示。
- 第 35-36 周：实现社区共学 v0，包括脱敏发布、评论、举报、审核队列、内容下架和学习打卡。
- 第 37-38 周：实现规则市场 v0，包括规则包、流派配置、权重模板、专家审核、标准卦例回归和规则版本发布。
- 第 39-40 周：完成合规后台增强、多端回归、性能压测、社区内容抽检、V2.0 验收报告和灰度发布清单。

## Test Plan

- 多端：Web/H5、mini_program、ios、android 的 bootstrap 字段一致，核心功能开关一致。
- 语音：允许问题完成转写，高风险语音问题返回 `blocked`，默认 `raw_audio_stored = false`。
- 导入：合法结构化 JSON 可生成 reading 和 chart_json；缺字段、非法爻值返回可编辑错误，不调用 AI 猜卦盘。
- 社区：未审核内容不公开，高风险 reading 不可发布，举报进入审核队列。
- 规则市场：未审核或回归未通过的规则包不可 `approved`；规则包可下架、弃用和回滚。
- 回归门槛：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 通过。

