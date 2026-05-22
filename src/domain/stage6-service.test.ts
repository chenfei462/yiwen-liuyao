import { beforeEach, describe, expect, test } from "vitest";
import { SCENARIOS } from "./contracts";
import {
  createAdminReview,
  createCommunityComment,
  createCommunityPost,
  createReadingImport,
  getAppBootstrap,
  getCommunityPost,
  getReadingImport,
  getRulePack,
  getVoiceJob,
  initReading,
  listCommunityPosts,
  listReviewQueue,
  listRulePacks,
  patchReadingImport,
  patchRulePack,
  previewReadingImport,
  registerDevice,
  reportCommunityContent,
  resetReadingStoreForTests,
  transcribeVoice,
  updatePushSettings,
  upsertRulePack,
  voiceExplainReading,
} from "./reading-service";

const scenario = SCENARIOS[0];

describe("V2.0 multi-platform, voice, import, community, and governance service", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("registers devices, updates push settings, and exposes app bootstrap capabilities", async () => {
    const device = await registerDevice({
      anonymous_id: "anon-v2",
      platform: "mini_program",
      app_version: "2.0.0",
    });

    expect(device.platform).toBe("mini_program");
    expect(device.capabilities).toContain("offline_cache");
    expect(device.safety_policy_version).toBe("v2.0");

    const push = await updatePushSettings({
      device_id: device.device_id,
      enabled: true,
      learning_reminders: true,
      community_notifications: false,
    });
    expect(push.enabled).toBe(true);

    const bootstrap = await getAppBootstrap({ platform: "ios", anonymous_id: "anon-v2" });
    expect(bootstrap.platform).toBe("ios");
    expect(bootstrap.feature_flags).toMatchObject({
      voice_reading: true,
      import_reading: true,
      community: true,
      rule_market: true,
    });
  });

  test("transcribes voice without storing raw audio and blocks high-risk voice questions", async () => {
    const allowed = await transcribeVoice({
      audio_text: "这次考试如何复盘",
      platform: "ios",
      save_audio: false,
    });
    expect(allowed.status).toBe("completed");
    expect(allowed.transcript).toContain("考试");
    expect(allowed.raw_audio_stored).toBe(false);
    expect((await getVoiceJob(allowed.job_id)).transcript).toBe(allowed.transcript);

    const reading = await initReading({
      question: "这次考试如何复盘",
      scenario,
      timezone: "Asia/Shanghai",
    });
    const explain = await voiceExplainReading({
      reading_id: reading.reading_id,
      mode: "learning",
      voice: "standard",
    });
    expect(explain.status).toBe("completed");
    expect(explain.audio_url).toBeNull();

    const blocked = await transcribeVoice({
      audio_text: "我想自杀，卦能不能告诉我怎么结束生命",
      platform: "android",
      save_audio: true,
    });
    expect(blocked.status).toBe("blocked");
    expect(blocked.raw_audio_stored).toBe(false);
  });

  test("previews and accepts structured or pasted reading imports without AI-generated chart facts", async () => {
    const preview = await previewReadingImport({
      source_type: "structured_json",
      payload: {
        question: "导入卦例复盘",
        scenario,
        line_values: [7, 8, 7, 8, 9, 6],
        cast_time: "2026-05-01",
      },
    });
    expect(preview.status).toBe("parsed");
    expect(preview.editable_fields.line_values).toEqual([7, 8, 7, 8, 9, 6]);
    expect(preview.ai_generated_chart_fields).toBe(false);

    const imported = await createReadingImport({
      source_type: "pasted_text",
      payload: "lines: 7 8 7 8 9 6; scenario: 事业; question: 导入复盘; date: 2026-05-01",
    });
    expect(imported.status).toBe("parsed");
    expect(imported.reading_id).toMatch(/^reading_/);
    expect(imported.chart_json).toBeTruthy();

    const accepted = await patchReadingImport(imported.import_id, { status: "accepted" });
    expect(accepted.status).toBe("accepted");
    expect((await getReadingImport(imported.import_id)).status).toBe("accepted");

    const missing = await previewReadingImport({
      source_type: "structured_json",
      payload: { scenario },
    });
    expect(missing.status).toBe("needs_review");
    expect(missing.errors.length).toBeGreaterThan(0);
  });

  test("keeps community posts private until review and blocks high-risk readings", async () => {
    const reading = await initReading({
      question: "这次面试如何复盘更稳妥",
      scenario,
      timezone: "Asia/Shanghai",
    });
    const post = await createCommunityPost({
      post_type: "case_discussion",
      title: "脱敏卦例讨论",
      body: "只讨论证据树，不展示原始问题。",
      reading_id: reading.reading_id,
    });
    expect(post.status).toBe("pending_review");
    expect((((await listCommunityPosts()).some((item) => item.id === post.id)))).toBe(false);

    await createAdminReview({
      target_type: "community_post",
      target_id: post.id,
      review_type: "compliance",
      decision: "approved",
      note: "脱敏通过。",
    });
    const published = await getCommunityPost(post.id);
    expect(published.status).toBe("published");
    expect(published.question_preview).toBe("redacted");
    expect((((await listCommunityPosts()).some((item) => item.id === post.id)))).toBe(true);

    const comment = await createCommunityComment({
      post_id: post.id,
      body: "这条规则可以回看用神卡。",
    });
    expect(comment.status).toBe("published");

    const report = await reportCommunityContent({
      target_type: "post",
      target_id: post.id,
      reason: "unsafe",
    });
    expect(report.status).toBe("pending_review");
    expect((((await listReviewQueue()).some((item) => "target_id" in item && item.target_id === post.id)))).toBe(true);

    const blockedReading = await initReading({
      question: "我想自杀，能不能发社区求卦",
      scenario,
      timezone: "Asia/Shanghai",
    });
    await expect(
      createCommunityPost({
        post_type: "case_discussion",
        title: "redacted",
        body: "redacted",
        reading_id: blockedReading.reading_id,
      }),
    ).rejects.toThrow(/High-risk readings cannot be published/);
  });

  test("requires reviewed rule packs before public use and supports rollback through deprecation", async () => {
    const seedPacks = await listRulePacks();
    expect(seedPacks.every((item) => item.status === "approved")).toBe(true);

    const pack = await upsertRulePack({
      name: "用神模板扩展",
      scope: "yongshen",
      status: "testing",
      rule_ids: ["B-YS-001"],
      weight_profile: { B: 1 },
      validation_case_ids: ["case-001"],
      source_refs: ["internal-v2"],
    });
    expect((((await listRulePacks()).some((item) => item.id === pack.id)))).toBe(false);

    await expect(patchRulePack(pack.id, { status: "approved", regression_passed: false })).rejects.toThrow(/regression/);

    await createAdminReview({
      target_type: "rule_pack",
      target_id: pack.id,
      review_type: "professional",
      decision: "approved",
      note: "专业审核通过。",
    });
    await createAdminReview({
      target_type: "rule_pack",
      target_id: pack.id,
      review_type: "compliance",
      decision: "approved",
      note: "合规审核通过。",
    });

    const approved = await patchRulePack(pack.id, { status: "approved", regression_passed: true });
    expect(approved.status).toBe("approved");
    expect(((await getRulePack(pack.id)).rule_pack_id)).toBe(pack.id);
    expect((((await listRulePacks()).some((item) => item.id === pack.id)))).toBe(true);

    const deprecated = await patchRulePack(pack.id, { status: "deprecated" });
    expect(deprecated.status).toBe("deprecated");
    expect((((await listRulePacks()).some((item) => item.id === pack.id)))).toBe(false);
  });
});
