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

  test("lists only approved learning content and returns knowledge card detail", () => {
    const terms = listLearningTerms({ term: "用神" });
    const exercises = listLearningExercises({ difficulty: "beginner" });
    const card = getLearningCard("kc-B-YS-001-01");

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

  test("creates a sanitized public share and blocks high-risk shares", () => {
    const init = initReading({
      question: "这次面试有没有机会，想看三周内的结果",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    const share = createReadingShare({
      reading_id: init.reading_id,
      visibility: "public_anonymous",
    });
    const publicShare = getPublicShare(share.share_id);

    expect(share.share_url).toBe(`/share/${share.share_id}`);
    expect(publicShare.card_payload.question_preview).not.toContain("面试");
    expect(publicShare.card_payload).not.toHaveProperty("question");
    expect(publicShare.card_payload.safety_notice).toContain("娱乐");

    const blocked = initReading({
      question: "明天买哪只股票一定发财",
      scenario: "财务",
      timezone: "Asia/Shanghai",
    });
    expect(() =>
      createReadingShare({
        reading_id: blocked.reading_id,
        visibility: "public_anonymous",
      }),
    ).toThrow("High-risk readings cannot be shared");
  });

  test("stores favorite, tags, learning progress, and feedback for the anonymous member baseline", () => {
    const init = initReading({
      question: "这次考试如何复习更稳",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });
    castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });

    expect(favoriteReading({ reading_id: init.reading_id, favorite: true }).favorite).toBe(true);
    expect(updateReadingTags({ reading_id: init.reading_id, tags: ["考试", "复盘"] }).tags).toEqual(["考试", "复盘"]);
    expect(
      updateLearningProgress({
        subject_id: "kc-B-YS-001-03",
        subject_type: "knowledge_card",
        score: 90,
        badge: "父母爻入门",
      }).badge,
    ).toBe("父母爻入门");
    expect(submitFeedback({ reading_id: init.reading_id, feedback_type: "helpful" }).feedback_type).toBe("helpful");

    const progress = getMemberProgress();
    expect(progress.membership.tier).toBe("free");
    expect(progress.favorites).toContain(init.reading_id);
    expect(progress.tags[init.reading_id]).toEqual(["考试", "复盘"]);
    expect(progress.learning_progress).toHaveLength(1);
  });

  test("admin can review knowledge cards and inspect feedback, audit logs, and metrics", () => {
    const init = initReading({
      question: "这次面试有没有机会",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });
    submitFeedback({ reading_id: init.reading_id, feedback_type: "unclear", comment: "证据解释不够清楚" });
    const rejected = patchKnowledgeCardStatus("kc-B-YS-001-01", {
      status: "rejected",
      review_note: "公开测试下架",
    });

    expect(rejected.status).toBe("rejected");
    expect(queryKnowledgeCards({ rule_id: "B-YS-001" }).some((card) => card.id === "kc-B-YS-001-01")).toBe(false);
    expect(listAdminFeedback()).toHaveLength(1);
    expect(listAdminAuditLogs().some((item) => item.action === "knowledge_card_review")).toBe(true);
    expect(getAdminMetrics()).toMatchObject({
      cast_completion_count: 1,
      feedback_count: 1,
      rejected_knowledge_cards: 1,
    });
  });
});
