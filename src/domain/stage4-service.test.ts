import { beforeEach, describe, expect, test } from "vitest";
import {
  castReading,
  createReadingShare,
  favoriteReading,
  getAdminMetrics,
  getLearningCard,
  getMemberProgress,
  getPublicShare,
  initReading,
  listAdminAuditLogs,
  listAdminFeedback,
  listLearningExercises,
  listLearningTerms,
  patchKnowledgeCardStatus,
  queryKnowledgeCards,
  resetReadingStoreForTests,
  submitFeedback,
  updateLearningProgress,
  updateReadingTags,
} from "./reading-service";

describe("V1.0 public-test learning, sharing, membership, and admin loop", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("lists only approved learning content and returns knowledge card detail", async () => {
    const terms = await listLearningTerms({ term: "用神" });
    const exercises = await listLearningExercises({ difficulty: "beginner" });
    const card = await getLearningCard("kc-B-YS-001-01");

    expect(terms.length).toBeGreaterThanOrEqual(1);
    expect(terms.every((term) => term.status === "approved")).toBe(true);
    expect(exercises.length).toBeGreaterThanOrEqual(1);
    expect(exercises.every((exercise) => exercise.status === "approved")).toBe(true);
    expect(card).toMatchObject({
      id: "kc-B-YS-001-01",
      status: "approved",
      content: expect.any(String),
      source_refs: expect.arrayContaining([expect.any(String)]),
    });
  });

  test("filters learning exercises by scenario context", async () => {
    const exercises = await listLearningExercises({ scenario: "财务" } as unknown as Parameters<typeof listLearningExercises>[0]);

    expect(exercises.length).toBeGreaterThan(0);
    expect(exercises.every((exercise) => exercise.scenario === "财务" || exercise.scenario === "通用")).toBe(true);
  });

  test("creates a sanitized public share and blocks high-risk shares", async () => {
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

    const share = await createReadingShare({
      reading_id: init.reading_id,
      visibility: "public_anonymous",
    });
    const publicShare = await getPublicShare(share.share_id);

    expect(share.share_url).toBe(`/share/${share.share_id}`);
    expect(publicShare.card_payload.question_preview).not.toContain("面试");
    expect(publicShare.card_payload).not.toHaveProperty("question");
    expect(publicShare.card_payload.safety_notice).toContain("娱乐");

    const blocked = await initReading({
      question: "明天买哪只股票一定发财",
      scenario: "财务",
      timezone: "Asia/Shanghai",
    });
    await expect(
      createReadingShare({
        reading_id: blocked.reading_id,
        visibility: "public_anonymous",
      }),
    ).rejects.toThrow("High-risk readings cannot be shared");
  });

  test("stores favorite, tags, learning progress, and feedback for the anonymous member baseline", async () => {
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

    expect((((await favoriteReading({ reading_id: init.reading_id, favorite: true }))).favorite)).toBe(true);
    expect((((await updateReadingTags({ reading_id: init.reading_id, tags: ["exam", "review"] }))).tags)).toEqual(["exam", "review"]);
    expect(
      (await updateLearningProgress({
        subject_id: "kc-B-YS-001-03",
        subject_type: "knowledge_card",
        score: 90,
        badge: "父母爻入门",
      })).badge,
    ).toBe("父母爻入门");
    expect((((await submitFeedback({ reading_id: init.reading_id, feedback_type: "helpful" }))).feedback_type)).toBe("helpful");

    const progress = await getMemberProgress();
    expect(progress.membership.tier).toBe("free");
    expect(progress.favorites).toContain(init.reading_id);
    expect(progress.tags[init.reading_id]).toEqual(["exam", "review"]);
    expect(progress.learning_progress).toHaveLength(1);
  });

  test("admin can review knowledge cards and inspect feedback, audit logs, and metrics", async () => {
    const init = await initReading({
      question: "这次面试有没有机会",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });
    await submitFeedback({ reading_id: init.reading_id, feedback_type: "unclear", comment: "证据解释不够清楚" });
    const rejected = await patchKnowledgeCardStatus("kc-B-YS-001-01", {
      status: "rejected",
      review_note: "公开测试下架",
    });

    expect(rejected.status).toBe("rejected");
    expect(((await queryKnowledgeCards({ rule_id: "B-YS-001" })).some((card) => card.id === "kc-B-YS-001-01"))).toBe(false);
    expect(await listAdminFeedback()).toHaveLength(1);
    expect(((await listAdminAuditLogs()).some((item) => item.action === "knowledge_card_review"))).toBe(true);
    expect((await getAdminMetrics())).toMatchObject({
      cast_completion_count: 1,
      feedback_count: 1,
      rejected_knowledge_cards: 1,
    });
  });
});
