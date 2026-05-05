"use client";

import Image from "next/image";
import {
  BookOpen,
  Coins,
  History,
  MessageCircle,
  Mic,
  PackageCheck,
  PenLine,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Share2,
  Smartphone,
  Star,
  Tags,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  GraduationCap,
  Gauge,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LineValue = 6 | 7 | 8 | 9;
type CastMethod = "coin" | "manual";
type SafetyStatus = {
  status: "allowed" | "blocked";
  risk_label: string;
  notice: string;
};
type ChartLine = {
  line_no: number;
  value: LineValue;
  yin_yang: "yin" | "yang";
  moving: boolean;
  stem: string;
  branch: string;
  element: string;
  liuqin: string;
  liushen: string;
  changed_branch: string;
};
type ChartSummary = {
  name: string;
  upper_trigram: string;
  lower_trigram: string;
  palace: string;
  shi_line: number;
  ying_line: number;
  xunkong: [string, string];
  is_youhun: boolean;
  is_guihun: boolean;
};
type CastResult = {
  reading_id: string;
  cast_method: CastMethod;
  cast_time: string;
  day_ganzhi: string;
  month_branch: string;
  month_source: "explicit" | "jieqi_table";
  base_chart: ChartSummary;
  changed_chart: ChartSummary;
  lines: ChartLine[];
};
type EvidenceNode = {
  id: string;
  rule_id: string;
  level: "A" | "B" | "C" | "D";
  title: string;
  line_refs: number[];
  premise: string;
  conclusion: string;
  polarity: "+" | "-" | "neutral";
  weight: number;
  confidence: "低" | "中" | "高";
  source_refs: string[];
};
type AnalysisResult = {
  reading_id: string;
  mode: "professional" | "light" | "learning";
  rule_version: string;
  safety_status: SafetyStatus;
  question_type: string;
  yongshen: {
    line_no: number;
    liuqin: string;
    branch: string;
    role: string;
    reason_rule_id: string;
    confidence: "低" | "中" | "高";
    alternatives: Array<{ line_no: number; liuqin: string; branch: string; role: string }>;
  } | null;
  evidence_tree: EvidenceNode[];
  counter_evidence: EvidenceNode[];
  verdict: {
    tendency: "supportive" | "mixed" | "mixed_resistance" | "learning_only" | "blocked";
    confidence: "低" | "中" | "高";
    summary: string;
  };
  action_tips: string[];
  safety_notice: string;
};
type HistoryItem = {
  reading_id: string;
  question_preview: string;
  scenario: string;
  cast_method: CastMethod;
  base_chart: string;
  changed_chart: string;
  cast_time: string;
  day_ganzhi: string;
  month_branch?: string;
  month_source?: "explicit" | "jieqi_table";
  created_at: string;
};
type ExplainMode = "professional" | "light" | "learning" | "story";
type FollowupType = "why_yongshen" | "key_rule" | "counter_evidence" | "timing" | "learning_mode" | "free_text";
type KnowledgeCard = {
  id: string;
  title: string;
  term: string;
  rule_id: string;
  scenario?: string;
  content: string;
  source_refs: string[];
  status: "draft" | "approved" | "rejected";
};
type AiReadingOutput = {
  summary: string;
  key_evidence: Array<{ evidence_id: string; plain_explanation: string }>;
  counter_evidence: string[];
  action_tips: string[];
  safety_notice: string;
  knowledge_card_refs: string[];
  model_metadata: {
    provider: string;
    model: string;
    generated_at: string;
  };
};
type AiDelta = {
  field: "summary" | "key_evidence" | "counter_evidence" | "action_tips" | "safety_notice";
  text: string;
};
type AiStreamEvent =
  | { type: "safety"; data: SafetyStatus }
  | { type: "retrieval"; data: { cards: KnowledgeCard[] } }
  | { type: "delta"; data: AiDelta }
  | { type: "final"; data: AiReadingOutput }
  | { type: "error"; data: { error: string } };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
type LearningTerm = {
  id: string;
  term: string;
  rule_id: string;
  definition: string;
  source_refs: string[];
  status: "draft" | "approved" | "rejected";
};
type LearningExercise = {
  id: string;
  title: string;
  prompt: string;
  answer: string;
  knowledge_card_id: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "draft" | "approved" | "rejected";
};
type LearningCardDetail = KnowledgeCard & {
  example: string;
  counter_example: string;
  safety_notice: string;
};
type ShareResult = {
  share_id: string;
  share_url: string;
  card_payload: {
    base_chart: string;
    changed_chart: string;
    question_preview: string;
    key_points: string[];
    safety_notice: string;
  };
};
type MemberProgress = {
  membership: {
    tier: "free" | "member";
    entitlements: string[];
  };
  favorites: string[];
  tags: Record<string, string[]>;
  learning_progress: Array<{ subject_id: string; subject_type: string; badge?: string; score?: number }>;
};
type AdminMetrics = {
  reading_count: number;
  cast_completion_count: number;
  ai_explain_success_count: number;
  followup_count: number;
  share_count: number;
  favorite_count: number;
  feedback_count: number;
  safety_block_count: number;
  rejected_knowledge_cards: number;
  case_count?: number;
  course_count?: number;
  creator_export_count?: number;
  experiment_event_count?: number;
  case_open_count?: number;
  course_started_count?: number;
  course_completed_count?: number;
  creator_exported_count?: number;
  device_count?: number;
  voice_job_count?: number;
  import_count?: number;
  community_post_count?: number;
  community_review_queue_count?: number;
  rule_pack_count?: number;
  ecosystem_submission_count?: number;
  ecosystem_package_count?: number;
  ecosystem_install_count?: number;
  ecosystem_suspended_count?: number;
  simulated_revenue_cents?: number;
  p95_latency_ms: {
    cast: number;
    first_ai_delta: number;
    share_page: number;
    case_page?: number;
    course_page?: number;
    creator_export?: number;
    voice_transcribe?: number;
    import_parse?: number;
    rule_regression?: number;
    ecosystem_catalog?: number;
    submission_review?: number;
  };
};
type CaseSummary = {
  id: string;
  title: string;
  scenario: string;
  source_type: "classic" | "anonymized_user" | "editorial";
  difficulty: "beginner" | "intermediate" | "advanced";
  status: "draft" | "approved" | "rejected" | "archived";
  question_preview: string;
  base_chart: string;
  changed_chart: string;
  yongshen: string;
  evidence_ids: string[];
  rule_ids: string[];
  learning_summary: string;
  source_refs: string[];
};
type CourseLesson = {
  id: string;
  title: string;
  lesson_type: "article" | "quiz" | "case_review" | "practice";
  summary: string;
  case_ids: string[];
  duration_minutes: number;
};
type CourseSummary = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  difficulty: "beginner" | "intermediate" | "advanced";
  summary: string;
  lesson_count: number;
  lessons: CourseLesson[];
  badge: string;
};
type CourseProgressSummary = {
  progress: Array<{ course_id: string; lesson_id: string; completed: boolean; badge?: string; score?: number }>;
};
type CreatorExportResult = {
  id: string;
  export_type: "article" | "short_video_script" | "long_image" | "chart_snapshot";
  title: string;
  content_sections: string[];
  source_refs: string[];
  safety_notice: string;
};
type ExperimentAssignment = {
  experiment_id: string;
  surface: "home" | "result" | "learning" | "share" | "course";
  variant: "control" | "variant_a" | "variant_b";
  status: "draft" | "running" | "paused" | "archived";
};
type ClientPlatform = "web" | "h5" | "mini_program" | "ios" | "android";
type DeviceRecord = {
  device_id: string;
  anonymous_id: string;
  platform: ClientPlatform;
  app_version: string;
  locale: string;
  capabilities: string[];
  safety_policy_version: string;
  registered_at: string;
};
type AppBootstrap = {
  platform: ClientPlatform;
  anonymous_id: string;
  api_version: string;
  safety_policy_version: string;
  feature_flags: Record<string, boolean>;
  capabilities: string[];
  copy: {
    safety_notice: string;
    privacy_notice: string;
  };
};
type VoiceJob = {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed" | "blocked";
  transcript: string;
  platform: ClientPlatform;
  safety: SafetyStatus;
  raw_audio_stored: boolean;
  audio_url: string | null;
  created_at: string;
};
type ReadingImportRecord = {
  import_id: string;
  source_type: "pasted_text" | "structured_json" | "image_ocr";
  status: "draft" | "parsed" | "needs_review" | "accepted" | "rejected";
  editable_fields: {
    question?: string;
    scenario?: string;
    line_values?: LineValue[];
    cast_time?: string;
    day_ganzhi?: string;
    month_branch?: string;
  };
  errors: string[];
  ai_generated_chart_fields: false;
  reading_id?: string;
  chart_json?: {
    base_chart: ChartSummary;
    changed_chart: ChartSummary;
    lines: ChartLine[];
  };
  created_at: string;
  updated_at: string;
};
type CommunityPost = {
  id: string;
  post_type: "case_discussion" | "course_checkin" | "knowledge_comment" | "wrong_question";
  title: string;
  body: string;
  reading_id?: string;
  case_id?: string;
  course_id?: string;
  knowledge_card_id?: string;
  status: "draft" | "pending_review" | "published" | "hidden" | "removed";
  author_label: string;
  question_preview: string;
  created_at: string;
  updated_at: string;
};
type CommunityReport = {
  id: string;
  target_type: "post" | "comment";
  target_id: string;
  reason: "unsafe" | "privacy" | "spam" | "inaccurate";
  status: "pending_review" | "resolved";
  created_at: string;
};
type RulePack = {
  id: string;
  rule_pack_id: string;
  rule_pack_version: number;
  name: string;
  scope: "yongshen" | "wangshuai" | "dongbian" | "timing" | "style" | "school";
  status: "draft" | "testing" | "approved" | "rejected" | "deprecated";
  rule_ids: string[];
  weight_profile: Record<string, number>;
  validation_case_ids: string[];
  source_refs: string[];
  regression_passed: boolean;
  professional_reviewed: boolean;
  compliance_reviewed: boolean;
  safety_reviewed: boolean;
  regression_reviewed: boolean;
  regression_report_id?: string;
  created_at: string;
  updated_at: string;
};
type AdminReview = {
  id: string;
  target_type: "community_post" | "community_comment" | "rule_pack" | "case" | "knowledge_card";
  target_id: string;
  review_type: "professional" | "compliance" | "privacy" | "safety";
  decision: "approved" | "rejected";
  note?: string;
  created_at: string;
};
type ReviewQueueItem = CommunityPost | CommunityReport | AdminReview;
type ContributorDashboard = {
  contributor_id: string;
  roles: Array<"creator" | "expert" | "reviewer" | "admin">;
  submission_count: number;
  published_count: number;
  pending_review_count: number;
  simulated_revenue_cents: number;
};
type ContributorSubmission = {
  id: string;
  submission_type: "rule_pack" | "case" | "course" | "knowledge_card" | "exercise" | "creator_template";
  title: string;
  payload: Record<string, unknown>;
  source_refs: string[];
  contributor_id: string;
  contributor_roles: ContributorDashboard["roles"];
  status: "draft" | "submitted" | "in_review" | "changes_requested" | "approved" | "rejected" | "published" | "archived";
  version: number;
  target_id?: string;
  target_type?: "rule_pack" | "case" | "course" | "knowledge_card" | "exercise" | "creator_template";
  gates: Partial<Record<"professional" | "compliance" | "privacy" | "safety" | "regression" | "editorial", "pending" | "approved" | "rejected" | "changes_requested">>;
  review_notes: Array<{ review_gate: string; decision: string; note?: string; id: string; created_at: string }>;
  diff_summary: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  published_at?: string;
};
type EcosystemPackage = {
  id: string;
  package_type: "rule_pack" | "course_pack" | "case_pack" | "knowledge_pack" | "creator_template_pack";
  title: string;
  status: "draft" | "testing" | "approved" | "published" | "suspended" | "deprecated";
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
type PackageInstallRecord = {
  id: string;
  package_id: string;
  user_id: string;
  status: "installed" | "disabled" | "removed";
  installed_at: string;
  updated_at: string;
};
type ContributorSettlement = {
  id: string;
  contributor_id: string;
  period: string;
  mode: "simulated";
  status: "pending" | "calculated" | "frozen" | "voided";
  total_amount_cents: number;
  event_count: number;
  created_at: string;
};
type EcosystemMetrics = {
  submission_count: number;
  approval_rate: number;
  changes_requested_rate: number;
  published_package_count: number;
  install_count: number;
  install_conversion_rate: number;
  content_revisit_count: number;
  learning_completion_count: number;
  contributor_active_count: number;
  review_sla_p95_ms: number;
  complaint_resolution_p95_ms: number;
  suspended_package_count: number;
  complaint_count: number;
  simulated_revenue_cents: number;
  regression_failure_rate: number;
  p95_latency_ms: {
    rule_regression: number;
    ecosystem_catalog: number;
    submission_review: number;
  };
};

type EcosystemQualityReview = {
  id: string;
  package_id: string;
  package_type: EcosystemPackage["package_type"];
  title: string;
  quality_status: "healthy" | "needs_review" | "suspended" | "deprecated";
  quality_score: number;
  safety_score: number;
  complaint_count: number;
  regression_failure_count: number;
  install_retention_rate: number;
  user_feedback_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  moderation_action: "warn" | "hide" | "suspend" | "rollback" | "reject";
  note: string;
  reviewed_at: string;
};

type EcosystemQualitySummary = {
  packages: EcosystemQualityReview[];
  healthy_count: number;
  needs_review_count: number;
  suspended_count: number;
  average_quality_score: number;
};

type EcosystemRiskEvent = {
  id: string;
  package_id: string;
  package_title: string;
  risk_level: "low" | "medium" | "high" | "critical";
  moderation_action: "warn" | "hide" | "suspend" | "rollback" | "reject";
  status: "open" | "resolved";
  detail: string;
  resolution?: string;
  created_at: string;
  resolved_at?: string;
};

type OpsSlo = {
  targets: {
    cast_p95_ms: number;
    first_ai_delta_p95_ms: number;
    ecosystem_catalog_p95_ms: number;
    submission_review_p95_ms: number;
  };
  current: {
    cast_p95_ms: number;
    first_ai_delta_p95_ms: number;
    ecosystem_catalog_p95_ms: number;
    submission_review_p95_ms: number;
  };
  open_incident_count: number;
};

type OpsIncident = {
  id: string;
  severity: "sev1" | "sev2" | "sev3" | "sev4";
  status: "open" | "investigating" | "mitigated" | "resolved";
  title: string;
  affected_surface: string;
  summary: string;
  mitigation?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
};

type CommercialReadiness = {
  mode: "simulated";
  overall_status: "ready" | "blocked";
  gates: Array<{
    gate: "entitlement" | "billing_sandbox" | "tax_profile" | "kyb_kyc" | "risk_control" | "support_process";
    status: "missing" | "draft" | "ready" | "blocked";
    evidence: string;
  }>;
  real_money_movement_enabled: boolean;
};

type CommercialBillingSimulation = {
  id: string;
  contributor_id: string;
  period: string;
  mode: "simulated";
  line_items: Array<{ source: string; amount_cents: number; note: string }>;
  total_amount_cents: number;
  real_money_movement: false;
  generated_at: string;
};

type RevenuePreview = {
  contributor_id: string;
  mode: "simulated";
  simulation_count: number;
  ledger_event_count: number;
  total_amount_cents: number;
  real_money_movement: false;
};

type PrivacySettings = {
  user_id: string;
  save_history: boolean;
  allow_personalization: boolean;
  allow_sensitive_review: boolean;
  retain_history_days: number;
  export_format: "json" | "csv";
  updated_at: string;
};

type PrivacyDataExport = {
  id: string;
  user_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  export_format: "json" | "csv";
  includes_raw_question_text: false;
  download_url: string;
  created_at: string;
  completed_at?: string;
};

type ComplianceReview = {
  id: string;
  review_type: "privacy_export" | "sensitive_content" | "commitment_scan" | "minor_protection";
  target_id: string;
  risk_level: "low" | "medium" | "high" | "critical";
  status: "open" | "resolved";
  summary: string;
  action?: "warn" | "hide" | "suspend" | "rollback" | "reject";
  resolution?: string;
  created_at: string;
  resolved_at?: string;
};

const scenarios = ["事业", "财务", "感情", "考试", "失物", "其他"] as const;
const lineOptions: Array<{ value: LineValue; label: string; hint: string }> = [
  { value: 6, label: "6 老阴", hint: "阴爻，动" },
  { value: 7, label: "7 少阳", hint: "阳爻，静" },
  { value: 8, label: "8 少阴", hint: "阴爻，静" },
  { value: 9, label: "9 老阳", hint: "阳爻，动" },
];
const explainModes: Array<{ value: ExplainMode; label: string }> = [
  { value: "professional", label: "专业版" },
  { value: "light", label: "轻松版" },
  { value: "learning", label: "学习版" },
  { value: "story", label: "剧情版" },
];
const followupPrompts: Array<{ type: FollowupType; label: string; message: string }> = [
  { type: "why_yongshen", label: "为什么取这个用神", message: "为什么取这个用神？" },
  { type: "key_rule", label: "哪条规则最重要", message: "哪条规则最重要？" },
  { type: "counter_evidence", label: "有没有反证", message: "有没有反证？" },
  { type: "timing", label: "应期如何看", message: "应期如何看？" },
  { type: "learning_mode", label: "学习模式解释", message: "换成学习模式解释。" },
];

export function ReadingWorkbench() {
  const [question, setQuestion] = useState("这次面试有没有机会");
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>("事业");
  const [castDate, setCastDate] = useState("");
  const [castMethod, setCastMethod] = useState<CastMethod>("coin");
  const [manualValues, setManualValues] = useState<LineValue[]>([7, 7, 7, 7, 7, 7]);
  const [coinValues, setCoinValues] = useState<LineValue[]>([]);
  const [safety, setSafety] = useState<SafetyStatus | null>(null);
  const [result, setResult] = useState<CastResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explainMode, setExplainMode] = useState<ExplainMode>("learning");
  const [aiOutput, setAiOutput] = useState<AiReadingOutput | null>(null);
  const [aiDeltas, setAiDeltas] = useState<AiDelta[]>([]);
  const [knowledgeCards, setKnowledgeCards] = useState<KnowledgeCard[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [followupText, setFollowupText] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [feedback, setFeedback] = useState<"helpful" | "off" | null>(null);
  const [learningTerms, setLearningTerms] = useState<LearningTerm[]>([]);
  const [learningExercises, setLearningExercises] = useState<LearningExercise[]>([]);
  const [selectedLearningCard, setSelectedLearningCard] = useState<LearningCardDetail | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgress | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);
  const [tagsText, setTagsText] = useState("复盘");
  const [isV1Loading, setIsV1Loading] = useState(false);
  const [v1Error, setV1Error] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [creatorExport, setCreatorExport] = useState<CreatorExportResult | null>(null);
  const [experimentAssignment, setExperimentAssignment] = useState<ExperimentAssignment | null>(null);
  const [isV15Loading, setIsV15Loading] = useState(false);
  const [v15Error, setV15Error] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceRecord | null>(null);
  const [appBootstrap, setAppBootstrap] = useState<AppBootstrap | null>(null);
  const [voiceJob, setVoiceJob] = useState<VoiceJob | null>(null);
  const [readingImport, setReadingImport] = useState<ReadingImportRecord | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [rulePacks, setRulePacks] = useState<RulePack[]>([]);
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [isV2Loading, setIsV2Loading] = useState(false);
  const [v2Error, setV2Error] = useState<string | null>(null);
  const [contributorDashboard, setContributorDashboard] = useState<ContributorDashboard | null>(null);
  const [contributorSubmissions, setContributorSubmissions] = useState<ContributorSubmission[]>([]);
  const [ecosystemPackages, setEcosystemPackages] = useState<EcosystemPackage[]>([]);
  const [ecosystemMetrics, setEcosystemMetrics] = useState<EcosystemMetrics | null>(null);
  const [latestInstall, setLatestInstall] = useState<PackageInstallRecord | null>(null);
  const [latestSettlement, setLatestSettlement] = useState<ContributorSettlement | null>(null);
  const [isV3Loading, setIsV3Loading] = useState(false);
  const [v3Error, setV3Error] = useState<string | null>(null);
  const [ecosystemQuality, setEcosystemQuality] = useState<EcosystemQualitySummary | null>(null);
  const [ecosystemRiskEvents, setEcosystemRiskEvents] = useState<EcosystemRiskEvent[]>([]);
  const [opsSlo, setOpsSlo] = useState<OpsSlo | null>(null);
  const [opsIncidents, setOpsIncidents] = useState<OpsIncident[]>([]);
  const [commercialReadiness, setCommercialReadiness] = useState<CommercialReadiness | null>(null);
  const [latestBilling, setLatestBilling] = useState<CommercialBillingSimulation | null>(null);
  const [revenuePreview, setRevenuePreview] = useState<RevenuePreview | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [latestPrivacyExport, setLatestPrivacyExport] = useState<PrivacyDataExport | null>(null);
  const [complianceReviews, setComplianceReviews] = useState<ComplianceReview[]>([]);
  const [isV35Loading, setIsV35Loading] = useState(false);
  const [v35Error, setV35Error] = useState<string | null>(null);

  const activeLineValues = castMethod === "coin" ? coinValues : manualValues;
  const canCast = question.trim().length >= 2 && activeLineValues.length === 6 && !isLoading;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshHistory();
      void refreshV1Data();
      void refreshV15Data();
      void refreshV2Data();
      void refreshV3Data();
      void refreshV35Data();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const linePreview = useMemo(() => {
    return activeLineValues.map((value, index) => ({
      lineNo: index + 1,
      value,
      label: lineOptions.find((option) => option.value === value)?.label ?? String(value),
    }));
  }, [activeLineValues]);

  function resetAiState() {
    setAiOutput(null);
    setAiDeltas([]);
    setKnowledgeCards([]);
    setAiError(null);
    setChatMessages([]);
    setFollowupText("");
    setFeedback(null);
    setShareResult(null);
    setCreatorExport(null);
  }

  function rollOneLine() {
    if (coinValues.length >= 6) return;
    const value = rollCoins();
    setCoinValues((current) => [...current, value]);
    setResult(null);
    setSafety(null);
    setError(null);
    resetAiState();
  }

  function resetCast() {
    setCoinValues([]);
    setManualValues([7, 7, 7, 7, 7, 7]);
    setResult(null);
    setAnalysis(null);
    setSafety(null);
    setError(null);
    setAnalysisError(null);
    resetAiState();
  }

  function updateManualLine(index: number, value: LineValue) {
    setManualValues((current) => current.map((line, lineIndex) => (lineIndex === index ? value : line)));
    setResult(null);
    setAnalysis(null);
    setError(null);
    resetAiState();
  }

  async function refreshHistory() {
    try {
      const response = await fetch("/api/readings/history", { method: "GET" });
      if (!response.ok) throw new Error("历史记录加载失败");
      const payload = (await response.json()) as { history: HistoryItem[] };
      setHistory(payload.history);
      window.localStorage.setItem("yiwen-liuyao-history", JSON.stringify(payload.history));
    } catch {
      const rawHistory = window.localStorage.getItem("yiwen-liuyao-history");
      if (!rawHistory) return;
      try {
        setHistory(JSON.parse(rawHistory) as HistoryItem[]);
      } catch {
        window.localStorage.removeItem("yiwen-liuyao-history");
      }
    }
  }

  async function submitReading() {
    if (!canCast) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setAnalysis(null);
    setAnalysisError(null);
    resetAiState();

    try {
      const initResponse = await fetch("/api/readings/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          scenario,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai",
        }),
      });

      if (!initResponse.ok) throw new Error("问题初始化失败");
      const initPayload = (await initResponse.json()) as {
        reading_id: string;
        safety_status: SafetyStatus;
      };
      setSafety(initPayload.safety_status);

      if (initPayload.safety_status.status === "blocked") {
        return;
      }

      const castResponse = await fetch("/api/readings/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: initPayload.reading_id,
          cast_method: castMethod,
          line_values: activeLineValues,
          cast_time: castDate || getTodayCivilDate(),
        }),
      });

      if (!castResponse.ok) throw new Error("排盘失败");
      const castPayload = (await castResponse.json()) as CastResult;
      setResult(castPayload);
      recordLocalHistory(toHistoryItem(castPayload, question, scenario));
      await refreshHistory();
      const analysisPayload = await requestAnalysis(initPayload.reading_id);
      if (analysisPayload) {
        await requestAiExplanation(initPayload.reading_id, explainMode);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "请求失败");
    } finally {
      setIsLoading(false);
    }
  }

  async function requestAnalysis(readingId: string, forceRefresh = false): Promise<AnalysisResult | null> {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/readings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: readingId,
          mode: "learning",
          force_refresh: forceRefresh,
        }),
      });
      if (!response.ok) throw new Error("规则分析失败");
      const payload = (await response.json()) as AnalysisResult;
      setAnalysis(payload);
      return payload;
    } catch (requestError) {
      setAnalysisError(requestError instanceof Error ? requestError.message : "规则分析失败");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function requestAiExplanation(readingId: string, mode: ExplainMode, forceRefresh = false) {
    setIsExplaining(true);
    setAiError(null);
    setAiDeltas([]);
    setAiOutput(null);
    setKnowledgeCards([]);
    setFeedback(null);
    try {
      const response = await fetch("/api/readings/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: readingId,
          mode,
          stream: true,
          force_refresh: forceRefresh,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "AI 解读失败"));
      await readSseEvents(response, handleAiStreamEvent);
    } catch (requestError) {
      setAiError(requestError instanceof Error ? requestError.message : "AI 解读失败");
    } finally {
      setIsExplaining(false);
    }
  }

  async function sendFollowup(type: FollowupType, message: string) {
    const content = message.trim();
    if (!result || content.length === 0 || isExplaining) return;
    const outgoing: ChatMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content,
    };
    setChatMessages((current) => [...current, outgoing]);
    setFollowupText("");
    setIsExplaining(true);
    setAiError(null);
    setAiDeltas([]);
    try {
      const response = await fetch("/api/readings/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result.reading_id,
          followup_type: type,
          message: content,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "追问失败"));
      let finalSummary = "";
      await readSseEvents(response, (event) => {
        handleAiStreamEvent(event);
        if (event.type === "final") {
          finalSummary = event.data.summary;
        }
      });
      if (finalSummary) {
        setChatMessages((current) => [
          ...current,
          {
            id: `local-assistant-${Date.now()}`,
            role: "assistant",
            content: finalSummary,
          },
        ]);
      }
    } catch (requestError) {
      setAiError(requestError instanceof Error ? requestError.message : "追问失败");
    } finally {
      setIsExplaining(false);
    }
  }

  function handleAiStreamEvent(event: AiStreamEvent) {
    if (event.type === "retrieval") {
      setKnowledgeCards(event.data.cards);
      return;
    }
    if (event.type === "delta") {
      setAiDeltas((current) => [...current, event.data]);
      return;
    }
    if (event.type === "final") {
      setAiOutput(event.data);
      return;
    }
    if (event.type === "error") {
      setAiError(event.data.error);
    }
  }

  async function refreshV1Data() {
    setIsV1Loading(true);
    setV1Error(null);
    try {
      const [termsResponse, exercisesResponse, progressResponse, metricsResponse] = await Promise.all([
        fetch("/api/learning/terms?limit=6", { method: "GET" }),
        fetch("/api/learning/exercises?limit=4", { method: "GET" }),
        fetch("/api/me/progress", { method: "GET" }),
        fetch("/api/admin/metrics", { method: "GET" }),
      ]);
      if (!termsResponse.ok || !exercisesResponse.ok || !progressResponse.ok || !metricsResponse.ok) {
        throw new Error("V1.0 数据加载失败");
      }
      const termsPayload = (await termsResponse.json()) as { terms: LearningTerm[] };
      const exercisesPayload = (await exercisesResponse.json()) as { exercises: LearningExercise[] };
      setLearningTerms(termsPayload.terms);
      setLearningExercises(exercisesPayload.exercises);
      setMemberProgress((await progressResponse.json()) as MemberProgress);
      setAdminMetrics((await metricsResponse.json()) as AdminMetrics);
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "V1.0 数据加载失败");
    } finally {
      setIsV1Loading(false);
    }
  }

  async function refreshV15Data() {
    setIsV15Loading(true);
    setV15Error(null);
    try {
      const anonymousId = getAnonymousId();
      const [casesResponse, coursesResponse, progressResponse, assignmentResponse] = await Promise.all([
        fetch("/api/cases?limit=6", { method: "GET" }),
        fetch("/api/courses", { method: "GET" }),
        fetch("/api/me/course-progress", { method: "GET" }),
        fetch(`/api/experiments/assignments?anonymous_id=${encodeURIComponent(anonymousId)}&surface=home`, { method: "GET" }),
      ]);
      if (!casesResponse.ok || !coursesResponse.ok || !progressResponse.ok || !assignmentResponse.ok) {
        throw new Error("V1.5 数据加载失败");
      }
      const casesPayload = (await casesResponse.json()) as { cases: CaseSummary[] };
      const coursesPayload = (await coursesResponse.json()) as { courses: CourseSummary[] };
      const assignmentPayload = (await assignmentResponse.json()) as { assignment: ExperimentAssignment };
      setCases(casesPayload.cases);
      setCourses(coursesPayload.courses);
      setCourseProgress((await progressResponse.json()) as CourseProgressSummary);
      setExperimentAssignment(assignmentPayload.assignment);
    } catch (requestError) {
      setV15Error(requestError instanceof Error ? requestError.message : "V1.5 数据加载失败");
    } finally {
      setIsV15Loading(false);
    }
  }

  async function refreshV2Data() {
    setIsV2Loading(true);
    setV2Error(null);
    try {
      const anonymousId = getAnonymousId();
      const [bootstrapResponse, postsResponse, packsResponse, queueResponse, metricsResponse] = await Promise.all([
        fetch(`/api/app/bootstrap?platform=web&anonymous_id=${encodeURIComponent(anonymousId)}`, { method: "GET" }),
        fetch("/api/community/posts", { method: "GET" }),
        fetch("/api/rule-packs", { method: "GET" }),
        fetch("/api/admin/review-queue", { method: "GET" }),
        fetch("/api/admin/metrics", { method: "GET" }),
      ]);
      if (!bootstrapResponse.ok || !postsResponse.ok || !packsResponse.ok || !queueResponse.ok || !metricsResponse.ok) {
        throw new Error("V2.0 data load failed");
      }
      const postsPayload = (await postsResponse.json()) as { posts: CommunityPost[] };
      const packsPayload = (await packsResponse.json()) as { rule_packs: RulePack[] };
      const queuePayload = (await queueResponse.json()) as { review_queue: ReviewQueueItem[] };
      setAppBootstrap((await bootstrapResponse.json()) as AppBootstrap);
      setCommunityPosts(postsPayload.posts);
      setRulePacks(packsPayload.rule_packs);
      setReviewQueue(queuePayload.review_queue);
      setAdminMetrics((await metricsResponse.json()) as AdminMetrics);
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "V2.0 数据加载失败");
    } finally {
      setIsV2Loading(false);
    }
  }

  async function registerV2Device() {
    setV2Error(null);
    try {
      const response = await fetch("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: getAnonymousId(),
          platform: "web",
          app_version: "2.0.0",
          locale: navigator.language || "zh-CN",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "设备注册失败"));
      const payload = (await response.json()) as { device: DeviceRecord };
      setDevice(payload.device);
      await fetch("/api/devices/push-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: payload.device.device_id,
          enabled: false,
          learning_reminders: true,
          community_notifications: true,
        }),
      });
      await refreshV2Data();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "设备注册失败");
    }
  }

  async function transcribeV2Voice() {
    setV2Error(null);
    try {
      const response = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio_text: question.trim() || "请用学习模式解释这个卦例",
          platform: "web",
          save_audio: false,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "语音转写失败"));
      const payload = (await response.json()) as { job: VoiceJob };
      setVoiceJob(payload.job);
      await refreshV2Data();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "语音转写失败");
    }
  }

  async function explainV2Voice() {
    if (!result) return;
    setV2Error(null);
    try {
      const response = await fetch("/api/voice/readings/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result.reading_id,
          mode: explainMode,
          voice: "teacher",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "语音播报任务失败"));
      const payload = (await response.json()) as { job: VoiceJob };
      setVoiceJob(payload.job);
      await refreshV2Data();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "语音播报任务失败");
    }
  }

  async function importV2Reading() {
    setV2Error(null);
    try {
      const fallbackLines: LineValue[] = [7, 8, 7, 9, 8, 7];
      const response = await fetch("/api/readings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: "structured_json",
          payload: {
            question: question.trim() || "导入卦例复盘",
            scenario,
            line_values: activeLineValues.length === 6 ? activeLineValues : fallbackLines,
            cast_time: result?.cast_time ?? getTodayCivilDate(),
            day_ganzhi: result?.day_ganzhi,
            month_branch: result?.month_branch,
          },
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "导入排盘失败"));
      const payload = (await response.json()) as { import_record: ReadingImportRecord };
      setReadingImport(payload.import_record);
      await refreshV2Data();
      await refreshHistory();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "导入排盘失败");
    }
  }

  async function createV2CommunityPost() {
    setV2Error(null);
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_type: result ? "case_discussion" : "course_checkin",
          title: result ? `${result.base_chart.name} 学习复盘` : "V2.0 共学打卡",
          body: "只讨论脱敏排盘、证据树和学习心得，不展示原始问题或私密追问。",
          reading_id: result?.reading_id,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "社区帖子创建失败"));
      const payload = (await response.json()) as { post: CommunityPost };
      await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "community_post",
          target_id: payload.post.id,
          review_type: "compliance",
          decision: "approved",
          note: "脱敏与合规审核通过。",
        }),
      });
      await fetch("/api/community/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: payload.post.id,
          body: "从规则依据出发做学习讨论。",
        }),
      });
      await refreshV2Data();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "社区帖子创建失败");
    }
  }

  async function publishV2RulePack() {
    setV2Error(null);
    try {
      const response = await fetch("/api/admin/rule-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "rule-pack-v2-ui-lab",
          name: "V2.0 UI 学习权重包",
          scope: "style",
          status: "testing",
          rule_ids: ["B-YS-001", "B-WR-001"],
          weight_profile: { "B-YS-001": 1, "B-WR-001": 0.8 },
          validation_case_ids: ["case_seed_1", "case_seed_2"],
          source_refs: ["V2.0 验收样例"],
          regression_passed: false,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "规则包创建失败"));
      const payload = (await response.json()) as { rule_pack: RulePack };
      await Promise.all([
        fetch("/api/admin/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_type: "rule_pack",
            target_id: payload.rule_pack.id,
            review_type: "professional",
            decision: "approved",
            note: "专业审核通过。",
          }),
        }),
        fetch("/api/admin/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_type: "rule_pack",
            target_id: payload.rule_pack.id,
            review_type: "compliance",
            decision: "approved",
            note: "合规审核通过。",
          }),
        }),
      ]);
      await fetch(`/api/admin/rule-packs/${encodeURIComponent(payload.rule_pack.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          regression_passed: true,
        }),
      });
      await refreshV2Data();
    } catch (requestError) {
      setV2Error(requestError instanceof Error ? requestError.message : "规则包发布失败");
    }
  }

  async function refreshV3Data() {
    setIsV3Loading(true);
    setV3Error(null);
    try {
      const [dashboardResponse, submissionsResponse, packagesResponse, metricsResponse] = await Promise.all([
        fetch("/api/me/contributor-dashboard", { method: "GET" }),
        fetch("/api/contributor/submissions", { method: "GET" }),
        fetch("/api/ecosystem/packages", { method: "GET" }),
        fetch("/api/admin/ecosystem/metrics", { method: "GET" }),
      ]);
      if (!dashboardResponse.ok || !submissionsResponse.ok || !packagesResponse.ok || !metricsResponse.ok) {
        throw new Error("V3.0 ecosystem data load failed");
      }
      const submissionsPayload = (await submissionsResponse.json()) as { submissions: ContributorSubmission[] };
      const packagesPayload = (await packagesResponse.json()) as { packages: EcosystemPackage[] };
      setContributorDashboard((await dashboardResponse.json()) as ContributorDashboard);
      setContributorSubmissions(submissionsPayload.submissions);
      setEcosystemPackages(packagesPayload.packages);
      setEcosystemMetrics((await metricsResponse.json()) as EcosystemMetrics);
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 数据加载失败");
    } finally {
      setIsV3Loading(false);
    }
  }

  async function createV3Submission() {
    setV3Error(null);
    try {
      const response = await fetch("/api/contributor/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_type: "rule_pack",
          title: "V3.0 Controlled Ecosystem Rule Pack",
          payload: {
            id: "rule-pack-v3-ui-lab",
            name: "V3.0 Controlled Ecosystem Rule Pack",
            scope: "style",
            status: "testing",
            rule_ids: ["B-YS-001", "B-WR-001", "B-DV-001"],
            weight_profile: { "B-YS-001": 1, "B-WR-001": 0.85, "B-DV-001": 0.72 },
            validation_case_ids: ["case-001", "case-002", "case-003"],
            source_refs: ["V3.0 acceptance sample"],
            regression_passed: false,
          },
          source_refs: ["V3.0 acceptance sample"],
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.0 submission create failed"));
      await refreshV3Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 提交草稿失败");
    }
  }

  async function approveAndPublishV3Submission() {
    setV3Error(null);
    try {
      let submission =
        contributorSubmissions.find((item) => item.target_id === "rule-pack-v3-ui-lab" && item.status !== "published") ??
        contributorSubmissions.find((item) => ["draft", "changes_requested", "in_review", "approved"].includes(item.status));
      if (!submission) {
        await createV3Submission();
        const response = await fetch("/api/contributor/submissions", { method: "GET" });
        if (!response.ok) throw new Error(await readApiError(response, "V3.0 submission load failed"));
        const payload = (await response.json()) as { submissions: ContributorSubmission[] };
        submission = payload.submissions.find((item) => item.target_id === "rule-pack-v3-ui-lab");
      }
      if (!submission?.target_id) throw new Error("No V3.0 rule pack submission is ready");

      if (submission.status === "draft" || submission.status === "changes_requested") {
        const submitResponse = await fetch(`/api/contributor/submissions/${encodeURIComponent(submission.id)}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm_controlled_opening: true }),
        });
        if (!submitResponse.ok) throw new Error(await readApiError(submitResponse, "V3.0 submission submit failed"));
      }

      for (const review_gate of ["professional", "compliance", "safety"] as const) {
        const reviewResponse = await fetch(`/api/admin/submissions/${encodeURIComponent(submission.id)}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            review_gate,
            decision: "approved",
            note: `${review_gate} gate approved for controlled opening`,
          }),
        });
        if (!reviewResponse.ok) throw new Error(await readApiError(reviewResponse, "V3.0 review gate failed"));
      }

      const regressionResponse = await fetch(`/api/admin/rule-packs/${encodeURIComponent(submission.target_id)}/regression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (!regressionResponse.ok) throw new Error(await readApiError(regressionResponse, "V3.0 regression failed"));

      const publishResponse = await fetch(`/api/admin/rule-packs/${encodeURIComponent(submission.target_id)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release_note: "V3.0 controlled opening preview release" }),
      });
      if (!publishResponse.ok) throw new Error(await readApiError(publishResponse, "V3.0 package publish failed"));
      await refreshV3Data();
      await refreshV2Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 审核发布失败");
    }
  }

  async function installV3Package() {
    setV3Error(null);
    try {
      const targetPackage = ecosystemPackages[0];
      if (!targetPackage) throw new Error("No published ecosystem package is available");
      const response = await fetch("/api/ecosystem/packages/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: targetPackage.id }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.0 package install failed"));
      const payload = (await response.json()) as { install: PackageInstallRecord };
      setLatestInstall(payload.install);
      await refreshV3Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 内容包安装失败");
    }
  }

  async function disableV3Package() {
    setV3Error(null);
    try {
      const packageId = latestInstall?.package_id ?? ecosystemPackages[0]?.id;
      if (!packageId) throw new Error("No installed ecosystem package is available");
      const response = await fetch("/api/ecosystem/packages/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package_id: packageId }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.0 package disable failed"));
      const payload = (await response.json()) as { install: PackageInstallRecord };
      setLatestInstall(payload.install);
      await refreshV3Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 内容包禁用失败");
    }
  }

  async function simulateV3Settlement() {
    setV3Error(null);
    try {
      const response = await fetch("/api/contributor/settlements/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributor_id: "contributor_demo",
          period: getCurrentSettlementPeriod(),
          mode: "simulated",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.0 settlement simulation failed"));
      const payload = (await response.json()) as { settlement: ContributorSettlement };
      setLatestSettlement(payload.settlement);
      await refreshV3Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 模拟结算失败");
    }
  }

  async function suspendV3Package() {
    setV3Error(null);
    try {
      const targetPackage = ecosystemPackages[0];
      if (!targetPackage) throw new Error("No published ecosystem package is available");
      const response = await fetch(`/api/admin/ecosystem/packages/${encodeURIComponent(targetPackage.id)}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "V3.0 controlled rollback drill" }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.0 package suspend failed"));
      await refreshV3Data();
    } catch (requestError) {
      setV3Error(requestError instanceof Error ? requestError.message : "V3.0 内容包下架演练失败");
    }
  }

  async function refreshV35Data() {
    setIsV35Loading(true);
    setV35Error(null);
    try {
      const [
        qualityResponse,
        riskResponse,
        sloResponse,
        incidentsResponse,
        readinessResponse,
        revenueResponse,
        privacyResponse,
        complianceResponse,
        metricsResponse,
      ] = await Promise.all([
        fetch("/api/admin/ecosystem/quality", { method: "GET" }),
        fetch("/api/admin/ecosystem/risk-events", { method: "GET" }),
        fetch("/api/admin/ops/slo", { method: "GET" }),
        fetch("/api/admin/ops/incidents", { method: "GET" }),
        fetch("/api/admin/commercial/readiness", { method: "GET" }),
        fetch("/api/contributor/revenue-preview", { method: "GET" }),
        fetch("/api/me/privacy-settings", { method: "GET" }),
        fetch("/api/admin/compliance/reviews", { method: "GET" }),
        fetch("/api/admin/ecosystem/metrics", { method: "GET" }),
      ]);
      if (
        !qualityResponse.ok ||
        !riskResponse.ok ||
        !sloResponse.ok ||
        !incidentsResponse.ok ||
        !readinessResponse.ok ||
        !revenueResponse.ok ||
        !privacyResponse.ok ||
        !complianceResponse.ok ||
        !metricsResponse.ok
      ) {
        throw new Error("V3.5 operations data load failed");
      }
      const riskPayload = (await riskResponse.json()) as { risk_events: EcosystemRiskEvent[] };
      const incidentsPayload = (await incidentsResponse.json()) as { incidents: OpsIncident[] };
      const compliancePayload = (await complianceResponse.json()) as { reviews: ComplianceReview[] };
      setEcosystemQuality((await qualityResponse.json()) as EcosystemQualitySummary);
      setEcosystemRiskEvents(riskPayload.risk_events);
      setOpsSlo((await sloResponse.json()) as OpsSlo);
      setOpsIncidents(incidentsPayload.incidents);
      setCommercialReadiness((await readinessResponse.json()) as CommercialReadiness);
      setRevenuePreview((await revenueResponse.json()) as RevenuePreview);
      setPrivacySettings((await privacyResponse.json()) as PrivacySettings);
      setComplianceReviews(compliancePayload.reviews);
      setEcosystemMetrics((await metricsResponse.json()) as EcosystemMetrics);
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 数据加载失败");
    } finally {
      setIsV35Loading(false);
    }
  }

  async function reviewV35PackageQuality() {
    setV35Error(null);
    try {
      const packageId = ecosystemQuality?.packages[0]?.package_id ?? ecosystemPackages[0]?.id;
      if (!packageId) throw new Error("No ecosystem package is available for quality review");
      const response = await fetch(`/api/admin/ecosystem/packages/${encodeURIComponent(packageId)}/quality-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "needs_review",
          quality_score: 58,
          safety_score: 86,
          complaint_count: 3,
          regression_failure_count: 1,
          install_retention_rate: 0.42,
          user_feedback_score: 3.4,
          risk_level: "high",
          moderation_action: "hide",
          note: "Ops review found elevated complaint and regression signals. Hide until reviewed.",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 quality review failed"));
      await refreshV3Data();
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 质量复审失败");
    }
  }

  async function resolveV35RiskEvent() {
    setV35Error(null);
    try {
      const target = ecosystemRiskEvents.find((event) => event.status === "open");
      if (!target) throw new Error("No open ecosystem risk event is available");
      const response = await fetch(`/api/admin/ecosystem/risk-events/${encodeURIComponent(target.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: "Reviewed by operations. Package remains hidden until updated content passes review.",
          action: target.moderation_action,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 risk event resolve failed"));
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 风险事件处理失败");
    }
  }

  async function createV35Incident() {
    setV35Error(null);
    try {
      const response = await fetch("/api/admin/ops/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Ecosystem quality review drill",
          severity: "sev3",
          affected_surface: "ecosystem_catalog",
          summary: "Catalog quality review and rollback drill for V3.5 operations readiness.",
          status: "investigating",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 incident create failed"));
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 事故记录创建失败");
    }
  }

  async function resolveV35Incident() {
    setV35Error(null);
    try {
      const target = opsIncidents.find((incident) => incident.status !== "resolved");
      if (!target) throw new Error("No open V3.5 incident is available");
      const response = await fetch(`/api/admin/ops/incidents/${encodeURIComponent(target.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          mitigation: "Quality review queue checked, public catalog filters verified, and rollback drill recorded.",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 incident resolve failed"));
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 事故处理失败");
    }
  }

  async function simulateV35Billing() {
    setV35Error(null);
    try {
      const response = await fetch("/api/admin/commercial/simulate-billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contributor_id: "contributor_demo",
          period: getCurrentSettlementPeriod(),
          mode: "simulated",
          include_entitlements: true,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 billing simulation failed"));
      const payload = (await response.json()) as { billing: CommercialBillingSimulation };
      setLatestBilling(payload.billing);
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 商业化沙盒失败");
    }
  }

  async function updateV35Privacy() {
    setV35Error(null);
    try {
      const response = await fetch("/api/me/privacy-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          save_history: false,
          allow_personalization: false,
          allow_sensitive_review: true,
          retain_history_days: 30,
          export_format: "json",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 privacy settings update failed"));
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 隐私设置更新失败");
    }
  }

  async function requestV35DataExport() {
    setV35Error(null);
    try {
      const response = await fetch("/api/me/data-export", { method: "POST" });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 privacy data export failed"));
      const payload = (await response.json()) as { export_job: PrivacyDataExport };
      setLatestPrivacyExport(payload.export_job);
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 数据导出失败");
    }
  }

  async function resolveV35ComplianceReview() {
    setV35Error(null);
    try {
      const target = complianceReviews.find((review) => review.status === "open");
      if (!target) throw new Error("No open compliance review is available");
      const response = await fetch(`/api/admin/compliance/reviews/${encodeURIComponent(target.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolution: "Reviewed for privacy, minor protection, and commitment wording. No raw question text exposed.",
          action: "warn",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "V3.5 compliance review resolve failed"));
      await refreshV35Data();
    } catch (requestError) {
      setV35Error(requestError instanceof Error ? requestError.message : "V3.5 合规复审处理失败");
    }
  }

  async function openLearningCard(cardId: string) {
    setV1Error(null);
    try {
      const response = await fetch(`/api/learning/cards/${encodeURIComponent(cardId)}`, { method: "GET" });
      if (!response.ok) throw new Error("知识卡加载失败");
      const payload = (await response.json()) as { card: LearningCardDetail };
      setSelectedLearningCard(payload.card);
      await saveLearningProgress(cardId, "knowledge_card");
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "知识卡加载失败");
    }
  }

  async function saveLearningProgress(subjectId: string, subjectType: "term" | "knowledge_card" | "exercise") {
    await fetch("/api/learning/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_id: subjectId,
        subject_type: subjectType,
        completed: true,
        score: subjectType === "exercise" ? 100 : undefined,
        badge: subjectType === "exercise" ? "闯关练习" : "知识卡学习",
      }),
    });
    await refreshV1Data();
  }

  async function createShareCard() {
    if (!result) return;
    setV1Error(null);
    try {
      const response = await fetch("/api/readings/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result.reading_id,
          visibility: "public_anonymous",
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "分享卡生成失败"));
      setShareResult((await response.json()) as ShareResult);
      await refreshV1Data();
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "分享卡生成失败");
    }
  }

  async function favoriteCurrentReading() {
    if (!result) return;
    setV1Error(null);
    try {
      const response = await fetch("/api/readings/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result.reading_id,
          favorite: true,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "收藏失败"));
      await refreshV1Data();
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "收藏失败");
    }
  }

  async function updateCurrentTags() {
    if (!result) return;
    setV1Error(null);
    try {
      const response = await fetch("/api/readings/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result.reading_id,
          tags: tagsText.split(/[，,\s]+/).filter(Boolean),
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "标签保存失败"));
      await refreshV1Data();
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "标签保存失败");
    }
  }

  async function submitCurrentFeedback(value: "helpful" | "off") {
    setFeedback(value);
    if (!result) return;
    await fetch("/api/readings/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reading_id: result.reading_id,
        feedback_type: value === "helpful" ? "helpful" : "inaccurate",
      }),
    });
    await refreshV1Data();
  }

  async function openCase(caseId: string) {
    setV15Error(null);
    try {
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_id: getAnonymousId(),
          event_name: "case_opened",
          surface: "learning",
          entity_id: caseId,
          variant: experimentAssignment?.variant ?? "control",
        }),
      });
      await refreshV15Data();
      await refreshV1Data();
    } catch (requestError) {
      setV15Error(requestError instanceof Error ? requestError.message : "案例事件记录失败");
    }
  }

  async function startCourse(course: CourseSummary) {
    const firstLesson = course.lessons[0];
    if (!firstLesson) return;
    setV15Error(null);
    try {
      const response = await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: course.id,
          lesson_id: firstLesson.id,
          completed: true,
          score: firstLesson.lesson_type === "quiz" ? 100 : undefined,
          wrong_question_ids: [],
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "课程进度保存失败"));
      await refreshV15Data();
      await refreshV1Data();
    } catch (requestError) {
      setV15Error(requestError instanceof Error ? requestError.message : "课程进度保存失败");
    }
  }

  async function createCreatorMaterial(exportType: CreatorExportResult["export_type"]) {
    setV15Error(null);
    setCreatorExport(null);
    try {
      const fallbackCase = cases[0];
      const response = await fetch("/api/creator/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reading_id: result?.reading_id,
          case_id: result ? fallbackCase?.id : fallbackCase?.id,
          export_type: exportType,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "创作者素材生成失败"));
      const payload = (await response.json()) as { export: CreatorExportResult };
      setCreatorExport(payload.export);
      await refreshV15Data();
      await refreshV1Data();
    } catch (requestError) {
      setV15Error(requestError instanceof Error ? requestError.message : "创作者素材生成失败");
    }
  }

  function recordLocalHistory(item: HistoryItem) {
    setHistory((current) => {
      const next = [item, ...current].slice(0, 8);
      window.localStorage.setItem("yiwen-liuyao-history", JSON.stringify(next));
      return next;
    });
  }

  async function deleteHistoryItem(readingId: string) {
    try {
      await fetch(`/api/readings/history/${encodeURIComponent(readingId)}`, { method: "DELETE" });
    } finally {
      setHistory((current) => {
        const next = current.filter((item) => item.reading_id !== readingId);
        window.localStorage.setItem("yiwen-liuyao-history", JSON.stringify(next));
        return next;
      });
      setSelectedHistory((current) => (current?.reading_id === readingId ? null : current));
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fffaf0_0,#f7f4ec_34%,#e8f0e7_100%)] text-[#171814]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[#2f3b2f]/15 pb-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-lg border border-[#9a6a2f]/35 bg-[#fff9e8] shadow-sm">
              <Image src="/bronze-coin.svg" width={44} height={44} alt="铜钱起卦图标" priority />
            </div>
            <div>
              <p className="text-sm font-medium text-[#7a2f24]">Web / H5 V2.0 社区与治理</p>
              <h1 className="text-2xl font-semibold tracking-normal text-[#171814] sm:text-3xl">易问六爻</h1>
            </div>
          </div>
          <div className="flex max-w-xl items-start gap-2 rounded-md border border-[#2f6b4f]/20 bg-white/70 p-3 text-sm leading-6 text-[#314239]">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2f6b4f]" aria-hidden="true" />
            <p>本工具用于传统文化学习与娱乐互动。医疗、法律、投资、自伤、改运消灾等高风险问题会被提示或拒答。</p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <section className="rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PenLine className="h-5 w-5 text-[#7a2f24]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">问题与起卦</h2>
            </div>

            <label className="block text-sm font-medium text-[#314239]" htmlFor="question">
              你的问题
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-md border border-[#2f3b2f]/20 bg-[#fffdf7] p-3 text-base leading-6 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
              maxLength={200}
            />

            <label className="mt-4 block text-sm font-medium text-[#314239]" htmlFor="scenario">
              场景
            </label>
            <select
              id="scenario"
              value={scenario}
              onChange={(event) => setScenario(event.target.value as (typeof scenarios)[number])}
              className="mt-2 h-11 w-full rounded-md border border-[#2f3b2f]/20 bg-[#fffdf7] px-3 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
            >
              {scenarios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-medium text-[#314239]" htmlFor="cast-date">
              起卦日期
            </label>
            <input
              id="cast-date"
              type="date"
              value={castDate}
              onChange={(event) => setCastDate(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-[#2f3b2f]/20 bg-[#fffdf7] px-3 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
            />

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#edf3ea] p-1">
              <button
                type="button"
                onClick={() => setCastMethod("coin")}
                className={`flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  castMethod === "coin" ? "bg-white text-[#7a2f24] shadow-sm" : "text-[#314239] hover:bg-white/65"
                }`}
              >
                <Coins className="h-4 w-4" aria-hidden="true" />
                铜钱摇卦
              </button>
              <button
                type="button"
                onClick={() => setCastMethod("manual")}
                className={`flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  castMethod === "manual" ? "bg-white text-[#7a2f24] shadow-sm" : "text-[#314239] hover:bg-white/65"
                }`}
              >
                <PenLine className="h-4 w-4" aria-hidden="true" />
                手动输入
              </button>
            </div>

            {castMethod === "coin" ? (
              <div className="mt-4 rounded-lg border border-[#9a6a2f]/20 bg-[#fff9e8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c1d]">从初爻到上爻</p>
                    <p className="text-sm text-[#6a675c]">已生成 {coinValues.length} / 6 爻</p>
                  </div>
                  <button
                    type="button"
                    onClick={rollOneLine}
                    disabled={coinValues.length >= 6}
                    className="flex h-10 items-center gap-2 rounded-md bg-[#8f3b2f] px-4 text-sm font-semibold text-white transition hover:bg-[#752f26] disabled:cursor-not-allowed disabled:bg-[#c9b8a4]"
                  >
                    <Coins className="h-4 w-4" aria-hidden="true" />
                    摇一爻
                  </button>
                </div>
                <LinePreview lines={linePreview} />
              </div>
            ) : (
              <div className="mt-4 grid gap-2">
                {manualValues.map((value, index) => (
                  <label
                    key={`manual-${index + 1}`}
                    className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-2 text-sm"
                  >
                    <span className="font-medium text-[#314239]">{index + 1} 爻</span>
                    <select
                      value={value}
                      onChange={(event) => updateManualLine(index, Number(event.target.value) as LineValue)}
                      className="h-10 rounded-md border border-[#2f3b2f]/20 bg-white px-3 outline-none focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
                    >
                      {lineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.hint}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={submitReading}
                disabled={!canCast}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-[#245f46] px-4 font-semibold text-white transition hover:bg-[#1c4c38] disabled:cursor-not-allowed disabled:bg-[#9cad9f]"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {isLoading ? "排盘中" : "开始排盘"}
              </button>
              <button
                type="button"
                onClick={resetCast}
                className="flex h-11 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-4 font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                重置
              </button>
            </div>

            {error ? <p className="mt-3 rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}
          </section>

          <section className="rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm" aria-live="polite">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#245f46]" aria-hidden="true" />
                <h2 className="text-lg font-semibold">基础卦盘</h2>
              </div>
              {result ? (
                <span className="rounded-md bg-[#edf3ea] px-2.5 py-1 text-sm font-medium text-[#245f46]">
                  {result.base_chart.name}
                </span>
              ) : null}
            </div>

            {safety?.status === "blocked" ? (
              <div className="rounded-lg border border-[#8f3b2f]/25 bg-[#fff0ec] p-4 text-[#752f26]">
                <p className="font-semibold">高风险问题已拦截</p>
                <p className="mt-2 text-sm leading-6">{safety.notice}</p>
              </div>
            ) : null}

            {result ? (
              <ResultPanel
                result={result}
                safety={safety}
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                analysisError={analysisError}
                onRefreshAnalysis={() => void requestAnalysis(result.reading_id, true)}
                explainMode={explainMode}
                onExplainModeChange={(mode) => {
                  setExplainMode(mode);
                  void requestAiExplanation(result.reading_id, mode, true);
                }}
                aiOutput={aiOutput}
                aiDeltas={aiDeltas}
                knowledgeCards={knowledgeCards}
                aiError={aiError}
                isExplaining={isExplaining}
                onRefreshAi={() => void requestAiExplanation(result.reading_id, explainMode, true)}
                followupText={followupText}
                onFollowupTextChange={setFollowupText}
                onSendFollowup={(type, message) => void sendFollowup(type, message)}
                chatMessages={chatMessages}
                feedback={feedback}
                onFeedback={(value) => void submitCurrentFeedback(value)}
                onOpenKnowledgeCard={(cardId) => void openLearningCard(cardId)}
              />
            ) : safety?.status !== "blocked" ? (
              <EmptyResult linePreview={linePreview} castMethod={castMethod} />
            ) : null}
          </section>
        </div>

        <V1PublicTestPanel
          result={result}
          terms={learningTerms}
          exercises={learningExercises}
          selectedCard={selectedLearningCard}
          memberProgress={memberProgress}
          adminMetrics={adminMetrics}
          shareResult={shareResult}
          tagsText={tagsText}
          isLoading={isV1Loading}
          error={v1Error}
          onTagsTextChange={setTagsText}
          onOpenLearningCard={(cardId) => void openLearningCard(cardId)}
          onSaveExercise={(exerciseId) => void saveLearningProgress(exerciseId, "exercise")}
          onCreateShare={() => void createShareCard()}
          onFavorite={() => void favoriteCurrentReading()}
          onUpdateTags={() => void updateCurrentTags()}
          onRefresh={() => void refreshV1Data()}
        />

        <V15GrowthPanel
          result={result}
          cases={cases}
          courses={courses}
          courseProgress={courseProgress}
          creatorExport={creatorExport}
          experimentAssignment={experimentAssignment}
          adminMetrics={adminMetrics}
          isLoading={isV15Loading}
          error={v15Error}
          onOpenCase={(caseId) => void openCase(caseId)}
          onStartCourse={(course) => void startCourse(course)}
          onCreateCreatorMaterial={(exportType) => void createCreatorMaterial(exportType)}
          onRefresh={() => void refreshV15Data()}
        />

        <V2ExpansionPanel
          result={result}
          appBootstrap={appBootstrap}
          device={device}
          voiceJob={voiceJob}
          readingImport={readingImport}
          communityPosts={communityPosts}
          rulePacks={rulePacks}
          reviewQueue={reviewQueue}
          adminMetrics={adminMetrics}
          isLoading={isV2Loading}
          error={v2Error}
          onRegisterDevice={() => void registerV2Device()}
          onTranscribeVoice={() => void transcribeV2Voice()}
          onExplainVoice={() => void explainV2Voice()}
          onImportReading={() => void importV2Reading()}
          onCreatePost={() => void createV2CommunityPost()}
          onPublishRulePack={() => void publishV2RulePack()}
          onRefresh={() => void refreshV2Data()}
        />

        <V3EcosystemPanel
          dashboard={contributorDashboard}
          submissions={contributorSubmissions}
          packages={ecosystemPackages}
          metrics={ecosystemMetrics}
          latestInstall={latestInstall}
          latestSettlement={latestSettlement}
          isLoading={isV3Loading}
          error={v3Error}
          onCreateSubmission={() => void createV3Submission()}
          onApproveAndPublish={() => void approveAndPublishV3Submission()}
          onInstallPackage={() => void installV3Package()}
          onDisablePackage={() => void disableV3Package()}
          onSimulateSettlement={() => void simulateV3Settlement()}
          onSuspendPackage={() => void suspendV3Package()}
          onRefresh={() => void refreshV3Data()}
        />

        <V35OperationsPanel
          quality={ecosystemQuality}
          riskEvents={ecosystemRiskEvents}
          opsSlo={opsSlo}
          incidents={opsIncidents}
          commercialReadiness={commercialReadiness}
          latestBilling={latestBilling}
          revenuePreview={revenuePreview}
          privacySettings={privacySettings}
          latestPrivacyExport={latestPrivacyExport}
          complianceReviews={complianceReviews}
          metrics={ecosystemMetrics}
          isLoading={isV35Loading}
          error={v35Error}
          onReviewQuality={() => void reviewV35PackageQuality()}
          onResolveRiskEvent={() => void resolveV35RiskEvent()}
          onCreateIncident={() => void createV35Incident()}
          onResolveIncident={() => void resolveV35Incident()}
          onSimulateBilling={() => void simulateV35Billing()}
          onUpdatePrivacy={() => void updateV35Privacy()}
          onRequestDataExport={() => void requestV35DataExport()}
          onResolveComplianceReview={() => void resolveV35ComplianceReview()}
          onRefresh={() => void refreshV35Data()}
        />

        <section className="rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#7a2f24]" aria-hidden="true" />
              <h2 className="text-lg font-semibold">历史记录</h2>
            </div>
            <button
              type="button"
              onClick={() => void refreshHistory()}
              className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              刷新
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-[#6a675c]">完成一次排盘后会在服务端会话和本机浏览器保存最近 8 条脱敏记录。</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {history.map((item) => (
                <article key={item.reading_id} className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
                  <p className="line-clamp-2 min-h-11 text-sm font-medium leading-5">{item.question_preview}</p>
                  <p className="mt-2 text-sm text-[#6a675c]">
                    {item.scenario} · {item.base_chart}
                    {item.changed_chart !== item.base_chart ? ` 变 ${item.changed_chart}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-[#6a675c]">
                    {item.day_ganzhi}日{item.month_branch ? ` · ${item.month_branch}月建` : ""} · {item.cast_time}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedHistory(item)}
                      className="h-8 flex-1 rounded-md bg-[#edf3ea] px-2 text-sm font-medium text-[#245f46] transition hover:bg-[#dfeadd]"
                    >
                      查看
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteHistoryItem(item.reading_id)}
                      className="grid h-8 w-9 place-items-center rounded-md border border-[#8f3b2f]/20 bg-white text-[#8f3b2f] transition hover:bg-[#fff0ec]"
                      aria-label="删除历史记录"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {selectedHistory ? (
            <div className="mt-4 rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6 text-[#314239]">
              <p className="font-semibold">当前查看</p>
              <p className="mt-1">{selectedHistory.question_preview}</p>
              <p>
                {selectedHistory.base_chart}
                {selectedHistory.changed_chart !== selectedHistory.base_chart ? ` 变 ${selectedHistory.changed_chart}` : ""} ·{" "}
                {selectedHistory.day_ganzhi}日{selectedHistory.month_branch ? ` · ${selectedHistory.month_branch}月建` : ""}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function V3EcosystemPanel({
  dashboard,
  submissions,
  packages,
  metrics,
  latestInstall,
  latestSettlement,
  isLoading,
  error,
  onCreateSubmission,
  onApproveAndPublish,
  onInstallPackage,
  onDisablePackage,
  onSimulateSettlement,
  onSuspendPackage,
  onRefresh,
}: {
  dashboard: ContributorDashboard | null;
  submissions: ContributorSubmission[];
  packages: EcosystemPackage[];
  metrics: EcosystemMetrics | null;
  latestInstall: PackageInstallRecord | null;
  latestSettlement: ContributorSettlement | null;
  isLoading: boolean;
  error: string | null;
  onCreateSubmission: () => void;
  onApproveAndPublish: () => void;
  onInstallPackage: () => void;
  onDisablePackage: () => void;
  onSimulateSettlement: () => void;
  onSuspendPackage: () => void;
  onRefresh: () => void;
}) {
  const latestSubmission = submissions[0];
  const latestPackage = packages[0];

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-[#245f46]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">V3.0 受控开放生态</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>
      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr_1.05fr_1fr]">
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">贡献者工作台</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="角色" value={dashboard?.roles.join("/") ?? "creator"} />
            <MiniMetric label="提交" value={String(dashboard?.submission_count ?? submissions.length)} />
            <MiniMetric label="待审" value={String(dashboard?.pending_review_count ?? 0)} />
            <MiniMetric label="已发布" value={String(dashboard?.published_count ?? packages.length)} />
          </div>
          <button
            type="button"
            onClick={onCreateSubmission}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38]"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            创建规则包草稿
          </button>
          {latestSubmission ? (
            <article className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6">
              <p className="line-clamp-1 font-semibold">{latestSubmission.title}</p>
              <p className="text-xs text-[#6a675c]">
                {latestSubmission.submission_type} / v{latestSubmission.version} / {latestSubmission.status}
              </p>
              <p className="line-clamp-2 text-xs text-[#6a675c]">{latestSubmission.diff_summary}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              贡献者可提交规则包、课程、案例、知识卡和模板，默认进入平台审核。
            </p>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">审核 gate 与回归</p>
          </div>
          <button
            type="button"
            onClick={onApproveAndPublish}
            disabled={!latestSubmission && submissions.length === 0}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#7a2f24] px-3 text-sm font-semibold text-white transition hover:bg-[#66261e] disabled:cursor-not-allowed disabled:bg-[#b99790]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            审核并发布生态包
          </button>
          {latestSubmission ? (
            <div className="grid gap-2">
              {Object.entries(latestSubmission.gates).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(latestSubmission.gates).map(([gate, status]) => (
                    <span
                      key={gate}
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        status === "approved" ? "bg-[#245f46] text-white" : "bg-[#fff0ec] text-[#8f3b2f]"
                      }`}
                    >
                      {gate}: {status}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm text-[#6a675c]">
                  草稿提交后会生成 professional、compliance、safety、regression gate。
                </p>
              )}
              {latestSubmission.review_notes.slice(-3).map((note) => (
                <p key={note.id} className="rounded-md border border-[#2f3b2f]/12 bg-white p-2 text-xs text-[#6a675c]">
                  {note.review_gate} / {note.decision} / {note.note ?? "no note"}
                </p>
              ))}
            </div>
          ) : null}
          {metrics ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniMetric label="通过率" value={`${Math.round(metrics.approval_rate * 100)}%`} />
              <MiniMetric label="回归失败" value={`${Math.round(metrics.regression_failure_rate * 100)}%`} />
              <MiniMetric label="回归 P95" value={`${metrics.p95_latency_ms.rule_regression}ms`} />
              <MiniMetric label="审核 P95" value={`${metrics.p95_latency_ms.submission_review}ms`} />
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">生态目录与安装</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <button
              type="button"
              onClick={onInstallPackage}
              disabled={!latestPackage}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              安装内容包
            </button>
            <button
              type="button"
              onClick={onDisablePackage}
              disabled={!latestPackage}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              禁用安装包
            </button>
            <button
              type="button"
              onClick={onSuspendPackage}
              disabled={!latestPackage}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#8f3b2f]/20 bg-white px-3 text-sm font-medium text-[#8f3b2f] transition hover:bg-[#fff0ec] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              下架演练
            </button>
          </div>
          {latestPackage ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="line-clamp-1 font-semibold">{latestPackage.title}</p>
              <p className="text-xs text-[#6a675c]">
                {latestPackage.package_type} / {latestPackage.status} / v{latestPackage.entity_version}
              </p>
              <p className="line-clamp-2 text-xs text-[#6a675c]">{latestPackage.summary}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              目录只展示 published 内容包；安装不改变底层安全策略和高风险拦截。
            </p>
          )}
          {latestInstall ? (
            <p className="rounded-md border border-[#9a6a2f]/18 bg-white p-3 text-xs text-[#6a675c]">
              {latestInstall.package_id} / {latestInstall.status}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">模拟结算与指标</p>
          </div>
          <button
            type="button"
            onClick={onSimulateSettlement}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            生成模拟账单
          </button>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="内容包" value={String(metrics?.published_package_count ?? packages.length)} />
            <MiniMetric label="安装" value={String(metrics?.install_count ?? 0)} />
            <MiniMetric label="下架" value={String(metrics?.suspended_package_count ?? 0)} />
            <MiniMetric label="模拟收益" value={`￥${((metrics?.simulated_revenue_cents ?? 0) / 100).toFixed(2)}`} />
            <MiniMetric label="目录 P95" value={`${metrics?.p95_latency_ms.ecosystem_catalog ?? 0}ms`} />
            <MiniMetric label="投诉" value={String(metrics?.complaint_count ?? 0)} />
          </div>
          {latestSettlement ? (
            <article className="rounded-md border border-[#9a6a2f]/18 bg-white p-3 text-sm leading-6">
              <p className="font-semibold">
                {latestSettlement.period} / {latestSettlement.status}
              </p>
              <p className="text-xs text-[#6a675c]">
                {latestSettlement.event_count} events / ￥{(latestSettlement.total_amount_cents / 100).toFixed(2)}
              </p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              本阶段只做 simulated ledger，不接真实分账、提现、发票或税务流程。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function V35OperationsPanel({
  quality,
  riskEvents,
  opsSlo,
  incidents,
  commercialReadiness,
  latestBilling,
  revenuePreview,
  privacySettings,
  latestPrivacyExport,
  complianceReviews,
  metrics,
  isLoading,
  error,
  onReviewQuality,
  onResolveRiskEvent,
  onCreateIncident,
  onResolveIncident,
  onSimulateBilling,
  onUpdatePrivacy,
  onRequestDataExport,
  onResolveComplianceReview,
  onRefresh,
}: {
  quality: EcosystemQualitySummary | null;
  riskEvents: EcosystemRiskEvent[];
  opsSlo: OpsSlo | null;
  incidents: OpsIncident[];
  commercialReadiness: CommercialReadiness | null;
  latestBilling: CommercialBillingSimulation | null;
  revenuePreview: RevenuePreview | null;
  privacySettings: PrivacySettings | null;
  latestPrivacyExport: PrivacyDataExport | null;
  complianceReviews: ComplianceReview[];
  metrics: EcosystemMetrics | null;
  isLoading: boolean;
  error: string | null;
  onReviewQuality: () => void;
  onResolveRiskEvent: () => void;
  onCreateIncident: () => void;
  onResolveIncident: () => void;
  onSimulateBilling: () => void;
  onUpdatePrivacy: () => void;
  onRequestDataExport: () => void;
  onResolveComplianceReview: () => void;
  onRefresh: () => void;
}) {
  const latestQuality = quality?.packages[0];
  const openRiskEvent = riskEvents.find((event) => event.status === "open");
  const openIncident = incidents.find((incident) => incident.status !== "resolved");
  const openComplianceReview = complianceReviews.find((review) => review.status === "open");
  const blockedGates = commercialReadiness?.gates.filter((gate) => gate.status !== "ready") ?? [];

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-[#7a2f24]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">V3.5 规模化运营准备</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>
      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">生态质量闭环</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="健康包" value={String(quality?.healthy_count ?? 0)} />
            <MiniMetric label="待复审" value={String(quality?.needs_review_count ?? 0)} />
            <MiniMetric label="已暂停" value={String(quality?.suspended_count ?? 0)} />
            <MiniMetric label="均分" value={String(quality?.average_quality_score ?? 0)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={onReviewQuality}
              disabled={!latestQuality}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#7a2f24] px-3 text-sm font-semibold text-white transition hover:bg-[#66261e] disabled:cursor-not-allowed disabled:bg-[#b99790]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              标记质量复审
            </button>
            <button
              type="button"
              onClick={onResolveRiskEvent}
              disabled={!openRiskEvent}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              处理风险事件
            </button>
          </div>
          {latestQuality ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="line-clamp-1 font-semibold">{latestQuality.title}</p>
              <p className="text-xs text-[#6a675c]">
                {latestQuality.quality_status} / risk {latestQuality.risk_level} / score {latestQuality.quality_score}
              </p>
              <p className="line-clamp-2 text-xs text-[#6a675c]">{latestQuality.note}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              生态包发布后会进入质量评分、投诉、回归和留存监控。
            </p>
          )}
          {openRiskEvent ? (
            <p className="rounded-md border border-[#8f3b2f]/18 bg-white p-3 text-xs leading-5 text-[#8f3b2f]">
              {openRiskEvent.risk_level} / {openRiskEvent.moderation_action} / {openRiskEvent.package_title}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">SLO 与事故</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="排盘" value={`${opsSlo?.current.cast_p95_ms ?? 0}/${opsSlo?.targets.cast_p95_ms ?? 500}ms`} />
            <MiniMetric
              label="AI 首段"
              value={`${opsSlo?.current.first_ai_delta_p95_ms ?? 0}/${opsSlo?.targets.first_ai_delta_p95_ms ?? 2000}ms`}
            />
            <MiniMetric
              label="目录"
              value={`${opsSlo?.current.ecosystem_catalog_p95_ms ?? 0}/${
                opsSlo?.targets.ecosystem_catalog_p95_ms ?? 1500
              }ms`}
            />
            <MiniMetric label="未结事故" value={String(opsSlo?.open_incident_count ?? 0)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={onCreateIncident}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <PenLine className="h-4 w-4" aria-hidden="true" />
              记录演练事故
            </button>
            <button
              type="button"
              onClick={onResolveIncident}
              disabled={!openIncident}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              关闭事故
            </button>
          </div>
          {openIncident ? (
            <article className="rounded-md border border-[#9a6a2f]/18 bg-white p-3 text-sm leading-6">
              <p className="line-clamp-1 font-semibold">
                {openIncident.severity} / {openIncident.status}
              </p>
              <p className="line-clamp-2 text-xs text-[#6a675c]">{openIncident.summary}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              事故记录用于 SLO、告警、回滚演练和审计追踪。
            </p>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">商业化沙盒</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="模式" value={commercialReadiness?.mode ?? "simulated"} />
            <MiniMetric label="状态" value={commercialReadiness?.overall_status ?? "blocked"} />
            <MiniMetric label="阻塞 gate" value={String(blockedGates.length)} />
            <MiniMetric label="真实资金" value={commercialReadiness?.real_money_movement_enabled ? "on" : "off"} />
          </div>
          <button
            type="button"
            onClick={onSimulateBilling}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38]"
          >
            <Gauge className="h-4 w-4" aria-hidden="true" />
            生成沙盒账单
          </button>
          {latestBilling ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="font-semibold">
                {latestBilling.period} / {(latestBilling.total_amount_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-[#6a675c]">
                {latestBilling.line_items.length} items / real money {latestBilling.real_money_movement ? "on" : "off"}
              </p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              本阶段只做账单预览、权益核对和对账演练。
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="模拟次数" value={String(revenuePreview?.simulation_count ?? 0)} />
            <MiniMetric label="预览收益" value={(Number(revenuePreview?.total_amount_cents ?? 0) / 100).toFixed(2)} />
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">隐私与合规</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="历史保存" value={privacySettings?.save_history ? "on" : "off"} />
            <MiniMetric label="个性化" value={privacySettings?.allow_personalization ? "on" : "off"} />
            <MiniMetric label="保留天数" value={String(privacySettings?.retain_history_days ?? 180)} />
            <MiniMetric label="待复审" value={String(complianceReviews.filter((review) => review.status === "open").length)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={onUpdatePrivacy}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              更新隐私设置
            </button>
            <button
              type="button"
              onClick={onRequestDataExport}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              生成数据导出
            </button>
            <button
              type="button"
              onClick={onResolveComplianceReview}
              disabled={!openComplianceReview}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#8f3b2f]/20 bg-white px-3 text-sm font-medium text-[#8f3b2f] transition hover:bg-[#fff0ec] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              处理合规复审
            </button>
          </div>
          {latestPrivacyExport ? (
            <p className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-xs leading-5 text-[#314239]">
              {latestPrivacyExport.status} / {latestPrivacyExport.export_format} / raw text{" "}
              {latestPrivacyExport.includes_raw_question_text ? "on" : "off"}
            </p>
          ) : null}
          {openComplianceReview ? (
            <p className="rounded-md border border-[#9a6a2f]/18 bg-white p-3 text-xs leading-5 text-[#6a675c]">
              {openComplianceReview.review_type} / {openComplianceReview.risk_level} / {openComplianceReview.summary}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3 sm:grid-cols-3 xl:grid-cols-6">
        <MiniMetric label="安装转化" value={`${Math.round((metrics?.install_conversion_rate ?? 0) * 100)}%`} />
        <MiniMetric label="内容复访" value={String(metrics?.content_revisit_count ?? 0)} />
        <MiniMetric label="学习完成" value={String(metrics?.learning_completion_count ?? 0)} />
        <MiniMetric label="贡献者活跃" value={String(metrics?.contributor_active_count ?? 0)} />
        <MiniMetric label="审核 SLA" value={`${metrics?.review_sla_p95_ms ?? 0}ms`} />
        <MiniMetric label="投诉处理" value={`${metrics?.complaint_resolution_p95_ms ?? 0}ms`} />
      </div>
    </section>
  );
}

function V2ExpansionPanel({
  result,
  appBootstrap,
  device,
  voiceJob,
  readingImport,
  communityPosts,
  rulePacks,
  reviewQueue,
  adminMetrics,
  isLoading,
  error,
  onRegisterDevice,
  onTranscribeVoice,
  onExplainVoice,
  onImportReading,
  onCreatePost,
  onPublishRulePack,
  onRefresh,
}: {
  result: CastResult | null;
  appBootstrap: AppBootstrap | null;
  device: DeviceRecord | null;
  voiceJob: VoiceJob | null;
  readingImport: ReadingImportRecord | null;
  communityPosts: CommunityPost[];
  rulePacks: RulePack[];
  reviewQueue: ReviewQueueItem[];
  adminMetrics: AdminMetrics | null;
  isLoading: boolean;
  error: string | null;
  onRegisterDevice: () => void;
  onTranscribeVoice: () => void;
  onExplainVoice: () => void;
  onImportReading: () => void;
  onCreatePost: () => void;
  onPublishRulePack: () => void;
  onRefresh: () => void;
}) {
  const approvedRulePacks = rulePacks.filter((pack) => pack.status === "approved");
  const bootstrapFlags = appBootstrap ? Object.entries(appBootstrap.feature_flags).filter(([, enabled]) => enabled) : [];

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-[#245f46]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">V2.0 社区、多端与治理</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>
      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_0.95fr_1.05fr_1.2fr]">
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">多端壳层</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="API" value={appBootstrap?.api_version ?? "v2.0"} />
            <MiniMetric label="策略" value={appBootstrap?.safety_policy_version ?? "v2.0"} />
            <MiniMetric label="设备" value={String(adminMetrics?.device_count ?? 0)} />
            <MiniMetric label="能力" value={String(appBootstrap?.capabilities.length ?? 0)} />
          </div>
          {bootstrapFlags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {bootstrapFlags.slice(0, 5).map(([flag]) => (
                <span key={flag} className="rounded-md bg-[#edf3ea] px-2 py-1 text-xs font-medium text-[#245f46]">
                  {flag}
                </span>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={onRegisterDevice}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38]"
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            注册 Web 设备
          </button>
          {device ? (
            <p className="break-all rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-xs leading-5 text-[#6a675c]">
              {device.device_id} / {device.platform} / {device.locale}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">语音问卦</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={onTranscribeVoice}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <Mic className="h-4 w-4" aria-hidden="true" />
              转写当前问题
            </button>
            <button
              type="button"
              onClick={onExplainVoice}
              disabled={!result}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              生成播报任务
            </button>
          </div>
          {voiceJob ? (
            <article className="rounded-md border border-[#9a6a2f]/18 bg-white p-3 text-sm leading-6">
              <p className="font-semibold">
                {voiceJob.status} / {voiceJob.safety.risk_label}
              </p>
              <p className="line-clamp-3 text-[#6a675c]">{voiceJob.transcript}</p>
              <p className="text-xs text-[#6a675c]">原始音频保存：{voiceJob.raw_audio_stored ? "是" : "否"}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              语音文本会复用文本风险分类和审计策略，默认不保存原始音频。
            </p>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">导入排盘</p>
          </div>
          <button
            type="button"
            onClick={onImportReading}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#7a2f24] px-3 text-sm font-semibold text-white transition hover:bg-[#66261e]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            导入结构化样例
          </button>
          {readingImport ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="font-semibold">
                {readingImport.status} / {readingImport.source_type}
              </p>
              <p className="text-[#314239]">
                {readingImport.chart_json?.base_chart.name ?? "待修正"}{" "}
                {readingImport.chart_json?.changed_chart.name ? `之 ${readingImport.chart_json.changed_chart.name}` : ""}
              </p>
              <p className="text-xs text-[#6a675c]">AI 补造卦盘字段：{readingImport.ai_generated_chart_fields ? "是" : "否"}</p>
              {readingImport.errors.length > 0 ? (
                <p className="text-xs text-[#8f3b2f]">{readingImport.errors.join(" / ")}</p>
              ) : null}
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              文本、JSON 与 OCR 预留入口统一转成 chart_json，失败时返回可编辑字段。
            </p>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">社区与规则治理</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCreatePost}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              发布脱敏共学
            </button>
            <button
              type="button"
              onClick={onPublishRulePack}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea]"
            >
              <PackageCheck className="h-4 w-4" aria-hidden="true" />
              审核规则包
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <MiniMetric label="帖子" value={String(communityPosts.length)} />
            <MiniMetric label="队列" value={String(reviewQueue.length)} />
            <MiniMetric label="规则包" value={String(rulePacks.length)} />
            <MiniMetric label="已批准" value={String(approvedRulePacks.length)} />
          </div>
          <div className="grid gap-2">
            {communityPosts.slice(0, 2).map((post) => (
              <article key={post.id} className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm">
                <p className="line-clamp-1 font-semibold">{post.title}</p>
                <p className="line-clamp-2 text-[#6a675c]">{post.body}</p>
              </article>
            ))}
            {rulePacks.slice(0, 2).map((pack) => (
              <article key={pack.id} className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm">
                <p className="font-semibold">{pack.name}</p>
                <p className="text-xs text-[#6a675c]">
                  {pack.scope} / {pack.status} / 回归 {pack.regression_passed ? "通过" : "待跑"}
                </p>
              </article>
            ))}
          </div>
          {adminMetrics ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniMetric label="语音 P95" value={`${adminMetrics.p95_latency_ms.voice_transcribe ?? 0}ms`} />
              <MiniMetric label="导入 P95" value={`${adminMetrics.p95_latency_ms.import_parse ?? 0}ms`} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function V15GrowthPanel({
  result,
  cases,
  courses,
  courseProgress,
  creatorExport,
  experimentAssignment,
  adminMetrics,
  isLoading,
  error,
  onOpenCase,
  onStartCourse,
  onCreateCreatorMaterial,
  onRefresh,
}: {
  result: CastResult | null;
  cases: CaseSummary[];
  courses: CourseSummary[];
  courseProgress: CourseProgressSummary | null;
  creatorExport: CreatorExportResult | null;
  experimentAssignment: ExperimentAssignment | null;
  adminMetrics: AdminMetrics | null;
  isLoading: boolean;
  error: string | null;
  onOpenCase: (caseId: string) => void;
  onStartCourse: (course: CourseSummary) => void;
  onCreateCreatorMaterial: (exportType: CreatorExportResult["export_type"]) => void;
  onRefresh: () => void;
}) {
  const completedLessonIds = new Set(courseProgress?.progress.filter((item) => item.completed).map((item) => item.lesson_id) ?? []);

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7a2f24]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">V1.5 内容化增长</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {experimentAssignment ? (
            <span className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] px-3 py-1 text-sm font-medium text-[#245f46]">
              {experimentAssignment.surface} · {experimentAssignment.variant}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {isLoading ? "刷新中" : "刷新"}
          </button>
        </div>
      </div>
      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#245f46]" aria-hidden="true" />
            <p className="font-medium">案例库</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
            {cases.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenCase(item.id)}
                className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-left text-sm transition hover:bg-[#edf3ea]"
              >
                <span className="block font-semibold text-[#171814]">{item.title}</span>
                <span className="mt-1 flex flex-wrap gap-1 text-xs text-[#6a675c]">
                  <span>{item.scenario}</span>
                  <span>{item.difficulty}</span>
                  <span>{item.base_chart}</span>
                  <span>{item.yongshen}</span>
                </span>
                <span className="mt-2 line-clamp-2 block text-[#314239]">{item.learning_summary}</span>
                <span className="mt-2 flex flex-wrap gap-1">
                  {item.rule_ids.slice(0, 3).map((ruleId) => (
                    <span key={ruleId} className="rounded-md bg-[#245f46] px-2 py-0.5 text-xs text-white">
                      {ruleId}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">课程体系</p>
          </div>
          <div className="grid gap-2">
            {courses.slice(0, 5).map((course) => {
              const firstLesson = course.lessons[0];
              const started = Boolean(firstLesson && completedLessonIds.has(firstLesson.id));
              return (
                <article key={course.id} className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{course.title}</p>
                      <p className="mt-1 line-clamp-2 text-[#6a675c]">{course.summary}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onStartCourse(course)}
                      className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-[#edf3ea] px-3 text-sm font-medium text-[#245f46] transition hover:bg-[#dfeadd]"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      {started ? "已学习" : "开始"}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#6a675c]">
                    {course.lesson_count} 课时 · {course.difficulty} · {course.badge}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">创作者工具</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CreatorButton label="图文提纲" exportType="article" disabled={!result && cases.length === 0} onCreate={onCreateCreatorMaterial} />
            <CreatorButton label="短视频脚本" exportType="short_video_script" disabled={!result && cases.length === 0} onCreate={onCreateCreatorMaterial} />
            <CreatorButton label="长图结构" exportType="long_image" disabled={!result && cases.length === 0} onCreate={onCreateCreatorMaterial} />
            <CreatorButton label="排盘图" exportType="chart_snapshot" disabled={!result && cases.length === 0} onCreate={onCreateCreatorMaterial} />
          </div>
          {creatorExport ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="font-semibold">{creatorExport.title}</p>
              <ul className="mt-2 grid gap-1">
                {creatorExport.content_sections.slice(0, 4).map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-[#6a675c]">{creatorExport.safety_notice}</p>
            </article>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              可基于当前排盘或首个脱敏案例生成学习型素材，不展示原始问题和私密追问。
            </p>
          )}
          {adminMetrics ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniMetric label="案例" value={String(adminMetrics.case_count ?? 0)} />
              <MiniMetric label="课程" value={String(adminMetrics.course_count ?? 0)} />
              <MiniMetric label="导出" value={String(adminMetrics.creator_export_count ?? 0)} />
              <MiniMetric label="事件" value={String(adminMetrics.experiment_event_count ?? 0)} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CreatorButton({
  label,
  exportType,
  disabled,
  onCreate,
}: {
  label: string;
  exportType: CreatorExportResult["export_type"];
  disabled: boolean;
  onCreate: (exportType: CreatorExportResult["export_type"]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onCreate(exportType)}
      disabled={disabled}
      className="flex h-10 items-center justify-center rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
    >
      {label}
    </button>
  );
}

function V1PublicTestPanel({
  result,
  terms,
  exercises,
  selectedCard,
  memberProgress,
  adminMetrics,
  shareResult,
  tagsText,
  isLoading,
  error,
  onTagsTextChange,
  onOpenLearningCard,
  onSaveExercise,
  onCreateShare,
  onFavorite,
  onUpdateTags,
  onRefresh,
}: {
  result: CastResult | null;
  terms: LearningTerm[];
  exercises: LearningExercise[];
  selectedCard: LearningCardDetail | null;
  memberProgress: MemberProgress | null;
  adminMetrics: AdminMetrics | null;
  shareResult: ShareResult | null;
  tagsText: string;
  isLoading: boolean;
  error: string | null;
  onTagsTextChange: (value: string) => void;
  onOpenLearningCard: (cardId: string) => void;
  onSaveExercise: (exerciseId: string) => void;
  onCreateShare: () => void;
  onFavorite: () => void;
  onUpdateTags: () => void;
  onRefresh: () => void;
}) {
  const currentTags = result && memberProgress ? memberProgress.tags[result.reading_id] ?? [] : [];
  const isFavorite = Boolean(result && memberProgress?.favorites.includes(result.reading_id));

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-[#245f46]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">V1.0 学习与公开测试</h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "刷新中" : "刷新"}
        </button>
      </div>
      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.9fr]">
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">术语与知识卡</p>
          </div>
          <div className="grid gap-2">
            {terms.slice(0, 4).map((term) => (
              <button
                key={term.id}
                type="button"
                onClick={() => onOpenLearningCard(term.id.split("-").slice(2).join("-"))}
                className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-left text-sm transition hover:bg-[#edf3ea]"
              >
                <span className="font-semibold text-[#171814]">{term.term}</span>
                <span className="ml-2 rounded-md bg-[#245f46] px-2 py-0.5 text-xs text-white">{term.rule_id}</span>
                <span className="mt-1 line-clamp-2 block text-[#6a675c]">{term.definition}</span>
              </button>
            ))}
          </div>
          {selectedCard ? (
            <article className="rounded-md border border-[#9a6a2f]/18 bg-[#fff9e8] p-3 text-sm leading-6">
              <p className="font-semibold">{selectedCard.title}</p>
              <p className="mt-1">{selectedCard.content}</p>
              <p className="mt-1 text-[#6a675c]">{selectedCard.counter_example}</p>
            </article>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">分享、收藏与标签</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onCreateShare}
              disabled={!result}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38] disabled:cursor-not-allowed disabled:bg-[#9cad9f]"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              生成分享卡
            </button>
            <button
              type="button"
              onClick={onFavorite}
              disabled={!result}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Star className="h-4 w-4" aria-hidden="true" />
              {isFavorite ? "已收藏" : "收藏"}
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={tagsText}
              onChange={(event) => onTagsTextChange(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-md border border-[#2f3b2f]/20 bg-white px-3 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
              placeholder="标签，用逗号分隔"
            />
            <button
              type="button"
              onClick={onUpdateTags}
              disabled={!result}
              className="flex h-10 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <Tags className="h-4 w-4" aria-hidden="true" />
              保存标签
            </button>
          </div>
          {currentTags.length > 0 ? <p className="text-sm text-[#6a675c]">当前标签：{currentTags.join("、")}</p> : null}
          {shareResult ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <p className="font-semibold">{shareResult.card_payload.base_chart} 分享卡已生成</p>
              <p>{shareResult.card_payload.question_preview}</p>
              <a className="font-medium text-[#245f46] underline" href={shareResult.share_url} target="_blank" rel="noreferrer">
                打开匿名分享页
              </a>
            </article>
          ) : null}
        </div>

        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">练习与运营快照</p>
          </div>
          <div className="grid gap-2">
            {exercises.slice(0, 3).map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => onSaveExercise(exercise.id)}
                className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-left text-sm transition hover:bg-[#edf3ea]"
              >
                <span className="font-semibold">{exercise.title}</span>
                <span className="ml-2 text-xs text-[#6a675c]">{exercise.difficulty}</span>
                <span className="mt-1 line-clamp-2 block text-[#6a675c]">{exercise.prompt}</span>
              </button>
            ))}
          </div>
          {adminMetrics ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MiniMetric label="起卦" value={String(adminMetrics.cast_completion_count)} />
              <MiniMetric label="分享" value={String(adminMetrics.share_count)} />
              <MiniMetric label="反馈" value={String(adminMetrics.feedback_count)} />
              <MiniMetric label="拒答" value={String(adminMetrics.safety_block_count)} />
              <MiniMetric label="排盘 P95" value={`${adminMetrics.p95_latency_ms.cast}ms`} />
              <MiniMetric label="分享 P95" value={`${adminMetrics.p95_latency_ms.share_page}ms`} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-2">
      <p className="text-xs text-[#6a675c]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#171814]">{value}</p>
    </div>
  );
}

function LinePreview({ lines }: { lines: Array<{ lineNo: number; value: LineValue; label: string }> }) {
  return (
    <div className="mt-4 grid min-h-24 grid-cols-3 gap-2 sm:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => {
        const line = lines[index];
        return (
          <div
            key={`preview-${index + 1}`}
            className="flex min-h-16 flex-col items-center justify-center rounded-md border border-[#9a6a2f]/18 bg-white/72 p-2 text-center"
          >
            <span className="text-xs text-[#6a675c]">{index + 1} 爻</span>
            <span className="mt-1 text-sm font-semibold text-[#171814]">{line ? line.label : "待摇"}</span>
          </div>
        );
      })}
    </div>
  );
}

function EmptyResult({
  linePreview,
  castMethod,
}: {
  linePreview: Array<{ lineNo: number; value: LineValue; label: string }>;
  castMethod: CastMethod;
}) {
  return (
    <div className="rounded-lg border border-dashed border-[#2f3b2f]/25 bg-[#fffdf7] p-5">
      <p className="font-medium text-[#314239]">等待排盘</p>
      <p className="mt-2 text-sm leading-6 text-[#6a675c]">
        {castMethod === "coin" ? "请先摇满 6 爻，再开始排盘。" : "手动输入默认已有 6 爻，可直接排盘。"}
      </p>
      {linePreview.length > 0 ? <LinePreview lines={linePreview} /> : null}
    </div>
  );
}

function ResultPanel({
  result,
  safety,
  analysis,
  isAnalyzing,
  analysisError,
  onRefreshAnalysis,
  explainMode,
  onExplainModeChange,
  aiOutput,
  aiDeltas,
  knowledgeCards,
  aiError,
  isExplaining,
  onRefreshAi,
  followupText,
  onFollowupTextChange,
  onSendFollowup,
  chatMessages,
  feedback,
  onFeedback,
  onOpenKnowledgeCard,
}: {
  result: CastResult;
  safety: SafetyStatus | null;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onRefreshAnalysis: () => void;
  explainMode: ExplainMode;
  onExplainModeChange: (mode: ExplainMode) => void;
  aiOutput: AiReadingOutput | null;
  aiDeltas: AiDelta[];
  knowledgeCards: KnowledgeCard[];
  aiError: string | null;
  isExplaining: boolean;
  onRefreshAi: () => void;
  followupText: string;
  onFollowupTextChange: (value: string) => void;
  onSendFollowup: (type: FollowupType, message: string) => void;
  chatMessages: ChatMessage[];
  feedback: "helpful" | "off" | null;
  onFeedback: (value: "helpful" | "off") => void;
  onOpenKnowledgeCard: (cardId: string) => void;
}) {
  const yongshenLine = analysis?.yongshen?.line_no;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <ChartMetric label="本卦" value={result.base_chart.name} />
        <ChartMetric label="变卦" value={result.changed_chart.name} />
        <ChartMetric label="卦宫" value={`${result.base_chart.palace}宫`} />
        <ChartMetric label="旬空" value={result.base_chart.xunkong.join("、")} />
        <ChartMetric label="日干支" value={`${result.day_ganzhi}日`} />
        <ChartMetric label="月建" value={`${result.month_branch}${result.month_source === "explicit" ? "（手动）" : "（节气表）"}`} />
        <ChartMetric label="起卦日期" value={result.cast_time} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2f3b2f]/15">
        <table className="w-full min-w-[680px] border-collapse bg-[#fffdf7] text-left text-sm">
          <thead className="bg-[#edf3ea] text-[#314239]">
            <tr>
              <th className="px-3 py-2 font-semibold">爻位</th>
              <th className="px-3 py-2 font-semibold">爻象</th>
              <th className="px-3 py-2 font-semibold">六神</th>
              <th className="px-3 py-2 font-semibold">六亲</th>
              <th className="px-3 py-2 font-semibold">干支</th>
              <th className="px-3 py-2 font-semibold">标记</th>
            </tr>
          </thead>
          <tbody>
            {[...result.lines].reverse().map((line) => (
              <tr
                key={line.line_no}
                className={`border-t border-[#2f3b2f]/10 ${line.line_no === yongshenLine ? "bg-[#fff4d4]" : ""}`}
              >
                <td className="px-3 py-3 font-medium">{line.line_no} 爻</td>
                <td className="px-3 py-3">
                  <span className="inline-block w-24 font-mono text-xl leading-none text-[#171814]">
                    {line.yin_yang === "yang" ? "━━━━━━" : "━━  ━━"}
                  </span>
                  {line.moving ? <span className="ml-2 rounded-md bg-[#8f3b2f] px-2 py-0.5 text-xs text-white">动</span> : null}
                </td>
                <td className="px-3 py-3">{line.liushen}</td>
                <td className="px-3 py-3">{line.liuqin}</td>
                <td className="px-3 py-3">
                  {line.stem}
                  {line.branch} · {line.element}
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    {line.line_no === result.base_chart.shi_line ? (
                      <span className="rounded-md bg-[#245f46] px-2 py-0.5 text-xs text-white">世</span>
                    ) : null}
                    {line.line_no === result.base_chart.ying_line ? (
                      <span className="rounded-md bg-[#9a6a2f] px-2 py-0.5 text-xs text-white">应</span>
                    ) : null}
                    {line.line_no === yongshenLine ? (
                      <span className="rounded-md bg-[#7a2f24] px-2 py-0.5 text-xs text-white">用</span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnalysisPanel
        analysis={analysis}
        isAnalyzing={isAnalyzing}
        analysisError={analysisError}
        onRefreshAnalysis={onRefreshAnalysis}
      />

      <AiExplanationPanel
        analysis={analysis}
        mode={explainMode}
        onModeChange={onExplainModeChange}
        output={aiOutput}
        deltas={aiDeltas}
        knowledgeCards={knowledgeCards}
        error={aiError}
        isLoading={isExplaining}
        onRefresh={onRefreshAi}
        followupText={followupText}
        onFollowupTextChange={onFollowupTextChange}
        onSendFollowup={onSendFollowup}
        chatMessages={chatMessages}
        feedback={feedback}
        onFeedback={onFeedback}
        onOpenKnowledgeCard={onOpenKnowledgeCard}
      />

      {safety ? (
        <div className="rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm leading-6 text-[#314239]">
          <p>{safety.notice}</p>
        </div>
      ) : null}
    </div>
  );
}

function AnalysisPanel({
  analysis,
  isAnalyzing,
  analysisError,
  onRefreshAnalysis,
}: {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analysisError: string | null;
  onRefreshAnalysis: () => void;
}) {
  if (isAnalyzing && !analysis) {
    return (
      <div className="rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm text-[#314239]">
        规则证据生成中
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm leading-6 text-[#314239]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>{analysisError ?? "规则证据尚未生成。"}</p>
          <button
            type="button"
            onClick={onRefreshAnalysis}
            className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            生成证据
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm leading-6 text-[#314239]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">规则证据树</p>
          <p className="mt-1">{analysis.verdict.summary}</p>
        </div>
        <button
          type="button"
          onClick={onRefreshAnalysis}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isAnalyzing ? "刷新中" : "刷新证据"}
        </button>
      </div>

      {analysis.yongshen ? (
        <div className="rounded-md border border-[#9a6a2f]/18 bg-[#fffdf7] p-3">
          <p className="font-medium">
            {analysis.yongshen.role}：{analysis.yongshen.line_no} 爻 · {analysis.yongshen.liuqin}
            {analysis.yongshen.branch}
          </p>
          {analysis.yongshen.alternatives.length > 0 ? (
            <p className="mt-1 text-[#6a675c]">
              辅助观察：
              {analysis.yongshen.alternatives
                .map((item) => `${item.line_no}爻${item.liuqin}${item.branch}`)
                .join("、")}
            </p>
          ) : null}
        </div>
      ) : null}

      <EvidenceList title="关键依据" nodes={analysis.evidence_tree} />
      <EvidenceList title="反证与保留" nodes={analysis.counter_evidence} />

      {analysis.action_tips.length > 0 ? (
        <div className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">
          <p className="font-medium">现实提示</p>
          <ul className="mt-1 grid gap-1">
            {analysis.action_tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function AiExplanationPanel({
  analysis,
  mode,
  onModeChange,
  output,
  deltas,
  knowledgeCards,
  error,
  isLoading,
  onRefresh,
  followupText,
  onFollowupTextChange,
  onSendFollowup,
  chatMessages,
  feedback,
  onFeedback,
  onOpenKnowledgeCard,
}: {
  analysis: AnalysisResult | null;
  mode: ExplainMode;
  onModeChange: (mode: ExplainMode) => void;
  output: AiReadingOutput | null;
  deltas: AiDelta[];
  knowledgeCards: KnowledgeCard[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  followupText: string;
  onFollowupTextChange: (value: string) => void;
  onSendFollowup: (type: FollowupType, message: string) => void;
  chatMessages: ChatMessage[];
  feedback: "helpful" | "off" | null;
  onFeedback: (value: "helpful" | "off") => void;
  onOpenKnowledgeCard: (cardId: string) => void;
}) {
  const canExplain = analysis?.safety_status.status === "allowed";
  const referencedCards = output
    ? knowledgeCards.filter((card) => output.knowledge_card_refs.includes(card.id))
    : knowledgeCards;

  return (
    <div className="grid gap-3 rounded-lg border border-[#7a2f24]/18 bg-[#fff9e8] p-4 text-sm leading-6 text-[#314239]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#7a2f24]" aria-hidden="true" />
          <h3 className="font-semibold text-[#171814]">AI 解读</h3>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={!canExplain || isLoading}
          className="flex h-9 items-center justify-center gap-2 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8] disabled:cursor-not-allowed disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isLoading ? "生成中" : "刷新解读"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {explainModes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onModeChange(item.value)}
            disabled={!canExplain || isLoading}
            className={`h-10 rounded-md border px-2 text-sm font-medium transition ${
              mode === item.value
                ? "border-[#7a2f24] bg-[#7a2f24] text-white"
                : "border-[#2f3b2f]/16 bg-white text-[#314239] hover:bg-[#f3f0e8]"
            } disabled:cursor-not-allowed disabled:opacity-55`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!analysis ? (
        <p className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">规则证据生成后可查看 AI 解读。</p>
      ) : !canExplain ? (
        <p className="rounded-md border border-[#8f3b2f]/20 bg-[#fff0ec] p-3 text-[#752f26]">{analysis.safety_notice}</p>
      ) : null}

      {error ? <p className="rounded-md border border-[#8f3b2f]/20 bg-[#fff0ec] p-3 text-[#752f26]">{error}</p> : null}

      {output ? (
        <div className="grid gap-3">
          <div className="rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3">
            <p className="font-medium">总结</p>
            <p className="mt-1">{output.summary}</p>
          </div>
          <AiOutputList title="关键证据" items={output.key_evidence.map((item) => `${item.evidence_id}：${item.plain_explanation}`)} />
          <AiOutputList title="反证" items={output.counter_evidence} />
          <AiOutputList title="行动提示" items={output.action_tips} />
          <div className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3">
            <p className="font-medium">安全提示</p>
            <p className="mt-1">{output.safety_notice}</p>
            <p className="mt-2 text-xs text-[#6a675c]">
              {output.model_metadata.provider} · {output.model_metadata.model}
            </p>
          </div>
        </div>
      ) : deltas.length > 0 ? (
        <div className="grid gap-2 rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3">
          {deltas.map((delta, index) => (
            <div key={`${delta.field}-${index}`}>
              <p className="font-medium">{toAiDeltaLabel(delta.field)}</p>
              <p className="mt-1 whitespace-pre-wrap">{delta.text}</p>
            </div>
          ))}
        </div>
      ) : canExplain ? (
        <p className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">
          {isLoading ? "解读生成中" : "当前卦盘会先显示规则证据，再生成 AI 解读。"}
        </p>
      ) : null}

      {referencedCards.length > 0 ? (
        <div className="grid gap-2">
          <p className="font-medium">知识卡引用</p>
          <div className="grid gap-2 md:grid-cols-2">
            {referencedCards.slice(0, 4).map((card) => (
              <article key={card.id} className="rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#245f46] px-2 py-0.5 text-xs font-medium text-white">{card.rule_id}</span>
                  <span className="font-medium">{card.title}</span>
                </div>
                <p className="mt-2 text-[#314239]">{card.content}</p>
                <p className="mt-1 text-xs text-[#6a675c]">来源：{card.source_refs.join("；")}</p>
                <button
                  type="button"
                  onClick={() => onOpenKnowledgeCard(card.id)}
                  className="mt-2 h-8 rounded-md border border-[#2f3b2f]/16 bg-[#edf3ea] px-3 text-xs font-medium text-[#245f46] transition hover:bg-[#dfeadd]"
                >
                  查看学习卡
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {canExplain ? (
        <div className="grid gap-3 rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
            <p className="font-medium">追问</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {followupPrompts.map((prompt) => (
              <button
                key={prompt.type}
                type="button"
                onClick={() => onSendFollowup(prompt.type, prompt.message)}
                disabled={isLoading}
                className="h-9 rounded-md border border-[#2f3b2f]/16 bg-[#fffdf7] px-3 text-sm font-medium text-[#314239] transition hover:bg-[#edf3ea] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {prompt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={followupText}
              onChange={(event) => onFollowupTextChange(event.target.value)}
              maxLength={160}
              className="h-10 min-w-0 flex-1 rounded-md border border-[#2f3b2f]/20 bg-white px-3 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
              placeholder="自由追问"
            />
            <button
              type="button"
              onClick={() => onSendFollowup("free_text", followupText)}
              disabled={isLoading || followupText.trim().length === 0}
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-4 font-medium text-white transition hover:bg-[#1c4c38] disabled:cursor-not-allowed disabled:bg-[#9cad9f]"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              发送
            </button>
          </div>
          {chatMessages.length > 0 ? (
            <div className="grid gap-2">
              {chatMessages.slice(-4).map((message) => (
                <p
                  key={message.id}
                  className={`rounded-md p-2 ${
                    message.role === "user" ? "bg-[#edf3ea] text-[#314239]" : "bg-[#fff9e8] text-[#314239]"
                  }`}
                >
                  {message.content}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {output ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onFeedback("helpful")}
            aria-pressed={feedback === "helpful"}
            className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
              feedback === "helpful"
                ? "border-[#245f46] bg-[#245f46] text-white"
                : "border-[#2f3b2f]/16 bg-white text-[#314239] hover:bg-[#edf3ea]"
            }`}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden="true" />
            有帮助
          </button>
          <button
            type="button"
            onClick={() => onFeedback("off")}
            aria-pressed={feedback === "off"}
            className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
              feedback === "off"
                ? "border-[#8f3b2f] bg-[#8f3b2f] text-white"
                : "border-[#2f3b2f]/16 bg-white text-[#314239] hover:bg-[#edf3ea]"
            }`}
          >
            <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            不准确
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AiOutputList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3">
      <p className="font-medium">{title}</p>
      <ul className="mt-1 grid gap-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceList({ title, nodes }: { title: string; nodes: EvidenceNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="font-medium">{title}</p>
      {nodes.map((node) => (
        <article key={node.id} className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#245f46] px-2 py-0.5 text-xs font-medium text-white">{node.rule_id}</span>
            <span className="font-medium">{node.title}</span>
            <span className="text-xs text-[#6a675c]">置信度 {node.confidence}</span>
          </div>
          <p className="mt-2">{node.conclusion}</p>
          <p className="mt-1 text-xs leading-5 text-[#6a675c]">{node.premise}</p>
          <p className="mt-1 text-xs leading-5 text-[#6a675c]">来源：{node.source_refs.join("；")}</p>
        </article>
      ))}
    </div>
  );
}

function ChartMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
      <p className="text-sm text-[#6a675c]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#171814]">{value}</p>
    </div>
  );
}

async function readSseEvents(response: Response, onEvent: (event: AiStreamEvent) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("流式响应不可用");
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      const event = parseSseBlock(block);
      if (event) onEvent(event);
      boundary = buffer.indexOf("\n\n");
    }
  }

  const tail = buffer.trim();
  if (tail) {
    const event = parseSseBlock(tail);
    if (event) onEvent(event);
  }
}

function parseSseBlock(block: string): AiStreamEvent | null {
  const lines = block.split(/\r?\n/);
  const eventType = lines.find((line) => line.startsWith("event: "))?.slice("event: ".length);
  const data = lines
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice("data: ".length))
    .join("\n");
  if (!eventType || !data) return null;
  return { type: eventType, data: JSON.parse(data) } as AiStreamEvent;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function toAiDeltaLabel(field: AiDelta["field"]): string {
  const labels: Record<AiDelta["field"], string> = {
    summary: "总结",
    key_evidence: "关键证据",
    counter_evidence: "反证",
    action_tips: "行动提示",
    safety_notice: "安全提示",
  };
  return labels[field];
}

function rollCoins(): LineValue {
  const total = Array.from({ length: 3 }, () => (Math.random() > 0.5 ? 3 : 2)).reduce((sum, value) => sum + value, 0);
  return total as LineValue;
}

function getAnonymousId(): string {
  const existing = window.localStorage.getItem("yiwen-liuyao-anonymous-id");
  if (existing) return existing;
  const next = `anon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem("yiwen-liuyao-anonymous-id", next);
  return next;
}

function getTodayCivilDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentSettlementPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toHistoryItem(castPayload: CastResult, question: string, scenario: string): HistoryItem {
  return {
    reading_id: castPayload.reading_id,
    question_preview: question.length > 18 ? `${question.slice(0, 18)}...` : question,
    scenario,
    cast_method: castPayload.cast_method,
    base_chart: castPayload.base_chart.name,
    changed_chart: castPayload.changed_chart.name,
    cast_time: castPayload.cast_time,
    day_ganzhi: castPayload.day_ganzhi,
    month_branch: castPayload.month_branch,
    month_source: castPayload.month_source,
    created_at: new Date().toISOString(),
  };
}
