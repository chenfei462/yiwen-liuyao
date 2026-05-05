import { describe, expect, test } from "vitest";
import { castChart } from "./chart-engine";
import { classifyQuestion } from "./safety";
import { CastRequestSchema, InitReadingRequestSchema } from "./contracts";
import { STANDARD_API_ERROR_CASES, STANDARD_CHART_CASES, STANDARD_SAFETY_CASES } from "./standard-cases";

describe("stage-1 standard acceptance cases", () => {
  test("contains exactly 100 standard cases across chart, API, and safety coverage", () => {
    expect(STANDARD_CHART_CASES.length + STANDARD_API_ERROR_CASES.length + STANDARD_SAFETY_CASES.length).toBe(100);
    expect(STANDARD_CHART_CASES.filter((item) => item.category === "static_hexagram")).toHaveLength(64);
    expect(STANDARD_CHART_CASES.filter((item) => item.category === "moving_line")).toHaveLength(12);
    expect(STANDARD_CHART_CASES.filter((item) => item.category === "day_ganzhi")).toHaveLength(12);
  });

  test("passes all chart acceptance cases", () => {
    for (const item of STANDARD_CHART_CASES) {
      const chart = castChart({
        lineValues: item.line_values,
        dayGanzhi: item.day_ganzhi,
      });

      expect(chart.base_chart.name, item.id).toBe(item.expected.base_chart);
      expect(chart.changed_chart.name, item.id).toBe(item.expected.changed_chart);
      expect(chart.base_chart.palace, item.id).toBe(item.expected.palace);
      expect(chart.base_chart.shi_line, item.id).toBe(item.expected.shi_line);
      expect(chart.base_chart.ying_line, item.id).toBe(item.expected.ying_line);
      expect(chart.base_chart.xunkong, item.id).toEqual(item.expected.xunkong);
      if (item.expected.first_liushen) {
        expect(chart.lines[0].liushen, item.id).toBe(item.expected.first_liushen);
      }
    }
  });

  test("passes all API error and safety acceptance cases", () => {
    for (const item of STANDARD_API_ERROR_CASES) {
      expect(() =>
        item.schema === "init" ? InitReadingRequestSchema.parse(item.payload) : CastRequestSchema.parse(item.payload),
      ).toThrow();
    }

    for (const item of STANDARD_SAFETY_CASES) {
      expect(classifyQuestion(item.question)).toMatchObject({
        status: "blocked",
        risk_label: item.expected_risk_label,
      });
    }
  });
});
