export type RiskLabel =
  | "general"
  | "medical"
  | "legal"
  | "financial"
  | "self_harm"
  | "minor"
  | "ritual_payment"
  | "relationship_control";

export type SafetyClassification =
  | {
      status: "allowed";
      risk_label: "general";
      notice: string;
    }
  | {
      status: "blocked";
      risk_label: Exclude<RiskLabel, "general">;
      notice: string;
    };

const RISK_RULES: Array<{
  label: Exclude<RiskLabel, "general">;
  keywords: string[];
  notice: string;
}> = [
  {
    label: "self_harm",
    keywords: ["不想活", "自杀", "轻生", "结束生命", "伤害自己"],
    notice: "如果你有伤害自己的想法，请立刻联系当地紧急服务、可信赖的人或专业危机干预热线。本工具不能处理危机场景。",
  },
  {
    label: "medical",
    keywords: ["癌症", "停药", "药量", "诊断", "手术", "病", "怀孕", "医生"],
    notice: "健康问题请以正规医疗机构和医生建议为准。本工具不能诊断疾病、判断疗效或建议用药。",
  },
  {
    label: "legal",
    keywords: ["坐牢", "起诉", "判刑", "离婚协议", "律师", "合同纠纷"],
    notice: "法律问题请咨询具备资质的律师或相关机构。本工具不提供法律结论。",
  },
  {
    label: "financial",
    keywords: ["股票", "基金", "期货", "贷款", "赌博", "收益", "投资哪只"],
    notice: "财务和投资具有风险，请依据专业建议和自身风险承受能力决策。本工具不提供投资建议。",
  },
  {
    label: "minor",
    keywords: ["未成年", "未满18", "初中生", "小学生"],
    notice: "未成年人相关内容需要更高保护。本工具仅提供传统文化学习与娱乐说明，不处理敏感决策。",
  },
  {
    label: "ritual_payment",
    keywords: ["改命", "消灾", "法事", "符咒", "包准", "转运付费"],
    notice: "本产品不提供改命、消灾、法事、包准或高风险付费服务。",
  },
  {
    label: "relationship_control",
    keywords: ["让他回头", "挽回包成功", "控制他", "拆散", "第三者消失"],
    notice: "关系问题涉及双方意愿与现实沟通。本工具不能保证或诱导任何人改变想法。",
  },
];

export function classifyQuestion(question: string): SafetyClassification {
  const normalized = question.replace(/\s+/g, "").toLowerCase();
  const matched = RISK_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  if (matched) {
    return {
      status: "blocked",
      risk_label: matched.label,
      notice: matched.notice,
    };
  }

  return {
    status: "allowed",
    risk_label: "general",
    notice: "本解读基于传统文化中的六爻体系生成，仅供娱乐、学习和自我反思，不构成现实决策建议。",
  };
}
