import { describe, expect, test } from "vitest";
import { getDayGanzhiForDate, resolveDayGanzhi, resolveMonthBranch } from "./calendar";

describe("calendar day ganzhi baseline", () => {
  test("calculates day ganzhi from a civil date using the stage-1 anchor", () => {
    expect(getDayGanzhiForDate("1984-01-31")).toBe("甲子");
    expect(getDayGanzhiForDate("1984-02-09")).toBe("癸酉");
    expect(getDayGanzhiForDate("1984-02-11")).toBe("乙亥");
    expect(getDayGanzhiForDate("2026-04-30")).toBe("甲戌");
  });

  test("prefers explicit day_ganzhi over cast_time when both are present", () => {
    expect(resolveDayGanzhi({ dayGanzhi: "丙寅", castTime: "2026-04-30" })).toBe("丙寅");
  });

  test("falls back to cast_time when day_ganzhi is omitted", () => {
    expect(resolveDayGanzhi({ castTime: "2026-04-30" })).toBe("甲戌");
  });

  test("resolves the MVP 0.2 month branch from explicit input or the 2024-2027 jieqi table", () => {
    expect(resolveMonthBranch({ monthBranch: "午", castTime: "2026-04-30" })).toEqual({
      monthBranch: "午",
      monthSource: "explicit",
    });
    expect(resolveMonthBranch({ castTime: "2026-04-30" })).toEqual({
      monthBranch: "辰",
      monthSource: "jieqi_table",
    });
    expect(resolveMonthBranch({ castTime: "2026-05-06" })).toEqual({
      monthBranch: "巳",
      monthSource: "jieqi_table",
    });
  });

  test("requires explicit month_branch for dates outside the MVP 0.2 jieqi table", () => {
    expect(() => resolveMonthBranch({ castTime: "2028-01-01" })).toThrow("month_branch is required");
  });
});
