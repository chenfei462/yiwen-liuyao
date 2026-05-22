import { beforeEach, describe, expect, test } from "vitest";
import {
  analyzeReading,
  castReading,
  deleteReadingHistory,
  explainReading,
  initReading,
  listReadingHistory,
  listReadingMessages,
  messageReading,
  queryKnowledgeCards,
  resetReadingStoreForTests,
  setReadingSnapshotStoreForTests,
} from "./reading-service";

describe("reading service stage-1 persistence", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
    setReadingSnapshotStoreForTests(null);
  });

  test("uses explicit day_ganzhi for cast facts and stores a desensitized history record", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内的结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });

    const cast = await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
      day_ganzhi: "甲戌",
    });

    expect(cast.day_ganzhi).toBe("甲戌");
    expect(cast.base_chart.xunkong).toEqual(["申", "酉"]);

    const [historyItem] = await listReadingHistory();
    expect(historyItem).toMatchObject({
      reading_id: init.reading_id,
      scenario: "事业",
      base_chart: "乾为天",
      changed_chart: "乾为天",
    });
    expect(historyItem.question_preview).toContain("这次面试");
    expect(historyItem).not.toHaveProperty("question");
  });

  test("derives day_ganzhi from cast_time and deletes history records", async () => {
    const init = await initReading({
      question: "这次考试如何复习更稳",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });

    const cast = await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    expect(cast.day_ganzhi).toBe("甲戌");
    expect(await listReadingHistory()).toHaveLength(1);
    expect(await deleteReadingHistory(init.reading_id)).toEqual({ deleted: true });
    expect(await listReadingHistory()).toHaveLength(0);
  });

  test("time cast derives deterministic six lines and stores a time-method history record", async () => {
    const init = await initReading({
      question: "今天用时间起卦看看项目复盘重点",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });

    const cast = await castReading({
      reading_id: init.reading_id,
      cast_method: "time",
      cast_time: "2026-05-05",
    });

    expect(cast.cast_method).toBe("time");
    expect(cast.lines).toHaveLength(6);
    expect(cast.lines.map((line) => line.value).every((value) => [6, 7, 8, 9].includes(value))).toBe(true);
    expect(cast.lines.some((line) => line.moving)).toBe(true);

    const [historyItem] = await listReadingHistory();
    expect(historyItem).toMatchObject({
      reading_id: init.reading_id,
      scenario: "事业",
      cast_method: "time",
    });
  });

  test("analyzes a cast chart into a traceable MVP 0.2 evidence tree", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内的结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });

    const cast = await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });
    const analysis = await analyzeReading({
      reading_id: init.reading_id,
      mode: "learning",
    });

    expect(cast.month_branch).toBe("辰");
    expect(cast.month_source).toBe("jieqi_table");
    expect(analysis).toMatchObject({
      reading_id: init.reading_id,
      mode: "learning",
      rule_version: "mvp-0.2-rule-engine-v0",
      question_type: "事业",
      yongshen: { line_no: 4, liuqin: "官鬼", reason_rule_id: "B-YS-001" },
    });
    expect(analysis.evidence_tree.length).toBeGreaterThanOrEqual(3);
    expect(analysis.counter_evidence.length).toBeGreaterThanOrEqual(1);
    expect(analysis.evidence_tree.every((node) => node.rule_id.startsWith("B-"))).toBe(true);

    const cached = await analyzeReading({
      reading_id: init.reading_id,
      mode: "learning",
    });
    const refreshed = await analyzeReading({
      reading_id: init.reading_id,
      mode: "learning",
      force_refresh: true,
    });
    expect(cached.evidence_tree).toEqual(analysis.evidence_tree);
    expect(refreshed.evidence_tree).toEqual(analysis.evidence_tree);
  });

  test("does not analyze high-risk blocked readings into evidence", async () => {
    const init = await initReading({
      question: "明天买哪只股票会发财",
      scenario: "财务",
      timezone: "Asia/Shanghai",
    });

    const analysis = await analyzeReading({
      reading_id: init.reading_id,
      mode: "light",
    });

    expect(analysis.yongshen).toBeNull();
    expect(analysis.evidence_tree).toEqual([]);
    expect(analysis.safety_status.status).toBe("blocked");
  });

  test("explains a reading with retrieved knowledge cards and stores follow-up messages", async () => {
    const init = await initReading({
      question: "这次面试有没有机会，想看三周内的结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const explainEvents = await explainReading({
      reading_id: init.reading_id,
      mode: "learning",
      stream: true,
    });
    const retrieval = explainEvents.find(
      (event): event is Extract<(typeof explainEvents)[number], { type: "retrieval" }> => event.type === "retrieval",
    );
    const final = explainEvents.find(
      (event): event is Extract<(typeof explainEvents)[number], { type: "final" }> => event.type === "final",
    );

    expect(retrieval?.data.cards.length).toBeGreaterThan(0);
    expect(final?.data.key_evidence[0].evidence_id).toContain("B-");
    expect(final?.data.knowledge_card_refs.length).toBeGreaterThan(0);

    const messageEvents = await messageReading({
      reading_id: init.reading_id,
      message: "为什么取这个用神？",
      followup_type: "why_yongshen",
    });
    const messageFinal = messageEvents.find(
      (event): event is Extract<(typeof messageEvents)[number], { type: "final" }> => event.type === "final",
    );

    expect(messageFinal?.data.summary).toContain("用神");
    expect(messageFinal?.data.summary).toContain("B-YS-001");
    expect(await listReadingMessages(init.reading_id)).toHaveLength(2);
  });

  test("returns only approved knowledge cards for reading context", async () => {
    const init = await initReading({
      question: "这次考试如何复习更稳",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const cards = await queryKnowledgeCards({
      reading_id: init.reading_id,
      term: "用神",
    });

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => card.status === "approved")).toBe(true);
  });
});

describe("reading service PostgreSQL snapshot persistence", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
    setReadingSnapshotStoreForTests(null);
  });

  test("saves a full snapshot and hydrates it back into cleared in-memory maps when explicitly configured", async () => {
    const savedSnapshots = new Map<string, unknown>();
    const snapshotStore = {
      load: async (scope: string) => savedSnapshots.get(scope) ?? null,
      save: async (scope: string, payload: unknown) => {
        savedSnapshots.set(scope, structuredClone(payload));
      },
    };

    setReadingSnapshotStoreForTests(snapshotStore);

    const init = await initReading({
      question: "这次考试如何复习更稳",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    resetReadingStoreForTests();
    setReadingSnapshotStoreForTests(snapshotStore);

    expect(await listReadingHistory()).toMatchObject([
      {
        reading_id: init.reading_id,
        scenario: "考试",
      },
    ]);
  });
});
