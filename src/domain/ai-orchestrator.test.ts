import { beforeEach, describe, expect, test, vi } from "vitest";
import { castReading, explainReading, initReading, messageReading, resetReadingStoreForTests } from "./reading-service";

describe("Beta 0.8 AI orchestration", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("streams fake AI explanation from chart, evidence, and knowledge cards", async () => {
    const init = initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    castReading({
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
    const init = initReading({
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
    const init = initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    castReading({
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
        key_evidence: [expect.objectContaining({ evidence_id: expect.stringContaining("B-YS-001") })],
      },
    });
  });

  test("rejects unsafe model output that contains promise wording", async () => {
    const init = initReading({
      question: "这次面试有没有机会，想看三周内结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    castReading({
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
