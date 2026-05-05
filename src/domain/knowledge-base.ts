import type { ContentStatus, ExerciseDifficulty, Scenario } from "./contracts";

export type KnowledgeCardStatus = ContentStatus;

export type KnowledgeCard = {
  id: string;
  title: string;
  term: string;
  rule_id: string;
  scenario: Scenario | "通用";
  level: "A" | "B" | "C" | "D";
  summary: string;
  content: string;
  source_ref: string;
  source_refs: string[];
  license_note: string;
  status: KnowledgeCardStatus;
};

export type ExerciseSeed = {
  id: string;
  title: string;
  scenario: Scenario | "通用";
  prompt: string;
  answer: string;
  knowledge_card_id: string;
  difficulty: ExerciseDifficulty;
  status: ContentStatus;
};

export type KnowledgeSearchInput = {
  rule_id?: string;
  scenario?: Scenario;
  term?: string;
  evidence_rule_ids?: string[];
  limit?: number;
};

const BASE_CARDS: Array<Omit<KnowledgeCard, "id" | "status" | "license_note" | "content" | "source_refs">> = [
  {
    title: "事业问题为什么常看官鬼",
    term: "用神",
    rule_id: "B-YS-001",
    scenario: "事业",
    level: "B",
    summary: "传统六爻中，求职位、录取、岗位压力时常以官鬼为主线，再兼看父母文书和世应互动。",
    source_ref: "计划书 5.4 取用神模板",
  },
  {
    title: "财务问题的妻财主线",
    term: "妻财",
    rule_id: "B-YS-001",
    scenario: "财务",
    level: "B",
    summary: "财务、资源、物品类问题通常以妻财为主线，同时观察子孙生财与兄弟耗财。",
    source_ref: "计划书 5.4 取用神模板",
  },
  {
    title: "考试与文书为什么看父母",
    term: "父母",
    rule_id: "B-YS-001",
    scenario: "考试",
    level: "B",
    summary: "考试、证书、材料、流程文书类问题常以父母爻为主线，官鬼可作压力或名次辅助观察。",
    source_ref: "计划书 5.4 取用神模板",
  },
  {
    title: "失物问题的财爻观察",
    term: "失物",
    rule_id: "B-YS-001",
    scenario: "失物",
    level: "B",
    summary: "失物问题以物象为中心，常以财爻观察，同时结合内外卦、动爻和空亡作学习提示。",
    source_ref: "计划书 5.4 取用神模板",
  },
  {
    title: "感情问题先看世应关系",
    term: "世应",
    rule_id: "B-SY-001",
    scenario: "感情",
    level: "B",
    summary: "未收集主体角色时，感情场景先以世应互动观察双方关系，不强行按性别取官鬼或妻财。",
    source_ref: "计划书 6.4 追问菜单",
  },
  {
    title: "其他问题的学习型观察",
    term: "世应",
    rule_id: "B-SY-001",
    scenario: "其他",
    level: "B",
    summary: "问题类型不明确时，先观察世爻、应爻和动爻，把卦盘作为拆解问题结构的学习工具。",
    source_ref: "计划书 6.1 交互原则",
  },
  {
    title: "月建如何影响旺衰",
    term: "月建",
    rule_id: "B-WR-001",
    scenario: "通用",
    level: "B",
    summary: "月建代表阶段性环境，用来观察用神是否得令、生扶、受克或被冲破。",
    source_ref: "计划书 5.2 排盘与断卦流程",
  },
  {
    title: "日辰用于短期触发",
    term: "日辰",
    rule_id: "B-HC-001",
    scenario: "通用",
    level: "B",
    summary: "日辰常用于观察短期触发、冲合和反复，不应脱离证据树单独下结论。",
    source_ref: "计划书 5.2 时间影响",
  },
  {
    title: "旬空为什么是反证",
    term: "旬空",
    rule_id: "B-XK-001",
    scenario: "通用",
    level: "B",
    summary: "关键爻落旬空时，表示该线索暂时不实或难落地，适合作为保留与反证展示。",
    source_ref: "规则资料基线 A级 旬空",
  },
  {
    title: "动爻表示变化线索",
    term: "动爻",
    rule_id: "B-DV-001",
    scenario: "通用",
    level: "B",
    summary: "动爻代表事情正在变化，需看它是否为用神、原神、忌神，以及变爻是否回头生克。",
    source_ref: "计划书 4.4 证据树模型",
  },
  {
    title: "合冲不能机械断吉凶",
    term: "合冲",
    rule_id: "B-HC-001",
    scenario: "通用",
    level: "B",
    summary: "合冲是互动关系，不等于单独的吉凶，需要结合用神旺衰、动静和反证一起看。",
    source_ref: "计划书 4.2 古籍规则到产品模块映射",
  },
  {
    title: "证据树的阅读顺序",
    term: "证据树",
    rule_id: "B-YS-001",
    scenario: "通用",
    level: "B",
    summary: "先看问题类型和用神，再看日月、动变、空破、世应，最后对照反证和置信度。",
    source_ref: "计划书 4.4 证据树模型",
  },
  {
    title: "反证为什么必须显示",
    term: "反证",
    rule_id: "B-XK-001",
    scenario: "通用",
    level: "B",
    summary: "反证能避免把单条规则夸大成确定结论，是学习型产品与承诺式占断的关键差别。",
    source_ref: "计划书 1.4 MVP 成功定义",
  },
  {
    title: "专业版解释保留术语",
    term: "专业版",
    rule_id: "B-YS-001",
    scenario: "通用",
    level: "B",
    summary: "专业版适合有基础的用户，应保留用神、世应、动变、旬空、月建等术语和证据编号。",
    source_ref: "计划书 3.3 产品调性",
  },
  {
    title: "轻松版解释转成白话",
    term: "轻松版",
    rule_id: "B-YS-001",
    scenario: "通用",
    level: "B",
    summary: "轻松版应把术语转为局面、机会、阻力和可观察动作，不使用必然化判断。",
    source_ref: "计划书 3.3 产品调性",
  },
  {
    title: "学习版解释每步为什么",
    term: "学习版",
    rule_id: "B-YS-001",
    scenario: "通用",
    level: "B",
    summary: "学习版的重点不是断语，而是解释每条证据为何进入证据树。",
    source_ref: "计划书 3.3 产品调性",
  },
  {
    title: "剧情版也必须保留边界",
    term: "剧情版",
    rule_id: "B-SY-001",
    scenario: "通用",
    level: "B",
    summary: "剧情版可以更有画面感，但必须保留不确定性、证据来源和安全提示。",
    source_ref: "计划书 3.3 产品调性",
  },
  {
    title: "安全提示优先于解读",
    term: "安全",
    rule_id: "B-YS-001",
    scenario: "通用",
    level: "B",
    summary: "医疗、法律、投资、自伤、未成年人和改运消灾等问题应先给安全提示，不进入承诺式解读。",
    source_ref: "计划书 11.2 高风险内容处理",
  },
];

const FILLER_TERMS = ["用神", "月建", "日辰", "动爻", "旬空", "世应", "反证", "证据树"] as const;
const FILLER_RULES = ["B-YS-001", "B-WR-001", "B-HC-001", "B-DV-001", "B-XK-001", "B-SY-001"] as const;
const FILLER_SCENARIOS: Array<Scenario | "通用"> = ["事业", "财务", "感情", "考试", "失物", "其他", "通用"];

export const KNOWLEDGE_CARD_SEEDS: KnowledgeCard[] = Array.from({ length: 50 }, (_, index) => {
  const base = BASE_CARDS[index % BASE_CARDS.length];
  const summary =
    index < BASE_CARDS.length
      ? base.summary
      : `这是第 ${index + 1} 张知识卡，用于解释${FILLER_TERMS[index % FILLER_TERMS.length]}在证据树中的学习意义。`;
  const sourceRef = index < BASE_CARDS.length ? base.source_ref : "计划书 9.2 知识库治理流程";
  return {
    id: `kc-${base.rule_id}-${String(index + 1).padStart(2, "0")}`,
    title: index < BASE_CARDS.length ? base.title : `${FILLER_TERMS[index % FILLER_TERMS.length]}学习卡 ${index + 1}`,
    term: index < BASE_CARDS.length ? base.term : FILLER_TERMS[index % FILLER_TERMS.length],
    rule_id: index < BASE_CARDS.length ? base.rule_id : FILLER_RULES[index % FILLER_RULES.length],
    scenario: index < BASE_CARDS.length ? base.scenario : FILLER_SCENARIOS[index % FILLER_SCENARIOS.length],
    level: base.level,
    summary,
    content: summary,
    source_ref: sourceRef,
    source_refs: [sourceRef],
    license_note: "项目自研解释卡，可用于产品内引用；不复刻未授权全文。",
    status: "approved",
  };
});

export const EXERCISE_SEEDS: ExerciseSeed[] = Array.from({ length: 20 }, (_, index) => {
  const card = KNOWLEDGE_CARD_SEEDS[index];
  return {
    id: `ex-${String(index + 1).padStart(2, "0")}`,
    title: `${card.term}练习 ${index + 1}`,
    scenario: card.scenario,
    prompt: `阅读知识卡“${card.title}”，说明它对应哪条规则。`,
    answer: card.rule_id,
    knowledge_card_id: card.id,
    difficulty: index < 8 ? "beginner" : index < 15 ? "intermediate" : "advanced",
    status: "approved",
  };
});

export function searchKnowledgeCards(input: KnowledgeSearchInput): KnowledgeCard[] {
  const terms = normalizeSearchTerms(input.term);
  const evidenceRuleIds = new Set(input.evidence_rule_ids ?? []);
  const scored = KNOWLEDGE_CARD_SEEDS.filter((card) => card.status === "approved")
    .map((card) => ({ card, score: scoreCard(card, input, terms, evidenceRuleIds) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.card.id.localeCompare(right.card.id));

  return scored.slice(0, input.limit ?? 8).map((item) => item.card);
}

function scoreCard(
  card: KnowledgeCard,
  input: KnowledgeSearchInput,
  terms: string[],
  evidenceRuleIds: Set<string>,
): number {
  let score = 0;
  if (input.rule_id && card.rule_id === input.rule_id) score += 8;
  if (evidenceRuleIds.has(card.rule_id)) score += 6;
  if (input.scenario && (card.scenario === input.scenario || card.scenario === "通用")) score += 3;
  for (const term of terms) {
    if (card.term.includes(term) || card.title.includes(term) || card.summary.includes(term)) score += 4;
  }
  if (!input.rule_id && !input.scenario && terms.length === 0 && evidenceRuleIds.size === 0) score += 1;
  return score;
}

function normalizeSearchTerms(term: string | undefined): string[] {
  if (!term) return [];
  return term
    .split(/[\s,，、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
