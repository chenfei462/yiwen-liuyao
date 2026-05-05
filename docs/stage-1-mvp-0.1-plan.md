# 《易问六爻》第 1 阶段：MVP 0.1 排盘与起卦体验

## 阶段目标

第 1 阶段对应计划书中的 `MVP 0.1，第 1-4 周`，目标是验证 Web/H5 的起卦、手动输入、基础卦盘和历史记录闭环。阶段内只输出排盘事实，不输出用神、旺衰、证据树或 AI 长解读。

## 已落地能力

- 起卦方式：铜钱摇卦与手动输入均保留，爻值固定为 `6 | 7 | 8 | 9`，输入顺序为初爻到上爻。
- 日期干支：`/api/readings/cast` 支持 `cast_time` 与可选 `day_ganzhi`；显式 `day_ganzhi` 优先，否则由 `cast_time` 推导日干支。
- 基础排盘：输出本卦、变卦、上下卦、卦宫、世应、纳甲、六亲、六神、旬空、动爻和变爻信息。
- 历史记录：服务端最小持久化写入 `.data/readings.json`，前端保留 localStorage 作为匿名/离线兜底；历史列表只展示脱敏问题摘要。
- 合规护栏：医疗、法律、金融、自伤、未成年人、改运消灾、情感控制等问题拦截或安全提示，不进入承诺式解读。

## API 变更

- `POST /api/readings/init`：保持不破坏，返回 `reading_id`、`safety_status`、`rewrite_suggestions`。
- `POST /api/readings/cast`：新增可选入参 `cast_time`、`day_ganzhi`；响应新增 `cast_time`、`day_ganzhi`。
- `GET /api/readings/history`：返回最近 8 条服务端历史记录。
- `DELETE /api/readings/history/[reading_id]`：删除指定历史记录和对应问卦记录。
- `POST /api/readings/analyze`：仍返回 MVP 0.1 占位，不生成用神和证据树。

## 第 1 阶段完成标准

- 用户可在移动端 3 分钟内完成问题输入、起卦、排盘和历史查看。
- 100 个标准验收样例进入自动化测试：64 个静卦、12 个单动爻、12 个日干支/旬空/六神、6 个 API 异常、6 个安全分类。
- `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 作为回归门槛。
- MVP 0.2 前不加入用神、旺衰、动变证据树、AI 追问、分享图、课程、付费、小程序、App 或语音。
