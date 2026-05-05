export type RuleCard = {
  rule_id: string;
  title: string;
  level: "A" | "B" | "C" | "D";
  source_refs: string[];
  condition_schema: Record<string, unknown>;
  explanation_template: string;
  default_weight: number;
  enabled: boolean;
};

export const RULE_CARD_SEEDS: RuleCard[] = [
  {
    rule_id: "B-YS-001",
    title: "用神模板匹配",
    level: "B",
    source_refs: ["计划书 4.4 证据树模型", "计划书 5.4 取用神模板"],
    condition_schema: { scenario: "事业|财务|感情|考试|失物|其他", chart_field: "lines.liuqin" },
    explanation_template: "根据问题场景选择主用神与辅助观察爻。",
    default_weight: 0.24,
    enabled: true,
  },
  {
    rule_id: "B-WR-001",
    title: "月建旺衰",
    level: "B",
    source_refs: ["计划书 4.2 B级规则", "计划书 5.2 排盘与断卦流程"],
    condition_schema: { date_context: "month_branch", target: "yongshen.branch" },
    explanation_template: "以月建五行与用神五行关系判断得令、生扶、受克或平常。",
    default_weight: 0.2,
    enabled: true,
  },
  {
    rule_id: "B-DV-001",
    title: "动爻变爻",
    level: "B",
    source_refs: ["计划书 4.2 B级规则", "计划书 5.2 排盘与断卦流程"],
    condition_schema: { target: "lines.moving", changed_field: "changed_branch" },
    explanation_template: "观察用神或关键爻是否发动，以及变爻对主线的影响。",
    default_weight: 0.18,
    enabled: true,
  },
  {
    rule_id: "B-XK-001",
    title: "旬空判断",
    level: "B",
    source_refs: ["计划书 4.2 B级规则", "规则资料基线 A级 旬空"],
    condition_schema: { date_context: "day_ganzhi", target: "chart.xunkong" },
    explanation_template: "检查用神或关键爻地支是否落入旬空。",
    default_weight: 0.16,
    enabled: true,
  },
  {
    rule_id: "B-SY-001",
    title: "世应关系",
    level: "B",
    source_refs: ["计划书 4.4 证据树模型", "规则资料基线 B级 世应关系"],
    condition_schema: { chart_field: "base_chart.shi_line|base_chart.ying_line" },
    explanation_template: "以世爻、应爻观察主体、对象和互动关系。",
    default_weight: 0.14,
    enabled: true,
  },
  {
    rule_id: "B-HC-001",
    title: "合冲关系",
    level: "B",
    source_refs: ["计划书 4.2 B级规则", "计划书 5.2 时间影响"],
    condition_schema: { date_context: "day_branch|month_branch", target: "line.branch" },
    explanation_template: "检查日辰、月建与关键爻之间的冲合提示。",
    default_weight: 0.12,
    enabled: true,
  },
];

export function getRuleCard(ruleId: string): RuleCard {
  const card = RULE_CARD_SEEDS.find((item) => item.rule_id === ruleId);
  if (!card) {
    throw new Error(`Unknown rule card: ${ruleId}`);
  }
  return card;
}
