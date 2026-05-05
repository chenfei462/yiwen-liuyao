# 规则资料基线

## A 级：排盘事实

| 数据 | 当前状态 | 实现位置 |
| --- | --- | --- |
| 八卦阴阳结构 | 已固化 8 个三爻模式、五行归属 | `src/domain/chart-engine.ts` |
| 六十四卦八宫 | 已固化京房八宫序列、游魂归魂、世应位置 | `src/domain/chart-engine.ts` |
| 爻值 | 已固化 6 老阴、7 少阳、8 少阴、9 老阳 | `src/domain/contracts.ts` |
| 纳甲 | 已固化八卦内外卦干支表 | `src/domain/chart-engine.ts` |
| 六亲 | 按卦宫五行与爻支五行生克关系计算 | `src/domain/chart-engine.ts` |
| 六神 | 按日干起六神顺排 | `src/domain/chart-engine.ts` |
| 旬空 | 按六十甲子旬首计算 | `src/domain/chart-engine.ts` |

## B 级：主流规则

| 规则 | MVP 0.1 状态 | 后续阶段 |
| --- | --- | --- |
| 用神模板 | 已启用 v0 | 覆盖事业、财务、感情、考试、失物、其他 |
| 日月旺衰 | 已启用月建/日辰 v0 | 2024-2027 月建表，超出范围需显式传入 |
| 动变回头生克 | 已启用 v0 | 用神动爻进入证据树，静爻进入反证 |
| 世应关系 | 已启用 v0 | 感情和其他场景默认以世应作学习观察 |

## C/D 级：经验与争议规则

三刑、六害、神煞、细碎应期法暂不进入 MVP 0.1。后续若加入，必须在规则卡中标注等级、适用条件、来源和是否默认启用。

## 数据来源口径

第 2 阶段已固化首批 B 级 `rule_cards` 种子，覆盖 `B-YS`、`B-WR`、`B-DV`、`B-XK`、`B-SY`、`B-HC`。古籍原文片段、现代教材解释和案例库仍需在 Beta 0.8 以后进入 `knowledge_docs`，AI 只能读取 `chart_json + evidence_tree + knowledge_cards`，不能自行生成卦盘事实。
