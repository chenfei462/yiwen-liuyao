import { beforeEach, describe, expect, test } from "vitest";
import { SCENARIOS } from "./contracts";
import {
  assignExperiment,
  castReading,
  createCreatorExport,
  createCreatorScript,
  getAdminMetrics,
  getCase,
  getCourse,
  getCourseProgress,
  getCreatorExport,
  initReading,
  listAdminExperiments,
  listCases,
  listCourses,
  patchCase,
  patchExperiment,
  recordEvent,
  resetReadingStoreForTests,
  updateCourseProgress,
  upsertCase,
} from "./reading-service";

const scenario = SCENARIOS[0];

describe("V1.5 content growth service", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("lists approved cases and filters by scenario, rule, and difficulty", async () => {
    const cases = await listCases({
      scenario,
      difficulty: "beginner",
      rule_id: "B-YS-001",
      limit: 5,
    });

    expect(cases.length).toBeGreaterThan(0);
    expect(cases.every((item) => item.status === "approved")).toBe(true);
    expect(cases.every((item) => item.scenario === scenario)).toBe(true);
    expect(cases.every((item) => item.rule_ids.includes("B-YS-001"))).toBe(true);
    expect(cases.every((item) => !("question" in item))).toBe(true);

    const detail = await getCase(cases[0].id);
    expect(detail.question_preview).toBe("redacted");
    expect(detail.evidence_ids.length).toBeGreaterThan(0);
    expect(detail.rule_ids[0]).toMatch(/^B-/);
  });

  test("supports admin case create, status patch, and public visibility rules", async () => {
    const created = await upsertCase({
      title: "测试案例",
      scenario,
      source_type: "editorial",
      difficulty: "beginner",
      status: "draft",
      question_preview: "问题已脱敏",
      base_chart: "乾为天",
      changed_chart: "天风姤",
      yongshen: "官鬼",
      evidence_ids: ["case-test:B-YS-001:01"],
      rule_ids: ["B-YS-001"],
      learning_summary: "只用于学习复盘。",
      counter_evidence: ["反证保留。"],
      source_refs: ["test"],
      license_note: "自研测试案例",
    });

    expect(((await listCases({ status: "approved" })).some((item) => item.id === created.id))).toBe(false);
    expect(((await patchCase(created.id, { status: "rejected" })).status)).toBe("rejected");
    expect(((await listCases({ status: "approved" })).some((item) => item.id === created.id))).toBe(false);
    expect(((await patchCase(created.id, { status: "approved" })).status)).toBe("approved");
    expect(((await listCases({ status: "approved" })).some((item) => item.id === created.id))).toBe(true);
  });

  test("exposes published courses and persists course progress", async () => {
    const courses = await listCourses();
    expect(courses.length).toBeGreaterThanOrEqual(5);
    expect(courses.every((course) => course.status === "published")).toBe(true);

    const course = await getCourse(courses[0].id);
    expect(course.lessons.length).toBeGreaterThan(0);

    const progress = await updateCourseProgress({
      course_id: course.id,
      lesson_id: course.lessons[0].id,
      completed: true,
      score: 100,
      wrong_question_ids: [],
    });
    expect(progress.badge).toBeTruthy();

    const summary = await getCourseProgress();
    expect(summary.progress.some((item) => item.course_id === course.id && item.lesson_id === course.lessons[0].id)).toBe(true);
  });

  test("creates sanitized creator exports and blocks high-risk readings", async () => {
    const allowed = await initReading({
      question: "这次面试如何复盘更稳妥",
      scenario,
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: allowed.reading_id,
      cast_method: "manual",
      line_values: [7, 8, 7, 8, 9, 6],
      cast_time: "2026-05-01",
    });

    const exportRecord = await createCreatorExport({
      reading_id: allowed.reading_id,
      case_id: "case-001",
      export_type: "short_video_script",
    });
    expect(exportRecord.content_sections.join("\n")).not.toContain("这次面试如何复盘更稳妥");
    expect(exportRecord.content_sections.join("\n")).not.toMatch(/包准|改命|消灾|一定复合|一定发财|诊断|投资建议/);
    expect((await getCreatorExport(exportRecord.id)).id).toBe(exportRecord.id);

    const script = await createCreatorScript({
      reading_id: allowed.reading_id,
      export_type: "short_video_script",
    });
    expect(script.export_type).toBe("short_video_script");

    const blocked = await initReading({
      question: "我想自杀，卦能不能告诉我怎么结束生命",
      scenario,
      timezone: "Asia/Shanghai",
    });
    await expect(
      createCreatorExport({
        reading_id: blocked.reading_id,
        export_type: "article",
      }),
    ).rejects.toThrow(/High-risk readings cannot be exported/);
  });

  test("assigns stable experiments and records growth events", async () => {
    const first = await assignExperiment({ anonymous_id: "anon-1", surface: "home" });
    const second = await assignExperiment({ anonymous_id: "anon-1", surface: "home" });
    expect(second.variant).toBe(first.variant);

    const experiments = await listAdminExperiments();
    expect(experiments.some((item) => item.surface === "home")).toBe(true);

    const patched = await patchExperiment(first.experiment_id, { status: "paused" });
    expect(patched.status).toBe("paused");
    expect(((await assignExperiment({ anonymous_id: "anon-1", surface: "home" })).variant)).toBe("control");
    await patchExperiment(first.experiment_id, { status: "running" });

    const event = await recordEvent({
      anonymous_id: "anon-1",
      event_name: "case_opened",
      surface: "learning",
      entity_id: "case-001",
      variant: first.variant,
    });
    expect(event.event_name).toBe("case_opened");
    expect(((await getAdminMetrics()).case_open_count)).toBeGreaterThanOrEqual(1);
  });
});
