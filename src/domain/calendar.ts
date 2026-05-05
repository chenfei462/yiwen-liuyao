export const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export type StemName = (typeof HEAVENLY_STEMS)[number];
export type BranchName = (typeof EARTHLY_BRANCHES)[number];
export type DayGanzhi = `${StemName}${BranchName}`;
export type MonthSource = "explicit" | "jieqi_table";

const DAY_MS = 86_400_000;
const JIA_ZI_ANCHOR_UTC = Date.UTC(1984, 0, 31);
const XUNKONG_BY_XUN_START: Record<number, [BranchName, BranchName]> = {
  0: ["戌", "亥"],
  10: ["申", "酉"],
  20: ["午", "未"],
  30: ["辰", "巳"],
  40: ["寅", "卯"],
  50: ["子", "丑"],
};

const JIEQI_MONTH_STARTS: Array<{ date: string; branch: BranchName }> = [
  { date: "2023-12-07", branch: "子" },
  { date: "2024-01-06", branch: "丑" },
  { date: "2024-02-04", branch: "寅" },
  { date: "2024-03-05", branch: "卯" },
  { date: "2024-04-04", branch: "辰" },
  { date: "2024-05-05", branch: "巳" },
  { date: "2024-06-05", branch: "午" },
  { date: "2024-07-06", branch: "未" },
  { date: "2024-08-07", branch: "申" },
  { date: "2024-09-07", branch: "酉" },
  { date: "2024-10-08", branch: "戌" },
  { date: "2024-11-07", branch: "亥" },
  { date: "2024-12-06", branch: "子" },
  { date: "2025-01-05", branch: "丑" },
  { date: "2025-02-03", branch: "寅" },
  { date: "2025-03-05", branch: "卯" },
  { date: "2025-04-04", branch: "辰" },
  { date: "2025-05-05", branch: "巳" },
  { date: "2025-06-05", branch: "午" },
  { date: "2025-07-07", branch: "未" },
  { date: "2025-08-07", branch: "申" },
  { date: "2025-09-07", branch: "酉" },
  { date: "2025-10-08", branch: "戌" },
  { date: "2025-11-07", branch: "亥" },
  { date: "2025-12-07", branch: "子" },
  { date: "2026-01-05", branch: "丑" },
  { date: "2026-02-04", branch: "寅" },
  { date: "2026-03-05", branch: "卯" },
  { date: "2026-04-05", branch: "辰" },
  { date: "2026-05-05", branch: "巳" },
  { date: "2026-06-05", branch: "午" },
  { date: "2026-07-07", branch: "未" },
  { date: "2026-08-07", branch: "申" },
  { date: "2026-09-07", branch: "酉" },
  { date: "2026-10-08", branch: "戌" },
  { date: "2026-11-07", branch: "亥" },
  { date: "2026-12-07", branch: "子" },
  { date: "2027-01-05", branch: "丑" },
  { date: "2027-02-04", branch: "寅" },
  { date: "2027-03-06", branch: "卯" },
  { date: "2027-04-05", branch: "辰" },
  { date: "2027-05-06", branch: "巳" },
  { date: "2027-06-06", branch: "午" },
  { date: "2027-07-07", branch: "未" },
  { date: "2027-08-08", branch: "申" },
  { date: "2027-09-08", branch: "酉" },
  { date: "2027-10-08", branch: "戌" },
  { date: "2027-11-07", branch: "亥" },
  { date: "2027-12-07", branch: "子" },
];

export function getDayGanzhiForDate(civilDate: string | Date): DayGanzhi {
  const date = toCivilDateParts(civilDate);
  const utc = Date.UTC(date.year, date.month - 1, date.day);
  const dayOffset = Math.round((utc - JIA_ZI_ANCHOR_UTC) / DAY_MS);
  const index = positiveModulo(dayOffset, 60);
  return `${HEAVENLY_STEMS[index % 10]}${EARTHLY_BRANCHES[index % 12]}` as DayGanzhi;
}

export function resolveDayGanzhi(input: { dayGanzhi?: string; castTime?: string | Date }): DayGanzhi {
  if (input.dayGanzhi) {
    return parseDayGanzhi(input.dayGanzhi);
  }
  if (input.castTime) {
    return getDayGanzhiForDate(input.castTime);
  }
  return getDayGanzhiForDate(new Date());
}

export function resolveMonthBranch(input: {
  monthBranch?: string;
  castTime?: string | Date;
}): { monthBranch: BranchName; monthSource: MonthSource } {
  if (input.monthBranch) {
    return {
      monthBranch: parseMonthBranch(input.monthBranch),
      monthSource: "explicit",
    };
  }

  const castTime = input.castTime ?? new Date();
  return {
    monthBranch: getMonthBranchForDate(castTime),
    monthSource: "jieqi_table",
  };
}

export function parseMonthBranch(value: string): BranchName {
  const branch = value.trim() as BranchName;
  if (!EARTHLY_BRANCHES.includes(branch)) {
    throw new Error("month_branch must be a valid earthly branch");
  }
  return branch;
}

export function parseDayGanzhi(value: string): DayGanzhi {
  const stem = value[0] as StemName | undefined;
  const branch = value[1] as BranchName | undefined;
  if (!stem || !branch || !HEAVENLY_STEMS.includes(stem) || !EARTHLY_BRANCHES.includes(branch)) {
    throw new Error("day_ganzhi must be a valid heavenly-stem and earthly-branch pair");
  }
  return `${stem}${branch}` as DayGanzhi;
}

export function getGanzhiIndex(dayGanzhi: string): number {
  const parsed = parseDayGanzhi(dayGanzhi);
  const stem = parsed[0] as StemName;
  const branch = parsed[1] as BranchName;
  for (let index = 0; index < 60; index += 1) {
    if (HEAVENLY_STEMS[index % 10] === stem && EARTHLY_BRANCHES[index % 12] === branch) {
      return index;
    }
  }
  throw new Error(`Invalid day_ganzhi: ${dayGanzhi}`);
}

export function getXunkong(dayGanzhi: string): [BranchName, BranchName] {
  const index = getGanzhiIndex(dayGanzhi);
  return XUNKONG_BY_XUN_START[Math.floor(index / 10) * 10];
}

export function isDateSupportedByJieqiTable(civilDate: string | Date): boolean {
  const { year } = toCivilDateParts(civilDate);
  return year >= 2024 && year <= 2027;
}

function getMonthBranchForDate(civilDate: string | Date): BranchName {
  if (!isDateSupportedByJieqiTable(civilDate)) {
    throw new Error("month_branch is required for dates outside the 2024-2027 jieqi table");
  }

  const dateKey = toCivilDateKey(civilDate);
  const matched = [...JIEQI_MONTH_STARTS].reverse().find((entry) => entry.date <= dateKey);
  if (!matched) {
    throw new Error("month_branch is required for dates outside the 2024-2027 jieqi table");
  }
  return matched.branch;
}

function toCivilDateKey(input: string | Date): string {
  const date = toCivilDateParts(input);
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function toCivilDateParts(input: string | Date): { year: number; month: number; day: number } {
  if (input instanceof Date) {
    return {
      year: input.getFullYear(),
      month: input.getMonth() + 1,
      day: input.getDate(),
    };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
  if (!match) {
    throw new Error("cast_time must start with YYYY-MM-DD");
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}
