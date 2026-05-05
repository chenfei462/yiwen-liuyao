import type { LineValue } from "./contracts";

type YinYang = "yin" | "yang";
type ElementName = "木" | "火" | "土" | "金" | "水";
type TrigramId = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
type BranchName = "子" | "丑" | "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥";
type StemName = "甲" | "乙" | "丙" | "丁" | "戊" | "己" | "庚" | "辛" | "壬" | "癸";

export type ChartLine = {
  line_no: number;
  value: LineValue;
  yin_yang: YinYang;
  moving: boolean;
  stem: StemName;
  branch: BranchName;
  element: ElementName;
  liuqin: "父母" | "兄弟" | "子孙" | "妻财" | "官鬼";
  liushen: "青龙" | "朱雀" | "勾陈" | "腾蛇" | "白虎" | "玄武";
  changed_branch: BranchName;
  changed_yin_yang: YinYang;
};

export type ChartSummary = {
  name: string;
  upper_trigram: TrigramId;
  lower_trigram: TrigramId;
  palace: TrigramId;
  shi_line: number;
  ying_line: number;
  xunkong: [BranchName, BranchName];
  is_youhun: boolean;
  is_guihun: boolean;
};

export type CastChartInput = {
  lineValues: number[];
  dayGanzhi: string;
};

export type CastChartResult = {
  base_chart: ChartSummary;
  changed_chart: ChartSummary;
  lines: ChartLine[];
};

const TRIGRAMS: Record<TrigramId, { pattern: string; element: ElementName }> = {
  乾: { pattern: "111", element: "金" },
  兑: { pattern: "110", element: "金" },
  离: { pattern: "101", element: "火" },
  震: { pattern: "100", element: "木" },
  巽: { pattern: "011", element: "木" },
  坎: { pattern: "010", element: "水" },
  艮: { pattern: "001", element: "土" },
  坤: { pattern: "000", element: "土" },
};

const TRIGRAM_BY_PATTERN = Object.fromEntries(
  Object.entries(TRIGRAMS).map(([id, value]) => [value.pattern, id]),
) as Record<string, TrigramId>;

const SYMBOL_TO_TRIGRAM: Record<string, TrigramId> = {
  天: "乾",
  泽: "兑",
  火: "离",
  雷: "震",
  风: "巽",
  水: "坎",
  山: "艮",
  地: "坤",
  乾: "乾",
  兑: "兑",
  离: "离",
  震: "震",
  巽: "巽",
  坎: "坎",
  艮: "艮",
  坤: "坤",
};

const PALACE_SEQUENCES: Record<TrigramId, string[]> = {
  乾: ["乾为天", "天风姤", "天山遁", "天地否", "风地观", "山地剥", "火地晋", "火天大有"],
  兑: ["兑为泽", "泽水困", "泽地萃", "泽山咸", "水山蹇", "地山谦", "雷山小过", "雷泽归妹"],
  离: ["离为火", "火山旅", "火风鼎", "火水未济", "山水蒙", "风水涣", "天水讼", "天火同人"],
  震: ["震为雷", "雷地豫", "雷水解", "雷风恒", "地风升", "水风井", "泽风大过", "泽雷随"],
  巽: ["巽为风", "风天小畜", "风火家人", "风雷益", "天雷无妄", "火雷噬嗑", "山雷颐", "山风蛊"],
  坎: ["坎为水", "水泽节", "水雷屯", "水火既济", "泽火革", "雷火丰", "地火明夷", "地水师"],
  艮: ["艮为山", "山火贲", "山天大畜", "山泽损", "火泽睽", "天泽履", "风泽中孚", "风山渐"],
  坤: ["坤为地", "地雷复", "地泽临", "地天泰", "雷天大壮", "泽天夬", "水天需", "水地比"],
};

const SHI_LINES = [6, 1, 2, 3, 4, 5, 4, 3] as const;

const NAIJIA: Record<
  TrigramId,
  {
    inner: Array<{ stem: StemName; branch: BranchName }>;
    outer: Array<{ stem: StemName; branch: BranchName }>;
  }
> = {
  乾: {
    inner: [
      { stem: "甲", branch: "子" },
      { stem: "甲", branch: "寅" },
      { stem: "甲", branch: "辰" },
    ],
    outer: [
      { stem: "壬", branch: "午" },
      { stem: "壬", branch: "申" },
      { stem: "壬", branch: "戌" },
    ],
  },
  坤: {
    inner: [
      { stem: "乙", branch: "未" },
      { stem: "乙", branch: "巳" },
      { stem: "乙", branch: "卯" },
    ],
    outer: [
      { stem: "癸", branch: "丑" },
      { stem: "癸", branch: "亥" },
      { stem: "癸", branch: "酉" },
    ],
  },
  震: {
    inner: [
      { stem: "庚", branch: "子" },
      { stem: "庚", branch: "寅" },
      { stem: "庚", branch: "辰" },
    ],
    outer: [
      { stem: "庚", branch: "午" },
      { stem: "庚", branch: "申" },
      { stem: "庚", branch: "戌" },
    ],
  },
  巽: {
    inner: [
      { stem: "辛", branch: "丑" },
      { stem: "辛", branch: "亥" },
      { stem: "辛", branch: "酉" },
    ],
    outer: [
      { stem: "辛", branch: "未" },
      { stem: "辛", branch: "巳" },
      { stem: "辛", branch: "卯" },
    ],
  },
  坎: {
    inner: [
      { stem: "戊", branch: "寅" },
      { stem: "戊", branch: "辰" },
      { stem: "戊", branch: "午" },
    ],
    outer: [
      { stem: "戊", branch: "申" },
      { stem: "戊", branch: "戌" },
      { stem: "戊", branch: "子" },
    ],
  },
  离: {
    inner: [
      { stem: "己", branch: "卯" },
      { stem: "己", branch: "丑" },
      { stem: "己", branch: "亥" },
    ],
    outer: [
      { stem: "己", branch: "酉" },
      { stem: "己", branch: "未" },
      { stem: "己", branch: "巳" },
    ],
  },
  艮: {
    inner: [
      { stem: "丙", branch: "辰" },
      { stem: "丙", branch: "午" },
      { stem: "丙", branch: "申" },
    ],
    outer: [
      { stem: "丙", branch: "戌" },
      { stem: "丙", branch: "子" },
      { stem: "丙", branch: "寅" },
    ],
  },
  兑: {
    inner: [
      { stem: "丁", branch: "巳" },
      { stem: "丁", branch: "卯" },
      { stem: "丁", branch: "丑" },
    ],
    outer: [
      { stem: "丁", branch: "亥" },
      { stem: "丁", branch: "酉" },
      { stem: "丁", branch: "未" },
    ],
  },
};

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

const LIUSHEN_ORDER = ["青龙", "朱雀", "勾陈", "腾蛇", "白虎", "玄武"] as const;
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const XUNKONG_BY_XUN_START: Record<number, [BranchName, BranchName]> = {
  0: ["戌", "亥"],
  10: ["申", "酉"],
  20: ["午", "未"],
  30: ["辰", "巳"],
  40: ["寅", "卯"],
  50: ["子", "丑"],
};

const HEXAGRAMS = buildHexagramLookup();

export function castChart(input: CastChartInput): CastChartResult {
  if (input.lineValues.length !== 6) {
    throw new Error("lineValues must contain exactly six bottom-to-top values");
  }

  const lineValues = input.lineValues.map((value) => {
    if (!isLineValue(value)) {
      throw new Error("lineValues may only contain 6, 7, 8, or 9");
    }
    return value;
  });

  const baseYinYang = lineValues.map(valueToYinYang);
  const changedYinYang = lineValues.map((value) =>
    isMoving(value) ? flipYinYang(valueToYinYang(value)) : valueToYinYang(value),
  );
  const baseTrigrams = getTrigrams(baseYinYang);
  const changedTrigrams = getTrigrams(changedYinYang);
  const baseHexagram = lookupHexagram(baseTrigrams.upper, baseTrigrams.lower);
  const changedHexagram = lookupHexagram(changedTrigrams.upper, changedTrigrams.lower);
  const xunkong = getXunkong(input.dayGanzhi);

  return {
    base_chart: { ...baseHexagram, xunkong },
    changed_chart: { ...changedHexagram, xunkong },
    lines: buildLines(lineValues, baseTrigrams, changedTrigrams, baseHexagram.palace, input.dayGanzhi),
  };
}

function buildLines(
  lineValues: LineValue[],
  baseTrigrams: { upper: TrigramId; lower: TrigramId },
  changedTrigrams: { upper: TrigramId; lower: TrigramId },
  palace: TrigramId,
  dayGanzhi: string,
): ChartLine[] {
  const dayStem = parseDayStem(dayGanzhi);
  return lineValues.map((value, index) => {
    const lineNo = index + 1;
    const baseNajia = getNajiaForLine(baseTrigrams, lineNo);
    const changedNajia = getNajiaForLine(changedTrigrams, lineNo);
    const element = BRANCH_ELEMENTS[baseNajia.branch];

    return {
      line_no: lineNo,
      value,
      yin_yang: valueToYinYang(value),
      moving: isMoving(value),
      stem: baseNajia.stem,
      branch: baseNajia.branch,
      element,
      liuqin: getLiuqin(TRIGRAMS[palace].element, element),
      liushen: getLiushen(dayStem, index),
      changed_branch: changedNajia.branch,
      changed_yin_yang: isMoving(value) ? flipYinYang(valueToYinYang(value)) : valueToYinYang(value),
    };
  });
}

function buildHexagramLookup(): Record<string, Omit<ChartSummary, "xunkong">> {
  const entries: Record<string, Omit<ChartSummary, "xunkong">> = {};

  for (const [palace, names] of Object.entries(PALACE_SEQUENCES) as Array<[TrigramId, string[]]>) {
    names.forEach((name, index) => {
      const { upper, lower } = parseHexagramName(name);
      const shiLine = SHI_LINES[index];
      const yingLine = getYingLine(shiLine);
      entries[getHexagramKey(upper, lower)] = {
        name,
        upper_trigram: upper,
        lower_trigram: lower,
        palace,
        shi_line: shiLine,
        ying_line: yingLine,
        is_youhun: index === 6,
        is_guihun: index === 7,
      };
    });
  }

  return entries;
}

function parseHexagramName(name: string): { upper: TrigramId; lower: TrigramId } {
  if (name.includes("为")) {
    const trigram = SYMBOL_TO_TRIGRAM[name[0]];
    return { upper: trigram, lower: trigram };
  }

  const upper = SYMBOL_TO_TRIGRAM[name[0]];
  const lower = SYMBOL_TO_TRIGRAM[name[1]];
  if (!upper || !lower) {
    throw new Error(`Unknown hexagram name: ${name}`);
  }
  return { upper, lower };
}

function getTrigrams(lines: YinYang[]): { upper: TrigramId; lower: TrigramId } {
  const lower = TRIGRAM_BY_PATTERN[lines.slice(0, 3).map(yinYangToBit).join("")];
  const upper = TRIGRAM_BY_PATTERN[lines.slice(3, 6).map(yinYangToBit).join("")];
  if (!upper || !lower) {
    throw new Error("Unable to resolve trigrams from line values");
  }
  return { upper, lower };
}

function lookupHexagram(upper: TrigramId, lower: TrigramId): Omit<ChartSummary, "xunkong"> {
  const hexagram = HEXAGRAMS[getHexagramKey(upper, lower)];
  if (!hexagram) {
    throw new Error(`No hexagram data for ${upper}-${lower}`);
  }
  return hexagram;
}

function getHexagramKey(upper: TrigramId, lower: TrigramId): string {
  return `${upper}-${lower}`;
}

function getNajiaForLine(trigrams: { upper: TrigramId; lower: TrigramId }, lineNo: number) {
  if (lineNo <= 3) {
    return NAIJIA[trigrams.lower].inner[lineNo - 1];
  }
  return NAIJIA[trigrams.upper].outer[lineNo - 4];
}

function getLiuqin(palaceElement: ElementName, lineElement: ElementName): ChartLine["liuqin"] {
  if (lineElement === palaceElement) return "兄弟";
  if (GENERATES[lineElement] === palaceElement) return "父母";
  if (GENERATES[palaceElement] === lineElement) return "子孙";
  if (CONTROLS[palaceElement] === lineElement) return "妻财";
  if (CONTROLS[lineElement] === palaceElement) return "官鬼";
  throw new Error(`Unable to derive liuqin for ${palaceElement}/${lineElement}`);
}

function getLiushen(dayStem: StemName, lineIndex: number): ChartLine["liushen"] {
  const startIndex =
    dayStem === "甲" || dayStem === "乙"
      ? 0
      : dayStem === "丙" || dayStem === "丁"
        ? 1
        : dayStem === "戊"
          ? 2
          : dayStem === "己"
            ? 3
            : dayStem === "庚" || dayStem === "辛"
              ? 4
              : 5;
  return LIUSHEN_ORDER[(startIndex + lineIndex) % LIUSHEN_ORDER.length];
}

function getXunkong(dayGanzhi: string): [BranchName, BranchName] {
  const stem = parseDayStem(dayGanzhi);
  const branch = parseDayBranch(dayGanzhi);
  const index = getGanzhiIndex(stem, branch);
  const xunStart = Math.floor(index / 10) * 10;
  return XUNKONG_BY_XUN_START[xunStart];
}

function getGanzhiIndex(stem: StemName, branch: BranchName): number {
  for (let index = 0; index < 60; index += 1) {
    if (STEMS[index % STEMS.length] === stem && BRANCHES[index % BRANCHES.length] === branch) {
      return index;
    }
  }
  throw new Error(`Invalid ganzhi day: ${stem}${branch}`);
}

function getYingLine(shiLine: number): number {
  return shiLine <= 3 ? shiLine + 3 : shiLine - 3;
}

function parseDayStem(dayGanzhi: string): StemName {
  const stem = dayGanzhi[0] as StemName | undefined;
  if (!stem || !STEMS.includes(stem)) {
    throw new Error("dayGanzhi must start with a valid heavenly stem");
  }
  return stem;
}

function parseDayBranch(dayGanzhi: string): BranchName {
  const branch = dayGanzhi[1] as BranchName | undefined;
  if (!branch || !BRANCHES.includes(branch)) {
    throw new Error("dayGanzhi must include a valid earthly branch");
  }
  return branch;
}

function isLineValue(value: number): value is LineValue {
  return value === 6 || value === 7 || value === 8 || value === 9;
}

function valueToYinYang(value: LineValue): YinYang {
  return value % 2 === 1 ? "yang" : "yin";
}

function yinYangToBit(yinYang: YinYang): string {
  return yinYang === "yang" ? "1" : "0";
}

function isMoving(value: LineValue): boolean {
  return value === 6 || value === 9;
}

function flipYinYang(yinYang: YinYang): YinYang {
  return yinYang === "yang" ? "yin" : "yang";
}
