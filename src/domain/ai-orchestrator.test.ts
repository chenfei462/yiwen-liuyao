import { beforeEach, describe, expect, test, vi } from "vitest";
import { castReading, explainReading, initReading, messageReading, resetReadingStoreForTests } from "./reading-service";

describe("Beta 0.8 AI orchestration", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("streams fake AI explanation from chart, evidence, and knowledge cards", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const events = await explainReading({
      reading_id: init.reading_id,
      mode: "learning",
      stream: true,
    });

    expect(events.map((event) => event.type)).toEqual(["safety", "retrieval", "delta", "delta", "delta", "delta", "delta", "final"]);
    const final = events.at(-1);
    expect(final).toMatchObject({
      type: "final",
      data: {
        summary: expect.stringContaining("证据树"),
        knowledge_card_refs: expect.arrayContaining([expect.stringMatching(/^kc-/)]),
      },
    });
  });

  test("blocks high-risk readings before any model call", async () => {
    const init = await initReading({
      question: "明天买哪只股票一定发财",
      scenario: "财务",
      timezone: "Asia/Shanghai",
    });

    const events = await explainReading({
      reading_id: init.reading_id,
      mode: "light",
      stream: true,
    });

    expect(events[0]).toMatchObject({
      type: "safety",
      data: { status: "blocked", risk_label: "financial" },
    });
    expect(events[1]).toMatchObject({
      type: "final",
      data: { model_metadata: { provider: "safety" } },
    });
    expect(events[1].data).not.toHaveProperty("evidence_tree");
  });

  test("stores follow-up messages and cites evidence for recommended questions", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const events = await messageReading({
      reading_id: init.reading_id,
      message: "为什么取这个用神？",
      followup_type: "why_yongshen",
    });
    const final = events.at(-1);

    expect(final).toMatchObject({
      type: "final",
      data: {
        model_metadata: { provider: "rules", model: "deterministic-followup" },
        key_evidence: [expect.objectContaining({ evidence_id: expect.stringContaining("B-YS-001") })],
      },
    });
    expect(JSON.stringify(final)).not.toContain("申金");
    expect(JSON.stringify(final)).not.toContain("甲午");
  });

  test("answers different recommended follow-ups with targeted summaries", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const whyEvents = await messageReading({
      reading_id: init.reading_id,
      message: "为什么取这个用神？",
      followup_type: "why_yongshen",
    });
    const ruleEvents = await messageReading({
      reading_id: init.reading_id,
      message: "哪条规则最重要？",
      followup_type: "key_rule",
    });

    const whyFinal = whyEvents.find(
      (event): event is Extract<(typeof whyEvents)[number], { type: "final" }> => event.type === "final",
    );
    const ruleFinal = ruleEvents.find(
      (event): event is Extract<(typeof ruleEvents)[number], { type: "final" }> => event.type === "final",
    );

    expect(whyFinal?.data.summary).toContain("用神");
    expect(ruleFinal?.data.summary).toContain("规则");
    expect(whyFinal?.data.summary).not.toBe(ruleFinal?.data.summary);
  });

  test("renders distinct main explanations for each explain mode", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const modes = ["light", "professional", "learning", "story"] as const;
    const finals = await Promise.all(
      modes.map(async (mode) => {
        const events = await explainReading({
          reading_id: init.reading_id,
          mode,
          stream: true,
          force_refresh: true,
        });
        const final = events.find(
          (event): event is Extract<(typeof events)[number], { type: "final" }> => event.type === "final",
        );
        return final?.data;
      }),
    );
    const summaries = finals.map((output) => output?.summary);

    expect(new Set(summaries).size).toBe(4);
    expect(summaries[0]).toContain("大白话");
    expect(summaries[1]).toContain("专业版");
    expect(summaries[2]).toContain("学习版");
    expect(summaries[3]).toContain("剧情");
    expect(finals[0]?.key_evidence[0].plain_explanation).not.toBe(finals[1]?.key_evidence[0].plain_explanation);
  });

  test("gives an exam static Tai reading with concrete liuyao evidence", async () => {
    const init = await initReading({
      question: "明天考试能过吗",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 8, 8, 8],
      cast_time: "2026-05-02",
    });

    const events = await explainReading({
      reading_id: init.reading_id,
      mode: "light",
      stream: true,
      force_refresh: true,
    });
    const final = events.find(
      (event): event is Extract<(typeof events)[number], { type: "final" }> => event.type === "final",
    );
    const text = JSON.stringify(final?.data);

    expect(text).toContain("地天泰");
    expect(text).toContain("静卦");
    expect(text).toContain("父母");
    expect(text).toContain("不显");
    expect(text).toContain("官鬼");
    expect(text).toContain("世爻");
    expect(text).toContain("腾蛇");
    expect(text).toContain("过关机会");
    expect(text).not.toContain("稳过");
    expect(text).not.toContain("必过");
  });

  test("rejects unsafe model output that contains promise wording", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });
    vi.stubEnv("AI_FAKE_UNSAFE_OUTPUT", "true");

    await expect(
      explainReading({
        reading_id: init.reading_id,
        mode: "learning",
        stream: true,
      }),
    ).rejects.toThrow("AI output failed safety validation");

    vi.unstubAllEnvs();
  });
});
