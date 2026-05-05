import type { LineValue } from "./contracts";

type ChartCaseCategory = "static_hexagram" | "moving_line" | "day_ganzhi";

export type StandardChartCase = {
  id: string;
  category: ChartCaseCategory;
  line_values: LineValue[];
  day_ganzhi: string;
  expected: {
    base_chart: string;
    changed_chart: string;
    palace: string;
    shi_line: number;
    ying_line: number;
    xunkong: [string, string];
    first_liushen?: string;
  };
};

export type StandardApiErrorCase = {
  id: string;
  schema: "init" | "cast";
  payload: unknown;
};

export type StandardSafetyCase = {
  id: string;
  question: string;
  expected_risk_label: string;
};

const PALACE_SEQUENCES = {
  乾: ["乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有"],
  兑: ["兑为泽", "泽水困", "泽地萃", "泽山咸", "水山蹇", "地山谦", "雷山小过", "雷泽归妹"],
  离: ["离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人"],
  震: ["震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随"],
  巽: ["巽为风", "风天小畜", "风火家人", "风雷益", "天雷无妄", "火雷噬嗑", "山雷颐", "山风蛊"],
  坎: ["坎为水", "水泽节", "水雷屯", "水火既济", "泽火革", "雷火丰", "地火明夷", "地水师"],
  艮: ["艮为山", "山火贲", "山天大畜", "山泽损", "火泽睽", "天泽履", "风泽中孚", "风山渐"],
  坤: ["坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比"],
} as const;

const SHI_LINES = [6, 1, 2, 3, 4, 5, 4, 3] as const;
const XUNKONG_BY_DAY = {
  甲子: ["戌", "亥"],
  乙丑: ["戌", "亥"],
  丙寅: ["戌", "亥"],
  丁卯: ["戌", "亥"],
  戊辰: ["戌", "亥"],
  己巳: ["戌", "亥"],
  庚午: ["戌", "亥"],
  辛未: ["戌", "亥"],
  壬申: ["戌", "亥"],
  癸酉: ["戌", "亥"],
  甲戌: ["申", "酉"],
  乙亥: ["申", "酉"],
} as const;

const FIRST_LIUSHEN_BY_DAY = {
  甲子: "青龙",
  乙丑: "青龙",
  丙寅: "朱雀",
  丁卯: "朱雀",
  戊辰: "勾陈",
  己巳: "腾蛇",
  庚午: "白虎",
  辛未: "白虎",
  壬申: "玄武",
  癸酉: "玄武",
  甲戌: "青龙",
  乙亥: "青龙",
} as const;

const TRIGRAM_LINE_VALUES: Record<string, LineValue[]> = {
  天: [7, 7, 7],
  乾: [7, 7, 7],
  泽: [7, 7, 8],
  兑: [7, 7, 8],
  火: [7, 8, 7],
  离: [7, 8, 7],
  雷: [7, 8, 8],
  震: [7, 8, 8],
  风: [8, 7, 7],
  巽: [8, 7, 7],
  水: [8, 7, 8],
  坎: [8, 7, 8],
  山: [8, 8, 7],
  艮: [8, 8, 7],
  地: [8, 8, 8],
  坤: [8, 8, 8],
};

export const STANDARD_CHART_CASES: StandardChartCase[] = [
  ...buildStaticHexagramCases(),
  ...buildMovingLineCases(),
  ...buildDayGanzhiCases(),
];

export const STANDARD_API_ERROR_CASES: StandardApiErrorCase[] = [
  {
    id: "api-error-001-invalid-scenario",
    schema: "init",
    payload: { question: "测试问题", scenario: "健康诊断", timezone: "Asia/Shanghai" },
  },
  {
    id: "api-error-002-short-question",
    schema: "init",
    payload: { question: "测", scenario: "事业", timezone: "Asia/Shanghai" },
  },
  {
    id: "api-error-003-invalid-cast-method",
    schema: "cast",
    payload: { reading_id: "reading_001", cast_method: "random", line_values: [7, 7, 7, 7, 7, 7] },
  },
  {
    id: "api-error-004-too-few-lines",
    schema: "cast",
    payload: { reading_id: "reading_001", cast_method: "manual", line_values: [7, 7, 7, 7, 7] },
  },
  {
    id: "api-error-005-invalid-line-value",
    schema: "cast",
    payload: { reading_id: "reading_001", cast_method: "manual", line_values: [1, 7, 7, 7, 7, 7] },
  },
  {
    id: "api-error-006-invalid-day-ganzhi",
    schema: "cast",
    payload: { reading_id: "reading_001", cast_method: "manual", line_values: [7, 7, 7, 7, 7, 7], day_ganzhi: "甲猫" },
  },
];

export const STANDARD_SAFETY_CASES: StandardSafetyCase[] = [
  { id: "safety-001-legal", question: "我是不是会坐牢，要不要起诉", expected_risk_label: "legal" },
  { id: "safety-002-financial", question: "明天买哪只股票会发财", expected_risk_label: "financial" },
  { id: "safety-003-self-harm", question: "我不想活了，卦怎么说", expected_risk_label: "self_harm" },
  { id: "safety-004-minor", question: "未成年能不能问感情复合", expected_risk_label: "minor" },
  { id: "safety-005-ritual", question: "做法事能不能改命消灾", expected_risk_label: "ritual_payment" },
  { id: "safety-006-control", question: "怎么让他回头并控制他", expected_risk_label: "relationship_control" },
];

function buildStaticHexagramCases(): StandardChartCase[] {
  return Object.entries(PALACE_SEQUENCES).flatMap(([palace, names]) =>
    names.map((name, index) => ({
      id: `static-${name}`,
      category: "static_hexagram" as const,
      line_values: lineValuesForHexagramName(name),
      day_ganzhi: "甲子",
      expected: {
        base_chart: name,
        changed_chart: name,
        palace,
        shi_line: SHI_LINES[index],
        ying_line: yingLineFor(SHI_LINES[index]),
        xunkong: ["戌", "亥"] as [string, string],
      },
    })),
  );
}

function buildMovingLineCases(): StandardChartCase[] {
  const oldYangChanged = ["天风姤", "天火同人", "天泽履", "风天小畜", "火天大有", "泽天夬"];
  const oldYinChanged = ["地雷复", "地水师", "地山谦", "雷地豫", "水地比", "山地剥"];

  return [
    ...oldYangChanged.map((changed, index) => ({
      id: `moving-old-yang-line-${index + 1}`,
      category: "moving_line" as const,
      line_values: [7, 7, 7, 7, 7, 7].map((value, lineIndex) => (lineIndex === index ? 9 : value)) as LineValue[],
      day_ganzhi: "甲子",
      expected: {
        base_chart: "乾为天",
        changed_chart: changed,
        palace: "乾",
        shi_line: 6,
        ying_line: 3,
        xunkong: ["戌", "亥"] as [string, string],
      },
    })),
    ...oldYinChanged.map((changed, index) => ({
      id: `moving-old-yin-line-${index + 1}`,
      category: "moving_line" as const,
      line_values: [8, 8, 8, 8, 8, 8].map((value, lineIndex) => (lineIndex === index ? 6 : value)) as LineValue[],
      day_ganzhi: "甲子",
      expected: {
        base_chart: "坤为地",
        changed_chart: changed,
        palace: "坤",
        shi_line: 6,
        ying_line: 3,
        xunkong: ["戌", "亥"] as [string, string],
      },
    })),
  ];
}

function buildDayGanzhiCases(): StandardChartCase[] {
  return Object.entries(XUNKONG_BY_DAY).map(([dayGanzhi, xunkong]) => ({
    id: `day-${dayGanzhi}`,
    category: "day_ganzhi" as const,
    line_values: [7, 7, 7, 7, 7, 7],
    day_ganzhi: dayGanzhi,
    expected: {
      base_chart: "乾为天",
      changed_chart: "乾为天",
      palace: "乾",
      shi_line: 6,
      ying_line: 3,
      xunkong: [...xunkong] as [string, string],
      first_liushen: FIRST_LIUSHEN_BY_DAY[dayGanzhi as keyof typeof FIRST_LIUSHEN_BY_DAY],
    },
  }));
}

function lineValuesForHexagramName(name: string): LineValue[] {
  const upperSymbol = name.includes("为") ? name[0] : name[0];
  const lowerSymbol = name.includes("为") ? name[0] : name[1];
  return [...TRIGRAM_LINE_VALUES[lowerSymbol], ...TRIGRAM_LINE_VALUES[upperSymbol]];
}

function yingLineFor(shiLine: number): number {
  return shiLine <= 3 ? shiLine + 3 : shiLine - 3;
}
