import { describe, expect, test } from "vitest";
import {
  AiReadingOutputSchema,
  AdminCasePatchSchema,
  AdminCaseUpsertSchema,
  AdminExperimentPatchSchema,
  AdminKnowledgeCardPatchSchema,
  AdminSubmissionReviewRequestSchema,
  AdminReviewRequestSchema,
  AnalyzeRequestSchema,
  CastRequestSchema,
  CommunityCommentRequestSchema,
  CommunityPostRequestSchema,
  CommunityReportRequestSchema,
  CourseProgressRequestSchema,
  CreatorExportRequestSchema,
  DeviceRegisterRequestSchema,
  EventRequestSchema,
  ExperimentAssignmentQuerySchema,
  ExplainRequestSchema,
  FavoriteRequestSchema,
  FeedbackRequestSchema,
  InitReadingRequestSchema,
  LearningProgressRequestSchema,
  MessageRequestSchema,
  CaseQuerySchema,
  PushSettingsRequestSchema,
  ReadingImportPatchSchema,
  ReadingImportPreviewRequestSchema,
  ReadingImportRequestSchema,
  RulePackPatchSchema,
  RulePackUpsertSchema,
  ShareReadingRequestSchema,
  TagsRequestSchema,
  VoiceExplainRequestSchema,
  VoiceTranscribeRequestSchema,
  ContributorSubmissionPatchSchema,
  ContributorSubmissionRequestSchema,
  ContributorSubmissionSubmitSchema,
  CommercialBillingSimulationRequestSchema,
  ComplianceReviewResolveRequestSchema,
  EcosystemQualityReviewRequestSchema,
  EcosystemRiskEventResolveRequestSchema,
  EcosystemPackageDisableRequestSchema,
  EcosystemPackageInstallRequestSchema,
  EcosystemPackageSuspendRequestSchema,
  OpsIncidentPatchSchema,
  OpsIncidentRequestSchema,
  PrivacySettingsRequestSchema,
  RulePackRegressionRequestSchema,
  RulePackPublishRequestSchema,
  RulePackRollbackRequestSchema,
  SettlementSimulateRequestSchema,
} from "./contracts";

describe("API contracts", () => {
  test("accepts the locked MVP 0.1 scenario and manual line-value contract", () => {
    const init = InitReadingRequestSchema.parse({
      question: "这次考试如何复习更稳",
      scenario: "考试",
      timezone: "Asia/Shanghai",
    });

    const cast = CastRequestSchema.parse({
      reading_id: "reading_001",
      cast_method: "manual",
      line_values: [6, 7, 8, 9, 7, 8],
      cast_time: "2026-04-30",
      day_ganzhi: "甲戌",
      month_branch: "辰",
    });

    expect(init.scenario).toBe("考试");
    expect(cast.line_values).toEqual([6, 7, 8, 9, 7, 8]);
    expect(cast.cast_time).toBe("2026-04-30");
    expect(cast.day_ganzhi).toBe("甲戌");
    expect(cast.month_branch).toBe("辰");
  });

  test("rejects scenarios and line values outside the MVP 0.1 scope", () => {
    expect(() =>
      InitReadingRequestSchema.parse({
        question: "测试",
        scenario: "健康诊断",
        timezone: "Asia/Shanghai",
      }),
    ).toThrow();

    expect(() =>
      CastRequestSchema.parse({
        reading_id: "reading_001",
        cast_method: "manual",
        line_values: [1, 2, 3, 4, 5, 6],
      }),
    ).toThrow();

    expect(() =>
      CastRequestSchema.parse({
        reading_id: "reading_001",
        cast_method: "manual",
        line_values: [6, 7, 8, 9, 7, 8],
        day_ganzhi: "甲猫",
      }),
    ).toThrow();

    expect(() =>
      CastRequestSchema.parse({
        reading_id: "reading_001",
        cast_method: "manual",
        line_values: [6, 7, 8, 9, 7, 8],
        cast_time: "2028-01-01",
      }),
    ).toThrow();
  });

  test("accepts the MVP 0.2 analyze refresh contract", () => {
    const analyze = AnalyzeRequestSchema.parse({
      reading_id: "reading_001",
      mode: "learning",
      force_refresh: true,
    });

    expect(analyze).toEqual({
      reading_id: "reading_001",
      mode: "learning",
      force_refresh: true,
    });
  });

  test("accepts the Beta 0.8 explain and message contracts", () => {
    expect(
      ExplainRequestSchema.parse({
        reading_id: "reading_001",
        mode: "story",
        stream: true,
        force_refresh: true,
      }),
    ).toEqual({
      reading_id: "reading_001",
      mode: "story",
      stream: true,
      force_refresh: true,
    });

    expect(
      MessageRequestSchema.parse({
        reading_id: "reading_001",
        message: "为什么取这个用神？",
        followup_type: "why_yongshen",
      }),
    ).toMatchObject({
      reading_id: "reading_001",
      followup_type: "why_yongshen",
    });
  });

  test("requires AI output to cite evidence or knowledge cards", () => {
    expect(() =>
      AiReadingOutputSchema.parse({
        summary: "这是一个没有依据的总结。",
        key_evidence: [{ evidence_id: "", plain_explanation: "缺少依据" }],
        counter_evidence: [],
        action_tips: ["仅供娱乐"],
        safety_notice: "仅供娱乐学习。",
        knowledge_card_refs: [],
        model_metadata: { provider: "fake", model: "fake-beta", generated_at: "2026-05-01T00:00:00.000Z" },
      }),
    ).toThrow();

    expect(
      AiReadingOutputSchema.parse({
        summary: "规则证据支持与反证并存，适合学习观察。",
        key_evidence: [{ evidence_id: "reading_001:B-YS-001:01", plain_explanation: "事业场景以官鬼为主线观察。" }],
        counter_evidence: ["用神静而未动，动变提示不足。"],
        action_tips: ["把结果当作复盘线索，不替代现实决策。"],
        safety_notice: "仅供传统文化娱乐与学习参考。",
        knowledge_card_refs: ["kc-B-YS-001-01"],
        model_metadata: { provider: "fake", model: "fake-beta", generated_at: "2026-05-01T00:00:00.000Z" },
      }).knowledge_card_refs,
    ).toEqual(["kc-B-YS-001-01"]);
  });

  test("accepts V1.0 learning, sharing, favorite, feedback, and admin contracts", () => {
    expect(
      ShareReadingRequestSchema.parse({
        reading_id: "reading_001",
        visibility: "public_anonymous",
      }),
    ).toEqual({ reading_id: "reading_001", visibility: "public_anonymous" });

    expect(FavoriteRequestSchema.parse({ reading_id: "reading_001" })).toEqual({
      reading_id: "reading_001",
      favorite: true,
    });

    expect(
      TagsRequestSchema.parse({
        reading_id: "reading_001",
        tags: ["面试", "复盘"],
      }).tags,
    ).toEqual(["面试", "复盘"]);

    expect(
      LearningProgressRequestSchema.parse({
        subject_id: "kc-B-YS-001-01",
        subject_type: "knowledge_card",
        score: 80,
        badge: "用神入门",
      }),
    ).toMatchObject({ completed: true, score: 80 });

    expect(
      FeedbackRequestSchema.parse({
        reading_id: "reading_001",
        feedback_type: "helpful",
      }).feedback_type,
    ).toBe("helpful");

    expect(
      AdminKnowledgeCardPatchSchema.parse({
        status: "rejected",
        review_note: "来源不足",
      }).status,
    ).toBe("rejected");
  });

  test("accepts V1.5 case, course, creator, experiment, and event contracts", () => {
    expect(
      CaseQuerySchema.parse({
        scenario: "事业",
        difficulty: "beginner",
        status: "approved",
        rule_id: "B-YS-001",
      }),
    ).toMatchObject({
      scenario: "事业",
      difficulty: "beginner",
      status: "approved",
      rule_id: "B-YS-001",
    });

    expect(
      AdminCaseUpsertSchema.parse({
        title: "事业案例复盘",
        scenario: "事业",
        source_type: "editorial",
        difficulty: "beginner",
        status: "draft",
        question_preview: "问题已脱敏",
        base_chart: "乾为天",
        changed_chart: "天风姤",
        yongshen: "官鬼",
        evidence_ids: ["case-new:B-YS-001:01"],
        rule_ids: ["B-YS-001"],
        learning_summary: "用于学习用神选择，不作现实承诺。",
        counter_evidence: ["动爻不足时保留反证。"],
        source_refs: ["editorial-seed"],
        license_note: "自研编辑案例",
      }).status,
    ).toBe("draft");

    expect(AdminCasePatchSchema.parse({ status: "approved" }).status).toBe("approved");

    expect(
      CourseProgressRequestSchema.parse({
        course_id: "course-01",
        lesson_id: "lesson-01",
        completed: true,
        score: 100,
      }),
    ).toMatchObject({ completed: true, score: 100 });

    expect(
      CreatorExportRequestSchema.parse({
        reading_id: "reading_001",
        case_id: "case-001",
        export_type: "short_video_script",
      }).export_type,
    ).toBe("short_video_script");

    expect(
      ExperimentAssignmentQuerySchema.parse({
        anonymous_id: "anon-1",
        surface: "home",
      }).surface,
    ).toBe("home");

    expect(
      EventRequestSchema.parse({
        anonymous_id: "anon-1",
        event_name: "case_opened",
        surface: "learning",
        entity_id: "case-001",
        variant: "control",
      }).event_name,
    ).toBe("case_opened");

    expect(
      AdminExperimentPatchSchema.parse({
        status: "running",
        variants: ["control", "variant_a"],
      }).variants,
    ).toEqual(["control", "variant_a"]);
  });

  test("accepts V2.0 device, voice, import, community, and rule governance contracts", () => {
    expect(
      DeviceRegisterRequestSchema.parse({
        anonymous_id: "anon-v2",
        platform: "mini_program",
        app_version: "2.0.0",
      }).platform,
    ).toBe("mini_program");

    expect(
      PushSettingsRequestSchema.parse({
        device_id: "device_001",
        enabled: true,
        learning_reminders: true,
      }).enabled,
    ).toBe(true);

    expect(
      VoiceTranscribeRequestSchema.parse({
        audio_text: "这次考试如何复盘",
        platform: "ios",
        save_audio: false,
      }).save_audio,
    ).toBe(false);

    expect(
      VoiceExplainRequestSchema.parse({
        reading_id: "reading_001",
        mode: "learning",
        voice: "standard",
      }).voice,
    ).toBe("standard");

    expect(
      ReadingImportPreviewRequestSchema.parse({
        source_type: "structured_json",
        payload: {
          question: "导入卦例复盘",
          scenario: "事业",
          line_values: [7, 8, 7, 8, 9, 6],
          cast_time: "2026-05-01",
        },
      }).source_type,
    ).toBe("structured_json");

    expect(
      ReadingImportRequestSchema.parse({
        source_type: "pasted_text",
        payload: "lines: 7 8 7 8 9 6; scenario: 事业; question: 导入复盘; date: 2026-05-01",
      }).source_type,
    ).toBe("pasted_text");

    expect(ReadingImportPatchSchema.parse({ status: "accepted" }).status).toBe("accepted");

    expect(
      CommunityPostRequestSchema.parse({
        post_type: "case_discussion",
        title: "脱敏卦例讨论",
        body: "只讨论证据树，不展示原始问题。",
        reading_id: "reading_001",
      }).post_type,
    ).toBe("case_discussion");

    expect(
      CommunityCommentRequestSchema.parse({
        post_id: "post_001",
        body: "这条规则可以回看用神卡。",
      }).post_id,
    ).toBe("post_001");

    expect(
      CommunityReportRequestSchema.parse({
        target_id: "post_001",
        target_type: "post",
        reason: "unsafe",
      }).reason,
    ).toBe("unsafe");

    expect(
      RulePackUpsertSchema.parse({
        name: "用神模板扩展",
        scope: "yongshen",
        status: "testing",
        rule_ids: ["B-YS-001"],
        weight_profile: { B: 1 },
        validation_case_ids: ["case-001"],
        source_refs: ["internal-v2"],
      }).scope,
    ).toBe("yongshen");

    expect(RulePackPatchSchema.parse({ status: "approved", regression_passed: true }).regression_passed).toBe(true);

    expect(
      AdminReviewRequestSchema.parse({
        target_type: "rule_pack",
        target_id: "rule-pack-001",
        review_type: "professional",
        decision: "approved",
        note: "标准卦例通过。",
      }).review_type,
    ).toBe("professional");
  });

  test("accepts V3.0 controlled ecosystem, contributor, review, and simulated settlement contracts", () => {
    expect(
      ContributorSubmissionRequestSchema.parse({
        submission_type: "rule_pack",
        title: "Controlled yongshen extension",
        payload: {
          id: "rule-pack-v3-demo",
          name: "V3 demo pack",
          scope: "yongshen",
          rule_ids: ["B-YS-001"],
          validation_case_ids: ["case-001"],
          source_refs: ["v3-demo"],
        },
        source_refs: ["v3-demo"],
      }).submission_type,
    ).toBe("rule_pack");

    expect(ContributorSubmissionPatchSchema.parse({ title: "Updated draft" }).title).toBe("Updated draft");
    expect(ContributorSubmissionSubmitSchema.parse({}).confirm_controlled_opening).toBe(true);

    expect(
      AdminSubmissionReviewRequestSchema.parse({
        review_gate: "professional",
        decision: "approved",
        note: "reviewed",
      }).review_gate,
    ).toBe("professional");

    expect(
      RulePackRegressionRequestSchema.parse({
        validation_case_ids: ["case-001", "case-002"],
        force: true,
      }).force,
    ).toBe(true);

    expect(RulePackPublishRequestSchema.parse({ release_note: "first public release" }).release_note).toBe("first public release");
    expect(RulePackRollbackRequestSchema.parse({ target_version: 1, reason: "quality rollback" }).target_version).toBe(1);

    expect(EcosystemPackageInstallRequestSchema.parse({ package_id: "pkg_001" }).package_id).toBe("pkg_001");
    expect(EcosystemPackageDisableRequestSchema.parse({ package_id: "pkg_001" }).package_id).toBe("pkg_001");
    expect(EcosystemPackageSuspendRequestSchema.parse({ reason: "unsafe claim" }).reason).toBe("unsafe claim");

    expect(
      SettlementSimulateRequestSchema.parse({
        contributor_id: "contributor_demo",
        period: "2026-05",
      }).mode,
    ).toBe("simulated");
  });

  test("accepts V3.5 operations, quality, commercial sandbox, privacy, and compliance contracts", () => {
    expect(
      EcosystemQualityReviewRequestSchema.parse({
        quality_score: 58,
        safety_score: 84,
        complaint_count: 3,
        regression_failure_count: 1,
        install_retention_rate: 0.42,
        user_feedback_score: 3.2,
        status: "needs_review",
        risk_level: "high",
        moderation_action: "hide",
        note: "low quality score and complaints require review",
      }).moderation_action,
    ).toBe("hide");

    expect(
      EcosystemRiskEventResolveRequestSchema.parse({
        resolution: "hidden pending author revision",
        action: "hide",
      }).action,
    ).toBe("hide");

    expect(
      OpsIncidentRequestSchema.parse({
        title: "ecosystem catalog latency breach",
        severity: "sev3",
        affected_surface: "ecosystem_catalog",
        summary: "catalog p95 crossed the V3.5 target",
      }).status,
    ).toBe("open");

    expect(
      OpsIncidentPatchSchema.parse({
        status: "resolved",
        mitigation: "cache warmed and slow package hidden",
      }).status,
    ).toBe("resolved");

    expect(
      CommercialBillingSimulationRequestSchema.parse({
        contributor_id: "contributor_demo",
        period: "2026-05",
        include_entitlements: true,
      }).mode,
    ).toBe("simulated");

    expect(
      PrivacySettingsRequestSchema.parse({
        save_history: false,
        allow_personalization: false,
        allow_sensitive_review: true,
        retain_history_days: 30,
        export_format: "json",
      }).retain_history_days,
    ).toBe(30);

    expect(
      ComplianceReviewResolveRequestSchema.parse({
        resolution: "reviewed and confirmed no commitment wording",
        action: "warn",
      }).action,
    ).toBe("warn");
  });
});
