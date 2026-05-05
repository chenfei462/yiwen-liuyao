# 《易问六爻》第 0 阶段开工基线

## 目标

第 0 阶段用于冻结正式研发前的产品、规则、技术、合规和验收基线。完成后进入 MVP 0.1，第 1-4 周只验证 Web/H5 的起卦、手动输入、基础排盘和本地历史记录。

## 产品边界

- 首端形态：Web/H5。
- 产品定位：传统文化学习 + 娱乐互动工具。
- 明确不做：精准预测承诺、改运消灾、包准、挽回、投资建议、医疗诊断、法律结论、高价单次断卦。
- MVP 0.1 功能：问题输入、场景选择、铜钱摇卦、手动输入、基础排盘、浏览器本地历史。
- MVP 0.1 不做：AI 长解读、追问、课程、分享图、付费、小程序、App、语音、后台管理。

## 技术基线

- 前端框架：Next.js App Router + TypeScript + Tailwind CSS。
- 领域逻辑：`src/domain` 中的 TypeScript 纯函数，先覆盖排盘、契约校验和风险分类。
- 运行时校验：Zod Schema 作为 API 输入契约单一来源。
- 存储策略：MVP 0.1 使用浏览器 localStorage 保存最近 8 条历史；数据库表结构先以草案固化。
- AI 编排：仅固化输出 Schema，不在 MVP 0.1 调用模型。

## 当前实现入口

- H5 页面：`src/app/page.tsx` 与 `src/components/reading-workbench.tsx`。
- 排盘引擎：`src/domain/chart-engine.ts`。
- 安全分类：`src/domain/safety.ts`。
- API 契约：`src/domain/contracts.ts`。
- API 路由：`src/app/api/readings/init`、`cast`、`analyze`。

## 完成标准

- 核心规则、契约和安全分类测试通过。
- TypeScript 类型检查通过。
- 生产构建通过。
- 本地浏览器可在 3 分钟内完成一次问题输入、起卦、排盘和历史记录保存。
