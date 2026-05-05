import type { CastChartResult, ChartLine } from "./chart-engine";
import type { BranchName, DayGanzhi, MonthSource } from "./calendar";
import type { AnalyzeRequest, Scenario } from "./contracts";
import { getRuleCard } from "./rule-cards";
import type { SafetyClassification } from "./safety";

type ElementName = "木" | "火" | "土" | "金" | "水";
type LiuqinName = ChartLine["liuqin"];
type EvidencePolarity = "+" | "-" | "neutral";
type EvidenceConfidence = "低" | "中" | "高";

export type EvidenceNode = {
  id: string;
  rule_id: string;
  level: "A" | "B" | "C" | "D";
  title: string;
  line_refs: number[];
  premise: string;
  conclusion: string;
  polarity: EvidencePolarity;
  weight: number;
  confidence: EvidenceConfidence;
  source_refs: string[];
};

export type YongshenSelection = {
  line_no: number;
  liuqin: LiuqinName;
  branch: BranchName;
  role: "主用神" | "世爻观察";
  reason_rule_id: string;
  confidence: EvidenceConfidence;
  alternatives: Array<{
    line_no: number;
    liuqin: LiuqinName;
    branch: BranchName;
    role: string;
  }>;
};

export type RuleAnalysisResult = {
  reading_id: string;
  mode: AnalyzeRequest["mode"];
  rule_version: "mvp-0.2-rule-engine-v0";
  safety_status: SafetyClassification;
  question_type: Scenario;
  yongshen: YongshenSelection | null;
  evidence_tree: EvidenceNode[];
  counter_evidence: EvidenceNode[];
  verdict: {
    tendency: "supportive" | "mixed" | "mixed_resistance" | "learning_only" | "blocked";
    confidence: EvidenceConfidence;
    summary: string;
  };
  action_tips: string[];
  safety_notice: string;
};

export type RuleAnalysisInput = {
  readingId: string;
  question: string;
  scenario: Scenario;
  mode: AnalyzeRequest["mode"];
  safety: SafetyClassification;
  chart?: CastChartResult;
  dateContext: {
    cast_time: string;
    day_ganzhi: DayGanzhi;
    month_branch: BranchName;
    month_source: MonthSource;
  };
};

const RULE_VERSION = "mvp-0.2-rule-engine-v0";

const BRANCH_ELEMENTS: Record<BranchName, ElementName> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

const GENERATES: Record<ElementName, ElementName> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const CONTROLS: Record<ElementName, ElementName> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

const OPPOSITES: Record<BranchName, BranchName> = {
  子: "午",
  丑: "未",
  寅: "申",
  卯: "酉",
  辰: "戌",
  巳: "亥",
  午: "子",
  未: "丑",
  申: "寅",
  酉: "卯",
  戌: "辰",
  亥: "巳",
};

const SCENARIO_TEMPLATES: Record<
  Scenario,
  {
    primary?: LiuqinName;
    auxiliary: LiuqinName[];
    yongshenRole: "主用神" | "世爻观察" | "none";
  }
> = {
  事业: { primary: "官鬼", auxiliary: ["父母"], yongshenRole: "主用神" },
  财务: { primary: "妻财", auxiliary: ["子孙", "兄弟"], yongshenRole: "主用神" },
  感情: { auxiliary: ["官鬼", "妻财"], yongshenRole: "世爻观察" },
  考试: { primary: "父母", auxiliary: ["官鬼"], yongshenRole: "主用神" },
  失物: { primary: "妻财", auxiliary: ["子孙"], yongshenRole: "主用神" },
  其他: { auxiliary: [], yongshenRole: "none" },
};

export function analyzeRules(input: RuleAnalysisInput): RuleAnalysisResult {
  if (input.safety.status === "blocked") {
    return blockedResult(input);
  }
  if (!input.chart) {
    throw new Error("Cast not found: evidence analysis requires a chart");
  }

  const yongshen = selectYongshen(input.scenario, input.chart);
  const evidence: EvidenceNode[] = [];
  const counterEvidence: EvidenceNode[] = [];
  let sequence = 1;

  const pushEvidence = (node: Omit<EvidenceNode, "id">, target: EvidenceNode[] = evidence) => {
    target.push({
      id: `${input.readingId}:${node.rule_id}:${String(sequence).padStart(2, "0")}`,
      ...node,
    });
    sequence += 1;
  };

  if (yongshen) {
    const yongshenLine = getLine(input.chart, yongshen.line_no);
    pushEvidence(buildNode("B-YS-001", {
      lineRefs: [yongshen.line_no],
      premise: `${input.scenario}场景匹配${yongshen.liuqin}或世应主线。`,
      conclusion: `以${yongshen.line_no}爻${yongshen.liuqin}${yongshen.branch}作为${yongshen.role}。`,
      polarity: "+",
      confidence: yongshen.confidence,
    }));

    const monthNode = buildMonthNode(yongshen, input.dateContext.month_branch);
    pushEvidence(monthNode, monthNode.polarity === "-" ? counterEvidence : evidence);
    const dayNode = buildDayNode(yongshen, input.dateContext.day_ganzhi[1] as BranchName);
    pushEvidence(dayNode, dayNode.polarity === "-" ? counterEvidence : evidence);
    const xunkongNode = buildXunkongNode(yongshen, input.chart.base_chart.xunkong);
    pushEvidence(xunkongNode, xunkongNode.polarity === "-" ? counterEvidence : evidence);
    const movingNode = buildMovingNode(yongshen, yongshenLine);
    pushEvidence(movingNode, movingNode.polarity === "-" ? counterEvidence : evidence);
  } else {
    const shiLine = getLine(input.chart, input.chart.base_chart.shi_line);
    const yingLine = getLine(input.chart, input.chart.base_chart.ying_line);
    pushEvidence(buildNode("B-SY-001", {
      lineRefs: [shiLine.line_no, yingLine.line_no],
      premise: `${input.scenario}场景暂不强行指定主用神。`,
      conclusion: `以世爻${shiLine.line_no}与应爻${yingLine.line_no}作为学习型观察。`,
      polarity: "neutral",
      confidence: "中",
    }));
    pushEvidence(buildNode("B-DV-001", {
      lineRefs: input.chart.lines.filter((line) => line.moving).map((line) => line.line_no),
      premise: "未指定主用神时，动爻只作为局面变化提示。",
      conclusion: input.chart.lines.some((line) => line.moving) ? "本卦存在动爻，可作变化观察。" : "本卦无动爻，变化提示较弱。",
      polarity: "neutral",
      confidence: "中",
    }));
    pushEvidence(buildNode("B-HC-001", {
      lineRefs: [shiLine.line_no],
      premise: `日辰${input.dateContext.day_ganzhi}，月建${input.dateContext.month_branch}。`,
      conclusion: "时间因素仅用于学习展示，不输出明确趋向。",
      polarity: "neutral",
      confidence: "中",
    }));
  }

  return {
    reading_id: input.readingId,
    mode: input.mode,
    rule_version: RULE_VERSION,
    safety_status: input.safety,
    question_type: input.scenario,
    yongshen,
    evidence_tree: evidence,
    counter_evidence: counterEvidence,
    verdict: buildVerdict(evidence, counterEvidence, yongshen),
    action_tips: buildActionTips(input.scenario),
    safety_notice: input.safety.notice,
  };
}

function blockedResult(input: RuleAnalysisInput): RuleAnalysisResult {
  return {
    reading_id: input.readingId,
    mode: input.mode,
    rule_version: RULE_VERSION,
    safety_status: input.safety,
    question_type: input.scenario,
    yongshen: null,
    evidence_tree: [],
    counter_evidence: [],
    verdict: {
      tendency: "blocked",
      confidence: "低",
      summary: input.safety.notice,
    },
    action_tips: [],
    safety_notice: input.safety.notice,
  };
}

function selectYongshen(scenario: Scenario, chart: CastChartResult): YongshenSelection | null {
  const template = SCENARIO_TEMPLATES[scenario];
  if (template.yongshenRole === "none") return null;

  if (template.yongshenRole === "世爻观察") {
    const shiLine = getLine(chart, chart.base_chart.shi_line);
    return {
      line_no: shiLine.line_no,
      liuqin: shiLine.liuqin,
      branch: shiLine.branch as BranchName,
      role: "世爻观察",
      reason_rule_id: "B-SY-001",
      confidence: "中",
      alternatives: buildAlternatives(chart, template.auxiliary),
    };
  }

  const primary = template.primary;
  if (!primary) return null;
  const candidate = chart.lines.find((line) => line.liuqin === primary);
  if (!candidate) return null;

  return {
    line_no: candidate.line_no,
    liuqin: candidate.liuqin,
    branch: candidate.branch as BranchName,
    role: "主用神",
    reason_rule_id: "B-YS-001",
    confidence: "高",
    alternatives: buildAlternatives(chart, template.auxiliary),
  };
}

function buildAlternatives(chart: CastChartResult, liuqinNames: LiuqinName[]): YongshenSelection["alternatives"] {
  return chart.lines
    .filter((line) => liuqinNames.includes(line.liuqin))
    .map((line) => ({
      line_no: line.line_no,
      liuqin: line.liuqin,
      branch: line.branch as BranchName,
      role: "辅助观察",
    }));
}

function buildMonthNode(yongshen: YongshenSelection, monthBranch: BranchName): Omit<EvidenceNode, "id"> {
  const monthElement = BRANCH_ELEMENTS[monthBranch];
  const lineElement = BRANCH_ELEMENTS[yongshen.branch];
  const relation = getElementRelation(monthElement, lineElement);
  const isMonthBreak = OPPOSITES[monthBranch] === yongshen.branch;

  if (isMonthBreak) {
    return buildNode("B-WR-001", {
      lineRefs: [yongshen.line_no],
      premise: `月建${monthBranch}冲用神${yongshen.branch}。`,
      conclusion: "用神受月建冲动，作为阻力或不稳证据。",
      polarity: "-",
      confidence: "中",
    });
  }

  return buildNode("B-WR-001", {
    lineRefs: [yongshen.line_no],
    premise: `月建${monthBranch}属${monthElement}，用神${yongshen.branch}属${lineElement}。`,
    conclusion: relation.conclusion,
    polarity: relation.polarity,
    confidence: "中",
  });
}

function buildDayNode(yongshen: YongshenSelection, dayBranch: BranchName): Omit<EvidenceNode, "id"> {
  const dayElement = BRANCH_ELEMENTS[dayBranch];
  const lineElement = BRANCH_ELEMENTS[yongshen.branch];
  const relation = getElementRelation(dayElement, lineElement);
  const isDayConflict = OPPOSITES[dayBranch] === yongshen.branch;

  return buildNode("B-HC-001", {
    lineRefs: [yongshen.line_no],
    premise: `日辰${dayBranch}与用神${yongshen.branch}比较。`,
    conclusion: isDayConflict ? "日辰冲用神，作为短期反复提示。" : relation.conclusion,
    polarity: isDayConflict ? "-" : relation.polarity,
    confidence: "中",
  });
}

function buildXunkongNode(
  yongshen: YongshenSelection,
  xunkong: [BranchName, BranchName],
): Omit<EvidenceNode, "id"> {
  const isEmpty = xunkong.includes(yongshen.branch);
  return buildNode("B-XK-001", {
    lineRefs: [yongshen.line_no],
    premise: `本日旬空为${xunkong.join("、")}，用神地支为${yongshen.branch}。`,
    conclusion: isEmpty ? "用神落旬空，结论需要保留反证。" : "用神不落旬空，空亡不构成本条主阻力。",
    polarity: isEmpty ? "-" : "neutral",
    confidence: "中",
  });
}

function buildMovingNode(yongshen: YongshenSelection, line: ChartLine): Omit<EvidenceNode, "id"> {
  if (line.moving) {
    const originalElement = BRANCH_ELEMENTS[yongshen.branch];
    const changedBranch = line.changed_branch as BranchName;
    const changedElement = BRANCH_ELEMENTS[changedBranch];
    const polarity =
      GENERATES[changedElement] === originalElement
        ? "+"
        : CONTROLS[changedElement] === originalElement
          ? "-"
          : "neutral";
    const conclusion =
      polarity === "+"
        ? `用神发动，变爻${changedBranch}${changedElement}回头生用神，作为正向变化证据。`
        : polarity === "-"
          ? `用神发动，变爻${changedBranch}${changedElement}回头克用神，作为反复阻力。`
          : `用神发动，变爻${changedBranch}${changedElement}与用神无直接回头生克。`;

    return buildNode("B-DV-001", {
      lineRefs: [yongshen.line_no],
      premise: `用神第${yongshen.line_no}爻发动，原支${yongshen.branch}，变支${changedBranch}。`,
      conclusion,
      polarity,
      confidence: "中",
    });
  }

  return buildNode("B-DV-001", {
    lineRefs: [yongshen.line_no],
    premise: `用神所在第${yongshen.line_no}爻是否发动。`,
    conclusion: "用神静而未动，动变证据不足，需更多依赖日月与世应。",
    polarity: "-",
    confidence: "中",
  });
}

function buildNode(
  ruleId: string,
  input: {
    lineRefs: number[];
    premise: string;
    conclusion: string;
    polarity: EvidencePolarity;
    confidence: EvidenceConfidence;
  },
): Omit<EvidenceNode, "id"> {
  const card = getRuleCard(ruleId);
  return {
    rule_id: card.rule_id,
    level: card.level,
    title: card.title,
    line_refs: input.lineRefs,
    premise: input.premise,
    conclusion: input.conclusion,
    polarity: input.polarity,
    weight: card.default_weight,
    confidence: input.confidence,
    source_refs: card.source_refs,
  };
}

function getElementRelation(source: ElementName, target: ElementName): { polarity: EvidencePolarity; conclusion: string } {
  if (source === target) {
    return { polarity: "+", conclusion: "同气相扶，作为稳定的正向证据。" };
  }
  if (GENERATES[source] === target) {
    return { polarity: "+", conclusion: "时间五行生扶用神，作为正向证据。" };
  }
  if (CONTROLS[source] === target) {
    return { polarity: "-", conclusion: "时间五行克制用神，作为阻力证据。" };
  }
  return { polarity: "neutral", conclusion: "时间五行与用神无直接生克，本条作为中性背景。" };
}

function buildVerdict(
  evidence: EvidenceNode[],
  counterEvidence: EvidenceNode[],
  yongshen: YongshenSelection | null,
): RuleAnalysisResult["verdict"] {
  if (!yongshen) {
    return {
      tendency: "learning_only",
      confidence: "中",
      summary: "本场景暂不强行取主用神，仅展示世应、动爻与时间背景，供学习观察。",
    };
  }

  const positiveScore = evidence.filter((node) => node.polarity === "+").reduce((sum, node) => sum + node.weight, 0);
  const negativeScore = counterEvidence.reduce((sum, node) => sum + node.weight, 0);
  const score = positiveScore - negativeScore;
  const tendency = score >= 0.24 ? "supportive" : score <= -0.12 ? "mixed_resistance" : "mixed";

  return {
    tendency,
    confidence: "中",
    summary:
      tendency === "supportive"
        ? "规则证据偏向有支撑，但仍需结合现实信息谨慎判断。"
        : tendency === "mixed_resistance"
          ? "规则证据显示存在阻力或反复，不宜作确定性判断。"
          : "规则证据支持与反证并存，适合作为反思线索而非现实结论。",
  };
}

function buildActionTips(scenario: Scenario): string[] {
  const commonTip = "把卦盘结果当作复盘问题结构的工具，不替代现实沟通、专业意见或个人判断。";
  const scenarioTip =
    scenario === "事业"
      ? "可把关注点拆成岗位匹配、流程文书和沟通节奏三类来观察。"
      : scenario === "财务"
        ? "财务问题应先核对预算、风险承受能力和专业建议。"
        : scenario === "考试"
          ? "考试问题可优先转化为复习计划、材料准备和时间安排。"
          : scenario === "感情"
            ? "关系问题应保留双方意愿和现实沟通空间。"
            : scenario === "失物"
              ? "失物问题可同步回忆时间线、地点和实际查找路径。"
              : "可先把问题改写得更具体，再观察世应和动爻。";
  return [scenarioTip, commonTip];
}

function getLine(chart: CastChartResult, lineNo: number): ChartLine {
  const line = chart.lines.find((item) => item.line_no === lineNo);
  if (!line) {
    throw new Error(`Missing line ${lineNo}`);
  }
  return line;
}
