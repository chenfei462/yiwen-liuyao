import { describe, expect, test } from "vitest";
import { castChart } from "./chart-engine";
import { analyzeRules } from "./rule-engine";
import type { Scenario } from "./contracts";
import type { SafetyClassification } from "./safety";

const allowedSafety: SafetyClassification = {
  status: "allowed",
  risk_label: "general",
  notice: "仅供娱乐、学习和自我反思。",
};

function analyzeScenario(scenario: Scenario) {
  return analyzeRules({
    readingId: "reading_rule_test",
    question: "这次面试有没有机会",
    scenario,
    mode: "learning",
    safety: allowedSafety,
    chart: castChart({ lineValues: [7, 7, 7, 7, 7, 7], dayGanzhi: "甲戌" }),
    dateContext: {
      cast_time: "2026-04-30",
      day_ganzhi: "甲戌",
      month_branch: "辰",
      month_source: "jieqi_table",
    },
  });
}

describe("Rule Engine v0", () => {
  test("selects the locked yongshen template for each MVP 0.2 scenario", () => {
    expect(analyzeScenario("事业").yongshen).toMatchObject({ line_no: 4, liuqin: "官鬼", role: "主用神" });
    expect(analyzeScenario("财务").yongshen).toMatchObject({ line_no: 2, liuqin: "妻财", role: "主用神" });
    expect(analyzeScenario("考试").yongshen).toMatchObject({ line_no: 3, liuqin: "父母", role: "主用神" });
    expect(analyzeScenario("失物").yongshen).toMatchObject({ line_no: 2, liuqin: "妻财", role: "主用神" });
    expect(analyzeScenario("感情").yongshen).toMatchObject({ line_no: 6, role: "世爻观察" });
    expect(analyzeScenario("其他").yongshen).toBeNull();
  });

  test("generates traceable evidence and counter evidence without AI participation", () => {
    const analysis = analyzeScenario("事业");

    expect(analysis.rule_version).toBe("mvp-0.2-rule-engine-v0");
    expect(analysis.question_type).toBe("事业");
    expect(analysis.evidence_tree.length).toBeGreaterThanOrEqual(3);
    expect(analysis.counter_evidence.length).toBeGreaterThanOrEqual(1);
    expect(analysis.verdict).toMatchObject({ confidence: "中" });
    expect(analysis.action_tips.length).toBeGreaterThan(0);
    expect(analysis.safety_notice).toContain("娱乐");
    expect(analysis.evidence_tree.every((node) => node.id.startsWith("reading_rule_test:"))).toBe(true);
    expect(analysis.evidence_tree.every((node) => node.rule_id.match(/^B-/))).toBe(true);
    expect(analysis.evidence_tree.every((node) => node.source_refs.length > 0)).toBe(true);
  });

  test("does not generate interpretive evidence for blocked safety classifications", () => {
    const analysis = analyzeRules({
      readingId: "reading_blocked",
      question: "明天买哪只股票会发财",
      scenario: "财务",
      mode: "light",
      safety: {
        status: "blocked",
        risk_label: "financial",
        notice: "本工具不提供投资建议。",
      },
      chart: castChart({ lineValues: [7, 7, 7, 7, 7, 7], dayGanzhi: "甲戌" }),
      dateContext: {
        cast_time: "2026-04-30",
        day_ganzhi: "甲戌",
        month_branch: "辰",
        month_source: "jieqi_table",
      },
    });

    expect(analysis.yongshen).toBeNull();
    expect(analysis.evidence_tree).toEqual([]);
    expect(analysis.counter_evidence).toEqual([]);
    expect(analysis.verdict.tendency).toBe("blocked");
  });

  test("moves yongshen dynamic lines into the evidence tree with changed-line context", () => {
    const analysis = analyzeRules({
      readingId: "reading_moving",
      question: "这次面试有没有机会",
      scenario: "事业",
      mode: "professional",
      safety: allowedSafety,
      chart: castChart({ lineValues: [7, 7, 7, 9, 7, 7], dayGanzhi: "甲戌" }),
      dateContext: {
        cast_time: "2026-04-30",
        day_ganzhi: "甲戌",
        month_branch: "辰",
        month_source: "jieqi_table",
      },
    });

    expect(analysis.evidence_tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule_id: "B-DV-001",
          line_refs: [4],
          premise: expect.stringContaining("发动"),
        }),
      ]),
    );
    expect(analysis.counter_evidence.some((node) => node.rule_id === "B-DV-001")).toBe(false);
  });

  test("puts yongshen xunkong into counter evidence", () => {
    const analysis = analyzeRules({
      readingId: "reading_xunkong",
      question: "这次面试有没有机会",
      scenario: "事业",
      mode: "learning",
      safety: allowedSafety,
      chart: castChart({ lineValues: [7, 7, 7, 7, 7, 7], dayGanzhi: "甲申" }),
      dateContext: {
        cast_time: "2026-04-30",
        day_ganzhi: "甲申",
        month_branch: "辰",
        month_source: "jieqi_table",
      },
    });

    expect(analysis.counter_evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule_id: "B-XK-001",
          line_refs: [4],
          conclusion: expect.stringContaining("旬空"),
        }),
      ]),
    );
  });

  test("keeps exam analysis useful when the primary parent line is hidden", () => {
    const analysis = analyzeRules({
      readingId: "reading_exam_tai",
      question: "明天考试能过吗",
      scenario: "考试",
      mode: "light",
      safety: allowedSafety,
      chart: castChart({ lineValues: [7, 7, 7, 8, 8, 8], dayGanzhi: "丙子" }),
      dateContext: {
        cast_time: "2026-05-02",
        day_ganzhi: "丙子",
        month_branch: "辰",
        month_source: "jieqi_table",
      },
    });
    const text = JSON.stringify(analysis);

    expect(analysis.evidence_tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ conclusion: expect.stringContaining("地天泰") }),
        expect.objectContaining({ conclusion: expect.stringContaining("静卦") }),
        expect.objectContaining({ conclusion: expect.stringContaining("世爻") }),
        expect.objectContaining({ conclusion: expect.stringContaining("官鬼") }),
      ]),
    );
    expect(text).toContain("父母");
    expect(text).toContain("不显");
    expect(text).toContain("腾蛇");
    expect(analysis.verdict.summary).toContain("过关机会");
  });
});
