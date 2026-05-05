import { z } from "zod";
import { EARTHLY_BRANCHES, HEAVENLY_STEMS, isDateSupportedByJieqiTable } from "./calendar";

export const SCENARIOS = ["事业", "财务", "感情", "考试", "失物", "其他"] as const;
export const CAST_METHODS = ["coin", "manual"] as const;
export const LINE_VALUES = [6, 7, 8, 9] as const;

export const LineValueSchema = z.union([
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
]);

export const InitReadingRequestSchema = z.object({
  question: z.string().trim().min(2).max(200),
  scenario: z.enum(SCENARIOS),
  timezone: z.string().trim().min(1).default("Asia/Shanghai"),
});

export const DayGanzhiSchema = z.string().trim().refine((value) => {
  const stem = value[0];
  const branch = value[1];
  return HEAVENLY_STEMS.includes(stem as (typeof HEAVENLY_STEMS)[number]) &&
    EARTHLY_BRANCHES.includes(branch as (typeof EARTHLY_BRANCHES)[number]);
}, "day_ganzhi must be a valid heavenly-stem and earthly-branch pair");

export const CastTimeSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}/, "cast_time must start with YYYY-MM-DD");
export const MonthBranchSchema = z.enum(EARTHLY_BRANCHES);

export const CastRequestSchema = z
  .object({
    reading_id: z.string().trim().min(1),
    cast_method: z.enum(CAST_METHODS),
    line_values: z.array(LineValueSchema).length(6, "line_values must contain exactly six bottom-to-top values"),
    cast_time: CastTimeSchema.optional(),
    day_ganzhi: DayGanzhiSchema.optional(),
    month_branch: MonthBranchSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.cast_time && !value.month_branch && !isDateSupportedByJieqiTable(value.cast_time)) {
      context.addIssue({
        code: "custom",
        path: ["month_branch"],
        message: "month_branch is required for dates outside the 2024-2027 jieqi table",
      });
    }
  });

export const AnalyzeRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  mode: z.enum(["professional", "light", "learning"]).default("light"),
  force_refresh: z.boolean().optional(),
});

export const ExplainModeSchema = z.enum(["professional", "light", "learning", "story"]);

export const ExplainRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  mode: ExplainModeSchema.default("learning"),
  stream: z.boolean().default(true),
  force_refresh: z.boolean().optional(),
});

export const FollowupTypeSchema = z.enum([
  "why_yongshen",
  "key_rule",
  "counter_evidence",
  "timing",
  "learning_mode",
  "free_text",
]);

export const MessageRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  message: z.string().trim().min(1).max(500),
  followup_type: FollowupTypeSchema.default("free_text"),
});

export const ContentStatusSchema = z.enum(["draft", "approved", "rejected"]);
export const ShareVisibilitySchema = z.enum(["public_anonymous", "private"]);
export const MembershipTierSchema = z.enum(["free", "member"]);
export const FeedbackTypeSchema = z.enum(["unclear", "inaccurate", "unsafe", "helpful"]);
export const ExerciseDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const CaseStatusSchema = z.enum(["draft", "approved", "rejected", "archived"]);
export const CaseSourceTypeSchema = z.enum(["classic", "anonymized_user", "editorial"]);
export const CaseDifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export const CourseStatusSchema = z.enum(["draft", "published", "archived"]);
export const LessonTypeSchema = z.enum(["article", "quiz", "case_review", "practice"]);
export const CreatorExportTypeSchema = z.enum(["article", "short_video_script", "long_image", "chart_snapshot"]);
export const ExperimentSurfaceSchema = z.enum(["home", "result", "learning", "share", "course"]);
export const ExperimentVariantSchema = z.enum(["control", "variant_a", "variant_b"]);
export const ExperimentStatusSchema = z.enum(["draft", "running", "paused", "archived"]);
export const EventNameSchema = z.enum([
  "cast_completed",
  "explain_completed",
  "followup_sent",
  "share_created",
  "case_opened",
  "course_started",
  "course_completed",
  "creator_exported",
]);
export const ClientPlatformSchema = z.enum(["web", "h5", "mini_program", "ios", "android"]);
export const VoiceJobStatusSchema = z.enum(["queued", "processing", "completed", "failed", "blocked"]);
export const ImportSourceTypeSchema = z.enum(["pasted_text", "structured_json", "image_ocr"]);
export const ImportStatusSchema = z.enum(["draft", "parsed", "needs_review", "accepted", "rejected"]);
export const CommunityPostStatusSchema = z.enum(["draft", "pending_review", "published", "hidden", "removed"]);
export const ReviewTypeSchema = z.enum(["professional", "compliance", "privacy", "safety"]);
export const ReviewDecisionSchema = z.enum(["approved", "rejected"]);
export const RulePackStatusSchema = z.enum(["draft", "testing", "approved", "rejected", "deprecated"]);
export const RulePackScopeSchema = z.enum(["yongshen", "wangshuai", "dongbian", "timing", "style", "school"]);
export const CommunityPostTypeSchema = z.enum(["case_discussion", "course_checkin", "knowledge_comment", "wrong_question"]);
export const CommunityReportReasonSchema = z.enum(["unsafe", "privacy", "spam", "inaccurate"]);
export const ContributorRoleSchema = z.enum(["creator", "expert", "reviewer", "admin"]);
export const SubmissionTypeSchema = z.enum(["rule_pack", "case", "course", "knowledge_card", "exercise", "creator_template"]);
export const SubmissionStatusSchema = z.enum(["draft", "submitted", "in_review", "changes_requested", "approved", "rejected", "published", "archived"]);
export const ReviewGateSchema = z.enum(["professional", "compliance", "privacy", "safety", "regression", "editorial"]);
export const SubmissionReviewDecisionSchema = z.enum(["approved", "rejected", "changes_requested"]);
export const EcosystemPackageTypeSchema = z.enum(["rule_pack", "course_pack", "case_pack", "knowledge_pack", "creator_template_pack"]);
export const EcosystemPackageStatusSchema = z.enum(["draft", "testing", "approved", "published", "suspended", "deprecated"]);
export const PackageInstallStatusSchema = z.enum(["installed", "disabled", "removed"]);
export const SettlementModeSchema = z.literal("simulated");
export const SettlementStatusSchema = z.enum(["pending", "calculated", "frozen", "voided"]);
export const QualityReviewStatusSchema = z.enum(["healthy", "needs_review", "suspended", "deprecated"]);
export const EcosystemRiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export const ModerationActionSchema = z.enum(["warn", "hide", "suspend", "rollback", "reject"]);
export const CommercialReadinessGateSchema = z.enum([
  "entitlement",
  "billing_sandbox",
  "tax_profile",
  "kyb_kyc",
  "risk_control",
  "support_process",
]);
export const CommercialReadinessStatusSchema = z.enum(["missing", "draft", "ready", "blocked"]);
export const IncidentSeveritySchema = z.enum(["sev1", "sev2", "sev3", "sev4"]);
export const IncidentStatusSchema = z.enum(["open", "investigating", "mitigated", "resolved"]);
export const PrivacyExportStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const ShareReadingRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  visibility: ShareVisibilitySchema.default("public_anonymous"),
});

export const FavoriteRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  favorite: z.boolean().default(true),
});

export const TagsRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1).max(16)).max(8).default([]),
});

export const LearningProgressRequestSchema = z.object({
  subject_id: z.string().trim().min(1),
  subject_type: z.enum(["term", "knowledge_card", "exercise"]),
  completed: z.boolean().default(true),
  score: z.number().min(0).max(100).optional(),
  badge: z.string().trim().min(1).max(24).optional(),
});

export const FeedbackRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  feedback_type: FeedbackTypeSchema,
  comment: z.string().trim().max(240).optional(),
});

export const AdminKnowledgeCardPatchSchema = z.object({
  status: ContentStatusSchema,
  review_note: z.string().trim().max(240).optional(),
});

export const CaseQuerySchema = z.object({
  scenario: z.enum(SCENARIOS).optional(),
  hexagram: z.string().trim().min(1).max(24).optional(),
  rule_id: z.string().trim().min(1).max(32).optional(),
  yongshen: z.string().trim().min(1).max(24).optional(),
  difficulty: CaseDifficultySchema.optional(),
  source_type: CaseSourceTypeSchema.optional(),
  status: CaseStatusSchema.default("approved"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const AdminCaseUpsertSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(80),
  scenario: z.enum(SCENARIOS),
  source_type: CaseSourceTypeSchema,
  difficulty: CaseDifficultySchema,
  status: CaseStatusSchema.default("draft"),
  question_preview: z.string().trim().min(1).max(80),
  base_chart: z.string().trim().min(1).max(32),
  changed_chart: z.string().trim().min(1).max(32),
  yongshen: z.string().trim().min(1).max(24),
  evidence_ids: z.array(z.string().trim().min(1).max(80)).min(1),
  rule_ids: z.array(z.string().trim().min(1).max(32)).min(1),
  learning_summary: z.string().trim().min(1).max(600),
  counter_evidence: z.array(z.string().trim().min(1).max(240)).default([]),
  source_refs: z.array(z.string().trim().min(1).max(120)).min(1),
  license_note: z.string().trim().min(1).max(160),
});

export const AdminCasePatchSchema = AdminCaseUpsertSchema.omit({ id: true }).partial().extend({
  status: CaseStatusSchema.optional(),
});

export const CourseProgressRequestSchema = z.object({
  course_id: z.string().trim().min(1).max(80),
  lesson_id: z.string().trim().min(1).max(80),
  completed: z.boolean().default(true),
  score: z.number().min(0).max(100).optional(),
  wrong_question_ids: z.array(z.string().trim().min(1).max(80)).default([]),
});

export const CreatorExportRequestSchema = z.object({
  reading_id: z.string().trim().min(1).optional(),
  case_id: z.string().trim().min(1).optional(),
  export_type: CreatorExportTypeSchema,
}).refine((value) => value.reading_id || value.case_id, {
  message: "reading_id or case_id is required",
});

export const ExperimentAssignmentQuerySchema = z.object({
  anonymous_id: z.string().trim().min(1).max(120),
  surface: ExperimentSurfaceSchema,
});

export const EventRequestSchema = z.object({
  anonymous_id: z.string().trim().min(1).max(120),
  event_name: EventNameSchema,
  surface: ExperimentSurfaceSchema,
  entity_id: z.string().trim().min(1).max(120).optional(),
  variant: ExperimentVariantSchema.default("control"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AdminExperimentPatchSchema = z.object({
  status: ExperimentStatusSchema.optional(),
  variants: z.array(ExperimentVariantSchema).min(1).max(3).optional(),
  name: z.string().trim().min(1).max(80).optional(),
});

export const DeviceRegisterRequestSchema = z.object({
  anonymous_id: z.string().trim().min(1).max(120),
  platform: ClientPlatformSchema,
  app_version: z.string().trim().min(1).max(32).default("2.0.0"),
  locale: z.string().trim().min(1).max(24).default("zh-CN"),
});

export const PushSettingsRequestSchema = z.object({
  device_id: z.string().trim().min(1),
  enabled: z.boolean().default(false),
  learning_reminders: z.boolean().default(false),
  community_notifications: z.boolean().default(false),
});

export const VoiceTranscribeRequestSchema = z.object({
  audio_text: z.string().trim().min(1).max(500),
  platform: ClientPlatformSchema.default("web"),
  save_audio: z.boolean().default(false),
});

export const VoiceExplainRequestSchema = z.object({
  reading_id: z.string().trim().min(1),
  mode: ExplainModeSchema.default("learning"),
  voice: z.enum(["standard", "calm", "teacher"]).default("standard"),
});

export const ImportedReadingPayloadSchema = z.object({
  question: z.string().trim().min(2).max(200).optional(),
  scenario: z.enum(SCENARIOS).optional(),
  line_values: z.array(LineValueSchema).length(6).optional(),
  cast_time: CastTimeSchema.optional(),
  day_ganzhi: DayGanzhiSchema.optional(),
  month_branch: MonthBranchSchema.optional(),
});

export const ReadingImportPreviewRequestSchema = z.object({
  source_type: ImportSourceTypeSchema,
  payload: z.union([z.string().trim().min(1).max(2000), ImportedReadingPayloadSchema]),
});

export const ReadingImportRequestSchema = ReadingImportPreviewRequestSchema;

export const ReadingImportPatchSchema = z.object({
  status: ImportStatusSchema.optional(),
  payload: ImportedReadingPayloadSchema.optional(),
});

export const CommunityPostRequestSchema = z.object({
  post_type: CommunityPostTypeSchema,
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(1000),
  reading_id: z.string().trim().min(1).optional(),
  case_id: z.string().trim().min(1).optional(),
  course_id: z.string().trim().min(1).optional(),
  knowledge_card_id: z.string().trim().min(1).optional(),
});

export const CommunityCommentRequestSchema = z.object({
  post_id: z.string().trim().min(1),
  body: z.string().trim().min(1).max(500),
});

export const CommunityReportRequestSchema = z.object({
  target_type: z.enum(["post", "comment"]),
  target_id: z.string().trim().min(1),
  reason: CommunityReportReasonSchema,
});

export const RulePackUpsertSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  name: z.string().trim().min(1).max(80),
  scope: RulePackScopeSchema,
  status: RulePackStatusSchema.default("draft"),
  rule_ids: z.array(z.string().trim().min(1).max(32)).min(1),
  weight_profile: z.record(z.string(), z.number()).default({}),
  validation_case_ids: z.array(z.string().trim().min(1).max(80)).min(1),
  source_refs: z.array(z.string().trim().min(1).max(120)).min(1),
  regression_passed: z.boolean().default(false),
});

export const RulePackPatchSchema = RulePackUpsertSchema.omit({ id: true }).partial().extend({
  status: RulePackStatusSchema.optional(),
  regression_passed: z.boolean().optional(),
});

export const AdminReviewRequestSchema = z.object({
  target_type: z.enum(["community_post", "community_comment", "rule_pack", "case", "knowledge_card"]),
  target_id: z.string().trim().min(1),
  review_type: ReviewTypeSchema,
  decision: ReviewDecisionSchema,
  note: z.string().trim().max(240).optional(),
});

export const ContributorSubmissionRequestSchema = z.object({
  submission_type: SubmissionTypeSchema,
  title: z.string().trim().min(1).max(120),
  payload: z.record(z.string(), z.unknown()),
  source_refs: z.array(z.string().trim().min(1).max(160)).min(1),
});

export const ContributorSubmissionPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "archived"]).optional(),
});

export const ContributorSubmissionSubmitSchema = z.object({
  confirm_controlled_opening: z.boolean().default(true),
});

export const AdminSubmissionReviewRequestSchema = z.object({
  review_gate: ReviewGateSchema,
  decision: SubmissionReviewDecisionSchema,
  note: z.string().trim().max(240).optional(),
});

export const RulePackRegressionRequestSchema = z.object({
  validation_case_ids: z.array(z.string().trim().min(1).max(80)).optional(),
  force: z.boolean().default(false),
});

export const RulePackPublishRequestSchema = z.object({
  release_note: z.string().trim().min(1).max(240),
});

export const RulePackRollbackRequestSchema = z.object({
  target_version: z.number().int().min(1),
  reason: z.string().trim().min(1).max(240),
});

export const EcosystemPackageInstallRequestSchema = z.object({
  package_id: z.string().trim().min(1),
});

export const EcosystemPackageDisableRequestSchema = z.object({
  package_id: z.string().trim().min(1),
});

export const EcosystemPackageSuspendRequestSchema = z.object({
  reason: z.string().trim().min(1).max(240),
});

export const SettlementSimulateRequestSchema = z.object({
  contributor_id: z.string().trim().min(1).max(120).default("contributor_demo"),
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, "period must use YYYY-MM"),
  mode: SettlementModeSchema.default("simulated"),
});

export const EcosystemQualityReviewRequestSchema = z.object({
  quality_score: z.number().int().min(0).max(100),
  safety_score: z.number().int().min(0).max(100),
  complaint_count: z.number().int().min(0).default(0),
  regression_failure_count: z.number().int().min(0).default(0),
  install_retention_rate: z.number().min(0).max(1).default(0),
  user_feedback_score: z.number().min(0).max(5).default(0),
  status: QualityReviewStatusSchema,
  risk_level: EcosystemRiskLevelSchema.default("low"),
  moderation_action: ModerationActionSchema.default("warn"),
  note: z.string().trim().min(1).max(400),
});

export const EcosystemRiskEventResolveRequestSchema = z.object({
  resolution: z.string().trim().min(1).max(400),
  action: ModerationActionSchema,
});

export const OpsIncidentRequestSchema = z.object({
  title: z.string().trim().min(1).max(120),
  severity: IncidentSeveritySchema,
  affected_surface: z.string().trim().min(1).max(80),
  summary: z.string().trim().min(1).max(600),
  status: IncidentStatusSchema.default("open"),
});

export const OpsIncidentPatchSchema = z.object({
  status: IncidentStatusSchema.optional(),
  mitigation: z.string().trim().min(1).max(600).optional(),
});

export const CommercialBillingSimulationRequestSchema = z.object({
  contributor_id: z.string().trim().min(1).max(120).default("contributor_demo"),
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, "period must use YYYY-MM"),
  mode: SettlementModeSchema.default("simulated"),
  include_entitlements: z.boolean().default(true),
});

export const PrivacySettingsRequestSchema = z.object({
  save_history: z.boolean().default(true),
  allow_personalization: z.boolean().default(true),
  allow_sensitive_review: z.boolean().default(false),
  retain_history_days: z.number().int().min(0).max(365).default(180),
  export_format: z.enum(["json", "csv"]).default("json"),
});

export const ComplianceReviewResolveRequestSchema = z.object({
  resolution: z.string().trim().min(1).max(400),
  action: ModerationActionSchema,
});

export const AiReadingOutputSchema = z
  .object({
    summary: z.string().trim().min(1),
    key_evidence: z.array(
      z.object({
        evidence_id: z.string().trim().min(1),
        plain_explanation: z.string().trim().min(1),
      }),
    ).min(1),
    counter_evidence: z.array(z.string().trim().min(1)),
    action_tips: z.array(z.string().trim().min(1)).min(1),
    safety_notice: z.string().trim().min(1),
    knowledge_card_refs: z.array(z.string().trim().min(1)).min(1),
    model_metadata: z.object({
      provider: z.string().trim().min(1),
      model: z.string().trim().min(1),
      generated_at: z.string().trim().min(1),
    }),
  })
  .strict();

export type Scenario = (typeof SCENARIOS)[number];
export type CastMethod = (typeof CAST_METHODS)[number];
export type LineValue = (typeof LINE_VALUES)[number];
export type InitReadingRequest = z.infer<typeof InitReadingRequestSchema>;
export type CastRequest = z.infer<typeof CastRequestSchema>;
export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ExplainMode = z.infer<typeof ExplainModeSchema>;
export type ExplainRequest = z.infer<typeof ExplainRequestSchema>;
export type FollowupType = z.infer<typeof FollowupTypeSchema>;
export type MessageRequest = z.infer<typeof MessageRequestSchema>;
export type AiReadingOutput = z.infer<typeof AiReadingOutputSchema>;
export type ContentStatus = z.infer<typeof ContentStatusSchema>;
export type ShareVisibility = z.infer<typeof ShareVisibilitySchema>;
export type MembershipTier = z.infer<typeof MembershipTierSchema>;
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;
export type ExerciseDifficulty = z.infer<typeof ExerciseDifficultySchema>;
export type CaseStatus = z.infer<typeof CaseStatusSchema>;
export type CaseSourceType = z.infer<typeof CaseSourceTypeSchema>;
export type CaseDifficulty = z.infer<typeof CaseDifficultySchema>;
export type CourseStatus = z.infer<typeof CourseStatusSchema>;
export type LessonType = z.infer<typeof LessonTypeSchema>;
export type CreatorExportType = z.infer<typeof CreatorExportTypeSchema>;
export type ExperimentSurface = z.infer<typeof ExperimentSurfaceSchema>;
export type ExperimentVariant = z.infer<typeof ExperimentVariantSchema>;
export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;
export type EventName = z.infer<typeof EventNameSchema>;
export type ClientPlatform = z.infer<typeof ClientPlatformSchema>;
export type VoiceJobStatus = z.infer<typeof VoiceJobStatusSchema>;
export type ImportSourceType = z.infer<typeof ImportSourceTypeSchema>;
export type ImportStatus = z.infer<typeof ImportStatusSchema>;
export type CommunityPostStatus = z.infer<typeof CommunityPostStatusSchema>;
export type ReviewType = z.infer<typeof ReviewTypeSchema>;
export type ReviewDecision = z.infer<typeof ReviewDecisionSchema>;
export type RulePackStatus = z.infer<typeof RulePackStatusSchema>;
export type RulePackScope = z.infer<typeof RulePackScopeSchema>;
export type CommunityPostType = z.infer<typeof CommunityPostTypeSchema>;
export type CommunityReportReason = z.infer<typeof CommunityReportReasonSchema>;
export type ContributorRole = z.infer<typeof ContributorRoleSchema>;
export type SubmissionType = z.infer<typeof SubmissionTypeSchema>;
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;
export type ReviewGate = z.infer<typeof ReviewGateSchema>;
export type SubmissionReviewDecision = z.infer<typeof SubmissionReviewDecisionSchema>;
export type EcosystemPackageType = z.infer<typeof EcosystemPackageTypeSchema>;
export type EcosystemPackageStatus = z.infer<typeof EcosystemPackageStatusSchema>;
export type PackageInstallStatus = z.infer<typeof PackageInstallStatusSchema>;
export type SettlementMode = z.infer<typeof SettlementModeSchema>;
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;
export type QualityReviewStatus = z.infer<typeof QualityReviewStatusSchema>;
export type EcosystemRiskLevel = z.infer<typeof EcosystemRiskLevelSchema>;
export type ModerationAction = z.infer<typeof ModerationActionSchema>;
export type CommercialReadinessGate = z.infer<typeof CommercialReadinessGateSchema>;
export type CommercialReadinessStatus = z.infer<typeof CommercialReadinessStatusSchema>;
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type PrivacyExportStatus = z.infer<typeof PrivacyExportStatusSchema>;
export type ShareReadingRequest = z.infer<typeof ShareReadingRequestSchema>;
export type FavoriteRequest = z.infer<typeof FavoriteRequestSchema>;
export type TagsRequest = z.infer<typeof TagsRequestSchema>;
export type LearningProgressRequest = z.infer<typeof LearningProgressRequestSchema>;
export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;
export type AdminKnowledgeCardPatch = z.infer<typeof AdminKnowledgeCardPatchSchema>;
export type CaseQuery = z.infer<typeof CaseQuerySchema>;
export type AdminCaseUpsert = z.infer<typeof AdminCaseUpsertSchema>;
export type AdminCasePatch = z.infer<typeof AdminCasePatchSchema>;
export type CourseProgressRequest = z.infer<typeof CourseProgressRequestSchema>;
export type CreatorExportRequest = z.infer<typeof CreatorExportRequestSchema>;
export type ExperimentAssignmentQuery = z.infer<typeof ExperimentAssignmentQuerySchema>;
export type EventRequest = z.infer<typeof EventRequestSchema>;
export type AdminExperimentPatch = z.infer<typeof AdminExperimentPatchSchema>;
export type DeviceRegisterRequest = z.infer<typeof DeviceRegisterRequestSchema>;
export type PushSettingsRequest = z.infer<typeof PushSettingsRequestSchema>;
export type VoiceTranscribeRequest = z.infer<typeof VoiceTranscribeRequestSchema>;
export type VoiceExplainRequest = z.infer<typeof VoiceExplainRequestSchema>;
export type ImportedReadingPayload = z.infer<typeof ImportedReadingPayloadSchema>;
export type ReadingImportPreviewRequest = z.infer<typeof ReadingImportPreviewRequestSchema>;
export type ReadingImportRequest = z.infer<typeof ReadingImportRequestSchema>;
export type ReadingImportPatch = z.infer<typeof ReadingImportPatchSchema>;
export type CommunityPostRequest = z.infer<typeof CommunityPostRequestSchema>;
export type CommunityCommentRequest = z.infer<typeof CommunityCommentRequestSchema>;
export type CommunityReportRequest = z.infer<typeof CommunityReportRequestSchema>;
export type RulePackUpsert = z.infer<typeof RulePackUpsertSchema>;
export type RulePackPatch = z.infer<typeof RulePackPatchSchema>;
export type AdminReviewRequest = z.infer<typeof AdminReviewRequestSchema>;
export type ContributorSubmissionRequest = z.infer<typeof ContributorSubmissionRequestSchema>;
export type ContributorSubmissionPatch = z.infer<typeof ContributorSubmissionPatchSchema>;
export type ContributorSubmissionSubmit = z.infer<typeof ContributorSubmissionSubmitSchema>;
export type AdminSubmissionReviewRequest = z.infer<typeof AdminSubmissionReviewRequestSchema>;
export type RulePackRegressionRequest = z.infer<typeof RulePackRegressionRequestSchema>;
export type RulePackPublishRequest = z.infer<typeof RulePackPublishRequestSchema>;
export type RulePackRollbackRequest = z.infer<typeof RulePackRollbackRequestSchema>;
export type EcosystemPackageInstallRequest = z.infer<typeof EcosystemPackageInstallRequestSchema>;
export type EcosystemPackageDisableRequest = z.infer<typeof EcosystemPackageDisableRequestSchema>;
export type EcosystemPackageSuspendRequest = z.infer<typeof EcosystemPackageSuspendRequestSchema>;
export type SettlementSimulateRequest = z.infer<typeof SettlementSimulateRequestSchema>;
export type EcosystemQualityReviewRequest = z.infer<typeof EcosystemQualityReviewRequestSchema>;
export type EcosystemRiskEventResolveRequest = z.infer<typeof EcosystemRiskEventResolveRequestSchema>;
export type OpsIncidentRequest = z.infer<typeof OpsIncidentRequestSchema>;
export type OpsIncidentPatch = z.infer<typeof OpsIncidentPatchSchema>;
export type CommercialBillingSimulationRequest = z.infer<typeof CommercialBillingSimulationRequestSchema>;
export type PrivacySettingsRequest = z.infer<typeof PrivacySettingsRequestSchema>;
export type ComplianceReviewResolveRequest = z.infer<typeof ComplianceReviewResolveRequestSchema>;
