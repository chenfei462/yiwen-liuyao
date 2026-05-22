import { randomUUID } from "crypto";
import { castChart, type CastChartResult } from "./chart-engine";
import { resolveDayGanzhi, resolveMonthBranch, type BranchName, type DayGanzhi, type MonthSource } from "./calendar";
import { explainWithAi } from "./ai-orchestrator";
import {
  AnalyzeRequestSchema,
  AdminCasePatchSchema,
  AdminCaseUpsertSchema,
  AdminExperimentPatchSchema,
  AdminKnowledgeCardPatchSchema,
  AdminSubmissionReviewRequestSchema,
  AdminReviewRequestSchema,
  CastRequestSchema,
  CommercialBillingSimulationRequestSchema,
  ComplianceReviewResolveRequestSchema,
  CommunityCommentRequestSchema,
  CommunityPostRequestSchema,
  CommunityReportRequestSchema,
  CourseProgressRequestSchema,
  CreatorExportRequestSchema,
  DeviceRegisterRequestSchema,
  EcosystemPackageDisableRequestSchema,
  EcosystemPackageInstallRequestSchema,
  EcosystemPackageSuspendRequestSchema,
  EcosystemQualityReviewRequestSchema,
  EcosystemRiskEventResolveRequestSchema,
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
  RulePackPublishRequestSchema,
  RulePackRegressionRequestSchema,
  RulePackRollbackRequestSchema,
  RulePackPatchSchema,
  RulePackUpsertSchema,
  OpsIncidentPatchSchema,
  OpsIncidentRequestSchema,
  PrivacySettingsRequestSchema,
  ContributorSubmissionPatchSchema,
  ContributorSubmissionRequestSchema,
  ContributorSubmissionSubmitSchema,
  SettlementSimulateRequestSchema,
  ShareReadingRequestSchema,
  TagsRequestSchema,
  VoiceExplainRequestSchema,
  VoiceTranscribeRequestSchema,
  type AnalyzeRequest,
  type AdminCasePatch,
  type AdminCaseUpsert,
  type AdminExperimentPatch,
  type AdminKnowledgeCardPatch,
  type AdminSubmissionReviewRequest,
  type AdminReviewRequest,
  type CaseDifficulty,
  type CaseQuery,
  type CaseSourceType,
  type CaseStatus,
  type CastRequest,
  type ClientPlatform,
  type CommercialBillingSimulationRequest,
  type CommercialReadinessGate,
  type CommercialReadinessStatus,
  type ComplianceReviewResolveRequest,
  type CommunityCommentRequest,
  type CommunityPostRequest,
  type CommunityPostStatus,
  type CommunityReportRequest,
  type ContentStatus,
  type CourseProgressRequest,
  type CourseStatus,
  type ContributorRole,
  type ContributorSubmissionPatch,
  type ContributorSubmissionRequest,
  type ContributorSubmissionSubmit,
  type CreatorExportRequest,
  type CreatorExportType,
  type DeviceRegisterRequest,
  type EcosystemPackageDisableRequest,
  type EcosystemPackageInstallRequest,
  type EcosystemPackageStatus,
  type EcosystemPackageSuspendRequest,
  type EcosystemPackageType,
  type EcosystemQualityReviewRequest,
  type EcosystemRiskEventResolveRequest,
  type EcosystemRiskLevel,
  type ExerciseDifficulty,
  type ExperimentAssignmentQuery,
  type ExperimentStatus,
  type ExperimentSurface,
  type ExperimentVariant,
  type EventRequest,
  type ExplainRequest,
  type FavoriteRequest,
  type FeedbackRequest,
  type ImportedReadingPayload,
  type ImportSourceType,
  type ImportStatus,
  type InitReadingRequest,
  type IncidentStatus,
  type LearningProgressRequest,
  type LessonType,
  type MessageRequest,
  type ModerationAction,
  type OpsIncidentPatch,
  type OpsIncidentRequest,
  type PrivacyExportStatus,
  type PrivacySettingsRequest,
  type QualityReviewStatus,
  type PushSettingsRequest,
  type ReadingImportPatch,
  type ReadingImportPreviewRequest,
  type ReadingImportRequest,
  type ReviewGate,
  type RulePackPublishRequest,
  type RulePackRegressionRequest,
  type RulePackRollbackRequest,
  type RulePackPatch,
  type RulePackScope,
  type RulePackUpsert,
  type SettlementMode,
  type SettlementSimulateRequest,
  type SettlementStatus,
  type ShareReadingRequest,
  type SubmissionStatus,
  type SubmissionType,
  type TagsRequest,
  type VoiceExplainRequest,
  type VoiceJobStatus,
  type VoiceTranscribeRequest,
} from "./contracts";
import { EXERCISE_SEEDS, KNOWLEDGE_CARD_SEEDS, searchKnowledgeCards, type KnowledgeCard } from "./knowledge-base";
import { createPostgresSnapshotStore, READING_SNAPSHOT_SCOPE, type SnapshotStore } from "./postgres-snapshot-store";
import { analyzeRules, type RuleAnalysisResult } from "./rule-engine";
import { classifyQuestion, type SafetyClassification } from "./safety";

type ReadingRecord = InitReadingRequest & {
  id: string;
  owner_id: string;
  safety: SafetyClassification;
  created_at: string;
};

export type ReadingHistoryItem = {
  reading_id: string;
  question_preview: string;
  scenario: InitReadingRequest["scenario"];
  cast_method: CastRequest["cast_method"];
  base_chart: string;
  changed_chart: string;
  cast_time: string;
  day_ganzhi: string;
  month_branch: BranchName;
  month_source: MonthSource;
  created_at: string;
};

type CastRecord = ReadingHistoryItem & {
  owner_id: string;
  chart_json: CastChartResult;
  updated_at: string;
};

type AnalysisRecord = RuleAnalysisResult & {
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  reading_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  safety_label: string;
  followup_type?: MessageRequest["followup_type"];
  created_at: string;
};

export type LearningTerm = {
  id: string;
  term: string;
  rule_id: string;
  scenario: KnowledgeCard["scenario"];
  definition: string;
  example: string;
  counter_example: string;
  source_refs: string[];
  status: ContentStatus;
};

export type LearningProgressRecord = LearningProgressRequest & {
  id: string;
  user_id: string;
  updated_at: string;
};

export type FeedbackRecord = FeedbackRequest & {
  id: string;
  created_at: string;
};

export type ShareCardPayload = {
  share_id: string;
  visibility: ShareReadingRequest["visibility"];
  base_chart: string;
  changed_chart: string;
  scenario: InitReadingRequest["scenario"];
  cast_time: string;
  day_ganzhi: string;
  month_branch: BranchName;
  question_preview: string;
  key_points: string[];
  safety_notice: string;
};

export type ShareRecord = {
  share_id: string;
  share_url: string;
  reading_id: string;
  visibility: ShareReadingRequest["visibility"];
  card_payload: ShareCardPayload;
  created_at: string;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  risk_label: string;
  reading_id?: string;
  detail?: string;
  created_at: string;
};

export type CaseRecord = {
  id: string;
  title: string;
  scenario: InitReadingRequest["scenario"];
  source_type: CaseSourceType;
  difficulty: CaseDifficulty;
  status: CaseStatus;
  question_preview: string;
  base_chart: string;
  changed_chart: string;
  yongshen: string;
  evidence_ids: string[];
  rule_ids: string[];
  learning_summary: string;
  counter_evidence: string[];
  source_refs: string[];
  license_note: string;
  created_at: string;
  updated_at: string;
};

export type CourseLesson = {
  id: string;
  title: string;
  lesson_type: LessonType;
  summary: string;
  knowledge_card_ids: string[];
  exercise_ids: string[];
  case_ids: string[];
  duration_minutes: number;
};

export type CourseRecord = {
  id: string;
  title: string;
  status: CourseStatus;
  difficulty: CaseDifficulty;
  summary: string;
  lesson_count: number;
  lessons: CourseLesson[];
  badge: string;
  created_at: string;
  updated_at: string;
};

export type CourseProgressRecord = CourseProgressRequest & {
  id: string;
  user_id: string;
  badge?: string;
  updated_at: string;
};

export type CreatorExportRecord = {
  id: string;
  export_type: CreatorExportType;
  reading_id?: string;
  case_id?: string;
  title: string;
  content_sections: string[];
  source_refs: string[];
  safety_notice: string;
  created_at: string;
};

export type ExperimentRecord = {
  id: string;
  surface: ExperimentSurface;
  name: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  created_at: string;
  updated_at: string;
};

export type ExperimentAssignment = {
  experiment_id: string;
  surface: ExperimentSurface;
  variant: ExperimentVariant;
  status: ExperimentStatus;
};

export type EventRecord = EventRequest & {
  id: string;
  created_at: string;
};

export type DeviceRecord = DeviceRegisterRequest & {
  device_id: string;
  capabilities: string[];
  safety_policy_version: string;
  registered_at: string;
};

export type PushSettingsRecord = PushSettingsRequest & {
  updated_at: string;
};

export type VoiceJobRecord = {
  job_id: string;
  status: VoiceJobStatus;
  transcript: string;
  platform: ClientPlatform;
  safety: SafetyClassification;
  raw_audio_stored: boolean;
  audio_url: string | null;
  created_at: string;
};

export type ReadingImportRecord = {
  import_id: string;
  source_type: ImportSourceType;
  status: ImportStatus;
  editable_fields: Partial<ImportedReadingPayload>;
  errors: string[];
  ai_generated_chart_fields: false;
  reading_id?: string;
  chart_json?: CastChartResult;
  created_at: string;
  updated_at: string;
};

export type CommunityPostRecord = CommunityPostRequest & {
  id: string;
  status: CommunityPostStatus;
  author_label: string;
  question_preview: string;
  created_at: string;
  updated_at: string;
};

export type CommunityCommentRecord = CommunityCommentRequest & {
  id: string;
  status: CommunityPostStatus;
  author_label: string;
  created_at: string;
};

export type CommunityReportRecord = CommunityReportRequest & {
  id: string;
  status: "pending_review" | "resolved";
  created_at: string;
};

export type RulePackRecord = RulePackUpsert & {
  id: string;
  rule_pack_id: string;
  rule_pack_version: number;
  professional_reviewed: boolean;
  compliance_reviewed: boolean;
  safety_reviewed: boolean;
  regression_reviewed: boolean;
  regression_report_id?: string;
  created_at: string;
  updated_at: string;
};

export type AdminReviewRecord = AdminReviewRequest & {
  id: string;
  created_at: string;
};

export type ContributorSubmissionRecord = ContributorSubmissionRequest & {
  id: string;
  contributor_id: string;
  contributor_roles: ContributorRole[];
  status: SubmissionStatus;
  version: number;
  target_id?: string;
  target_type?: SubmissionType;
  gates: Partial<Record<ReviewGate, "pending" | "approved" | "rejected" | "changes_requested">>;
  review_notes: Array<AdminSubmissionReviewRequest & { id: string; created_at: string }>;
  diff_summary: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  published_at?: string;
};

export type RulePackRegressionRecord = {
  id: string;
  rule_pack_id: string;
  status: "passed" | "failed";
  validation_case_ids: string[];
  passed_case_count: number;
  failed_case_count: number;
  p95_ms: number;
  report: string;
  created_at: string;
};

export type EcosystemPackageRecord = {
  id: string;
  package_type: EcosystemPackageType;
  title: string;
  status: EcosystemPackageStatus;
  contributor_id: string;
  source_submission_id?: string;
  entity_id: string;
  entity_version: number;
  summary: string;
  source_refs: string[];
  install_count: number;
  quality_score: number;
  safety_score: number;
  release_note?: string;
  suspended_reason?: string;
  created_at: string;
  updated_at: string;
};

export type PackageInstallRecord = EcosystemPackageInstallRequest & {
  id: string;
  user_id: string;
  status: "installed" | "disabled" | "removed";
  installed_at: string;
  updated_at: string;
};

export type SettlementLedgerEventRecord = {
  id: string;
  contributor_id: string;
  package_id: string;
  event_name: "package_installed" | "course_completed" | "template_exported";
  amount_cents: number;
  mode: SettlementMode;
  created_at: string;
};

export type ContributorSettlementRecord = {
  id: string;
  contributor_id: string;
  period: string;
  mode: SettlementMode;
  status: SettlementStatus;
  total_amount_cents: number;
  event_count: number;
  created_at: string;
};

export type EcosystemQualityRecord = {
  id: string;
  package_id: string;
  package_type: EcosystemPackageType;
  title: string;
  quality_status: QualityReviewStatus;
  quality_score: number;
  safety_score: number;
  complaint_count: number;
  regression_failure_count: number;
  install_retention_rate: number;
  user_feedback_score: number;
  risk_level: EcosystemRiskLevel;
  moderation_action: ModerationAction;
  note: string;
  reviewed_at: string;
};

export type EcosystemRiskEventRecord = {
  id: string;
  package_id: string;
  package_title: string;
  risk_level: EcosystemRiskLevel;
  moderation_action: ModerationAction;
  status: "open" | "resolved";
  detail: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
};

export type OpsIncidentRecord = OpsIncidentRequest & {
  id: string;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  mitigation?: string;
};

export type CommercialReadinessGateRecord = {
  gate: CommercialReadinessGate;
  status: CommercialReadinessStatus;
  evidence: string;
};

export type CommercialBillingSimulationRecord = {
  id: string;
  contributor_id: string;
  period: string;
  mode: SettlementMode;
  line_items: Array<{ source: string; amount_cents: number; note: string }>;
  total_amount_cents: number;
  real_money_movement: false;
  generated_at: string;
};

export type UserPrivacySettingsRecord = PrivacySettingsRequest & {
  user_id: string;
  updated_at: string;
};

export type PrivacyDataExportRecord = {
  id: string;
  user_id: string;
  status: PrivacyExportStatus;
  export_format: PrivacySettingsRequest["export_format"];
  includes_raw_question_text: false;
  includes_private_followups: false;
  download_url: string;
  created_at: string;
  completed_at?: string;
};

export type ComplianceReviewRecord = {
  id: string;
  review_type: "privacy_export" | "sensitive_content" | "commitment_scan" | "minor_protection";
  target_id: string;
  risk_level: EcosystemRiskLevel;
  status: "open" | "resolved";
  summary: string;
  action?: ModerationAction;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
};

const readings = new Map<string, ReadingRecord>();
const casts = new Map<string, CastRecord>();
const analyses = new Map<string, AnalysisRecord>();
const messages = new Map<string, MessageRecord[]>();
const shares = new Map<string, ShareRecord>();
const favorites = new Set<string>();
const readingTags = new Map<string, string[]>();
const learningProgress = new Map<string, LearningProgressRecord>();
const feedbackRecords = new Map<string, FeedbackRecord>();
const auditLogs = new Map<string, AuditLogRecord>();
const knowledgeStatusOverrides = new Map<string, { status: ContentStatus; review_note?: string; updated_at: string }>();
const caseOverrides = new Map<string, CaseRecord>();
const courseProgress = new Map<string, CourseProgressRecord>();
const creatorExports = new Map<string, CreatorExportRecord>();
const experimentOverrides = new Map<string, ExperimentRecord>();
const events = new Map<string, EventRecord>();
const devices = new Map<string, DeviceRecord>();
const pushSettings = new Map<string, PushSettingsRecord>();
const voiceJobs = new Map<string, VoiceJobRecord>();
const readingImports = new Map<string, ReadingImportRecord>();
const communityPosts = new Map<string, CommunityPostRecord>();
const communityComments = new Map<string, CommunityCommentRecord[]>();
const communityReports = new Map<string, CommunityReportRecord>();
const rulePackOverrides = new Map<string, RulePackRecord>();
const adminReviews = new Map<string, AdminReviewRecord>();
const contributorSubmissions = new Map<string, ContributorSubmissionRecord>();
const rulePackRegressions = new Map<string, RulePackRegressionRecord>();
const ecosystemPackages = new Map<string, EcosystemPackageRecord>();
const packageInstalls = new Map<string, PackageInstallRecord>();
const settlementLedger = new Map<string, SettlementLedgerEventRecord>();
const contributorSettlements = new Map<string, ContributorSettlementRecord>();
const ecosystemQualityReviews = new Map<string, EcosystemQualityRecord>();
const ecosystemRiskEvents = new Map<string, EcosystemRiskEventRecord>();
const opsIncidents = new Map<string, OpsIncidentRecord>();
const commercialBillingSimulations = new Map<string, CommercialBillingSimulationRecord>();
const privacySettings = new Map<string, UserPrivacySettingsRecord>();
const privacyDataExports = new Map<string, PrivacyDataExportRecord>();
const complianceReviews = new Map<string, ComplianceReviewRecord>();

const CASE_SCENARIOS: InitReadingRequest["scenario"][] = ["事业", "财务", "感情", "考试", "失物", "其他"];
const CASE_DIFFICULTIES: CaseDifficulty[] = ["beginner", "intermediate", "advanced"];
const CASE_SOURCE_TYPES: CaseSourceType[] = ["classic", "editorial", "anonymized_user"];
const RULE_ROTATION = ["B-YS-001", "B-WR-001", "B-DV-001", "B-XK-001", "B-SY-001", "B-HC-001"];
const HEXAGRAM_ROTATION = ["乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比"];
const YONGSHEN_BY_SCENARIO: Record<InitReadingRequest["scenario"], string> = {
  事业: "官鬼",
  财务: "妻财",
  感情: "世应",
  考试: "父母",
  失物: "妻财",
  其他: "世爻",
};
const CREATOR_BANNED_TERMS = ["包准", "改命", "消灾", "一定复合", "一定发财", "诊断", "投资建议"];
const CREATOR_SAFETY_NOTICE = "创作者素材仅用于传统文化学习、案例复盘和娱乐互动，不构成现实决策建议。";
const ECOSYSTEM_BANNED_TERMS = [...CREATOR_BANNED_TERMS, "guaranteed", "get rich", "make someone return", "diagnosis", "investment advice"];
const DEFAULT_CONTRIBUTOR_ID = "contributor_demo";
const DEFAULT_CONTRIBUTOR_ROLES: ContributorRole[] = ["creator", "expert"];

const CASE_SEEDS: CaseRecord[] = Array.from({ length: 60 }, (_, index) => {
  const caseNo = index + 1;
  const scenario = CASE_SCENARIOS[index % CASE_SCENARIOS.length];
  const ruleId = index % 6 === 0 ? "B-YS-001" : RULE_ROTATION[index % RULE_ROTATION.length];
  const companionRule = RULE_ROTATION[(index + 2) % RULE_ROTATION.length];
  const now = "2026-05-01T00:00:00.000Z";
  return {
    id: `case-${String(caseNo).padStart(3, "0")}`,
    title: `${scenario}卦例复盘 ${String(caseNo).padStart(2, "0")}`,
    scenario,
    source_type: CASE_SOURCE_TYPES[index % CASE_SOURCE_TYPES.length],
    difficulty: CASE_DIFFICULTIES[index % CASE_DIFFICULTIES.length],
    status: "approved",
    question_preview: "redacted",
    base_chart: HEXAGRAM_ROTATION[index % HEXAGRAM_ROTATION.length],
    changed_chart: HEXAGRAM_ROTATION[(index + 3) % HEXAGRAM_ROTATION.length],
    yongshen: YONGSHEN_BY_SCENARIO[scenario],
    evidence_ids: [`case-${String(caseNo).padStart(3, "0")}:${ruleId}:01`, `case-${String(caseNo).padStart(3, "0")}:${companionRule}:02`],
    rule_ids: Array.from(new Set([ruleId, companionRule, "B-YS-001"])),
    learning_summary: "本案例用于学习取用、证据排序和反证保留，公开展示前已脱敏。",
    counter_evidence: ["反证用于提示结论边界，不能省略。"],
    source_refs: [`V1.5案例种子-${String(caseNo).padStart(2, "0")}`],
    license_note: "编辑自研或已授权脱敏案例",
    created_at: now,
    updated_at: now,
  };
});

const COURSE_SEEDS: CourseRecord[] = [
  makeCourseSeed("course-01", "入门课", "beginner", ["article", "quiz", "practice"], ["case-001", "case-007"]),
  makeCourseSeed("course-02", "装卦课", "beginner", ["article", "case_review", "practice"], ["case-002", "case-008"]),
  makeCourseSeed("course-03", "用神课", "intermediate", ["article", "quiz", "case_review"], ["case-003", "case-009"]),
  makeCourseSeed("course-04", "证据树课", "intermediate", ["article", "case_review", "practice"], ["case-004", "case-010"]),
  makeCourseSeed("course-05", "卦例复盘课", "advanced", ["case_review", "quiz", "practice"], ["case-005", "case-011"]),
];

const EXPERIMENT_SEEDS: ExperimentRecord[] = [
  makeExperimentSeed("experiment-home-guidance", "home", "首页起卦引导"),
  makeExperimentSeed("experiment-result-cta", "result", "结果页学习入口"),
  makeExperimentSeed("experiment-learning-entry", "learning", "知识卡入口"),
  makeExperimentSeed("experiment-share-card", "share", "分享卡样式"),
  makeExperimentSeed("experiment-course-reco", "course", "课程推荐"),
];

const RULE_PACK_SEEDS: RulePackRecord[] = [
  makeRulePackSeed("rule-pack-core-yongshen", "Core Yongshen Pack", "yongshen", ["B-YS-001"]),
  makeRulePackSeed("rule-pack-core-wangshuai", "Core Wangshuai Pack", "wangshuai", ["B-WR-001"]),
  makeRulePackSeed("rule-pack-core-dongbian", "Core Dongbian Pack", "dongbian", ["B-DV-001"]),
];

type PrincipalScope = {
  owner_id?: string;
};

const DEFAULT_OWNER_ID = "anonymous";

export async function initReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input = InitReadingRequestSchema.parse(rawInput);
  const safety = classifyQuestion(input.question);
  const id = `reading_${randomUUID()}`;
  readings.set(id, {
    ...input,
    id,
    owner_id: scope.owner_id ?? DEFAULT_OWNER_ID,
    safety,
    created_at: new Date().toISOString(),
  });
  await persistStore();

  return {
    reading_id: id,
    safety_status: safety,
    rewrite_suggestions:
      safety.status === "allowed"
        ? ["问题越具体越便于学习排盘，例如补充对象、时间范围和你想观察的重点。"]
        : [safety.notice],
  };
}

export async function castReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: CastRequest = CastRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const castTime = input.cast_time ?? toCivilDateString(new Date());
  const dayGanzhi = resolveDayGanzhi({
    dayGanzhi: input.day_ganzhi,
    castTime,
  });
  const monthContext = resolveMonthBranch({
    monthBranch: input.month_branch,
    castTime,
  });
  const lineValues = input.cast_method === "time" ? deriveTimeCastLines(castTime, dayGanzhi) : input.line_values;
  if (!lineValues) {
    throw new Error("line_values must contain exactly six bottom-to-top values");
  }
  const chart = castChart({
    lineValues,
    dayGanzhi,
  });
  const now = new Date().toISOString();

  casts.set(input.reading_id, {
    owner_id: reading.owner_id,
    reading_id: input.reading_id,
    question_preview: createQuestionPreview(reading.question),
    scenario: reading.scenario,
    cast_method: input.cast_method,
    base_chart: chart.base_chart.name,
    changed_chart: chart.changed_chart.name,
    cast_time: castTime,
    day_ganzhi: dayGanzhi,
    month_branch: monthContext.monthBranch,
    month_source: monthContext.monthSource,
    chart_json: chart,
    created_at: reading.created_at,
    updated_at: now,
  });
  deleteAnalysisCache(input.reading_id);
  await persistStore();

  return {
    reading_id: input.reading_id,
    cast_method: input.cast_method,
    cast_time: castTime,
    day_ganzhi: dayGanzhi,
    month_branch: monthContext.monthBranch,
    month_source: monthContext.monthSource,
    ...chart,
  };
}

export async function analyzeReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: AnalyzeRequest = AnalyzeRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const cacheKey = getAnalysisCacheKey(input.reading_id, input.mode);
  const cached = analyses.get(cacheKey);
  if (cached && !input.force_refresh) {
    return stripAnalysisRecord(cached);
  }

  const cast = casts.get(input.reading_id);
  if (!cast && reading.safety.status !== "blocked") {
    throw new Error(`Cast not found: ${input.reading_id}`);
  }

  const analysis = analyzeRules({
    readingId: input.reading_id,
    question: reading.question,
    scenario: reading.scenario,
    mode: input.mode,
    safety: reading.safety,
    chart: cast?.chart_json,
    dateContext: {
      cast_time: cast?.cast_time ?? toCivilDateString(new Date()),
      day_ganzhi: (cast?.day_ganzhi ?? resolveDayGanzhi({})) as DayGanzhi,
      month_branch: cast?.month_branch ?? "子",
      month_source: cast?.month_source ?? "jieqi_table",
    },
  });

  analyses.set(cacheKey, {
    ...analysis,
    updated_at: new Date().toISOString(),
  });
  await persistStore();

  return analysis;
}

export async function explainReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: ExplainRequest = ExplainRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const analysis = await analyzeReading({
    reading_id: input.reading_id,
    mode: toAnalyzeMode(input.mode),
    force_refresh: input.force_refresh,
  }, scope);
  const knowledgeCards = getKnowledgeCardsForAnalysis(reading.scenario, analysis);
  return explainWithAi({
    question: reading.question,
    scenario: reading.scenario,
    mode: input.mode,
    analysis,
    chart: casts.get(input.reading_id)?.chart_json,
    knowledgeCards,
  });
}

export async function messageReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: MessageRequest = MessageRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const safety = classifyQuestion(input.message);
  await appendMessage({
    reading_id: input.reading_id,
    role: "user",
    content: input.message,
    safety_label: safety.risk_label,
    followup_type: input.followup_type,
  });
  if (safety.status === "blocked") {
    const blockedAnalysis = analyzeRules({
      readingId: input.reading_id,
      question: reading.question,
      scenario: reading.scenario,
      mode: "learning",
      safety,
      chart: casts.get(input.reading_id)?.chart_json,
      dateContext: {
        cast_time: casts.get(input.reading_id)?.cast_time ?? toCivilDateString(new Date()),
        day_ganzhi: (casts.get(input.reading_id)?.day_ganzhi ?? resolveDayGanzhi({})) as DayGanzhi,
        month_branch: casts.get(input.reading_id)?.month_branch ?? "子",
        month_source: casts.get(input.reading_id)?.month_source ?? "jieqi_table",
      },
    });
    const blockedEvents = await explainWithAi({
      question: reading.question,
      scenario: reading.scenario,
    mode: "learning",
    analysis: blockedAnalysis,
    chart: casts.get(input.reading_id)?.chart_json,
    knowledgeCards: [],
    followup: { message: input.message, type: input.followup_type },
  });
    return blockedEvents;
  }

  const analysis = await analyzeReading({
    reading_id: input.reading_id,
    mode: input.followup_type === "learning_mode" ? "learning" : "light",
  }, scope);
  const knowledgeCards = getKnowledgeCardsForAnalysis(reading.scenario, analysis, input.message);
  const events = await explainWithAi({
    question: reading.question,
    scenario: reading.scenario,
    mode: input.followup_type === "learning_mode" ? "learning" : "light",
    analysis,
    chart: casts.get(input.reading_id)?.chart_json,
    knowledgeCards,
    followup: { message: input.message, type: input.followup_type },
  });
  const final = events.find((event) => event.type === "final");
  if (final) {
    await appendMessage({
      reading_id: input.reading_id,
      role: "assistant",
      content: final.data.summary,
      safety_label: "general",
      followup_type: input.followup_type,
    });
  }
  return events;
}

export async function listReadingMessages(readingId: string) {
  await hydrateStore();
  return messages.get(readingId) ?? [];
}

export async function queryKnowledgeCards(input: {
  reading_id?: string;
  rule_id?: string;
  term?: string;
  scenario?: InitReadingRequest["scenario"];
  limit?: number;
}, scope: PrincipalScope = {}) {
  await hydrateStore();
  const analysis = input.reading_id
    ? await analyzeReading({ reading_id: input.reading_id, mode: "learning" }, scope)
    : undefined;
  return searchKnowledgeCards({
    rule_id: input.rule_id,
    term: input.term,
    scenario: input.scenario ?? analysis?.question_type,
    evidence_rule_ids: analysis?.evidence_tree.map((node) => node.rule_id),
    limit: input.limit,
  }).map(applyKnowledgeStatus).filter((card) => card.status === "approved");
}

export async function listLearningTerms(input: {
  term?: string;
  rule_id?: string;
  scenario?: InitReadingRequest["scenario"];
  limit?: number;
} = {}) {
  await hydrateStore();
  const cards = listKnowledgeCardsForLearning({
    term: input.term,
    rule_id: input.rule_id,
    scenario: input.scenario,
    limit: input.limit ?? 100,
  });
  return cards.map((card, index) => ({
    id: `term-${String(index + 1).padStart(3, "0")}-${card.id}`,
    term: card.term,
    rule_id: card.rule_id,
    scenario: card.scenario,
    definition: card.content,
    example: `例：在${card.scenario === "通用" ? "通用" : card.scenario}场景中，先把“${card.term}”放回证据树观察。`,
    counter_example: `反例：不能只凭“${card.term}”一项就给出现实承诺。`,
    source_refs: card.source_refs,
    status: card.status,
  }));
}

export async function getLearningCard(cardId: string) {
  await hydrateStore();
  const card = findKnowledgeCard(cardId);
  if (!card || card.status !== "approved") {
    throw new Error(`Knowledge card not found: ${cardId}`);
  }
  return {
    ...card,
    example: `学习时先看 ${card.rule_id} 的适用条件，再回到卦盘里的对应爻位。`,
    counter_example: "不要把单张知识卡当成确定预测，也不要脱离反证和安全提示使用。",
    safety_notice: "本知识卡用于传统文化学习与娱乐体验，不构成现实决策建议。",
  };
}

export async function listLearningExercises(input: {
  term?: string;
  rule_id?: string;
  scenario?: InitReadingRequest["scenario"];
  difficulty?: ExerciseDifficulty;
  limit?: number;
} = {}) {
  await hydrateStore();
  return EXERCISE_SEEDS.map((exercise) => ({ ...exercise, status: exercise.status }))
    .filter((exercise) => exercise.status === "approved")
    .filter((exercise) => !input.difficulty || exercise.difficulty === input.difficulty)
    .filter((exercise) => {
      const card = findKnowledgeCard(exercise.knowledge_card_id);
      if (!card || card.status !== "approved") return false;
      if (input.rule_id && card.rule_id !== input.rule_id) return false;
      if (input.scenario && card.scenario !== input.scenario && card.scenario !== "通用") return false;
      if (input.term && !`${card.term} ${card.title} ${card.content}`.includes(input.term)) return false;
      return true;
    })
    .slice(0, input.limit ?? 40);
}

export async function updateLearningProgress(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input = LearningProgressRequestSchema.parse(rawInput);
  const now = new Date().toISOString();
  const record: LearningProgressRecord = {
    ...input,
    id: `progress_${randomUUID()}`,
    user_id: scope.owner_id ?? DEFAULT_OWNER_ID,
    updated_at: now,
  };
  learningProgress.set(input.subject_id, record);
  appendAuditLog({
    action: "learning_progress_updated",
    risk_label: "general",
    detail: input.subject_type,
  });
  await persistStore();
  return record;
}

export async function favoriteReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: FavoriteRequest = FavoriteRequestSchema.parse(rawInput);
  ensureReadingForScope(input.reading_id, scope);
  if (input.favorite) {
    favorites.add(input.reading_id);
  } else {
    favorites.delete(input.reading_id);
  }
  appendAuditLog({
    action: input.favorite ? "reading_favorited" : "reading_unfavorited",
    risk_label: "general",
    reading_id: input.reading_id,
  });
  await persistStore();
  return { reading_id: input.reading_id, favorite: input.favorite };
}

export async function updateReadingTags(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: TagsRequest = TagsRequestSchema.parse(rawInput);
  ensureReadingForScope(input.reading_id, scope);
  const tags = Array.from(new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 8);
  readingTags.set(input.reading_id, tags);
  appendAuditLog({
    action: "reading_tags_updated",
    risk_label: "general",
    reading_id: input.reading_id,
  });
  await persistStore();
  return { reading_id: input.reading_id, tags };
}

export async function getMemberProgress(scope: PrincipalScope = {}) {
  await hydrateStore();
  const ownerId = scope.owner_id ?? DEFAULT_OWNER_ID;
  return {
    membership: {
      tier: "free" as const,
      entitlements: ["基础历史", "收藏", "标签", "学习进度"],
    },
    favorites: Array.from(favorites).filter((readingId) => readings.get(readingId)?.owner_id === ownerId),
    tags: Object.fromEntries(Array.from(readingTags.entries()).filter(([readingId]) => readings.get(readingId)?.owner_id === ownerId)),
    learning_progress: Array.from(learningProgress.values())
      .filter((item) => item.user_id === ownerId)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
  };
}

export async function submitFeedback(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: FeedbackRequest = FeedbackRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const record: FeedbackRecord = {
    ...input,
    id: `feedback_${randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  feedbackRecords.set(record.id, record);
  appendAuditLog({
    action: "feedback_submitted",
    risk_label: reading.safety.risk_label,
    reading_id: input.reading_id,
    detail: input.feedback_type,
  });
  await persistStore();
  return record;
}

export async function createReadingShare(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: ShareReadingRequest = ShareReadingRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  if (reading.safety.status === "blocked") {
    appendAuditLog({
      action: "share_blocked",
      risk_label: reading.safety.risk_label,
      reading_id: input.reading_id,
    });
    await persistStore();
    throw new Error("High-risk readings cannot be shared");
  }
  const cast = casts.get(input.reading_id);
  if (!cast) {
    throw new Error(`Cast not found: ${input.reading_id}`);
  }
  const analysis = await analyzeReading({ reading_id: input.reading_id, mode: "learning" }, scope);
  const shareId = `share_${randomUUID()}`;
  const record: ShareRecord = {
    share_id: shareId,
    share_url: `/share/${shareId}`,
    reading_id: input.reading_id,
    visibility: input.visibility,
    card_payload: {
      share_id: shareId,
      visibility: input.visibility,
      base_chart: cast.base_chart,
      changed_chart: cast.changed_chart,
      scenario: reading.scenario,
      cast_time: cast.cast_time,
      day_ganzhi: cast.day_ganzhi,
      month_branch: cast.month_branch,
      question_preview: "问题已脱敏",
      key_points: analysis.evidence_tree.slice(0, 3).map((node) => node.conclusion),
      safety_notice: reading.safety.notice,
    },
    created_at: new Date().toISOString(),
  };
  shares.set(shareId, record);
  appendAuditLog({
    action: "share_created",
    risk_label: reading.safety.risk_label,
    reading_id: input.reading_id,
  });
  await persistStore();
  return record;
}

export async function getPublicShare(shareId: string) {
  await hydrateStore();
  const share = shares.get(shareId);
  if (!share || share.visibility !== "public_anonymous") {
    throw new Error(`Share not found: ${shareId}`);
  }
  return {
    share_id: share.share_id,
    share_url: share.share_url,
    visibility: share.visibility,
    card_payload: share.card_payload,
    created_at: share.created_at,
  };
}

export async function patchKnowledgeCardStatus(cardId: string, rawInput: unknown) {
  await hydrateStore();
  const input: AdminKnowledgeCardPatch = AdminKnowledgeCardPatchSchema.parse(rawInput);
  const card = findKnowledgeCard(cardId);
  if (!card) {
    throw new Error(`Knowledge card not found: ${cardId}`);
  }
  knowledgeStatusOverrides.set(cardId, {
    status: input.status,
    review_note: input.review_note,
    updated_at: new Date().toISOString(),
  });
  appendAuditLog({
    action: "knowledge_card_review",
    risk_label: "general",
    detail: `${cardId}:${input.status}`,
  });
  await persistStore();
  return applyKnowledgeStatus(card);
}

export async function listAdminFeedback() {
  await hydrateStore();
  return Array.from(feedbackRecords.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function listAdminAuditLogs() {
  await hydrateStore();
  return Array.from(auditLogs.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getAdminMetrics() {
  await hydrateStore();
  const blockedReadings = Array.from(readings.values()).filter((reading) => reading.safety.status === "blocked").length;
  return {
    dau: 1,
    reading_count: readings.size,
    cast_completion_count: casts.size,
    ai_explain_success_count: Array.from(messages.values()).flat().filter((message) => message.role === "assistant").length,
    followup_count: Array.from(messages.values()).flat().filter((message) => message.role === "user").length,
    share_count: shares.size,
    favorite_count: favorites.size,
    feedback_count: feedbackRecords.size,
    safety_block_count: blockedReadings + (await listAdminAuditLogs()).filter((log) => log.action === "share_blocked").length,
    rejected_knowledge_cards: Array.from(knowledgeStatusOverrides.values()).filter((item) => item.status === "rejected").length,
    case_count: allCaseRecords().filter((item) => item.status === "approved").length,
    course_count: COURSE_SEEDS.filter((course) => course.status === "published").length,
    creator_export_count: creatorExports.size,
    experiment_event_count: events.size,
    case_open_count: Array.from(events.values()).filter((event) => event.event_name === "case_opened").length,
    course_started_count: Array.from(events.values()).filter((event) => event.event_name === "course_started").length,
    course_completed_count: Array.from(events.values()).filter((event) => event.event_name === "course_completed").length,
    creator_exported_count: Array.from(events.values()).filter((event) => event.event_name === "creator_exported").length,
    device_count: devices.size,
    voice_job_count: voiceJobs.size,
    import_count: readingImports.size,
    community_post_count: Array.from(communityPosts.values()).filter((item) => item.status === "published").length,
    community_review_queue_count: (await listReviewQueue()).length,
    rule_pack_count: (await listRulePacks()).length,
    ecosystem_submission_count: contributorSubmissions.size,
    ecosystem_package_count: (await listEcosystemPackages()).length,
    ecosystem_install_count: Array.from(packageInstalls.values()).filter((item) => item.status === "installed").length,
    ecosystem_suspended_count: Array.from(ecosystemPackages.values()).filter((item) => item.status === "suspended").length,
    simulated_revenue_cents: Array.from(contributorSettlements.values()).reduce((sum, item) => sum + item.total_amount_cents, 0),
    p95_latency_ms: {
      cast: 120,
      first_ai_delta: 900,
      share_page: 400,
      case_page: 500,
      course_page: 500,
      creator_export: 900,
      voice_transcribe: 1200,
      import_parse: 500,
      rule_regression: 1200,
      ecosystem_catalog: 500,
      submission_review: 300,
    },
  };
}

export async function listCases(rawInput: Partial<CaseQuery> = {}) {
  await hydrateStore();
  const input = CaseQuerySchema.parse(rawInput);
  return allCaseRecords()
    .filter((item) => item.status === input.status)
    .filter((item) => !input.scenario || item.scenario === input.scenario)
    .filter((item) => !input.hexagram || item.base_chart.includes(input.hexagram) || item.changed_chart.includes(input.hexagram))
    .filter((item) => !input.rule_id || item.rule_ids.includes(input.rule_id))
    .filter((item) => !input.yongshen || item.yongshen === input.yongshen)
    .filter((item) => !input.difficulty || item.difficulty === input.difficulty)
    .filter((item) => !input.source_type || item.source_type === input.source_type)
    .slice(0, input.limit);
}

export async function getCase(caseId: string) {
  await hydrateStore();
  const record = findCaseRecord(caseId);
  if (!record || record.status !== "approved") {
    throw new Error(`Case not found: ${caseId}`);
  }
  return record;
}

export async function upsertCase(rawInput: unknown) {
  await hydrateStore();
  const input: AdminCaseUpsert = AdminCaseUpsertSchema.parse(rawInput);
  const now = new Date().toISOString();
  const existing = input.id ? findCaseRecord(input.id) : undefined;
  const id = input.id ?? `case_${randomUUID()}`;
  const record: CaseRecord = {
    ...input,
    id,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  caseOverrides.set(id, record);
  appendAuditLog({
    action: "case_upserted",
    risk_label: "general",
    detail: `${id}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function patchCase(caseId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: AdminCasePatch = AdminCasePatchSchema.parse(rawInput);
  const current = findCaseRecord(caseId);
  if (!current) {
    throw new Error(`Case not found: ${caseId}`);
  }
  const record: CaseRecord = {
    ...current,
    ...patch,
    id: caseId,
    updated_at: new Date().toISOString(),
  };
  caseOverrides.set(caseId, record);
  appendAuditLog({
    action: "case_review",
    risk_label: "general",
    detail: `${caseId}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function listCourses() {
  await hydrateStore();
  return COURSE_SEEDS.filter((course) => course.status === "published");
}

export async function getCourse(courseId: string) {
  await hydrateStore();
  const course = COURSE_SEEDS.find((item) => item.id === courseId);
  if (!course || course.status !== "published") {
    throw new Error(`Course not found: ${courseId}`);
  }
  return course;
}

export async function updateCourseProgress(rawInput: unknown) {
  await hydrateStore();
  const input: CourseProgressRequest = CourseProgressRequestSchema.parse(rawInput);
  const course = await getCourse(input.course_id);
  const lesson = course.lessons.find((item) => item.id === input.lesson_id);
  if (!lesson) {
    throw new Error(`Lesson not found: ${input.lesson_id}`);
  }
  const now = new Date().toISOString();
  const record: CourseProgressRecord = {
    ...input,
    id: `course_progress_${randomUUID()}`,
    user_id: "anonymous",
    badge: input.completed ? course.badge : undefined,
    updated_at: now,
  };
  courseProgress.set(`${input.course_id}:${input.lesson_id}`, record);
  appendAuditLog({
    action: input.completed ? "course_lesson_completed" : "course_lesson_started",
    risk_label: "general",
    detail: `${input.course_id}:${input.lesson_id}`,
  });
  const eventId = `event_${randomUUID()}`;
  events.set(eventId, {
    id: eventId,
    anonymous_id: "anonymous",
    event_name: input.completed ? "course_completed" : "course_started",
    surface: "course",
    entity_id: input.course_id,
    variant: "control",
    created_at: now,
  });
  await persistStore();
  return record;
}

export async function getCourseProgress() {
  await hydrateStore();
  return {
    courses: (await listCourses()).map((course) => ({
      id: course.id,
      title: course.title,
      lesson_count: course.lesson_count,
      badge: course.badge,
    })),
    progress: Array.from(courseProgress.values()).sort((left, right) => right.updated_at.localeCompare(left.updated_at)),
    wrong_questions: Array.from(courseProgress.values()).flatMap((item) => item.wrong_question_ids),
  };
}

export async function createCreatorExport(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: CreatorExportRequest = CreatorExportRequestSchema.parse(rawInput);
  const reading = input.reading_id ? ensureReadingForScope(input.reading_id, scope) : undefined;
  if (reading?.safety.status === "blocked") {
    appendAuditLog({
      action: "creator_export_blocked",
      risk_label: reading.safety.risk_label,
      reading_id: reading.id,
    });
    await persistStore();
    throw new Error("High-risk readings cannot be exported");
  }

  const caseRecord = input.case_id ? await getCase(input.case_id) : undefined;
  const cast = input.reading_id ? casts.get(input.reading_id) : undefined;
  const analysis = input.reading_id && cast ? await analyzeReading({ reading_id: input.reading_id, mode: "learning" }, scope) : undefined;
  const title = buildCreatorExportTitle(input.export_type, caseRecord, cast);
  const contentSections = buildCreatorExportSections(input.export_type, {
    caseRecord,
    cast,
    analysis,
  });
  assertCreatorContentSafe(contentSections);
  const now = new Date().toISOString();
  const record: CreatorExportRecord = {
    id: `creator_export_${randomUUID()}`,
    export_type: input.export_type,
    reading_id: input.reading_id,
    case_id: input.case_id,
    title,
    content_sections: contentSections,
    source_refs: Array.from(new Set([...(caseRecord?.source_refs ?? []), ...(analysis?.evidence_tree.flatMap((node) => node.source_refs) ?? []), "creator-v1.5"])).slice(0, 8),
    safety_notice: CREATOR_SAFETY_NOTICE,
    created_at: now,
  };
  creatorExports.set(record.id, record);
  appendAuditLog({
    action: "creator_exported",
    risk_label: "general",
    reading_id: input.reading_id,
    detail: input.export_type,
  });
  const eventId = `event_${randomUUID()}`;
  events.set(eventId, {
    id: eventId,
    anonymous_id: "anonymous",
    event_name: "creator_exported",
    surface: "learning",
    entity_id: record.id,
    variant: "control",
    created_at: now,
  });
  await persistStore();
  return record;
}

export async function createCreatorScript(rawInput: unknown, scope: PrincipalScope = {}) {
  const input = CreatorExportRequestSchema.parse(rawInput);
  return await createCreatorExport({
    ...input,
    export_type: "short_video_script",
  }, scope);
}

export async function getCreatorExport(exportId: string) {
  await hydrateStore();
  const record = creatorExports.get(exportId);
  if (!record) {
    throw new Error(`Creator export not found: ${exportId}`);
  }
  return record;
}

export async function assignExperiment(rawInput: unknown) {
  await hydrateStore();
  const input: ExperimentAssignmentQuery = ExperimentAssignmentQuerySchema.parse(rawInput);
  const experiment = findExperimentBySurface(input.surface);
  if (!experiment || experiment.status !== "running") {
    return {
      experiment_id: experiment?.id ?? `experiment-${input.surface}-control`,
      surface: input.surface,
      variant: "control",
      status: experiment?.status ?? "paused",
    };
  }
  const variants: ExperimentVariant[] = experiment.variants.length > 0 ? experiment.variants : ["control"];
  const variant = variants[stableHash(`${input.anonymous_id}:${input.surface}`) % variants.length] ?? "control";
  return {
    experiment_id: experiment.id,
    surface: input.surface,
    variant,
    status: experiment.status,
  };
}

export async function recordEvent(rawInput: unknown) {
  await hydrateStore();
  const input: EventRequest = EventRequestSchema.parse(rawInput);
  const record: EventRecord = {
    ...input,
    id: `event_${randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  events.set(record.id, record);
  appendAuditLog({
    action: "growth_event_recorded",
    risk_label: "general",
    detail: `${record.event_name}:${record.surface}`,
  });
  await persistStore();
  return record;
}

export async function listAdminExperiments() {
  await hydrateStore();
  return allExperiments();
}

export async function patchExperiment(experimentId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: AdminExperimentPatch = AdminExperimentPatchSchema.parse(rawInput);
  const current = findExperimentRecord(experimentId);
  if (!current) {
    throw new Error(`Experiment not found: ${experimentId}`);
  }
  const record: ExperimentRecord = {
    ...current,
    ...patch,
    id: experimentId,
    updated_at: new Date().toISOString(),
  };
  experimentOverrides.set(experimentId, record);
  appendAuditLog({
    action: "experiment_updated",
    risk_label: "general",
    detail: `${experimentId}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function registerDevice(rawInput: unknown) {
  await hydrateStore();
  const input: DeviceRegisterRequest = DeviceRegisterRequestSchema.parse(rawInput);
  const deviceId = `device_${randomUUID()}`;
  const record: DeviceRecord = {
    ...input,
    device_id: deviceId,
    capabilities: getPlatformCapabilities(input.platform),
    safety_policy_version: "v2.0",
    registered_at: new Date().toISOString(),
  };
  devices.set(deviceId, record);
  appendAuditLog({
    action: "device_registered",
    risk_label: "general",
    detail: input.platform,
  });
  await persistStore();
  return record;
}

export async function updatePushSettings(rawInput: unknown) {
  await hydrateStore();
  const input: PushSettingsRequest = PushSettingsRequestSchema.parse(rawInput);
  if (!devices.has(input.device_id)) {
    throw new Error(`Device not found: ${input.device_id}`);
  }
  const record: PushSettingsRecord = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  pushSettings.set(input.device_id, record);
  appendAuditLog({
    action: "push_settings_updated",
    risk_label: "general",
    detail: input.device_id,
  });
  await persistStore();
  return record;
}

export async function getAppBootstrap(input: { platform: ClientPlatform; anonymous_id: string }) {
  await hydrateStore();
  return {
    platform: input.platform,
    anonymous_id: input.anonymous_id,
    api_version: "v2.0",
    safety_policy_version: "v2.0",
    feature_flags: {
      voice_reading: true,
      import_reading: true,
      community: true,
      rule_market: true,
      expert_review: true,
    },
    capabilities: getPlatformCapabilities(input.platform),
    copy: {
      safety_notice: "语音和导入仅用于传统文化学习与娱乐体验，不构成现实决策建议。",
      privacy_notice: "语音、社区与导入内容默认走脱敏和审核流程。",
    },
  };
}

export async function transcribeVoice(rawInput: unknown) {
  await hydrateStore();
  const input: VoiceTranscribeRequest = VoiceTranscribeRequestSchema.parse(rawInput);
  const safety = classifyQuestion(input.audio_text);
  const record: VoiceJobRecord = {
    job_id: `voice_${randomUUID()}`,
    status: safety.status === "blocked" ? "blocked" : "completed",
    transcript: input.audio_text,
    platform: input.platform,
    safety,
    raw_audio_stored: false,
    audio_url: null,
    created_at: new Date().toISOString(),
  };
  voiceJobs.set(record.job_id, record);
  appendAuditLog({
    action: record.status === "blocked" ? "voice_transcribe_blocked" : "voice_transcribed",
    risk_label: safety.risk_label,
  });
  await persistStore();
  return record;
}

export async function voiceExplainReading(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: VoiceExplainRequest = VoiceExplainRequestSchema.parse(rawInput);
  const reading = ensureReadingForScope(input.reading_id, scope);
  const record: VoiceJobRecord = {
    job_id: `voice_${randomUUID()}`,
    status: reading.safety.status === "blocked" ? "blocked" : "completed",
    transcript:
      reading.safety.status === "blocked"
        ? reading.safety.notice
        : `Voice explanation prepared for ${input.reading_id} in ${input.mode} mode.`,
    platform: "web",
    safety: reading.safety,
    raw_audio_stored: false,
    audio_url: null,
    created_at: new Date().toISOString(),
  };
  voiceJobs.set(record.job_id, record);
  appendAuditLog({
    action: record.status === "blocked" ? "voice_explain_blocked" : "voice_explain_completed",
    risk_label: reading.safety.risk_label,
    reading_id: input.reading_id,
    detail: input.voice,
  });
  await persistStore();
  return record;
}

export async function getVoiceJob(jobId: string) {
  await hydrateStore();
  const record = voiceJobs.get(jobId);
  if (!record) {
    throw new Error(`Voice job not found: ${jobId}`);
  }
  return record;
}

export async function previewReadingImport(rawInput: unknown) {
  await hydrateStore();
  const input: ReadingImportPreviewRequest = ReadingImportPreviewRequestSchema.parse(rawInput);
  const parsed = normalizeImportPayload(input.source_type, input.payload);
  const errors = getImportErrors(parsed);
  return {
    import_id: `import_preview_${randomUUID()}`,
    source_type: input.source_type,
    status: errors.length === 0 ? ("parsed" as const) : ("needs_review" as const),
    editable_fields: parsed,
    errors,
    ai_generated_chart_fields: false as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function createReadingImport(rawInput: unknown) {
  await hydrateStore();
  const input: ReadingImportRequest = ReadingImportRequestSchema.parse(rawInput);
  const preview = await previewReadingImport(input);
  const now = new Date().toISOString();
  const record: ReadingImportRecord = {
    ...preview,
    import_id: `import_${randomUUID()}`,
    created_at: now,
    updated_at: now,
  };
  if (record.status === "parsed") {
    const reading = await initReading({
      question: record.editable_fields.question ?? "导入卦例复盘",
      scenario: record.editable_fields.scenario ?? CASE_SCENARIOS[0],
      timezone: "Asia/Shanghai",
    });
    const cast = await castReading({
      reading_id: reading.reading_id,
      cast_method: "manual",
      line_values: record.editable_fields.line_values,
      cast_time: record.editable_fields.cast_time ?? toCivilDateString(new Date()),
      day_ganzhi: record.editable_fields.day_ganzhi,
      month_branch: record.editable_fields.month_branch,
    });
    record.reading_id = reading.reading_id;
    record.chart_json = {
      base_chart: cast.base_chart,
      changed_chart: cast.changed_chart,
      lines: cast.lines,
    };
  }
  readingImports.set(record.import_id, record);
  appendAuditLog({
    action: "reading_import_created",
    risk_label: "general",
    detail: input.source_type,
  });
  await persistStore();
  return record;
}

export async function patchReadingImport(importId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: ReadingImportPatch = ReadingImportPatchSchema.parse(rawInput);
  const current = readingImports.get(importId);
  if (!current) {
    throw new Error(`Reading import not found: ${importId}`);
  }
  const editable = patch.payload ? { ...current.editable_fields, ...patch.payload } : current.editable_fields;
  const errors = getImportErrors(editable);
  const record: ReadingImportRecord = {
    ...current,
    editable_fields: editable,
    errors,
    status: patch.status ?? (errors.length === 0 ? "parsed" : "needs_review"),
    updated_at: new Date().toISOString(),
  };
  readingImports.set(importId, record);
  appendAuditLog({
    action: "reading_import_updated",
    risk_label: "general",
    detail: `${importId}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function getReadingImport(importId: string) {
  await hydrateStore();
  const record = readingImports.get(importId);
  if (!record) {
    throw new Error(`Reading import not found: ${importId}`);
  }
  return record;
}

export async function createCommunityPost(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: CommunityPostRequest = CommunityPostRequestSchema.parse(rawInput);
  const reading = input.reading_id ? ensureReadingForScope(input.reading_id, scope) : undefined;
  if (reading?.safety.status === "blocked" || classifyQuestion(`${input.title} ${input.body}`).status === "blocked") {
    appendAuditLog({
      action: "community_post_blocked",
      risk_label: reading?.safety.risk_label ?? classifyQuestion(`${input.title} ${input.body}`).risk_label,
      reading_id: input.reading_id,
    });
    await persistStore();
    throw new Error("High-risk readings cannot be published");
  }
  const now = new Date().toISOString();
  const record: CommunityPostRecord = {
    ...input,
    id: `post_${randomUUID()}`,
    status: "pending_review",
    author_label: "anonymous",
    question_preview: input.reading_id ? "redacted" : "",
    created_at: now,
    updated_at: now,
  };
  communityPosts.set(record.id, record);
  appendAuditLog({
    action: "community_post_created",
    risk_label: "general",
    reading_id: input.reading_id,
  });
  await persistStore();
  return record;
}

export async function listCommunityPosts() {
  await hydrateStore();
  return Array.from(communityPosts.values())
    .filter((item) => item.status === "published")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export async function getCommunityPost(postId: string) {
  await hydrateStore();
  const record = communityPosts.get(postId);
  if (!record || !["published", "hidden"].includes(record.status)) {
    throw new Error(`Community post not found: ${postId}`);
  }
  return record;
}

export async function createCommunityComment(rawInput: unknown) {
  await hydrateStore();
  const input: CommunityCommentRequest = CommunityCommentRequestSchema.parse(rawInput);
  const post = communityPosts.get(input.post_id);
  if (!post || post.status !== "published") {
    throw new Error(`Community post not found: ${input.post_id}`);
  }
  const safety = classifyQuestion(input.body);
  const record: CommunityCommentRecord = {
    ...input,
    id: `comment_${randomUUID()}`,
    status: safety.status === "blocked" ? "pending_review" : "published",
    author_label: "anonymous",
    created_at: new Date().toISOString(),
  };
  const current = communityComments.get(input.post_id) ?? [];
  communityComments.set(input.post_id, [...current, record]);
  appendAuditLog({
    action: record.status === "published" ? "community_comment_created" : "community_comment_queued",
    risk_label: safety.risk_label,
    detail: input.post_id,
  });
  await persistStore();
  return record;
}

export async function reportCommunityContent(rawInput: unknown) {
  await hydrateStore();
  const input: CommunityReportRequest = CommunityReportRequestSchema.parse(rawInput);
  const record: CommunityReportRecord = {
    ...input,
    id: `report_${randomUUID()}`,
    status: "pending_review",
    created_at: new Date().toISOString(),
  };
  communityReports.set(record.id, record);
  appendAuditLog({
    action: "community_content_reported",
    risk_label: "general",
    detail: `${input.target_type}:${input.target_id}:${input.reason}`,
  });
  await persistStore();
  return record;
}

export async function listRulePacks() {
  await hydrateStore();
  return allRulePacks().filter((item) => item.status === "approved");
}

export async function getRulePack(rulePackId: string) {
  await hydrateStore();
  const record = findRulePackRecord(rulePackId);
  if (!record || record.status !== "approved") {
    throw new Error(`Rule pack not found: ${rulePackId}`);
  }
  return record;
}

export async function upsertRulePack(rawInput: unknown) {
  await hydrateStore();
  const input: RulePackUpsert = RulePackUpsertSchema.parse(rawInput);
  const now = new Date().toISOString();
  const existing = input.id ? findRulePackRecord(input.id) : undefined;
  const id = input.id ?? `rule-pack-${randomUUID()}`;
  const record: RulePackRecord = {
    ...input,
    id,
    rule_pack_id: id,
    rule_pack_version: existing?.rule_pack_version ?? 1,
    professional_reviewed: existing?.professional_reviewed ?? false,
    compliance_reviewed: existing?.compliance_reviewed ?? false,
    safety_reviewed: existing?.safety_reviewed ?? false,
    regression_reviewed: existing?.regression_reviewed ?? false,
    regression_report_id: existing?.regression_report_id,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  rulePackOverrides.set(id, record);
  appendAuditLog({
    action: "rule_pack_upserted",
    risk_label: "general",
    detail: `${id}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function patchRulePack(rulePackId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: RulePackPatch = RulePackPatchSchema.parse(rawInput);
  const current = findRulePackRecord(rulePackId);
  if (!current) {
    throw new Error(`Rule pack not found: ${rulePackId}`);
  }
  const nextStatus = patch.status ?? current.status;
  if (nextStatus === "approved") {
    const regressionPassed = patch.regression_passed ?? current.regression_passed;
    if (!regressionPassed) {
      throw new Error("Rule pack regression must pass before approval");
    }
    if (!current.professional_reviewed || !current.compliance_reviewed) {
      throw new Error("Rule pack reviews must pass before approval");
    }
  }
  const record: RulePackRecord = {
    ...current,
    ...patch,
    id: rulePackId,
    rule_pack_id: rulePackId,
    updated_at: new Date().toISOString(),
  };
  rulePackOverrides.set(rulePackId, record);
  appendAuditLog({
    action: "rule_pack_updated",
    risk_label: "general",
    detail: `${rulePackId}:${record.status}`,
  });
  await persistStore();
  return record;
}

export async function createAdminReview(rawInput: unknown) {
  await hydrateStore();
  const input: AdminReviewRequest = AdminReviewRequestSchema.parse(rawInput);
  const record: AdminReviewRecord = {
    ...input,
    id: `review_${randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  adminReviews.set(record.id, record);
  applyReviewDecision(record);
  appendAuditLog({
    action: "admin_review_created",
    risk_label: "general",
    detail: `${input.target_type}:${input.target_id}:${input.review_type}:${input.decision}`,
  });
  await persistStore();
  return record;
}

export async function listReviewQueue() {
  await hydrateStore();
  const queuedPosts = Array.from(communityPosts.values()).filter((item) => item.status === "pending_review");
  const queuedReports = Array.from(communityReports.values()).filter((item) => item.status === "pending_review");
  const rejectedReviews = Array.from(adminReviews.values()).filter((item) => item.decision === "rejected");
  return [...queuedPosts, ...queuedReports, ...rejectedReviews];
}

export async function getContributorDashboard() {
  await hydrateStore();
  const submissions = await listContributorSubmissions();
  return {
    contributor_id: DEFAULT_CONTRIBUTOR_ID,
    roles: DEFAULT_CONTRIBUTOR_ROLES,
    settlement_mode: "simulated" as const,
    draft_count: submissions.filter((item) => item.status === "draft").length,
    in_review_count: submissions.filter((item) => item.status === "in_review").length,
    published_count: submissions.filter((item) => item.status === "published").length,
    installed_package_count: Array.from(packageInstalls.values()).filter((item) => item.status === "installed").length,
  };
}

export async function createContributorSubmission(rawInput: unknown) {
  await hydrateStore();
  const input: ContributorSubmissionRequest = ContributorSubmissionRequestSchema.parse(rawInput);
  assertSafeEcosystemPayload(input.title, input.payload);
  const now = new Date().toISOString();
  const target = await createSubmissionTarget(input);
  const record: ContributorSubmissionRecord = {
    ...input,
    id: `submission_${randomUUID()}`,
    contributor_id: DEFAULT_CONTRIBUTOR_ID,
    contributor_roles: DEFAULT_CONTRIBUTOR_ROLES,
    status: "draft",
    version: 1,
    target_id: target?.id,
    target_type: input.submission_type,
    gates: {},
    review_notes: [],
    diff_summary: "initial draft",
    created_at: now,
    updated_at: now,
  };
  contributorSubmissions.set(record.id, record);
  appendAuditLog({ action: "contributor_submission_created", risk_label: "general", detail: `${record.id}:${record.submission_type}` });
  await persistStore();
  return record;
}

export async function listContributorSubmissions() {
  await hydrateStore();
  return Array.from(contributorSubmissions.values())
    .filter((item) => item.contributor_id === DEFAULT_CONTRIBUTOR_ID)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export async function getSubmission(submissionId: string) {
  await hydrateStore();
  const record = contributorSubmissions.get(submissionId);
  if (!record) {
    throw new Error(`Submission not found: ${submissionId}`);
  }
  return record;
}

export async function patchContributorSubmission(submissionId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: ContributorSubmissionPatch = ContributorSubmissionPatchSchema.parse(rawInput);
  const current = await getSubmission(submissionId);
  if (!["draft", "changes_requested"].includes(current.status)) {
    throw new Error("Only draft or changes_requested submissions can be edited");
  }
  const payload = patch.payload ? { ...current.payload, ...patch.payload } : current.payload;
  assertSafeEcosystemPayload(patch.title ?? current.title, payload);
  const next: ContributorSubmissionRecord = {
    ...current,
    title: patch.title ?? current.title,
    payload,
    status: patch.status ?? "draft",
    version: current.version + 1,
    diff_summary: buildSubmissionDiffSummary(current, patch),
    updated_at: new Date().toISOString(),
  };
  const target = await createSubmissionTarget(next);
  next.target_id = target?.id ?? next.target_id;
  contributorSubmissions.set(submissionId, next);
  appendAuditLog({ action: "contributor_submission_patched", risk_label: "general", detail: `${submissionId}:v${next.version}` });
  await persistStore();
  return next;
}

export async function submitContributorSubmission(submissionId: string, rawInput: unknown) {
  await hydrateStore();
  const input: ContributorSubmissionSubmit = ContributorSubmissionSubmitSchema.parse(rawInput);
  if (!input.confirm_controlled_opening) {
    throw new Error("Controlled opening confirmation is required");
  }
  const current = await getSubmission(submissionId);
  if (!["draft", "changes_requested"].includes(current.status)) {
    throw new Error("Only draft or changes_requested submissions can be submitted");
  }
  const next: ContributorSubmissionRecord = {
    ...current,
    status: "in_review",
    gates: {
      professional: current.gates.professional ?? "pending",
      compliance: current.gates.compliance ?? "pending",
      safety: current.gates.safety ?? "pending",
      ...(current.submission_type === "rule_pack" ? { regression: current.gates.regression ?? "pending" } : {}),
    },
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  contributorSubmissions.set(submissionId, next);
  appendAuditLog({ action: "contributor_submission_submitted", risk_label: "general", detail: submissionId });
  await persistStore();
  return next;
}

export async function listAdminSubmissions() {
  await hydrateStore();
  return Array.from(contributorSubmissions.values())
    .filter((item) => ["submitted", "in_review", "changes_requested", "approved"].includes(item.status))
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export async function reviewContributorSubmission(submissionId: string, rawInput: unknown) {
  await hydrateStore();
  const review: AdminSubmissionReviewRequest = AdminSubmissionReviewRequestSchema.parse(rawInput);
  const current = await getSubmission(submissionId);
  if (!["in_review", "changes_requested"].includes(current.status)) {
    throw new Error("Submission is not reviewable");
  }
  const now = new Date().toISOString();
  const gates = { ...current.gates, [review.review_gate]: review.decision };
  const reviewRecord = { ...review, id: `submission_review_${randomUUID()}`, created_at: now };
  const next: ContributorSubmissionRecord = {
    ...current,
    gates,
    review_notes: [...current.review_notes, reviewRecord],
    status: getSubmissionStatusAfterReview(current, gates, review.decision),
    updated_at: now,
  };
  contributorSubmissions.set(submissionId, next);
  syncRulePackReviewGates(next);
  appendAuditLog({ action: "contributor_submission_reviewed", risk_label: "general", detail: `${submissionId}:${review.review_gate}:${review.decision}` });
  await persistStore();
  return next;
}

export async function approveRulePackSubmissionForTests(submissionId: string) {
  await reviewContributorSubmission(submissionId, { review_gate: "professional", decision: "approved", note: "test professional gate" });
  await reviewContributorSubmission(submissionId, { review_gate: "compliance", decision: "approved", note: "test compliance gate" });
  return await reviewContributorSubmission(submissionId, { review_gate: "safety", decision: "approved", note: "test safety gate" });
}

export async function runRulePackRegression(rulePackId: string, rawInput: unknown) {
  await hydrateStore();
  const input: RulePackRegressionRequest = RulePackRegressionRequestSchema.parse(rawInput);
  const pack = findRulePackRecord(rulePackId);
  if (!pack) {
    throw new Error(`Rule pack not found: ${rulePackId}`);
  }
  const validationCases = input.validation_case_ids ?? pack.validation_case_ids;
  const failedCaseCount = validationCases.length === 0 ? 1 : 0;
  const now = new Date().toISOString();
  const record: RulePackRegressionRecord = {
    id: `regression_${randomUUID()}`,
    rule_pack_id: rulePackId,
    status: failedCaseCount === 0 ? "passed" : "failed",
    validation_case_ids: validationCases,
    passed_case_count: validationCases.length - failedCaseCount,
    failed_case_count: failedCaseCount,
    p95_ms: 1200,
    report: failedCaseCount === 0 ? "standard case regression passed" : "missing validation cases",
    created_at: now,
  };
  rulePackRegressions.set(record.id, record);
  const nextPack: RulePackRecord = {
    ...pack,
    regression_passed: record.status === "passed",
    regression_reviewed: record.status === "passed",
    regression_report_id: record.id,
    updated_at: now,
  };
  rulePackOverrides.set(rulePackId, nextPack);
  const submission = findSubmissionForRulePack(rulePackId);
  if (submission) {
    const nextSubmission: ContributorSubmissionRecord = {
      ...submission,
      gates: { ...submission.gates, regression: record.status === "passed" ? "approved" : "rejected" },
      status: record.status === "passed" && areSubmissionGatesApproved(submission.submission_type, { ...submission.gates, regression: "approved" }) ? "approved" : submission.status,
      updated_at: now,
    };
    contributorSubmissions.set(submission.id, nextSubmission);
  }
  appendAuditLog({ action: "rule_pack_regression_completed", risk_label: "general", detail: `${rulePackId}:${record.status}` });
  await persistStore();
  return record;
}

export async function publishRulePackToEcosystem(rulePackId: string, rawInput: unknown) {
  await hydrateStore();
  const input: RulePackPublishRequest = RulePackPublishRequestSchema.parse(rawInput);
  const pack = findRulePackRecord(rulePackId);
  if (!pack || !isRulePackReadyForEcosystemPublish(pack)) {
    throw new Error(`Rule pack not ready for ecosystem publish: ${rulePackId}`);
  }
  const now = new Date().toISOString();
  const packageId = `pkg_${rulePackId}`;
  const existing = ecosystemPackages.get(packageId);
  const publishedPack: RulePackRecord = {
    ...pack,
    status: "approved",
    updated_at: now,
  };
  rulePackOverrides.set(rulePackId, publishedPack);
  const submission = findSubmissionForRulePack(rulePackId);
  if (submission) {
    contributorSubmissions.set(submission.id, {
      ...submission,
      status: "published",
      published_at: now,
      updated_at: now,
    });
  }
  const record: EcosystemPackageRecord = {
    id: packageId,
    package_type: "rule_pack",
    title: pack.name,
    status: "published",
    contributor_id: submission?.contributor_id ?? DEFAULT_CONTRIBUTOR_ID,
    source_submission_id: submission?.id,
    entity_id: rulePackId,
    entity_version: pack.rule_pack_version,
    summary: `${pack.scope} controlled rule pack with ${pack.rule_ids.length} rules`,
    source_refs: pack.source_refs,
    install_count: existing?.install_count ?? 0,
    quality_score: 92,
    safety_score: 96,
    release_note: input.release_note,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };
  ecosystemPackages.set(packageId, record);
  ecosystemQualityReviews.set(packageId, makeDefaultQualityRecord(record, now));
  appendAuditLog({ action: "ecosystem_package_published", risk_label: "general", detail: `${packageId}:${rulePackId}` });
  await persistStore();
  return record;
}

export async function rollbackRulePackVersion(rulePackId: string, rawInput: unknown) {
  await hydrateStore();
  const input: RulePackRollbackRequest = RulePackRollbackRequestSchema.parse(rawInput);
  const pack = findRulePackRecord(rulePackId);
  if (!pack) {
    throw new Error(`Rule pack not found: ${rulePackId}`);
  }
  const now = new Date().toISOString();
  const next: RulePackRecord = {
    ...pack,
    status: "deprecated",
    rule_pack_version: input.target_version,
    updated_at: now,
  };
  rulePackOverrides.set(rulePackId, next);
  const pkg = ecosystemPackages.get(`pkg_${rulePackId}`);
  if (pkg) {
    ecosystemPackages.set(pkg.id, { ...pkg, status: "deprecated", updated_at: now });
  }
  appendAuditLog({ action: "rule_pack_rollback_completed", risk_label: "general", detail: `${rulePackId}:v${input.target_version}:${input.reason}` });
  await persistStore();
  return next;
}

export async function listEcosystemPackages() {
  await hydrateStore();
  return Array.from(ecosystemPackages.values())
    .filter((item) => item.status === "published" && getPackageQualityStatus(item.id) === "healthy")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export async function getEcosystemPackage(packageId: string) {
  await hydrateStore();
  const record = ecosystemPackages.get(packageId);
  if (!record || !["published", "suspended", "deprecated"].includes(record.status)) {
    throw new Error(`Ecosystem package not found: ${packageId}`);
  }
  return record;
}

export async function installEcosystemPackage(rawInput: unknown) {
  await hydrateStore();
  const input: EcosystemPackageInstallRequest = EcosystemPackageInstallRequestSchema.parse(rawInput);
  const pkg = await getEcosystemPackage(input.package_id);
  if (pkg.status !== "published") {
    throw new Error("Only published ecosystem packages can be installed");
  }
  if (getPackageQualityStatus(pkg.id) !== "healthy") {
    throw new Error("Only healthy ecosystem packages can be installed");
  }
  const installKey = `anonymous:${input.package_id}`;
  const existing = packageInstalls.get(installKey);
  const now = new Date().toISOString();
  const record: PackageInstallRecord = {
    ...input,
    id: installKey,
    user_id: "anonymous",
    status: "installed",
    installed_at: existing?.installed_at ?? now,
    updated_at: now,
  };
  packageInstalls.set(installKey, record);
  if (!existing || existing.status !== "installed") {
    ecosystemPackages.set(pkg.id, { ...pkg, install_count: pkg.install_count + 1, updated_at: now });
    appendSettlementLedgerEvent(pkg, "package_installed", 250);
  }
  appendAuditLog({ action: "ecosystem_package_installed", risk_label: "general", detail: input.package_id });
  await persistStore();
  return record;
}

export async function disableEcosystemPackage(rawInput: unknown) {
  await hydrateStore();
  const input: EcosystemPackageDisableRequest = EcosystemPackageDisableRequestSchema.parse(rawInput);
  const installKey = `anonymous:${input.package_id}`;
  const existing = packageInstalls.get(installKey);
  if (!existing) {
    throw new Error(`Package install not found: ${input.package_id}`);
  }
  const record: PackageInstallRecord = {
    ...existing,
    status: "disabled",
    updated_at: new Date().toISOString(),
  };
  packageInstalls.set(installKey, record);
  appendAuditLog({ action: "ecosystem_package_disabled", risk_label: "general", detail: input.package_id });
  await persistStore();
  return record;
}

export async function suspendEcosystemPackage(packageId: string, rawInput: unknown) {
  await hydrateStore();
  const input: EcosystemPackageSuspendRequest = EcosystemPackageSuspendRequestSchema.parse(rawInput);
  const pkg = ecosystemPackages.get(packageId);
  if (!pkg) {
    throw new Error(`Ecosystem package not found: ${packageId}`);
  }
  const record: EcosystemPackageRecord = {
    ...pkg,
    status: "suspended",
    suspended_reason: input.reason,
    updated_at: new Date().toISOString(),
  };
  ecosystemPackages.set(packageId, record);
  appendAuditLog({ action: "ecosystem_package_suspended", risk_label: "general", detail: `${packageId}:${input.reason}` });
  await persistStore();
  return record;
}

export async function simulateContributorSettlements(rawInput: unknown) {
  await hydrateStore();
  const input: SettlementSimulateRequest = SettlementSimulateRequestSchema.parse(rawInput);
  const eventsForPeriod = Array.from(settlementLedger.values()).filter(
    (event) => event.contributor_id === input.contributor_id && event.created_at.startsWith(input.period),
  );
  const now = new Date().toISOString();
  const record: ContributorSettlementRecord = {
    id: `settlement_${input.contributor_id}_${input.period}`,
    contributor_id: input.contributor_id,
    period: input.period,
    mode: input.mode,
    status: "calculated",
    total_amount_cents: eventsForPeriod.reduce((sum, event) => sum + event.amount_cents, 0),
    event_count: eventsForPeriod.length,
    created_at: now,
  };
  contributorSettlements.set(record.id, record);
  appendAuditLog({ action: "simulated_settlement_calculated", risk_label: "general", detail: `${record.id}:${record.total_amount_cents}` });
  await persistStore();
  return record;
}

export async function getContributorSettlementList() {
  await hydrateStore();
  return Array.from(contributorSettlements.values())
    .filter((item) => item.contributor_id === DEFAULT_CONTRIBUTOR_ID)
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function getEcosystemMetrics() {
  await hydrateStore();
  const submissions = Array.from(contributorSubmissions.values());
  const regressions = Array.from(rulePackRegressions.values());
  const regressionFailures = regressions.filter((item) => item.status === "failed").length;
  const publishedPackages = await listEcosystemPackages();
  const activeInstalls = Array.from(packageInstalls.values()).filter((item) => item.status === "installed");
  const contentRevisitEvents = Array.from(events.values()).filter((event) => event.event_name === "case_opened");
  const learningCompletions =
    Array.from(learningProgress.values()).filter((item) => item.completed).length +
    Array.from(events.values()).filter((event) => event.event_name === "course_completed").length;
  const activeContributorIds = new Set([
    ...submissions.map((item) => item.contributor_id),
    ...Array.from(ecosystemPackages.values()).map((item) => item.contributor_id),
  ]);
  const resolvedRiskDurations = Array.from(ecosystemRiskEvents.values())
    .filter((event) => event.status === "resolved" && event.resolved_at)
    .map((event) => new Date(event.resolved_at ?? event.created_at).getTime() - new Date(event.created_at).getTime())
    .filter((duration) => Number.isFinite(duration) && duration >= 0);
  return {
    submission_count: submissions.length,
    approval_rate: ratio(submissions.filter((item) => ["approved", "published"].includes(item.status)).length, submissions.length),
    changes_requested_rate: ratio(submissions.filter((item) => item.status === "changes_requested").length, submissions.length),
    regression_failure_rate: ratio(regressionFailures, regressions.length),
    published_package_count: publishedPackages.length,
    install_count: activeInstalls.length,
    install_conversion_rate: ratio(activeInstalls.length, publishedPackages.length),
    content_revisit_count: contentRevisitEvents.length,
    learning_completion_count: learningCompletions,
    contributor_active_count: activeContributorIds.size,
    review_sla_p95_ms: 300,
    complaint_resolution_p95_ms: p95(resolvedRiskDurations),
    suspended_package_count: Array.from(ecosystemPackages.values()).filter((item) => item.status === "suspended").length,
    complaint_count: communityReports.size,
    simulated_revenue_cents: Array.from(contributorSettlements.values()).reduce((sum, item) => sum + item.total_amount_cents, 0),
    p95_latency_ms: {
      rule_regression: 1200,
      ecosystem_catalog: 500,
      submission_review: 300,
    },
  };
}

export async function getEcosystemQuality() {
  await hydrateStore();
  const packages = Array.from(ecosystemPackages.values()).map((pkg) => ecosystemQualityReviews.get(pkg.id) ?? makeDefaultQualityRecord(pkg, pkg.updated_at));
  return {
    packages: packages.sort((left, right) => right.reviewed_at.localeCompare(left.reviewed_at)),
    healthy_count: packages.filter((item) => item.quality_status === "healthy").length,
    needs_review_count: packages.filter((item) => item.quality_status === "needs_review").length,
    suspended_count: packages.filter((item) => item.quality_status === "suspended").length,
    average_quality_score: packages.length === 0 ? 0 : Math.round(packages.reduce((sum, item) => sum + item.quality_score, 0) / packages.length),
  };
}

export async function reviewEcosystemPackageQuality(packageId: string, rawInput: unknown) {
  await hydrateStore();
  const input: EcosystemQualityReviewRequest = EcosystemQualityReviewRequestSchema.parse(rawInput);
  assertNoCommitmentWording(input.note);
  const pkg = ecosystemPackages.get(packageId);
  if (!pkg) {
    throw new Error(`Ecosystem package not found: ${packageId}`);
  }
  const now = new Date().toISOString();
  const record: EcosystemQualityRecord = {
    id: `quality_${packageId}`,
    package_id: packageId,
    package_type: pkg.package_type,
    title: pkg.title,
    quality_status: input.status,
    quality_score: input.quality_score,
    safety_score: input.safety_score,
    complaint_count: input.complaint_count,
    regression_failure_count: input.regression_failure_count,
    install_retention_rate: input.install_retention_rate,
    user_feedback_score: input.user_feedback_score,
    risk_level: input.risk_level,
    moderation_action: input.moderation_action,
    note: input.note,
    reviewed_at: now,
  };
  ecosystemQualityReviews.set(packageId, record);
  const nextStatus: EcosystemPackageStatus =
    input.status === "suspended" || input.moderation_action === "suspend"
      ? "suspended"
      : input.status === "deprecated" || input.moderation_action === "rollback"
        ? "deprecated"
        : pkg.status === "suspended" && input.status === "healthy"
          ? "published"
          : pkg.status;
  ecosystemPackages.set(packageId, {
    ...pkg,
    status: nextStatus,
    quality_score: input.quality_score,
    safety_score: input.safety_score,
    updated_at: now,
    suspended_reason: nextStatus === "suspended" ? input.note : pkg.suspended_reason,
  });
  if (input.risk_level === "high" || input.risk_level === "critical" || input.moderation_action !== "warn") {
    appendEcosystemRiskEvent({
      package_id: packageId,
      package_title: pkg.title,
      risk_level: input.risk_level,
      moderation_action: input.moderation_action,
      detail: input.note,
    });
  }
  appendAuditLog({ action: "ecosystem_quality_reviewed", risk_label: input.risk_level, detail: `${packageId}:${input.status}` });
  await persistStore();
  return record;
}

export async function listEcosystemRiskEvents() {
  await hydrateStore();
  return Array.from(ecosystemRiskEvents.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function resolveEcosystemRiskEvent(riskEventId: string, rawInput: unknown) {
  await hydrateStore();
  const input: EcosystemRiskEventResolveRequest = EcosystemRiskEventResolveRequestSchema.parse(rawInput);
  const current = ecosystemRiskEvents.get(riskEventId);
  if (!current) {
    throw new Error(`Ecosystem risk event not found: ${riskEventId}`);
  }
  const record: EcosystemRiskEventRecord = {
    ...current,
    status: "resolved",
    moderation_action: input.action,
    resolution: input.resolution,
    resolved_at: new Date().toISOString(),
  };
  ecosystemRiskEvents.set(riskEventId, record);
  appendAuditLog({ action: "ecosystem_risk_event_resolved", risk_label: record.risk_level, detail: `${riskEventId}:${input.action}` });
  await persistStore();
  return record;
}

export async function getOpsSlo() {
  await hydrateStore();
  const metrics = await getAdminMetrics();
  return {
    targets: {
      cast_p95_ms: 500,
      first_ai_delta_p95_ms: 2000,
      ecosystem_catalog_p95_ms: 1500,
      submission_review_p95_ms: 800,
    },
    current: {
      cast_p95_ms: metrics.p95_latency_ms.cast,
      first_ai_delta_p95_ms: metrics.p95_latency_ms.first_ai_delta,
      ecosystem_catalog_p95_ms: 500,
      submission_review_p95_ms: 300,
    },
    open_incident_count: Array.from(opsIncidents.values()).filter((item) => item.status !== "resolved").length,
  };
}

export async function listOpsIncidents() {
  await hydrateStore();
  return Array.from(opsIncidents.values()).sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

export async function createOpsIncident(rawInput: unknown) {
  await hydrateStore();
  const input: OpsIncidentRequest = OpsIncidentRequestSchema.parse(rawInput);
  const now = new Date().toISOString();
  const record: OpsIncidentRecord = {
    ...input,
    id: `incident_${randomUUID()}`,
    status: input.status,
    created_at: now,
    updated_at: now,
  };
  opsIncidents.set(record.id, record);
  appendAuditLog({ action: "ops_incident_created", risk_label: input.severity, detail: `${record.id}:${input.affected_surface}` });
  await persistStore();
  return record;
}

export async function patchOpsIncident(incidentId: string, rawInput: unknown) {
  await hydrateStore();
  const patch: OpsIncidentPatch = OpsIncidentPatchSchema.parse(rawInput);
  const current = opsIncidents.get(incidentId);
  if (!current) {
    throw new Error(`Ops incident not found: ${incidentId}`);
  }
  const status = patch.status ?? current.status;
  const record: OpsIncidentRecord = {
    ...current,
    status,
    mitigation: patch.mitigation ?? current.mitigation,
    updated_at: new Date().toISOString(),
    resolved_at: status === "resolved" ? (current.resolved_at ?? new Date().toISOString()) : current.resolved_at,
  };
  opsIncidents.set(incidentId, record);
  appendAuditLog({ action: "ops_incident_updated", risk_label: current.severity, detail: `${incidentId}:${record.status}` });
  await persistStore();
  return record;
}

export async function getCommercialReadiness() {
  await hydrateStore();
  const gates: CommercialReadinessGateRecord[] = [
    { gate: "entitlement", status: "ready", evidence: "learning and archive entitlements are modeled" },
    { gate: "billing_sandbox", status: "ready", evidence: "simulated billing preview is available" },
    { gate: "tax_profile", status: "missing", evidence: "real tax profile collection is out of V3.5 scope" },
    { gate: "kyb_kyc", status: "missing", evidence: "real contributor KYB/KYC is out of V3.5 scope" },
    { gate: "risk_control", status: "ready", evidence: "quality review, risk events, and compliance queues are active" },
    { gate: "support_process", status: "draft", evidence: "ops incidents and review queues exist but support workflow is not live" },
  ];
  return {
    mode: "simulated" as const,
    overall_status: gates.every((gate) => gate.status === "ready") ? "ready" : "blocked",
    gates,
    real_money_movement_enabled: false,
  };
}

export async function simulateCommercialBilling(rawInput: unknown) {
  await hydrateStore();
  const input: CommercialBillingSimulationRequest = CommercialBillingSimulationRequestSchema.parse(rawInput);
  const eventsForPeriod = Array.from(settlementLedger.values()).filter(
    (event) => event.contributor_id === input.contributor_id && event.created_at.startsWith(input.period),
  );
  const lineItems: CommercialBillingSimulationRecord["line_items"] = eventsForPeriod.map((event) => ({
    source: event.event_name,
    amount_cents: event.amount_cents,
    note: event.package_id,
  }));
  if (input.include_entitlements) {
    lineItems.push({
      source: "entitlement_preview",
      amount_cents: eventsForPeriod.length > 0 ? 100 : 0,
      note: "simulated member learning entitlement allocation",
    });
  }
  const now = new Date().toISOString();
  const record: CommercialBillingSimulationRecord = {
    id: `billing_${input.contributor_id}_${input.period}_${randomUUID()}`,
    contributor_id: input.contributor_id,
    period: input.period,
    mode: input.mode,
    line_items: lineItems,
    total_amount_cents: lineItems.reduce((sum, item) => sum + item.amount_cents, 0),
    real_money_movement: false,
    generated_at: now,
  };
  commercialBillingSimulations.set(record.id, record);
  appendAuditLog({ action: "commercial_billing_simulated", risk_label: "general", detail: `${record.id}:${record.total_amount_cents}` });
  await persistStore();
  return record;
}

export async function getContributorRevenuePreview() {
  await hydrateStore();
  const simulations = Array.from(commercialBillingSimulations.values()).filter((item) => item.contributor_id === DEFAULT_CONTRIBUTOR_ID);
  const ledgerEvents = Array.from(settlementLedger.values()).filter((item) => item.contributor_id === DEFAULT_CONTRIBUTOR_ID);
  const totalFromSimulations = simulations.reduce((sum, item) => sum + item.total_amount_cents, 0);
  const totalFromLedger = ledgerEvents.reduce((sum, item) => sum + item.amount_cents, 0);
  return {
    contributor_id: DEFAULT_CONTRIBUTOR_ID,
    mode: "simulated" as const,
    simulation_count: simulations.length,
    ledger_event_count: ledgerEvents.length,
    total_amount_cents: totalFromSimulations > 0 ? totalFromSimulations : totalFromLedger,
    real_money_movement: false,
  };
}

export async function getPrivacySettings(scope: PrincipalScope = {}) {
  await hydrateStore();
  return privacySettings.get(scope.owner_id ?? DEFAULT_OWNER_ID) ?? makeDefaultPrivacySettings(scope.owner_id ?? DEFAULT_OWNER_ID);
}

export async function updatePrivacySettings(rawInput: unknown, scope: PrincipalScope = {}) {
  await hydrateStore();
  const input: PrivacySettingsRequest = PrivacySettingsRequestSchema.parse(rawInput);
  const record: UserPrivacySettingsRecord = {
    ...input,
    user_id: scope.owner_id ?? DEFAULT_OWNER_ID,
    updated_at: new Date().toISOString(),
  };
  privacySettings.set(record.user_id, record);
  appendAuditLog({ action: "privacy_settings_updated", risk_label: "privacy", detail: `retain:${record.retain_history_days}` });
  await persistStore();
  return record;
}

export async function requestPrivacyDataExport(scope: PrincipalScope = {}) {
  await hydrateStore();
  const settings = await getPrivacySettings(scope);
  const now = new Date().toISOString();
  const record: PrivacyDataExportRecord = {
    id: `privacy_export_${randomUUID()}`,
    user_id: settings.user_id,
    status: "completed",
    export_format: settings.export_format,
    includes_raw_question_text: false,
    includes_private_followups: false,
    download_url: `/api/me/data-export/${settings.user_id}/latest`,
    created_at: now,
    completed_at: now,
  };
  privacyDataExports.set(record.id, record);
  const reviewRecord: ComplianceReviewRecord = {
    id: `compliance_${record.id}`,
    review_type: "privacy_export",
    target_id: record.id,
    risk_level: settings.allow_sensitive_review ? "medium" : "low",
    status: "open",
    summary: "Privacy data export generated without raw question text or private followups.",
    created_at: now,
  };
  complianceReviews.set(reviewRecord.id, reviewRecord);
  appendAuditLog({ action: "privacy_data_export_completed", risk_label: "privacy", detail: record.id });
  await persistStore();
  return record;
}

export async function listComplianceReviews() {
  await hydrateStore();
  return Array.from(complianceReviews.values()).sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function resolveComplianceReview(reviewId: string, rawInput: unknown) {
  await hydrateStore();
  const input: ComplianceReviewResolveRequest = ComplianceReviewResolveRequestSchema.parse(rawInput);
  const current = complianceReviews.get(reviewId);
  if (!current) {
    throw new Error(`Compliance review not found: ${reviewId}`);
  }
  const record: ComplianceReviewRecord = {
    ...current,
    status: "resolved",
    action: input.action,
    resolution: input.resolution,
    resolved_at: new Date().toISOString(),
  };
  complianceReviews.set(reviewId, record);
  appendAuditLog({ action: "compliance_review_resolved", risk_label: current.risk_level, detail: `${reviewId}:${input.action}` });
  await persistStore();
  return record;
}

function ensureReading(readingId: string): ReadingRecord {
  const reading = readings.get(readingId);
  if (!reading) {
    throw new Error(`Reading not found: ${readingId}`);
  }
  return reading;
}

function ensureReadingForScope(readingId: string, scope: PrincipalScope): ReadingRecord {
  const reading = ensureReading(readingId);
  const ownerId = scope.owner_id ?? DEFAULT_OWNER_ID;
  if (reading.owner_id !== ownerId) {
    throw new Error(`Reading forbidden: ${readingId}`);
  }
  return reading;
}

export async function listReadingHistory(limit = 8, scope: PrincipalScope = {}) {
  await hydrateStore();
  const ownerId = scope.owner_id ?? DEFAULT_OWNER_ID;
  return Array.from(casts.values())
    .filter((item) => item.owner_id === ownerId)
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
    .slice(0, limit)
    .map((item) => ({
      reading_id: item.reading_id,
      question_preview: item.question_preview,
      scenario: item.scenario,
      cast_method: item.cast_method,
      base_chart: item.base_chart,
      changed_chart: item.changed_chart,
      cast_time: item.cast_time,
      day_ganzhi: item.day_ganzhi,
      month_branch: item.month_branch,
      month_source: item.month_source,
      created_at: item.created_at,
    }));
}

export async function deleteReadingHistory(readingId: string, scope: PrincipalScope = {}) {
  await hydrateStore();
  ensureReadingForScope(readingId, scope);
  const deletedCast = casts.delete(readingId);
  const deletedReading = readings.delete(readingId);
  messages.delete(readingId);
  favorites.delete(readingId);
  readingTags.delete(readingId);
  for (const [shareId, share] of shares.entries()) {
    if (share.reading_id === readingId) shares.delete(shareId);
  }
  deleteAnalysisCache(readingId);
  if (deletedCast || deletedReading) {
    await persistStore();
  }
  return { deleted: deletedCast || deletedReading };
}

export function resetReadingStoreForTests(): void {
  readings.clear();
  casts.clear();
  analyses.clear();
  messages.clear();
  shares.clear();
  favorites.clear();
  readingTags.clear();
  learningProgress.clear();
  feedbackRecords.clear();
  auditLogs.clear();
  knowledgeStatusOverrides.clear();
  caseOverrides.clear();
  courseProgress.clear();
  creatorExports.clear();
  experimentOverrides.clear();
  events.clear();
  devices.clear();
  pushSettings.clear();
  voiceJobs.clear();
  readingImports.clear();
  communityPosts.clear();
  communityComments.clear();
  communityReports.clear();
  rulePackOverrides.clear();
  adminReviews.clear();
  contributorSubmissions.clear();
  rulePackRegressions.clear();
  ecosystemPackages.clear();
  packageInstalls.clear();
  settlementLedger.clear();
  contributorSettlements.clear();
  ecosystemQualityReviews.clear();
  ecosystemRiskEvents.clear();
  opsIncidents.clear();
  commercialBillingSimulations.clear();
  privacySettings.clear();
  privacyDataExports.clear();
  complianceReviews.clear();
  ecosystemQualityReviews.clear();
  ecosystemRiskEvents.clear();
  opsIncidents.clear();
  commercialBillingSimulations.clear();
  privacySettings.clear();
  privacyDataExports.clear();
  complianceReviews.clear();
}

export function setReadingSnapshotStoreForTests(store: SnapshotStore | null): void {
  testReadingSnapshotStore = store;
}

function createQuestionPreview(question: string): string {
  const normalized = question.replace(/\s+/g, " ").trim();
  if (normalized.length <= 18) return normalized;
  return `${normalized.slice(0, 18)}...`;
}

function toCivilDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deriveTimeCastLines(castTime: string, dayGanzhi: string): CastRequest["line_values"] {
  const seed = stableHash(`${castTime}:${dayGanzhi}:yiwen-time-cast`);
  const values = [6, 7, 8, 9] as const;
  const lines = Array.from({ length: 6 }, (_, index) => values[(seed + index * 7 + (seed >>> (index % 8))) % values.length]);

  if (!lines.some((value) => value === 6 || value === 9)) {
    lines[seed % 6] = seed % 2 === 0 ? 6 : 9;
  }

  return lines;
}

type ReadingStoreSnapshot = {
  readings?: ReadingRecord[];
  casts?: CastRecord[];
  analyses?: AnalysisRecord[];
  messages?: MessageRecord[];
  shares?: ShareRecord[];
  favorites?: string[];
  reading_tags?: Array<{ reading_id: string; tags: string[] }>;
  learning_progress?: LearningProgressRecord[];
  feedback?: FeedbackRecord[];
  audit_logs?: AuditLogRecord[];
  knowledge_status_overrides?: Array<{ id: string; status: ContentStatus; review_note?: string; updated_at: string }>;
  cases?: CaseRecord[];
  course_progress?: CourseProgressRecord[];
  creator_exports?: CreatorExportRecord[];
  experiments?: ExperimentRecord[];
  events?: EventRecord[];
  devices?: DeviceRecord[];
  push_settings?: PushSettingsRecord[];
  voice_jobs?: VoiceJobRecord[];
  reading_imports?: ReadingImportRecord[];
  community_posts?: CommunityPostRecord[];
  community_comments?: Array<CommunityCommentRecord & { post_id: string }>;
  community_reports?: CommunityReportRecord[];
  rule_packs?: RulePackRecord[];
  admin_reviews?: AdminReviewRecord[];
  contributor_submissions?: ContributorSubmissionRecord[];
  rule_pack_regressions?: RulePackRegressionRecord[];
  ecosystem_packages?: EcosystemPackageRecord[];
  package_installs?: PackageInstallRecord[];
  settlement_ledger?: SettlementLedgerEventRecord[];
  contributor_settlements?: ContributorSettlementRecord[];
  ecosystem_quality_reviews?: EcosystemQualityRecord[];
  ecosystem_risk_events?: EcosystemRiskEventRecord[];
  ops_incidents?: OpsIncidentRecord[];
  commercial_billing_simulations?: CommercialBillingSimulationRecord[];
  privacy_settings?: UserPrivacySettingsRecord[];
  privacy_data_exports?: PrivacyDataExportRecord[];
  compliance_reviews?: ComplianceReviewRecord[];
};

const readingSnapshotStore = createPostgresSnapshotStore();
let testReadingSnapshotStore: SnapshotStore | null = null;

async function hydrateStore(): Promise<void> {
  const snapshotStore = getReadingSnapshotStore();
  if (!snapshotStore) return;

  const snapshot = (await snapshotStore.load(READING_SNAPSHOT_SCOPE)) as ReadingStoreSnapshot | null;
  applyStoreSnapshot(snapshot ?? {});
}

async function persistStore(): Promise<void> {
  const snapshotStore = getReadingSnapshotStore();
  if (!snapshotStore) return;
  await snapshotStore.save(READING_SNAPSHOT_SCOPE, createStoreSnapshot());
}

function getReadingSnapshotStore(): SnapshotStore | null {
  if (testReadingSnapshotStore) return testReadingSnapshotStore;
  if (!usesSharedSnapshotStore()) return null;
  return readingSnapshotStore;
}

function usesSharedSnapshotStore(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim()) || process.env.NODE_ENV === "production";
}

function clearStore(): void {
  readings.clear();
  casts.clear();
  analyses.clear();
  messages.clear();
  shares.clear();
  favorites.clear();
  readingTags.clear();
  learningProgress.clear();
  feedbackRecords.clear();
  auditLogs.clear();
  knowledgeStatusOverrides.clear();
  caseOverrides.clear();
  courseProgress.clear();
  creatorExports.clear();
  experimentOverrides.clear();
  events.clear();
  devices.clear();
  pushSettings.clear();
  voiceJobs.clear();
  readingImports.clear();
  communityPosts.clear();
  communityComments.clear();
  communityReports.clear();
  rulePackOverrides.clear();
  adminReviews.clear();
  contributorSubmissions.clear();
  rulePackRegressions.clear();
  ecosystemPackages.clear();
  packageInstalls.clear();
  settlementLedger.clear();
  contributorSettlements.clear();
  ecosystemQualityReviews.clear();
  ecosystemRiskEvents.clear();
  opsIncidents.clear();
  commercialBillingSimulations.clear();
  privacySettings.clear();
  privacyDataExports.clear();
  complianceReviews.clear();
}

function applyStoreSnapshot(parsed: ReadingStoreSnapshot): void {
  clearStore();
  for (const reading of parsed.readings ?? []) readings.set(reading.id, reading);
  for (const cast of parsed.casts ?? []) casts.set(cast.reading_id, cast);
  for (const analysis of parsed.analyses ?? []) analyses.set(getAnalysisCacheKey(analysis.reading_id, analysis.mode), analysis);
  for (const message of parsed.messages ?? []) {
    const current = messages.get(message.reading_id) ?? [];
    current.push(message);
    messages.set(message.reading_id, current);
  }
  for (const share of parsed.shares ?? []) shares.set(share.share_id, share);
  for (const readingId of parsed.favorites ?? []) favorites.add(readingId);
  for (const item of parsed.reading_tags ?? []) readingTags.set(item.reading_id, item.tags);
  for (const progress of parsed.learning_progress ?? []) learningProgress.set(progress.subject_id, progress);
  for (const feedback of parsed.feedback ?? []) feedbackRecords.set(feedback.id, feedback);
  for (const auditLog of parsed.audit_logs ?? []) auditLogs.set(auditLog.id, auditLog);
  for (const item of parsed.knowledge_status_overrides ?? []) knowledgeStatusOverrides.set(item.id, item);
  for (const item of parsed.cases ?? []) caseOverrides.set(item.id, item);
  for (const item of parsed.course_progress ?? []) courseProgress.set(`${item.course_id}:${item.lesson_id}`, item);
  for (const item of parsed.creator_exports ?? []) creatorExports.set(item.id, item);
  for (const item of parsed.experiments ?? []) experimentOverrides.set(item.id, item);
  for (const item of parsed.events ?? []) events.set(item.id, item);
  for (const item of parsed.devices ?? []) devices.set(item.device_id, item);
  for (const item of parsed.push_settings ?? []) pushSettings.set(item.device_id, item);
  for (const item of parsed.voice_jobs ?? []) voiceJobs.set(item.job_id, item);
  for (const item of parsed.reading_imports ?? []) readingImports.set(item.import_id, item);
  for (const item of parsed.community_posts ?? []) communityPosts.set(item.id, item);
  for (const item of parsed.community_comments ?? []) {
    const current = communityComments.get(item.post_id) ?? [];
    current.push(item);
    communityComments.set(item.post_id, current);
  }
  for (const item of parsed.community_reports ?? []) communityReports.set(item.id, item);
  for (const item of parsed.rule_packs ?? []) rulePackOverrides.set(item.id, item);
  for (const item of parsed.admin_reviews ?? []) adminReviews.set(item.id, item);
  for (const item of parsed.contributor_submissions ?? []) contributorSubmissions.set(item.id, item);
  for (const item of parsed.rule_pack_regressions ?? []) rulePackRegressions.set(item.id, item);
  for (const item of parsed.ecosystem_packages ?? []) ecosystemPackages.set(item.id, item);
  for (const item of parsed.package_installs ?? []) packageInstalls.set(item.id, item);
  for (const item of parsed.settlement_ledger ?? []) settlementLedger.set(item.id, item);
  for (const item of parsed.contributor_settlements ?? []) contributorSettlements.set(item.id, item);
  for (const item of parsed.ecosystem_quality_reviews ?? []) ecosystemQualityReviews.set(item.package_id, item);
  for (const item of parsed.ecosystem_risk_events ?? []) ecosystemRiskEvents.set(item.id, item);
  for (const item of parsed.ops_incidents ?? []) opsIncidents.set(item.id, item);
  for (const item of parsed.commercial_billing_simulations ?? []) commercialBillingSimulations.set(item.id, item);
  for (const item of parsed.privacy_settings ?? []) privacySettings.set(item.user_id, item);
  for (const item of parsed.privacy_data_exports ?? []) privacyDataExports.set(item.id, item);
  for (const item of parsed.compliance_reviews ?? []) complianceReviews.set(item.id, item);
}

function createStoreSnapshot(): ReadingStoreSnapshot {
  return {
    readings: Array.from(readings.values()),
    casts: Array.from(casts.values()),
    analyses: Array.from(analyses.values()),
    messages: Array.from(messages.values()).flat(),
    shares: Array.from(shares.values()),
    favorites: Array.from(favorites),
    reading_tags: Array.from(readingTags.entries()).map(([reading_id, tags]) => ({ reading_id, tags })),
    learning_progress: Array.from(learningProgress.values()),
    feedback: Array.from(feedbackRecords.values()),
    audit_logs: Array.from(auditLogs.values()),
    knowledge_status_overrides: Array.from(knowledgeStatusOverrides.entries()).map(([id, value]) => ({ id, ...value })),
    cases: Array.from(caseOverrides.values()),
    course_progress: Array.from(courseProgress.values()),
    creator_exports: Array.from(creatorExports.values()),
    experiments: Array.from(experimentOverrides.values()),
    events: Array.from(events.values()),
    devices: Array.from(devices.values()),
    push_settings: Array.from(pushSettings.values()),
    voice_jobs: Array.from(voiceJobs.values()),
    reading_imports: Array.from(readingImports.values()),
    community_posts: Array.from(communityPosts.values()),
    community_comments: Array.from(communityComments.values()).flat(),
    community_reports: Array.from(communityReports.values()),
    rule_packs: Array.from(rulePackOverrides.values()),
    admin_reviews: Array.from(adminReviews.values()),
    contributor_submissions: Array.from(contributorSubmissions.values()),
    rule_pack_regressions: Array.from(rulePackRegressions.values()),
    ecosystem_packages: Array.from(ecosystemPackages.values()),
    package_installs: Array.from(packageInstalls.values()),
    settlement_ledger: Array.from(settlementLedger.values()),
    contributor_settlements: Array.from(contributorSettlements.values()),
    ecosystem_quality_reviews: Array.from(ecosystemQualityReviews.values()),
    ecosystem_risk_events: Array.from(ecosystemRiskEvents.values()),
    ops_incidents: Array.from(opsIncidents.values()),
    commercial_billing_simulations: Array.from(commercialBillingSimulations.values()),
    privacy_settings: Array.from(privacySettings.values()),
    privacy_data_exports: Array.from(privacyDataExports.values()),
    compliance_reviews: Array.from(complianceReviews.values()),
  };
}
function getAnalysisCacheKey(readingId: string, mode: AnalyzeRequest["mode"]): string {
  return `${readingId}:${mode}`;
}

function deleteAnalysisCache(readingId: string): void {
  for (const key of analyses.keys()) {
    if (key.startsWith(`${readingId}:`)) {
      analyses.delete(key);
    }
  }
}

function stripAnalysisRecord(record: AnalysisRecord): RuleAnalysisResult {
  const analysis = { ...record } as Partial<AnalysisRecord>;
  delete analysis.updated_at;
  return analysis as RuleAnalysisResult;
}

function toAnalyzeMode(mode: ExplainRequest["mode"]): AnalyzeRequest["mode"] {
  return mode === "story" ? "light" : mode;
}

function getKnowledgeCardsForAnalysis(
  scenario: InitReadingRequest["scenario"],
  analysis: RuleAnalysisResult,
  term?: string,
): KnowledgeCard[] {
  return searchKnowledgeCards({
    scenario,
    term,
    evidence_rule_ids: analysis.evidence_tree.map((node) => node.rule_id),
    limit: 6,
  });
}

async function appendMessage(input: Omit<MessageRecord, "id" | "created_at">): Promise<void> {
  const next: MessageRecord = {
    ...input,
    id: `msg_${randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  const current = messages.get(input.reading_id) ?? [];
  messages.set(input.reading_id, [...current, next].slice(-20));
  await persistStore();
}

function listKnowledgeCardsForLearning(input: {
  term?: string;
  rule_id?: string;
  scenario?: InitReadingRequest["scenario"];
  limit?: number;
}): KnowledgeCard[] {
  return KNOWLEDGE_CARD_SEEDS.map(applyKnowledgeStatus)
    .filter((card) => card.status === "approved")
    .filter((card) => !input.rule_id || card.rule_id === input.rule_id)
    .filter((card) => !input.scenario || card.scenario === input.scenario || card.scenario === "通用")
    .filter((card) => !input.term || `${card.term} ${card.title} ${card.content}`.includes(input.term))
    .slice(0, input.limit ?? 100);
}

function findKnowledgeCard(cardId: string): KnowledgeCard | undefined {
  const card = KNOWLEDGE_CARD_SEEDS.find((item) => item.id === cardId);
  return card ? applyKnowledgeStatus(card) : undefined;
}

function applyKnowledgeStatus(card: KnowledgeCard): KnowledgeCard {
  const override = knowledgeStatusOverrides.get(card.id);
  return override ? { ...card, status: override.status } : card;
}

function makeCourseSeed(
  id: string,
  title: string,
  difficulty: CaseDifficulty,
  lessonTypes: LessonType[],
  caseIds: string[],
): CourseRecord {
  const now = "2026-05-01T00:00:00.000Z";
  const lessons = lessonTypes.map((lessonType, index) => ({
    id: `${id}-lesson-${String(index + 1).padStart(2, "0")}`,
    title: `${title} ${index + 1}`,
    lesson_type: lessonType,
    summary: "围绕知识卡、练习和卦例复盘建立学习闭环。",
    knowledge_card_ids: KNOWLEDGE_CARD_SEEDS.slice(index, index + 2).map((card) => card.id),
    exercise_ids: EXERCISE_SEEDS.slice(index, index + 2).map((exercise) => exercise.id),
    case_ids: caseIds.slice(0, Math.max(1, Math.min(caseIds.length, index + 1))),
    duration_minutes: 8 + index * 4,
  }));
  return {
    id,
    title,
    status: "published",
    difficulty,
    summary: "学习权益课程，只做传统文化知识讲解、练习和案例复盘。",
    lesson_count: lessons.length,
    lessons,
    badge: `${title}完成`,
    created_at: now,
    updated_at: now,
  };
}

function makeExperimentSeed(id: string, surface: ExperimentSurface, name: string): ExperimentRecord {
  const now = "2026-05-01T00:00:00.000Z";
  return {
    id,
    surface,
    name,
    status: "running",
    variants: ["control", "variant_a"],
    created_at: now,
    updated_at: now,
  };
}

function allCaseRecords(): CaseRecord[] {
  const seeded = CASE_SEEDS.map((item) => caseOverrides.get(item.id) ?? item);
  const seedIds = new Set(CASE_SEEDS.map((item) => item.id));
  const custom = Array.from(caseOverrides.values()).filter((item) => !seedIds.has(item.id));
  return [...seeded, ...custom].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function findCaseRecord(caseId: string): CaseRecord | undefined {
  return caseOverrides.get(caseId) ?? CASE_SEEDS.find((item) => item.id === caseId);
}

function allExperiments(): ExperimentRecord[] {
  const seeded = EXPERIMENT_SEEDS.map((item) => experimentOverrides.get(item.id) ?? item);
  const seedIds = new Set(EXPERIMENT_SEEDS.map((item) => item.id));
  const custom = Array.from(experimentOverrides.values()).filter((item) => !seedIds.has(item.id));
  return [...seeded, ...custom].sort((left, right) => left.surface.localeCompare(right.surface));
}

function findExperimentRecord(experimentId: string): ExperimentRecord | undefined {
  return experimentOverrides.get(experimentId) ?? EXPERIMENT_SEEDS.find((item) => item.id === experimentId);
}

function findExperimentBySurface(surface: ExperimentSurface): ExperimentRecord | undefined {
  return allExperiments().find((item) => item.surface === surface);
}

function makeRulePackSeed(id: string, name: string, scope: RulePackScope, ruleIds: string[]): RulePackRecord {
  const now = "2026-05-01T00:00:00.000Z";
  return {
    id,
    rule_pack_id: id,
    rule_pack_version: 1,
    name,
    scope,
    status: "approved",
    rule_ids: ruleIds,
    weight_profile: { B: 1 },
    validation_case_ids: ["case-001", "case-002"],
    source_refs: ["v2-core-rule-pack"],
    regression_passed: true,
    professional_reviewed: true,
    compliance_reviewed: true,
    safety_reviewed: true,
    regression_reviewed: true,
    created_at: now,
    updated_at: now,
  };
}

function allRulePacks(): RulePackRecord[] {
  const seeded = RULE_PACK_SEEDS.map((item) => rulePackOverrides.get(item.id) ?? item);
  const seedIds = new Set(RULE_PACK_SEEDS.map((item) => item.id));
  const custom = Array.from(rulePackOverrides.values()).filter((item) => !seedIds.has(item.id));
  return [...seeded, ...custom].sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function findRulePackRecord(rulePackId: string): RulePackRecord | undefined {
  return rulePackOverrides.get(rulePackId) ?? RULE_PACK_SEEDS.find((item) => item.id === rulePackId);
}

function getPlatformCapabilities(platform: ClientPlatform): string[] {
  const shared = ["reading_flow", "history", "learning", "community", "safety_guardrails"];
  if (platform === "web" || platform === "h5") return [...shared, "web_share"];
  if (platform === "mini_program") return [...shared, "offline_cache", "native_share", "push_settings"];
  return [...shared, "offline_cache", "native_share", "voice_permission", "push_settings"];
}

function normalizeImportPayload(sourceType: ImportSourceType, payload: ReadingImportPreviewRequest["payload"]): Partial<ImportedReadingPayload> {
  if (sourceType === "structured_json" && typeof payload !== "string") {
    return payload;
  }
  if (typeof payload !== "string") {
    return payload;
  }
  const numbers = payload
    .match(/[6789]/g)
    ?.slice(0, 6)
    .map((value) => Number(value) as NonNullable<ImportedReadingPayload["line_values"]>[number]);
  const scenario = CASE_SCENARIOS.find((item) => payload.includes(item)) ?? CASE_SCENARIOS[0];
  const question = payload.match(/question:\s*([^;]+)/i)?.[1]?.trim() ?? payload.match(/问题[:：]\s*([^;；]+)/)?.[1]?.trim() ?? "导入卦例复盘";
  const castTime = payload.match(/(?:date|cast_time):\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? payload.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  return {
    question,
    scenario,
    line_values: numbers && numbers.length === 6 ? numbers : undefined,
    cast_time: castTime,
  };
}

function getImportErrors(payload: Partial<ImportedReadingPayload>): string[] {
  const errors: string[] = [];
  if (!payload.question || payload.question.trim().length < 2) errors.push("question is required");
  if (!payload.scenario) errors.push("scenario is required");
  if (!payload.line_values || payload.line_values.length !== 6) errors.push("six line_values are required");
  if (!payload.cast_time) errors.push("cast_time is required");
  return errors;
}

function applyReviewDecision(review: AdminReviewRecord): void {
  if (review.target_type === "community_post") {
    const post = communityPosts.get(review.target_id);
    if (post) {
      communityPosts.set(review.target_id, {
        ...post,
        status: review.decision === "approved" ? "published" : "removed",
        updated_at: new Date().toISOString(),
      });
    }
    return;
  }

  if (review.target_type === "community_comment") {
    for (const [postId, comments] of communityComments.entries()) {
      communityComments.set(
        postId,
        comments.map((comment) =>
          comment.id === review.target_id
            ? { ...comment, status: review.decision === "approved" ? "published" : "removed" }
            : comment,
        ),
      );
    }
    return;
  }

  if (review.target_type === "rule_pack") {
    const pack = findRulePackRecord(review.target_id);
    if (pack) {
      const next: RulePackRecord = {
        ...pack,
        professional_reviewed: pack.professional_reviewed || (review.review_type === "professional" && review.decision === "approved"),
        compliance_reviewed: pack.compliance_reviewed || (review.review_type === "compliance" && review.decision === "approved"),
        safety_reviewed: pack.safety_reviewed || (review.review_type === "safety" && review.decision === "approved"),
        status: review.decision === "rejected" ? "rejected" : pack.status,
        updated_at: new Date().toISOString(),
      };
      rulePackOverrides.set(review.target_id, next);
    }
  }
}

function assertSafeEcosystemPayload(title: string, payload: Record<string, unknown>): void {
  const normalized = `${title} ${JSON.stringify(payload)}`.toLowerCase();
  const blocked = ECOSYSTEM_BANNED_TERMS.find((term) => normalized.includes(term.toLowerCase()));
  if (blocked) {
    throw new Error(`unsafe ecosystem content: ${blocked}`);
  }
}

function assertNoCommitmentWording(text: string): void {
  const normalized = text.toLowerCase();
  const blocked = ECOSYSTEM_BANNED_TERMS.find((term) => normalized.includes(term.toLowerCase()));
  if (blocked) {
    throw new Error(`commitment wording detected: ${blocked}`);
  }
}

function makeDefaultQualityRecord(pkg: EcosystemPackageRecord, reviewedAt: string): EcosystemQualityRecord {
  return {
    id: `quality_${pkg.id}`,
    package_id: pkg.id,
    package_type: pkg.package_type,
    title: pkg.title,
    quality_status: pkg.status === "deprecated" ? "deprecated" : pkg.status === "suspended" ? "suspended" : "healthy",
    quality_score: pkg.quality_score,
    safety_score: pkg.safety_score,
    complaint_count: 0,
    regression_failure_count: 0,
    install_retention_rate: pkg.install_count > 0 ? 1 : 0,
    user_feedback_score: 4.5,
    risk_level: "low",
    moderation_action: "warn",
    note: "default healthy package quality baseline",
    reviewed_at: reviewedAt,
  };
}

function getPackageQualityStatus(packageId: string): QualityReviewStatus {
  const pkg = ecosystemPackages.get(packageId);
  const review = ecosystemQualityReviews.get(packageId);
  if (review) return review.quality_status;
  if (!pkg) return "suspended";
  if (pkg.status === "suspended") return "suspended";
  if (pkg.status === "deprecated") return "deprecated";
  return "healthy";
}

function appendEcosystemRiskEvent(input: Omit<EcosystemRiskEventRecord, "id" | "status" | "created_at">): void {
  const record: EcosystemRiskEventRecord = {
    ...input,
    id: `risk_${randomUUID()}`,
    status: "open",
    created_at: new Date().toISOString(),
  };
  ecosystemRiskEvents.set(record.id, record);
}

function makeDefaultPrivacySettings(userId = DEFAULT_OWNER_ID): UserPrivacySettingsRecord {
  return {
    user_id: userId,
    save_history: true,
    allow_personalization: true,
    allow_sensitive_review: false,
    retain_history_days: 180,
    export_format: "json",
    updated_at: "2026-05-01T00:00:00.000Z",
  };
}

async function createSubmissionTarget(input: Pick<ContributorSubmissionRecord, "submission_type" | "payload"> | ContributorSubmissionRequest): Promise<{ id: string } | null> {
  if (input.submission_type !== "rule_pack") {
    return null;
  }
  const payload = RulePackUpsertSchema.parse({
    ...input.payload,
    status: "testing",
  });
  return await upsertRulePack(payload);
}

function buildSubmissionDiffSummary(current: ContributorSubmissionRecord, patch: ContributorSubmissionPatch): string {
  const changed = [
    patch.title && patch.title !== current.title ? "title" : undefined,
    patch.payload ? "payload" : undefined,
    patch.status && patch.status !== current.status ? "status" : undefined,
  ].filter(Boolean);
  return changed.length > 0 ? `changed ${changed.join(", ")}` : "metadata refreshed";
}

function getSubmissionStatusAfterReview(
  submission: ContributorSubmissionRecord,
  gates: ContributorSubmissionRecord["gates"],
  decision: AdminSubmissionReviewRequest["decision"],
): SubmissionStatus {
  if (decision === "changes_requested") return "changes_requested";
  if (decision === "rejected") return "rejected";
  return areSubmissionGatesApproved(submission.submission_type, gates) ? "approved" : "in_review";
}

function areSubmissionGatesApproved(submissionType: SubmissionType, gates: ContributorSubmissionRecord["gates"]): boolean {
  const required: ReviewGate[] = submissionType === "rule_pack" ? ["professional", "compliance", "safety", "regression"] : ["professional", "compliance", "safety"];
  return required.every((gate) => gates[gate] === "approved");
}

function syncRulePackReviewGates(submission: ContributorSubmissionRecord): void {
  if (submission.submission_type !== "rule_pack" || !submission.target_id) return;
  const pack = findRulePackRecord(submission.target_id);
  if (!pack) return;
  rulePackOverrides.set(submission.target_id, {
    ...pack,
    professional_reviewed: submission.gates.professional === "approved" || pack.professional_reviewed,
    compliance_reviewed: submission.gates.compliance === "approved" || pack.compliance_reviewed,
    safety_reviewed: submission.gates.safety === "approved" || pack.safety_reviewed,
    regression_reviewed: submission.gates.regression === "approved" || pack.regression_reviewed,
    status: submission.status === "rejected" ? "rejected" : pack.status,
    updated_at: new Date().toISOString(),
  });
}

function findSubmissionForRulePack(rulePackId: string): ContributorSubmissionRecord | undefined {
  return Array.from(contributorSubmissions.values()).find((item) => item.submission_type === "rule_pack" && item.target_id === rulePackId);
}

function isRulePackReadyForEcosystemPublish(pack: RulePackRecord): boolean {
  return pack.professional_reviewed && pack.compliance_reviewed && pack.safety_reviewed && pack.regression_passed && pack.regression_reviewed;
}

function appendSettlementLedgerEvent(pkg: EcosystemPackageRecord, eventName: SettlementLedgerEventRecord["event_name"], amountCents: number): void {
  const record: SettlementLedgerEventRecord = {
    id: `ledger_${randomUUID()}`,
    contributor_id: pkg.contributor_id,
    package_id: pkg.id,
    event_name: eventName,
    amount_cents: amountCents,
    mode: "simulated",
    created_at: new Date().toISOString(),
  };
  settlementLedger.set(record.id, record);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, index)];
}

function stableHash(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function buildCreatorExportTitle(exportType: CreatorExportType, caseRecord?: CaseRecord, cast?: CastRecord): string {
  const base = caseRecord?.title ?? `${cast?.base_chart ?? "排盘"}学习素材`;
  const labels: Record<CreatorExportType, string> = {
    article: "图文讲解",
    short_video_script: "短视频脚本",
    long_image: "长图结构",
    chart_snapshot: "排盘图导出",
  };
  return `${base} · ${labels[exportType]}`;
}

function buildCreatorExportSections(
  exportType: CreatorExportType,
  context: {
    caseRecord?: CaseRecord;
    cast?: CastRecord;
    analysis?: RuleAnalysisResult;
  },
): string[] {
  const caseLine = context.caseRecord
    ? `案例：${context.caseRecord.title}，${context.caseRecord.question_preview}，来源：${context.caseRecord.source_refs.join("、")}`
    : "案例：基于当前脱敏排盘生成学习素材。";
  const chartLine = context.cast
    ? `排盘快照：本卦${context.cast.base_chart}，变卦${context.cast.changed_chart}，日干支${context.cast.day_ganzhi}，月建${context.cast.month_branch}。`
    : `排盘快照：${context.caseRecord?.base_chart ?? "待补充"} -> ${context.caseRecord?.changed_chart ?? "待补充"}。`;
  const evidenceLine = context.analysis
    ? `证据主线：${context.analysis.evidence_tree.slice(0, 3).map((node) => `${node.rule_id} ${node.conclusion}`).join("；")}`
    : `证据主线：${context.caseRecord?.rule_ids.join("、") ?? "规则卡"}。`;
  const counterLine = context.caseRecord?.counter_evidence[0] ?? context.analysis?.counter_evidence[0]?.conclusion ?? "保留反证，不给确定承诺。";

  if (exportType === "short_video_script") {
    return [
      "开场：用一个脱敏卦例说明如何从排盘进入证据树。",
      chartLine,
      evidenceLine,
      `反证：${counterLine}`,
      "收束：把卦例当作传统文化学习材料，不替代现实沟通、专业建议或个人判断。",
    ];
  }

  if (exportType === "long_image") {
    return [
      "长图标题区：卦名、场景和娱乐学习免责声明。",
      chartLine,
      evidenceLine,
      `反证区：${counterLine}`,
      "结尾区：知识卡引用、来源说明和隐私脱敏说明。",
    ];
  }

  if (exportType === "chart_snapshot") {
    return [
      "排盘图信息：仅展示卦名、时间、六亲六神和动爻标识。",
      chartLine,
      "隐私规则：隐藏原始问题、私密追问和用户标识。",
      CREATOR_SAFETY_NOTICE,
    ];
  }

  return [
    caseLine,
    chartLine,
    evidenceLine,
    `讲解边界：${counterLine}`,
    "只做学习复盘，不输出承诺式结论。",
  ];
}
function assertCreatorContentSafe(sections: string[]): void {
  const joined = sections.join("\n");
  const banned = CREATOR_BANNED_TERMS.find((term) => joined.includes(term));
  if (banned) {
    throw new Error(`Creator export contains banned term: ${banned}`);
  }
}

function appendAuditLog(input: Omit<AuditLogRecord, "id" | "created_at">): void {
  const record: AuditLogRecord = {
    ...input,
    id: `audit_${randomUUID()}`,
    created_at: new Date().toISOString(),
  };
  auditLogs.set(record.id, record);
}
