"use client";

import Image from "next/image";
import {
  BookOpen,
  Copy,
  Coins,
  Download,
  Eye,
  FileText,
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
  Smartphone,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  GraduationCap,
  Gauge,
  Upload,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type LineValue = 6 | 7 | 8 | 9;
type CastMethod = "coin" | "manual" | "time";
type WorkbenchModule = "cast" | "learning" | "history" | "growth" | "community" | "privacy";
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
type LearningContext = {
  scenario: (typeof scenarios)[number];
  ruleId?: string;
  term?: string;
  difficulty?: LearningExercise["difficulty"];
};
type LearningPathSectionId = "foundation" | "symbols" | "strength" | "evidence" | "practice";
export type LearningPathNode = {
  id: string;
  sectionId: LearningPathSectionId;
  title: string;
  term: string;
  ruleId: string;
  summary: string;
  core: string;
  example: string;
  counterExample: string;
  practicePrompt: string;
  scenario: (typeof scenarios)[number];
  difficulty: LearningExercise["difficulty"];
};
type LearningPathSection = {
  id: LearningPathSectionId;
  title: string;
  summary: string;
};
export type LearningNodeStatus = "locked" | "current" | "completed";
type EvidenceSectionId = "keyEvidence" | "counterEvidence" | "actionTips";
type EvidenceExpansionState = Record<EvidenceSectionId, boolean>;
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
type LearningTerm = {
  id: string;
  term: string;
  rule_id: string;
  scenario?: string;
  definition: string;
  example?: string;
  counter_example?: string;
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
type MemberProgress = {
  membership: {
    tier: "free" | "member";
    entitlements: string[];
  };
  favorites: string[];
  tags: Record<string, string[]>;
  learning_progress: Array<{ subject_id: string; subject_type: string; badge?: string; score?: number }>;
};
type AuthPrincipal = {
  kind: "anonymous" | "user" | "admin";
  user_id: string | null;
  anonymous_id: string | null;
  email: string | null;
  roles: Array<"user" | "admin">;
  session_id: string | null;
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
type CreatorExportType = CreatorExportResult["export_type"];
type CreatorSourceType = "reading" | "case";
type CreatorMaterialRequest = {
  sourceType: CreatorSourceType;
  exportType: CreatorExportType;
  caseId?: string;
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
  status: "queued" | "processing" | "completed" | "failed";
  export_format: "json" | "csv";
  includes_raw_question_text: false;
  includes_private_followups: false;
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
  { value: "light", label: "大白话" },
  { value: "professional", label: "专业版" },
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

const moduleLinks = [
  { id: "cast", label: "起卦", icon: PenLine },
  { id: "learning", label: "学习", icon: GraduationCap },
  { id: "history", label: "历史", icon: History },
  { id: "growth", label: "案例", icon: BookOpen },
  { id: "community", label: "社区", icon: Users },
  { id: "privacy", label: "隐私设置", icon: ShieldCheck },
] as const;

const creatorMaterialTypes: Array<{ value: CreatorExportType; label: string; description: string }> = [
  { value: "article", label: "图文提纲", description: "适合公众号、小红书或课程讲义。" },
  { value: "short_video_script", label: "短视频脚本", description: "适合口播、分镜和结尾提示。" },
  { value: "long_image", label: "长图结构", description: "适合知识卡长图和图文拆解。" },
  { value: "chart_snapshot", label: "排盘图结构稿", description: "输出可复制的排盘信息结构。" },
];

export const learningPathSections: LearningPathSection[] = [
  { id: "foundation", title: "入门基础", summary: "先把起卦、阴阳动静、用神、世应、日月、动变建立起来。" },
  { id: "symbols", title: "六亲取象", summary: "理解父母、兄弟、子孙、妻财、官鬼在不同场景里的角色。" },
  { id: "strength", title: "旺衰生克", summary: "学习月建、日辰、旬空、冲破等怎样影响证据强弱。" },
  { id: "evidence", title: "证据树读法", summary: "把支持、反证、置信度和安全边界组织成可复盘的判断。" },
  { id: "practice", title: "场景实战", summary: "用事业、财务、感情、考试、失物和独立读盘做综合练习。" },
];

export const learningPathNodes: LearningPathNode[] = [
  {
    id: "learn-cast-values",
    sectionId: "foundation",
    title: "起卦四值",
    term: "起卦",
    ruleId: "B-YS-001",
    summary: "先认识 6、7、8、9 四种爻值，区分阴阳、动静和从初爻到上爻的顺序。",
    core: "三枚铜钱相加只会得到 6、7、8、9。6 与 8 属阴，7 与 9 属阳；6 与 9 是动爻，会生成变卦。",
    example: "三枚全背为 6 老阴，一正两背为 7 少阳，两正一背为 8 少阴，三枚全正为 9 老阳。",
    counterExample: "不要把 7、8 看成低级结果，它们是最常见的静爻，概率本来就高。",
    practicePrompt: "请说出 6、7、8、9 分别对应阴阳和动静。",
    scenario: "事业",
    difficulty: "beginner",
  },
  {
    id: "learn-yin-yang-moving",
    sectionId: "foundation",
    title: "阴阳动静",
    term: "动爻",
    ruleId: "B-DV-001",
    summary: "理解少阴少阳是静爻，老阴老阳是动爻，后续证据树会优先关注变化线索。",
    core: "静爻看当前结构，动爻看变化方向。动爻不一定代表好坏，它只说明这条线正在变化，需要接着看变爻。",
    example: "用神发动时，先看它变出什么，再看变爻对用神是回头生、回头克还是泄耗。",
    counterExample: "不能看到动爻就直接判断事情一定会成，也不能看到静爻就认为毫无变化。",
    practicePrompt: "从一个有动爻的卦里指出哪条是变化线索，并说明为什么。",
    scenario: "其他",
    difficulty: "intermediate",
  },
  {
    id: "learn-yongshen",
    sectionId: "foundation",
    title: "取用神",
    term: "用神",
    ruleId: "B-YS-001",
    summary: "把问题类型转成主观察对象，例如事业常看官鬼，财务常看妻财。",
    core: "用神是本次问题的主观察对象。先确定问题类型，再把它映射到六亲、世应或具体爻位。",
    example: "求职面试常以官鬼为岗位和录取压力，同时参考父母文书、世应互动。",
    counterExample: "不能所有问题都固定看一个用神；财务、考试、感情、失物的主线不同。",
    practicePrompt: "给出事业、财务、考试三个问题，分别选出最优先观察的用神。",
    scenario: "事业",
    difficulty: "beginner",
  },
  {
    id: "learn-shiying",
    sectionId: "foundation",
    title: "世应关系",
    term: "世应",
    ruleId: "B-SY-001",
    summary: "用世爻和应爻观察自己、对方或外部环境之间的互动。",
    core: "世爻常看自己或提问者，应爻常看对方、外部环境或事情所面对的一端。",
    example: "感情问题里，世应相生可视作互动顺畅，世应相冲则提示关系张力。",
    counterExample: "不能只凭世应相生就保证关系成功，还要看用神、动爻和现实边界。",
    practicePrompt: "指出世爻和应爻分别代表什么，并描述两者互动。",
    scenario: "感情",
    difficulty: "intermediate",
  },
  {
    id: "learn-day-month",
    sectionId: "foundation",
    title: "日月旺衰",
    term: "月建",
    ruleId: "B-WR-001",
    summary: "用月建看阶段环境，用日辰看短期触发，不单凭一项下结论。",
    core: "月建像阶段环境，日辰像短期触发。用神得月日生扶通常更有力，受冲克则要保留。",
    example: "用神临月建或得月生日扶，可作为强证据；同时被动爻克制则要加入反证。",
    counterExample: "不能只看月建旺就下结论，动变、空亡、世应都会改变判断。",
    practicePrompt: "判断一个用神是否得月日支持，并写出支持或削弱理由。",
    scenario: "考试",
    difficulty: "intermediate",
  },
  {
    id: "learn-moving-change",
    sectionId: "foundation",
    title: "动爻变爻",
    term: "变爻",
    ruleId: "B-DV-001",
    summary: "观察动爻带来的变化、回头生克和反证，形成更完整的学习判断。",
    core: "动爻生成变爻，变爻用来观察事情下一步走向。重点看它对用神、世应和原局的影响。",
    example: "用神发动化回头生，是增强线索；化回头克，则是明显保留。",
    counterExample: "不能只看变卦名字断事，必须回到具体动爻和变爻关系。",
    practicePrompt: "选一条动爻，说明它变出后对用神是增强还是削弱。",
    scenario: "财务",
    difficulty: "intermediate",
  },
  {
    id: "learn-six-relatives",
    sectionId: "symbols",
    title: "六亲总览",
    term: "六亲",
    ruleId: "B-YS-001",
    summary: "认识父母、兄弟、子孙、妻财、官鬼在不同问题里的常见含义。",
    core: "六亲不是固定吉凶，而是把现实问题拆成角色：文书、竞争、产出、资源、压力。",
    example: "考试看父母文书，求财看妻财资源，求职看官鬼岗位。",
    counterExample: "不能看到官鬼就只理解为坏事，求职场景里它可能正是岗位和录取压力。",
    practicePrompt: "把父母、兄弟、子孙、妻财、官鬼各写一个现实含义。",
    scenario: "其他",
    difficulty: "beginner",
  },
  {
    id: "learn-fumu-docs",
    sectionId: "symbols",
    title: "父母与文书",
    term: "父母",
    ruleId: "B-YS-001",
    summary: "父母常对应材料、证件、流程、规则、学习内容和保护性资源。",
    core: "父母爻常看文书、手续、证件、合同、学习材料，也可看流程是否顺畅。",
    example: "考试、面试材料、合同流程中，父母旺相可提示文书线索较稳。",
    counterExample: "不能把父母旺直接等同成功，还要看主用神是否受益。",
    practicePrompt: "在考试问题里说明为什么父母爻重要。",
    scenario: "考试",
    difficulty: "beginner",
  },
  {
    id: "learn-brothers-competition",
    sectionId: "symbols",
    title: "兄弟与竞争",
    term: "兄弟",
    ruleId: "B-YS-001",
    summary: "兄弟常看同类、竞争者、分走资源的人或成本消耗。",
    core: "兄弟不一定是坏，但在求财和竞争场景里常代表消耗、分担或同类竞争。",
    example: "求财时兄弟旺，可能提示成本、分账或竞争者强。",
    counterExample: "合作问题里兄弟也可能代表同伴支持，不能机械判凶。",
    practicePrompt: "说明求财和合作场景中兄弟含义有什么不同。",
    scenario: "财务",
    difficulty: "intermediate",
  },
  {
    id: "learn-zisun-output",
    sectionId: "symbols",
    title: "子孙与产出",
    term: "子孙",
    ruleId: "B-DV-001",
    summary: "子孙常看产出、表达、方案、结果呈现，也可制约官鬼压力。",
    core: "子孙代表表达、成果、创造、放松，也常用来观察能否化解官鬼压力。",
    example: "面试中子孙可看表达发挥，考试中可看作答输出。",
    counterExample: "子孙强不一定万事顺利，如果它克制了需要的官鬼线索，也要谨慎。",
    practicePrompt: "在面试问题里找出子孙可能代表的现实动作。",
    scenario: "事业",
    difficulty: "intermediate",
  },
  {
    id: "learn-caixing-resource",
    sectionId: "symbols",
    title: "妻财与资源",
    term: "妻财",
    ruleId: "B-YS-001",
    summary: "妻财常看钱、资源、物品、收益、客户，也可能是感情问题中的对象线索。",
    core: "妻财在财务和失物问题里常是主线，在其他场景里可代表资源和可获得物。",
    example: "问奖金、项目回款、丢失物品时，妻财爻通常优先进入证据树。",
    counterExample: "感情问题不能默认妻财就是唯一对象，要结合提问者身份和世应。",
    practicePrompt: "给出财务和失物两个场景，说明妻财各自代表什么。",
    scenario: "财务",
    difficulty: "beginner",
  },
  {
    id: "learn-guangui-pressure",
    sectionId: "symbols",
    title: "官鬼与压力",
    term: "官鬼",
    ruleId: "B-YS-001",
    summary: "官鬼可看岗位、规则、压力、疾病风险、约束，具体含义随场景变化。",
    core: "官鬼不是固定坏词。事业可看岗位，考试可看压力，风险问题则需谨慎提示。",
    example: "求职看官鬼为岗位和录用标准，官鬼得生可能代表岗位线索较清楚。",
    counterExample: "不能把官鬼旺直接说成一定升职，现实流程仍需验证。",
    practicePrompt: "解释为什么事业场景会优先看官鬼。",
    scenario: "事业",
    difficulty: "beginner",
  },
  {
    id: "learn-wuxing-birth",
    sectionId: "strength",
    title: "五行生克",
    term: "生克",
    ruleId: "B-WR-001",
    summary: "用五行生克理解支持、消耗、制约和阻力的基础关系。",
    core: "相生表示支持或转化，相克表示约束或冲突。它是证据，不是单独结论。",
    example: "月建生用神，可记为环境支持；忌神克用神，可记为压力来源。",
    counterExample: "不能把相克一律判坏，有些问题需要克制风险或约束过强因素。",
    practicePrompt: "写出一个相生支持和一个相克制约的例子。",
    scenario: "其他",
    difficulty: "beginner",
  },
  {
    id: "learn-wangshuai-source",
    sectionId: "strength",
    title: "旺衰来源",
    term: "旺衰",
    ruleId: "B-WR-001",
    summary: "分清月建、日辰、动爻、变爻分别从哪里给用神加分或减分。",
    core: "旺衰不是单一分数，而是多条来源叠加：月日、动变、空破、合冲都可能影响。",
    example: "用神得月生但被动爻克，结论应写成有基础但存在阻力。",
    counterExample: "不能只凭一个旺字忽略反证。",
    practicePrompt: "列出判断旺衰时至少三种需要检查的来源。",
    scenario: "考试",
    difficulty: "intermediate",
  },
  {
    id: "learn-month-branch",
    sectionId: "strength",
    title: "月建环境",
    term: "月建",
    ruleId: "B-WR-001",
    summary: "月建代表当前阶段的大环境，是判断用神是否得势的重要依据。",
    core: "月建像季节和背景条件，常用于判断某条线索在当前阶段是否有力。",
    example: "用神与月建同类或得月建生扶，通常可作为关键依据。",
    counterExample: "月建强不代表马上发生，短期触发还要看日辰和动爻。",
    practicePrompt: "说明月建和日辰在时间感上的差异。",
    scenario: "其他",
    difficulty: "intermediate",
  },
  {
    id: "learn-day-trigger",
    sectionId: "strength",
    title: "日辰触发",
    term: "日辰",
    ruleId: "B-HC-001",
    summary: "日辰常看短期触发、冲合、填实和当天层面的影响。",
    core: "日辰比月建更偏短期，适合观察当前触发点和细节变化。",
    example: "用神旬空而日辰冲空，有时可作为短期被触发的学习线索。",
    counterExample: "不能只用日辰推断长期趋势。",
    practicePrompt: "找一个日辰对用神产生影响的例子。",
    scenario: "其他",
    difficulty: "intermediate",
  },
  {
    id: "learn-empty-void",
    sectionId: "strength",
    title: "旬空保留",
    term: "旬空",
    ruleId: "B-XK-001",
    summary: "旬空提示线索暂时不实、不落地或需要等待条件补足。",
    core: "关键爻落旬空时，通常要作为反证或保留，不宜直接给确定承诺。",
    example: "用神旺但旬空，可写成有条件但暂未落实。",
    counterExample: "不能见旬空就判无望，填实、冲空或后续动变可能改变。",
    practicePrompt: "解释为什么旬空适合放在反证区。",
    scenario: "其他",
    difficulty: "advanced",
  },
  {
    id: "learn-break-clash",
    sectionId: "strength",
    title: "冲破与摇动",
    term: "冲破",
    ruleId: "B-HC-001",
    summary: "冲、破常提示不稳定、变化、冲突或原有结构被打开。",
    core: "冲破不是固定坏，它提示关系被触动。要看被冲的是用神、忌神还是阻力。",
    example: "忌神被冲，可能是阻力被打开；用神被冲，则可能是不稳。",
    counterExample: "不能看到冲就统一判失败。",
    practicePrompt: "区分用神被冲和忌神被冲的不同含义。",
    scenario: "其他",
    difficulty: "advanced",
  },
  {
    id: "learn-evidence-order",
    sectionId: "evidence",
    title: "证据树顺序",
    term: "证据树",
    ruleId: "B-YS-001",
    summary: "按问题类型、用神、旺衰、动变、反证的顺序组织判断。",
    core: "证据树的目的不是堆术语，而是让用户知道每条判断从哪里来。",
    example: "先写用神为什么选，再写它是否得月日，再写动变和反证。",
    counterExample: "不能先给结论再硬找依据。",
    practicePrompt: "把一次分析拆成三条关键依据和一条反证。",
    scenario: "事业",
    difficulty: "intermediate",
  },
  {
    id: "learn-key-counter",
    sectionId: "evidence",
    title: "关键依据与反证",
    term: "反证",
    ruleId: "B-XK-001",
    summary: "学会同时展示支持判断的依据和需要保留的反向线索。",
    core: "好学习页必须让用户看到为什么支持，也看到哪里不能过度确定。",
    example: "用神得月生是支持，关键爻旬空就是保留。",
    counterExample: "只展示支持证据会把学习变成占断承诺。",
    practicePrompt: "为同一卦象写一条支持和一条保留。",
    scenario: "其他",
    difficulty: "intermediate",
  },
  {
    id: "learn-confidence",
    sectionId: "evidence",
    title: "置信度表达",
    term: "置信度",
    ruleId: "B-YS-001",
    summary: "把证据强弱表达成倾向、保留和不确定，而不是绝对预测。",
    core: "置信度来自证据数量、方向一致性和反证强弱。它帮助用户理解判断边界。",
    example: "多条证据同向且反证弱，可写成倾向较强；证据混杂则写成需要观察。",
    counterExample: "不能用 100% 或必然成败表达传统文化学习内容。",
    practicePrompt: "把一句绝对判断改写成带置信度的表达。",
    scenario: "其他",
    difficulty: "intermediate",
  },
  {
    id: "learn-safety-boundary",
    sectionId: "evidence",
    title: "安全边界",
    term: "安全",
    ruleId: "B-YS-001",
    summary: "医疗、法律、投资、自伤、未成年人等问题要优先安全提示。",
    core: "学习功能不能诱导现实高风险决策。高风险问题只能做文化学习和问题整理。",
    example: "投资问题应提示不构成建议，并鼓励咨询专业人士。",
    counterExample: "不能承诺收益、疾病结果、诉讼结果或改运消灾。",
    practicePrompt: "把一个高风险问题改写成安全的学习提示。",
    scenario: "其他",
    difficulty: "beginner",
  },
  {
    id: "learn-ai-explain",
    sectionId: "evidence",
    title: "AI 解读读法",
    term: "学习版",
    ruleId: "B-YS-001",
    summary: "理解大白话、专业版、学习版、剧情版的区别，重点看证据而非文风。",
    core: "同一证据可用不同文风表达。学习时优先看规则编号、依据和反证。",
    example: "学习版会解释为什么这条规则进入证据树，而不是只给结论。",
    counterExample: "不要把文风更像真的当成证据更强。",
    practicePrompt: "比较大白话和学习版，同一条证据有什么不同表达。",
    scenario: "其他",
    difficulty: "beginner",
  },
  {
    id: "learn-review-reading",
    sectionId: "evidence",
    title: "复盘一卦",
    term: "复盘",
    ruleId: "B-YS-001",
    summary: "用问题、卦盘、证据树、AI 解读和现实反馈做一次完整复盘。",
    core: "复盘要记录当时问题、证据、现实动作和后续反馈，避免只记结论。",
    example: "面试后记录流程推进、沟通反馈、准备动作，再回看证据是否合理。",
    counterExample: "不能只在结果符合时说准，不符合时忽略反证。",
    practicePrompt: "写一个复盘模板：问题、依据、反证、行动、反馈。",
    scenario: "事业",
    difficulty: "advanced",
  },
  {
    id: "learn-career-case",
    sectionId: "practice",
    title: "事业案例",
    term: "官鬼",
    ruleId: "B-YS-001",
    summary: "用官鬼、父母、世应、子孙四条线拆解事业与面试问题。",
    core: "事业案例优先看岗位线索，再看材料流程、互动关系和表达发挥。",
    example: "官鬼为岗位，父母为简历流程，子孙为表达输出，世应看双方互动。",
    counterExample: "不能只看官鬼旺就说录用，流程和竞争仍需观察。",
    practicePrompt: "按四条线拆解一个面试问题。",
    scenario: "事业",
    difficulty: "intermediate",
  },
  {
    id: "learn-money-case",
    sectionId: "practice",
    title: "财务案例",
    term: "妻财",
    ruleId: "B-YS-001",
    summary: "用妻财、兄弟、子孙和日月观察资源、收益、成本和产出。",
    core: "财务案例要同时看财爻是否有力、是否被兄弟耗、是否有产出来源。",
    example: "财爻得生日扶但兄弟旺，可能是有机会但成本或分成较高。",
    counterExample: "不能把财爻出现就说一定赚钱。",
    practicePrompt: "写出求财问题的三条观察线。",
    scenario: "财务",
    difficulty: "intermediate",
  },
  {
    id: "learn-relationship-case",
    sectionId: "practice",
    title: "感情案例",
    term: "世应",
    ruleId: "B-SY-001",
    summary: "用世应互动、用神选择和反证边界学习关系类问题。",
    core: "感情案例更需要避免绝对承诺，重点看互动状态、沟通阻力和现实边界。",
    example: "世应相生可作为互动顺畅，若关键爻旬空则要写保留。",
    counterExample: "不能承诺对方一定回来、一定分手或一定结婚。",
    practicePrompt: "把感情问题改写成学习型分析，不做承诺。",
    scenario: "感情",
    difficulty: "intermediate",
  },
  {
    id: "learn-exam-case",
    sectionId: "practice",
    title: "考试案例",
    term: "父母",
    ruleId: "B-YS-001",
    summary: "用父母、官鬼、子孙和日月拆解考试、证书、文书问题。",
    core: "考试案例常看父母文书和知识准备，官鬼看压力标准，子孙看作答输出。",
    example: "父母旺且子孙有力，可写成材料和发挥都有支撑。",
    counterExample: "不能把卦象当成替代复习或报名流程的依据。",
    practicePrompt: "列出考试类问题的主线和辅助线。",
    scenario: "考试",
    difficulty: "intermediate",
  },
  {
    id: "learn-lost-item-case",
    sectionId: "practice",
    title: "失物案例",
    term: "失物",
    ruleId: "B-YS-001",
    summary: "用财爻、内外卦、动爻和空亡学习失物问题的观察方式。",
    core: "失物案例要把卦象当作整理搜索线索的工具，而不是保证找回。",
    example: "财爻在内卦可提示先查近处，动爻提示位置或状态变化。",
    counterExample: "不能承诺一定找回，也不能让用户放弃现实查找。",
    practicePrompt: "把失物问题拆成近处、远处、变化、现实行动四项。",
    scenario: "失物",
    difficulty: "advanced",
  },
  {
    id: "learn-independent-reading",
    sectionId: "practice",
    title: "独立读盘",
    term: "证据树",
    ruleId: "B-YS-001",
    summary: "完成一次从问题到证据树再到安全提示的完整独立练习。",
    core: "独立读盘的目标是结构完整：问题分类、用神、旺衰、动变、反证、行动提示。",
    example: "先写问题类型，再列三条依据、一条反证、两条现实行动。",
    counterExample: "不能跳过反证和安全边界直接给断语。",
    practicePrompt: "任选一个问题，写出完整学习型证据树。",
    scenario: "其他",
    difficulty: "advanced",
  },
];

export const defaultEvidenceExpansion: EvidenceExpansionState = {
  keyEvidence: false,
  counterEvidence: false,
  actionTips: false,
};

export function toggleEvidenceSection(
  current: EvidenceExpansionState,
  section: EvidenceSectionId,
): EvidenceExpansionState {
  return {
    ...current,
    [section]: !current[section],
  };
}

export function ReadingWorkbench() {
  const [activeModule, setActiveModule] = useState<WorkbenchModule>("cast");
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
  const [pendingDeleteHistory, setPendingDeleteHistory] = useState<HistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [explainMode, setExplainMode] = useState<ExplainMode>("light");
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
  const [selectedLearningNodeId, setSelectedLearningNodeId] = useState(learningPathNodes[0].id);
  const [authPrincipal, setAuthPrincipal] = useState<AuthPrincipal | null>(null);
  const [memberProgress, setMemberProgress] = useState<MemberProgress | null>(null);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [isV1Loading, setIsV1Loading] = useState(false);
  const [v1Error, setV1Error] = useState<string | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [creatorExport, setCreatorExport] = useState<CreatorExportResult | null>(null);
  const [isCreatorGenerating, setIsCreatorGenerating] = useState(false);
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

  const activeLineValues = useMemo(
    () => (castMethod === "coin" ? coinValues : castMethod === "manual" ? manualValues : []),
    [castMethod, coinValues, manualValues],
  );
  const canCast = question.trim().length >= 2 && (castMethod === "time" || activeLineValues.length === 6) && !isLoading;
  const learningNodeStatuses = useMemo(
    () => getLearningNodeStatuses(learningPathNodes, memberProgress?.learning_progress ?? []),
    [memberProgress],
  );
  const selectedLearningNode =
    learningPathNodes.find((node) => node.id === selectedLearningNodeId && learningNodeStatuses[node.id] !== "completed") ??
    learningPathNodes.find((node) => learningNodeStatuses[node.id] === "current") ??
    learningPathNodes[0];
  const completedLearningNodeCount = learningPathNodes.filter((node) => learningNodeStatuses[node.id] === "completed").length;

  const refreshV1Data = useCallback(async (context: LearningContext = getLearningContextForNode(selectedLearningNode)) => {
    setIsV1Loading(true);
    setV1Error(null);
    try {
      const primaryTermsUrl = buildLearningUrl("/api/learning/terms", context, 6);
      const primaryExercisesUrl = buildLearningUrl("/api/learning/exercises", context, 4);
      const [termsResponse, exercisesResponse, progressResponse] = await Promise.all([
        fetch(primaryTermsUrl, { method: "GET" }),
        fetch(primaryExercisesUrl, { method: "GET" }),
        fetch("/api/me/progress", { method: "GET" }),
      ]);
      if (!termsResponse.ok || !exercisesResponse.ok || !progressResponse.ok) {
        throw new Error("V1.0 数据加载失败");
      }
      let termsPayload = (await termsResponse.json()) as { terms: LearningTerm[] };
      let exercisesPayload = (await exercisesResponse.json()) as { exercises: LearningExercise[] };
      if (context.ruleId && (termsPayload.terms.length === 0 || exercisesPayload.exercises.length === 0)) {
        const resolvedContext = { scenario: context.scenario };
        const [fallbackTermsResponse, fallbackExercisesResponse] = await Promise.all([
          fetch(buildLearningUrl("/api/learning/terms", resolvedContext, 6), { method: "GET" }),
          fetch(buildLearningUrl("/api/learning/exercises", resolvedContext, 4), { method: "GET" }),
        ]);
        if (!fallbackTermsResponse.ok || !fallbackExercisesResponse.ok) {
          throw new Error("V1.0 数据加载失败");
        }
        termsPayload = (await fallbackTermsResponse.json()) as { terms: LearningTerm[] };
        exercisesPayload = (await fallbackExercisesResponse.json()) as { exercises: LearningExercise[] };
      }
      setLearningTerms(termsPayload.terms);
      setLearningExercises(exercisesPayload.exercises);
      setMemberProgress((await progressResponse.json()) as MemberProgress);
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "V1.0 数据加载失败");
    } finally {
      setIsV1Loading(false);
    }
  }, [selectedLearningNode]);

  const isAdmin = authPrincipal?.roles.includes("admin") ?? false;

  useEffect(() => {
    async function refreshAuthPrincipal() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: { "x-anonymous-id": getAnonymousId() },
        });
        if (!response.ok) throw new Error("auth load failed");
        const payload = (await response.json()) as { principal: AuthPrincipal };
        setAuthPrincipal(payload.principal);
      } catch {
        setAuthPrincipal({
          kind: "anonymous",
          user_id: null,
          anonymous_id: getAnonymousId(),
          email: null,
          roles: [],
          session_id: null,
        });
      }
    }

    void refreshAuthPrincipal();
  }, []);

  useEffect(() => {
    if (!authPrincipal) return;
    if (activeModule === "learning") {
      queueMicrotask(() => void refreshV1Data(getLearningContextForNode(selectedLearningNode)));
      return;
    }
    if (activeModule === "history") {
      void refreshHistory();
      return;
    }
    if (activeModule === "growth") {
      void refreshV15Data();
      return;
    }
    if (activeModule === "community") {
      void refreshV2Data();
      void refreshV3Data();
      return;
    }
    if (activeModule === "privacy") {
      void refreshV35Data();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, authPrincipal, refreshV1Data, selectedLearningNode]);

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

  function changeCastMethod(method: CastMethod) {
    setCastMethod(method);
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
        body: JSON.stringify(
          castMethod === "time"
            ? {
                reading_id: initPayload.reading_id,
                cast_method: castMethod,
                cast_time: castDate || getTodayCivilDate(),
              }
            : {
                reading_id: initPayload.reading_id,
                cast_method: castMethod,
                line_values: activeLineValues,
                cast_time: castDate || getTodayCivilDate(),
              },
        ),
      });

      if (!castResponse.ok) throw new Error("排盘失败");
      const castPayload = (await castResponse.json()) as CastResult;
      setResult(castPayload);
      recordLocalHistory(toHistoryItem(castPayload, question, scenario));
      await refreshHistory();
      const analysisPayload = await requestAnalysis(initPayload.reading_id);
      if (analysisPayload) {
        await refreshV1Data(getLearningContext(analysisPayload, scenario));
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
      let finalAnswer = "";
      await readSseEvents(response, (event) => {
        handleAiStreamEvent(event);
        if (event.type === "final") {
          finalAnswer = formatFollowupAnswer(event.data);
        }
      });
      if (finalAnswer) {
        setChatMessages((current) => [
          ...current,
          {
            id: `local-assistant-${Date.now()}`,
            role: "assistant",
            content: finalAnswer,
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
      const [bootstrapResponse, postsResponse, packsResponse] = await Promise.all([
        fetch(`/api/app/bootstrap?platform=web&anonymous_id=${encodeURIComponent(anonymousId)}`, { method: "GET" }),
        fetch("/api/community/posts", { method: "GET" }),
        fetch("/api/rule-packs", { method: "GET" }),
      ]);
      if (!bootstrapResponse.ok || !postsResponse.ok || !packsResponse.ok) {
        throw new Error("V2.0 data load failed");
      }
      const postsPayload = (await postsResponse.json()) as { posts: CommunityPost[] };
      const packsPayload = (await packsResponse.json()) as { rule_packs: RulePack[] };
      setAppBootstrap((await bootstrapResponse.json()) as AppBootstrap);
      setCommunityPosts(postsPayload.posts);
      setRulePacks(packsPayload.rule_packs);
      if (isAdmin) {
        const [queueResponse, metricsResponse] = await Promise.all([
          fetch("/api/admin/review-queue", { method: "GET" }),
          fetch("/api/admin/metrics", { method: "GET" }),
        ]);
        if (!queueResponse.ok || !metricsResponse.ok) throw new Error("V2.0 admin data load failed");
        const queuePayload = (await queueResponse.json()) as { review_queue: ReviewQueueItem[] };
        setReviewQueue(queuePayload.review_queue);
        setAdminMetrics((await metricsResponse.json()) as AdminMetrics);
      } else {
        setReviewQueue([]);
        setAdminMetrics(null);
      }
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
      const [dashboardResponse, submissionsResponse, packagesResponse] = await Promise.all([
        fetch("/api/me/contributor-dashboard", { method: "GET" }),
        fetch("/api/contributor/submissions", { method: "GET" }),
        fetch("/api/ecosystem/packages", { method: "GET" }),
      ]);
      if (!dashboardResponse.ok || !submissionsResponse.ok || !packagesResponse.ok) {
        throw new Error("V3.0 ecosystem data load failed");
      }
      const submissionsPayload = (await submissionsResponse.json()) as { submissions: ContributorSubmission[] };
      const packagesPayload = (await packagesResponse.json()) as { packages: EcosystemPackage[] };
      setContributorDashboard((await dashboardResponse.json()) as ContributorDashboard);
      setContributorSubmissions(submissionsPayload.submissions);
      setEcosystemPackages(packagesPayload.packages);
      if (isAdmin) {
        const metricsResponse = await fetch("/api/admin/ecosystem/metrics", { method: "GET" });
        if (!metricsResponse.ok) throw new Error("V3.0 admin metrics load failed");
        setEcosystemMetrics((await metricsResponse.json()) as EcosystemMetrics);
      } else {
        setEcosystemMetrics(null);
      }
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
      const [revenueResponse, privacyResponse] = await Promise.all([
        fetch("/api/contributor/revenue-preview", { method: "GET" }),
        fetch("/api/me/privacy-settings", { method: "GET" }),
      ]);
      if (!revenueResponse.ok || !privacyResponse.ok) {
        throw new Error("V3.5 operations data load failed");
      }
      setRevenuePreview((await revenueResponse.json()) as RevenuePreview);
      setPrivacySettings((await privacyResponse.json()) as PrivacySettings);
      if (isAdmin) {
        const [
          qualityResponse,
          riskResponse,
          sloResponse,
          incidentsResponse,
          readinessResponse,
          complianceResponse,
          metricsResponse,
        ] = await Promise.all([
          fetch("/api/admin/ecosystem/quality", { method: "GET" }),
          fetch("/api/admin/ecosystem/risk-events", { method: "GET" }),
          fetch("/api/admin/ops/slo", { method: "GET" }),
          fetch("/api/admin/ops/incidents", { method: "GET" }),
          fetch("/api/admin/commercial/readiness", { method: "GET" }),
          fetch("/api/admin/compliance/reviews", { method: "GET" }),
          fetch("/api/admin/ecosystem/metrics", { method: "GET" }),
        ]);
        if (
          !qualityResponse.ok ||
          !riskResponse.ok ||
          !sloResponse.ok ||
          !incidentsResponse.ok ||
          !readinessResponse.ok ||
          !complianceResponse.ok ||
          !metricsResponse.ok
        ) {
          throw new Error("V3.5 admin operations data load failed");
        }
        const riskPayload = (await riskResponse.json()) as { risk_events: EcosystemRiskEvent[] };
        const incidentsPayload = (await incidentsResponse.json()) as { incidents: OpsIncident[] };
        const compliancePayload = (await complianceResponse.json()) as { reviews: ComplianceReview[] };
        setEcosystemQuality((await qualityResponse.json()) as EcosystemQualitySummary);
        setEcosystemRiskEvents(riskPayload.risk_events);
        setOpsSlo((await sloResponse.json()) as OpsSlo);
        setOpsIncidents(incidentsPayload.incidents);
        setCommercialReadiness((await readinessResponse.json()) as CommercialReadiness);
        setComplianceReviews(compliancePayload.reviews);
        setEcosystemMetrics((await metricsResponse.json()) as EcosystemMetrics);
      } else {
        setEcosystemQuality(null);
        setEcosystemRiskEvents([]);
        setOpsSlo(null);
        setOpsIncidents([]);
        setCommercialReadiness(null);
        setComplianceReviews([]);
        setEcosystemMetrics(null);
      }
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

  async function completeLearningNode(node: LearningPathNode) {
    setV1Error(null);
    try {
      const response = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildLearningExerciseProgress(node)),
      });
      if (!response.ok) throw new Error(await readApiError(response, "练习记录失败"));
      await refreshV1Data(getLearningContextForNode(node));
    } catch (requestError) {
      setV1Error(requestError instanceof Error ? requestError.message : "练习记录失败");
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

  async function createCreatorMaterial(request: CreatorMaterialRequest) {
    setV15Error(null);
    setCreatorExport(null);
    setIsCreatorGenerating(true);
    try {
      const requestPayload = buildCreatorExportPayload({
        sourceType: request.sourceType,
        readingId: result?.reading_id,
        caseId: request.caseId,
        exportType: request.exportType,
      });
      const response = await fetch("/api/creator/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (!response.ok) {
        const apiError = await readApiError(response, "创作者素材生成失败");
        throw new Error(response.status === 422 || apiError === "creator_export_blocked" ? "该内容不适合生成传播素材。" : apiError);
      }
      const payload = (await response.json()) as { export: CreatorExportResult };
      setCreatorExport(payload.export);
      await refreshV15Data();
      await refreshV1Data();
    } catch (requestError) {
      setV15Error(requestError instanceof Error ? requestError.message : "创作者素材生成失败");
    } finally {
      setIsCreatorGenerating(false);
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
      setPendingDeleteHistory((current) => (current?.reading_id === readingId ? null : current));
    }
  }

  function selectModule(module: WorkbenchModule) {
    setActiveModule(module);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff6df_0,#f2eadb_36%,#dfeedd_100%)] text-[#171814]">
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

        <nav className="rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-3 shadow-sm" aria-label="主要功能入口">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {moduleLinks.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectModule(id)}
                aria-pressed={activeModule === id}
                className={`flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                  activeModule === id
                    ? "border-[#2f6b4f]/35 bg-[#edf3ea] text-[#245f46] shadow-sm"
                    : "border-[#2f3b2f]/12 bg-[#fffdf7] text-[#314239] hover:bg-[#edf3ea] hover:text-[#245f46]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {activeModule === "cast" ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <section
            id="cast"
            className="scroll-mt-4 rounded-lg border border-[#2f3b2f]/15 bg-white/78 p-4 shadow-sm lg:sticky lg:top-5"
          >
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

            <label className="mt-4 block text-sm font-medium text-[#314239]" htmlFor="explain-mode">
              解读方式
            </label>
            <select
              id="explain-mode"
              value={explainMode}
              onChange={(event) => setExplainMode(event.target.value as ExplainMode)}
              className="mt-2 h-11 w-full rounded-md border border-[#2f3b2f]/20 bg-[#fffdf7] px-3 outline-none transition focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20"
            >
              {explainModes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
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

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg bg-[#edf3ea] p-1">
              <button
                type="button"
                onClick={() => changeCastMethod("coin")}
                className={`flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  castMethod === "coin" ? "bg-white text-[#7a2f24] shadow-sm" : "text-[#314239] hover:bg-white/65"
                }`}
              >
                <Coins className="h-4 w-4" aria-hidden="true" />
                铜钱摇卦
              </button>
              <button
                type="button"
                onClick={() => changeCastMethod("manual")}
                className={`flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  castMethod === "manual" ? "bg-white text-[#7a2f24] shadow-sm" : "text-[#314239] hover:bg-white/65"
                }`}
              >
                <PenLine className="h-4 w-4" aria-hidden="true" />
                手动输入
              </button>
              <button
                type="button"
                onClick={() => changeCastMethod("time")}
                className={`flex h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  castMethod === "time" ? "bg-white text-[#7a2f24] shadow-sm" : "text-[#314239] hover:bg-white/65"
                }`}
              >
                <Gauge className="h-4 w-4" aria-hidden="true" />
                时间起卦
              </button>
            </div>

            {castMethod === "time" ? (
              <div className="mt-4 rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm leading-6 text-[#314239]">
                <p className="font-medium text-[#245f46]">时间起卦 · 轻量体验</p>
                <p className="mt-1">
                  系统会按所选日期生成 6 爻，适合快速体验和学习复盘；它不等同于传统铜钱法，结果仍会经过排盘、证据树、AI 解读和安全边界。
                </p>
              </div>
            ) : castMethod === "coin" ? (
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
        ) : null}

        {activeModule === "learning" ? (
        <div className="scroll-mt-4">
          <LearningPathPanel
            result={result}
            nodes={learningPathNodes}
            selectedNode={selectedLearningNode}
            nodeStatuses={learningNodeStatuses}
            completedCount={completedLearningNodeCount}
            terms={learningTerms}
            exercises={learningExercises}
            selectedCard={selectedLearningCard}
            isLoading={isV1Loading}
            error={v1Error}
            onSelectNode={(node) => setSelectedLearningNodeId(node.id)}
            onOpenLearningCard={(cardId) => void openLearningCard(cardId)}
            onCompleteNode={(node) => void completeLearningNode(node)}
            onRefresh={() => void refreshV1Data(getLearningContextForNode(selectedLearningNode))}
          />
        </div>
        ) : null}

        {activeModule === "growth" ? (
        <div className="scroll-mt-4">
          <V15GrowthPanel
          result={result}
          cases={cases}
          courses={courses}
          courseProgress={courseProgress}
          creatorExport={creatorExport}
          isCreatorGenerating={isCreatorGenerating}
          experimentAssignment={experimentAssignment}
          adminMetrics={adminMetrics}
          isLoading={isV15Loading}
          error={v15Error}
          onOpenCase={(caseId) => void openCase(caseId)}
          onStartCourse={(course) => void startCourse(course)}
          onCreateCreatorMaterial={(request) => void createCreatorMaterial(request)}
          onRefresh={() => void refreshV15Data()}
          />
        </div>
        ) : null}

        {activeModule === "community" ? (
        <div className="grid scroll-mt-4 gap-5">
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
        </div>
        ) : null}

        {activeModule === "privacy" ? (
        <div className="scroll-mt-4">
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
        </div>
        ) : null}

        {activeModule === "history" ? (
        <section className="scroll-mt-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
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
                      onClick={() => setPendingDeleteHistory(item)}
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
          {pendingDeleteHistory ? (
            <div
              className="mt-4 rounded-md border border-[#8f3b2f]/22 bg-[#fff0ec] p-3 text-sm leading-6 text-[#752f26]"
              role="alertdialog"
              aria-labelledby="delete-history-title"
              aria-describedby="delete-history-description"
            >
              <p id="delete-history-title" className="font-semibold">
                确认删除这条历史记录？
              </p>
              <p id="delete-history-description" className="mt-1 text-[#6a3028]">
                {pendingDeleteHistory.question_preview}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setPendingDeleteHistory(null)}
                  className="flex h-9 items-center justify-center rounded-md border border-[#2f3b2f]/20 bg-white px-3 font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => void deleteHistoryItem(pendingDeleteHistory.reading_id)}
                  className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#8f3b2f] px-3 font-semibold text-white transition hover:bg-[#752f26]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  确认删除
                </button>
              </div>
            </div>
          ) : null}
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
        ) : null}
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
              {latestPrivacyExport.includes_raw_question_text ? "on" : "off"} / private followups{" "}
              {latestPrivacyExport.includes_private_followups ? "on" : "off"}
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
  isCreatorGenerating,
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
  isCreatorGenerating: boolean;
  experimentAssignment: ExperimentAssignment | null;
  adminMetrics: AdminMetrics | null;
  isLoading: boolean;
  error: string | null;
  onOpenCase: (caseId: string) => void;
  onStartCourse: (course: CourseSummary) => void;
  onCreateCreatorMaterial: (request: CreatorMaterialRequest) => void;
  onRefresh: () => void;
}) {
  const completedLessonIds = new Set(courseProgress?.progress.filter((item) => item.completed).map((item) => item.lesson_id) ?? []);
  const [creatorSourceType, setCreatorSourceType] = useState<CreatorSourceType | null>(null);
  const [selectedCreatorCaseId, setSelectedCreatorCaseId] = useState(cases[0]?.id ?? "");
  const [selectedCreatorExportType, setSelectedCreatorExportType] = useState<CreatorExportType>("article");
  const [creatorCopyStatus, setCreatorCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const requestedCreatorSource: CreatorSourceType = creatorSourceType ?? getDefaultCreatorSource(Boolean(result), cases.length > 0);
  const effectiveCreatorSource: CreatorSourceType = requestedCreatorSource === "reading" && !result ? "case" : requestedCreatorSource;
  const selectedCreatorCase = cases.find((item) => item.id === selectedCreatorCaseId) ?? cases[0];
  const canGenerateCreatorMaterial =
    !isCreatorGenerating && (effectiveCreatorSource === "reading" ? Boolean(result) : Boolean(selectedCreatorCase));

  function createMaterial() {
    if (!canGenerateCreatorMaterial) return;
    setCreatorCopyStatus("idle");
    onCreateCreatorMaterial({
      sourceType: effectiveCreatorSource,
      exportType: selectedCreatorExportType,
      caseId: effectiveCreatorSource === "case" ? selectedCreatorCase?.id : undefined,
    });
  }

  async function copyCreatorExport() {
    if (!creatorExport) return;
    try {
      await navigator.clipboard.writeText(formatCreatorExportText(creatorExport));
      setCreatorCopyStatus("copied");
    } catch {
      setCreatorCopyStatus("failed");
    }
  }

  function downloadCreatorExport() {
    if (!creatorExport) return;
    const blob = new Blob([formatCreatorExportText(creatorExport)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${creatorExport.id}.md`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

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

          <div className="grid gap-2 rounded-md border border-[#2f3b2f]/12 bg-white p-3">
            <p className="text-xs font-medium text-[#6a675c]">素材来源</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreatorSourceType("reading")}
                disabled={!result}
                aria-pressed={effectiveCreatorSource === "reading"}
                className={`h-9 rounded-md border px-2 text-sm font-medium transition ${
                  effectiveCreatorSource === "reading"
                    ? "border-[#245f46] bg-[#245f46] text-white"
                    : "border-[#2f3b2f]/16 bg-white text-[#314239] hover:bg-[#edf3ea]"
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                当前卦盘
              </button>
              <button
                type="button"
                onClick={() => setCreatorSourceType("case")}
                aria-pressed={effectiveCreatorSource === "case"}
                className={`h-9 rounded-md border px-2 text-sm font-medium transition ${
                  effectiveCreatorSource === "case"
                    ? "border-[#245f46] bg-[#245f46] text-white"
                    : "border-[#2f3b2f]/16 bg-white text-[#314239] hover:bg-[#edf3ea]"
                }`}
              >
                案例库
              </button>
            </div>
            {!result ? <p className="text-xs text-[#8f3b2f]">当前卦盘需先起卦后可用。</p> : null}
            {effectiveCreatorSource === "case" ? (
              <label className="grid gap-1 text-xs text-[#6a675c]">
                选择案例
                <select
                  value={selectedCreatorCase?.id ?? ""}
                  onChange={(event) => setSelectedCreatorCaseId(event.target.value)}
                  disabled={cases.length === 0}
                  className="h-10 rounded-md border border-[#2f3b2f]/20 bg-white px-2 text-sm text-[#171814] outline-none focus:border-[#2f6b4f] focus:ring-2 focus:ring-[#2f6b4f]/20 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {cases.length === 0 ? <option value="">暂无案例</option> : null}
                  {cases.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-medium text-[#6a675c]">素材类型</p>
            <div className="grid grid-cols-2 gap-2">
              {creatorMaterialTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedCreatorExportType(type.value)}
                  aria-pressed={selectedCreatorExportType === type.value}
                  className={`rounded-md border p-2 text-left transition ${
                    selectedCreatorExportType === type.value
                      ? "border-[#7a2f24]/45 bg-[#fff0ec]"
                      : "border-[#2f3b2f]/12 bg-white hover:bg-[#f3f0e8]"
                  }`}
                >
                  <span className="block text-sm font-semibold text-[#171814]">{type.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#6a675c]">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={createMaterial}
            disabled={!canGenerateCreatorMaterial}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38] disabled:cursor-not-allowed disabled:bg-[#9cad9f]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {isCreatorGenerating ? "生成中" : "生成素材"}
          </button>
          {!canGenerateCreatorMaterial && !isCreatorGenerating ? (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-white p-3 text-sm leading-6 text-[#6a675c]">
              暂无可用来源。请先起卦，或刷新案例库后选择一个脱敏案例。
            </p>
          ) : null}

          {creatorExport ? (
            <article className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3 text-sm leading-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{creatorExport.title}</p>
                  <p className="mt-1 text-xs text-[#6a675c]">
                    {toCreatorExportTypeLabel(creatorExport.export_type)} /{" "}
                    {effectiveCreatorSource === "reading" ? "当前卦盘" : `案例库：${selectedCreatorCase?.title ?? "脱敏案例"}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyCreatorExport()}
                    className="flex h-8 items-center gap-1 rounded-md border border-[#2f3b2f]/16 bg-white px-2 text-xs font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    {creatorCopyStatus === "copied" ? "已复制" : creatorCopyStatus === "failed" ? "复制失败" : "复制全文"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadCreatorExport}
                    className="flex h-8 items-center gap-1 rounded-md border border-[#2f3b2f]/16 bg-white px-2 text-xs font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    下载 Markdown
                  </button>
                </div>
              </div>
              <ul className="mt-3 grid gap-2">
                {creatorExport.content_sections.map((section, index) => (
                  <li key={`${creatorExport.id}-${index}`} className="rounded-md border border-[#2f3b2f]/12 bg-white/82 p-2">
                    <span className="text-xs font-semibold text-[#245f46]">{index + 1}</span>
                    <p className="mt-1 whitespace-pre-wrap">{section}</p>
                  </li>
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

function LearningPathPanel({
  result,
  nodes,
  selectedNode,
  nodeStatuses,
  completedCount,
  terms,
  exercises,
  selectedCard,
  isLoading,
  error,
  onSelectNode,
  onOpenLearningCard,
  onCompleteNode,
  onRefresh,
}: {
  result: CastResult | null;
  nodes: LearningPathNode[];
  selectedNode: LearningPathNode;
  nodeStatuses: Record<string, LearningNodeStatus>;
  completedCount: number;
  terms: LearningTerm[];
  exercises: LearningExercise[];
  selectedCard: LearningCardDetail | null;
  isLoading: boolean;
  error: string | null;
  onSelectNode: (node: LearningPathNode) => void;
  onOpenLearningCard: (cardId: string) => void;
  onCompleteNode: (node: LearningPathNode) => void;
  onRefresh: () => void;
}) {
  const activeTerm = terms.find((term) => term.rule_id === selectedNode.ruleId) ?? terms[0];
  const activeExercise =
    exercises.find((exercise) => exercise.answer === selectedNode.ruleId && exercise.difficulty === selectedNode.difficulty) ??
    exercises.find((exercise) => exercise.answer === selectedNode.ruleId);
  const selectedStatus = nodeStatuses[selectedNode.id] ?? "current";
  const progressLabel = `${completedCount}/${nodes.length}`;
  const [expandedLearningSections, setExpandedLearningSections] = useState<Record<LearningPathSectionId, boolean>>(() =>
    Object.fromEntries(learningPathSections.map((section) => [section.id, false])) as Record<LearningPathSectionId, boolean>,
  );
  const selectedSection = learningPathSections.find((section) => section.id === selectedNode.sectionId) ?? learningPathSections[0];

  function selectLearningNode(node: LearningPathNode) {
    setExpandedLearningSections((current) =>
      current[node.sectionId] ? current : { ...current, [node.sectionId]: true },
    );
    onSelectNode(node);
  }

  return (
    <section className="grid gap-4 rounded-lg border border-[#2f3b2f]/15 bg-white/82 p-4 shadow-sm">
      <div className="grid gap-4 rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-start gap-3">
          <GraduationCap className="mt-1 h-5 w-5 shrink-0 text-[#245f46]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[#245f46]">{result ? "基于当前卦推荐" : "入门推荐路径"}</p>
            <h2 className="mt-1 text-xl font-semibold text-[#171814]">六爻系统学习路径</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#314239]">
              从起卦基础到六亲、旺衰、证据树和实战复盘，按章节逐步推进。每节都有核心知识、例子、反例和练习。
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[26rem]">
          <MiniMetric label="路径进度" value={progressLabel} />
          <MiniMetric label="章节" value={`${learningPathSections.length} 章`} />
          <button
            type="button"
            onClick={() => selectLearningNode(nodes.find((node) => nodeStatuses[node.id] === "current") ?? selectedNode)}
            className="flex h-full min-h-14 items-center justify-center rounded-md bg-[#245f46] px-3 text-sm font-semibold text-white transition hover:bg-[#1c4c38]"
          >
            继续学习
          </button>
        </div>
      </div>

      {error ? <p className="rounded-md bg-[#fff0ec] p-3 text-sm text-[#8f3b2f]">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
              <p className="font-medium">课程目录</p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-8 items-center justify-center gap-1 rounded-md border border-[#2f3b2f]/20 bg-white px-2 text-xs font-medium text-[#314239] transition hover:bg-[#f3f0e8]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {isLoading ? "刷新中" : "刷新"}
            </button>
          </div>
          <div className="grid gap-2">
            {learningPathSections.map((section) => {
              const sectionNodes = nodes.filter((node) => node.sectionId === section.id);
              const sectionCompleted = sectionNodes.filter((node) => nodeStatuses[node.id] === "completed").length;
              const isExpanded = expandedLearningSections[section.id] || section.id === selectedNode.sectionId;
              return (
                <div key={section.id} className="overflow-hidden rounded-md border border-[#2f3b2f]/12 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLearningSections((current) => ({ ...current, [section.id]: !current[section.id] }))
                    }
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-[#f3f0e8]"
                  >
                    <span>
                      <span className="block font-semibold text-[#171814]">{section.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#6a675c]">{section.summary}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-[#6a675c]">
                      {sectionCompleted}/{sectionNodes.length}
                      <span className="text-lg leading-none">{isExpanded ? "−" : "+"}</span>
                    </span>
                  </button>
                  {isExpanded ? (
                    <div className="grid gap-2 border-t border-[#2f3b2f]/10 p-2">
                      {sectionNodes.map((node) => {
                        const nodeIndex = nodes.findIndex((item) => item.id === node.id);
                        const status = nodeStatuses[node.id] ?? "locked";
                        const isSelected = node.id === selectedNode.id;
                        return (
                          <button
                            key={node.id}
                            type="button"
                            onClick={() => selectLearningNode(node)}
                            aria-pressed={isSelected}
                            className={`grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border p-2 text-left transition ${
                              isSelected
                                ? "border-[#245f46]/45 bg-[#edf3ea] shadow-sm"
                                : "border-[#2f3b2f]/10 bg-[#fffdf7] hover:bg-[#f3f0e8]"
                            }`}
                          >
                            <span
                              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                                status === "completed"
                                  ? "bg-[#245f46] text-white"
                                  : status === "current"
                                    ? "bg-[#8f3b2f] text-white"
                                    : "bg-[#f3f0e8] text-[#6a675c]"
                              }`}
                            >
                              {status === "completed" ? "✓" : nodeIndex + 1}
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-[#171814]">{node.title}</span>
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[#6a675c]">{node.summary}</span>
                            </span>
                            <span className="rounded-md bg-[#fff9e8] px-2 py-1 text-xs font-medium text-[#7a2f24]">
                              {toLearningNodeStatusLabel(status)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4">
          <article className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#245f46]">当前节点</p>
                <h3 className="mt-1 text-lg font-semibold text-[#171814]">{selectedNode.title}</h3>
                <p className="mt-1 text-xs text-[#6a675c]">{selectedSection.title}</p>
              </div>
              <span className="w-fit rounded-md bg-[#edf3ea] px-2 py-1 text-xs font-medium text-[#245f46]">
                {selectedNode.term} · {selectedNode.ruleId}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#314239]">{selectedNode.summary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md border border-[#2f3b2f]/12 bg-white/78 p-3 text-sm leading-6">
                <p className="font-semibold text-[#171814]">{selectedCard?.title ?? activeTerm?.term ?? "核心知识卡"}</p>
                <p className="mt-1 text-[#314239]">{selectedCard?.content ?? activeTerm?.definition ?? selectedNode.core}</p>
                <button
                  type="button"
                  onClick={() => {
                    const cardId = activeTerm?.id.split("-").slice(2).join("-");
                    if (cardId) onOpenLearningCard(cardId);
                  }}
                  disabled={!activeTerm}
                  className="mt-3 h-9 rounded-md border border-[#2f3b2f]/20 bg-white px-3 text-sm font-medium text-[#314239] transition hover:bg-[#f3f0e8] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  打开知识卡
                </button>
              </div>
              <div className="grid gap-2 text-sm leading-6">
                <div className="rounded-md border border-[#2f6b4f]/18 bg-[#edf3ea] p-3">
                  <p className="font-semibold text-[#245f46]">例子</p>
                  <p className="mt-1">{selectedCard?.example ?? activeTerm?.example ?? selectedNode.example}</p>
                </div>
                <div className="rounded-md border border-[#8f3b2f]/18 bg-[#fff0ec] p-3">
                  <p className="font-semibold text-[#8f3b2f]">反例</p>
                  <p className="mt-1">{selectedCard?.counter_example ?? activeTerm?.counter_example ?? selectedNode.counterExample}</p>
                </div>
              </div>
            </div>
            <p className="mt-3 rounded-md border border-[#2f3b2f]/12 bg-white/70 p-3 text-sm leading-6 text-[#6a675c]">
              {selectedCard?.safety_notice ?? "学习内容只用于传统文化学习与娱乐体验，不替代医疗、法律、投资等专业建议。"}
            </p>
          </article>

          <article className="rounded-md border border-[#9a6a2f]/18 bg-[#fff9e8] p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[#7a2f24]" aria-hidden="true" />
              <h3 className="font-semibold text-[#171814]">节点练习</h3>
            </div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-md border border-[#2f3b2f]/12 bg-white/82 p-3 text-sm leading-6">
                <p className="font-semibold">{activeExercise?.title ?? `${selectedNode.title}练习`}</p>
                <p className="mt-1 text-[#314239]">{activeExercise?.prompt ?? selectedNode.practicePrompt}</p>
                <p className="mt-2 text-xs text-[#6a675c]">
                  难度：{toDifficultyLabel(activeExercise?.difficulty ?? selectedNode.difficulty)} · 标准规则：
                  {activeExercise?.answer ?? selectedNode.ruleId}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onCompleteNode(selectedNode)}
                  disabled={selectedStatus === "completed"}
                  className="flex h-10 items-center justify-center rounded-md bg-[#245f46] px-4 text-sm font-semibold text-white transition hover:bg-[#1c4c38] disabled:cursor-not-allowed disabled:bg-[#9cad9f]"
                >
                  {selectedStatus === "completed" ? "已完成练习" : "提交并完成练习"}
                </button>
                <p className="text-sm text-[#6a675c]">
                  {selectedStatus === "completed" ? "这个节点已计入学习进度。" : "提交后会记录进度，并推荐下一个未完成节点。"}
                </p>
              </div>
              {!activeExercise && isLoading ? <p className="text-xs text-[#6a675c]">正在匹配接口练习，当前先显示节点内置练习。</p> : null}
            </div>
          </article>
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

const linePreviewThemes: Record<LineValue, { card: string; mark: string; tag: string }> = {
  6: {
    card:
      "border-[#3d4050]/25 bg-[radial-gradient(circle_at_50%_0%,rgba(61,64,80,0.22),transparent_58%),linear-gradient(180deg,#f8f3e8,#e6e0d3)]",
    mark: "bg-[#3d4050] text-white",
    tag: "动阴",
  },
  7: {
    card:
      "border-[#b9852e]/28 bg-[radial-gradient(circle_at_50%_0%,rgba(226,175,77,0.34),transparent_56%),linear-gradient(180deg,#fff9e8,#f3ead4)]",
    mark: "bg-[#b9852e] text-white",
    tag: "静阳",
  },
  8: {
    card:
      "border-[#4f755e]/25 bg-[radial-gradient(circle_at_50%_0%,rgba(79,117,94,0.24),transparent_58%),linear-gradient(180deg,#f7f7ed,#e5eadc)]",
    mark: "bg-[#4f755e] text-white",
    tag: "静阴",
  },
  9: {
    card:
      "border-[#8f3b2f]/30 bg-[radial-gradient(circle_at_50%_0%,rgba(174,75,48,0.36),transparent_56%),linear-gradient(180deg,#fff0df,#f2dcc8)]",
    mark: "bg-[#8f3b2f] text-white",
    tag: "动阳",
  },
};

function LinePreview({ lines }: { lines: Array<{ lineNo: number; value: LineValue; label: string }> }) {
  return (
    <div className="mt-4 grid min-h-24 grid-cols-3 gap-2 sm:grid-cols-6">
      {Array.from({ length: 6 }, (_, index) => {
        const line = lines[index];
        const theme = line ? linePreviewThemes[line.value] : null;
        return (
          <div
            key={`preview-${index + 1}`}
            className={`flex min-h-20 flex-col items-center justify-between rounded-md border p-2 text-center shadow-sm transition ${
              theme ? theme.card : "border-[#9a6a2f]/18 bg-white/72"
            }`}
          >
            <span className="text-xs text-[#6a675c]">{index + 1} 爻</span>
            {line && theme ? (
              <>
                <span className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-semibold ${theme.mark}`}>
                  {theme.tag}
                </span>
                <span className="text-sm font-semibold text-[#171814]">{line.label}</span>
              </>
            ) : (
              <span className="my-auto text-sm font-semibold text-[#171814]">待摇</span>
            )}
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
  const keyEvidence = analysis?.evidence_tree.slice(0, 3) ?? [];

  return (
    <div className="grid gap-4">
      <section className="grid gap-3 rounded-lg border border-[#2f6b4f]/18 bg-[#edf3ea] p-4 text-sm leading-6 text-[#314239]">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-[#245f46]" aria-hidden="true" />
          <h3 className="font-semibold text-[#171814]">结果速览</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <MiniMetric label="本卦" value={result.base_chart.name} />
          <MiniMetric label="变卦" value={result.changed_chart.name} />
          <MiniMetric
            label="用神"
            value={analysis?.yongshen ? `${analysis.yongshen.role} ${analysis.yongshen.line_no}爻` : "证据生成后显示"}
          />
        </div>
        {keyEvidence.length > 0 ? (
          <div className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">
            <p className="font-medium">3 条关键依据</p>
            <ul className="mt-1 grid gap-1">
              {keyEvidence.map((node) => (
                <li key={node.id}>
                  {node.title}：{node.conclusion}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-md border border-[#2f3b2f]/12 bg-white/72 p-3">规则证据生成后，会在这里先显示 3 条关键依据。</p>
        )}
        <p className="rounded-md border border-[#2f6b4f]/18 bg-white/72 p-3">
          {safety?.notice ?? "仅用于传统文化学习与娱乐互动，不替代医疗、法律、投资等专业意见。"}
        </p>
      </section>

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
  const [expandedSections, setExpandedSections] = useState<EvidenceExpansionState>(defaultEvidenceExpansion);

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

  function toggleSection(section: EvidenceSectionId) {
    setExpandedSections((current) => toggleEvidenceSection(current, section));
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

      <div className="grid gap-2 sm:grid-cols-3">
        <MiniMetric label="关键依据" value={`${analysis.evidence_tree.length} 条`} />
        <MiniMetric label="反证与保留" value={`${analysis.counter_evidence.length} 条`} />
        <MiniMetric label="现实提示" value={`${analysis.action_tips.length} 条`} />
      </div>

      <ExpandableEvidenceList
        id="keyEvidence"
        title="关键依据"
        nodes={analysis.evidence_tree}
        emptyText="暂无关键依据"
        expanded={expandedSections.keyEvidence}
        onToggle={toggleSection}
      />
      <ExpandableEvidenceList
        id="counterEvidence"
        title="反证与保留"
        nodes={analysis.counter_evidence}
        emptyText="暂无反证与保留"
        expanded={expandedSections.counterEvidence}
        onToggle={toggleSection}
      />
      <ExpandableActionTips
        tips={analysis.action_tips}
        expanded={expandedSections.actionTips}
        onToggle={toggleSection}
      />
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
            aria-pressed={mode === item.value}
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
                  className={`whitespace-pre-wrap rounded-md p-2 ${
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

function ExpandableEvidenceList({
  id,
  title,
  nodes,
  emptyText,
  expanded,
  onToggle,
}: {
  id: Extract<EvidenceSectionId, "keyEvidence" | "counterEvidence">;
  title: string;
  nodes: EvidenceNode[];
  emptyText: string;
  expanded: boolean;
  onToggle: (section: EvidenceSectionId) => void;
}) {
  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-white/72">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
      >
        <span className="font-medium">{title}</span>
        <span className="flex items-center gap-2 text-sm text-[#6a675c]">
          {nodes.length} 条
          <span className="text-lg leading-none">{expanded ? "−" : "+"}</span>
        </span>
      </button>
      {expanded ? (
        <div className="grid gap-2 border-t border-[#2f3b2f]/10 p-3">
          {nodes.length > 0 ? (
            nodes.map((node) => (
              <article key={node.id} className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#245f46] px-2 py-0.5 text-xs font-medium text-white">{node.rule_id}</span>
                  <span className="font-medium">{node.title}</span>
                  <span className="text-xs text-[#6a675c]">置信度 {node.confidence}</span>
                </div>
                <p className="mt-2">{node.conclusion}</p>
                <p className="mt-1 text-xs leading-5 text-[#6a675c]">{node.premise}</p>
                <p className="mt-1 text-xs leading-5 text-[#6a675c]">来源：{node.source_refs.join("；")}</p>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3 text-[#6a675c]">{emptyText}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ExpandableActionTips({
  tips,
  expanded,
  onToggle,
}: {
  tips: string[];
  expanded: boolean;
  onToggle: (section: EvidenceSectionId) => void;
}) {
  return (
    <div className="rounded-md border border-[#2f3b2f]/12 bg-white/72">
      <button
        type="button"
        onClick={() => onToggle("actionTips")}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
      >
        <span className="font-medium">现实提示</span>
        <span className="flex items-center gap-2 text-sm text-[#6a675c]">
          {tips.length} 条
          <span className="text-lg leading-none">{expanded ? "−" : "+"}</span>
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-[#2f3b2f]/10 p-3">
          {tips.length > 0 ? (
            <ul className="grid gap-1 rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3">
              {tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          ) : (
            <p className="rounded-md border border-[#2f3b2f]/12 bg-[#fffdf7] p-3 text-[#6a675c]">暂无现实提示</p>
          )}
        </div>
      ) : null}
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
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.message ?? payload.error ?? fallback;
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

function toLearningNodeStatusLabel(status: LearningNodeStatus): string {
  if (status === "completed") return "已完成";
  if (status === "current") return "当前";
  return "未开始";
}

function toDifficultyLabel(difficulty: LearningExercise["difficulty"]): string {
  if (difficulty === "beginner") return "入门";
  if (difficulty === "intermediate") return "进阶";
  return "高阶";
}

function getLearningContext(analysis: AnalysisResult | null, fallbackScenario: (typeof scenarios)[number]): LearningContext {
  const analysisScenario = analysis?.question_type;
  const scenario = scenarios.includes(analysisScenario as (typeof scenarios)[number])
    ? (analysisScenario as (typeof scenarios)[number])
    : fallbackScenario;
  return {
    scenario,
    ruleId: analysis?.evidence_tree[0]?.rule_id,
  };
}

function buildLearningUrl(path: string, context: LearningContext, limit: number): string {
  const params = new URLSearchParams({
    scenario: context.scenario,
    limit: String(limit),
  });
  if (context.ruleId) params.set("rule_id", context.ruleId);
  if (context.term) params.set("term", context.term);
  if (context.difficulty) params.set("difficulty", context.difficulty);
  return `${path}?${params.toString()}`;
}

function formatFollowupAnswer(output: AiReadingOutput): string {
  const sections = [
    output.summary,
    output.key_evidence.length > 0
      ? `依据：${output.key_evidence.map((item) => item.plain_explanation).join("；")}`
      : "",
    output.counter_evidence.length > 0 ? `反证：${output.counter_evidence.join("；")}` : "",
    output.action_tips.length > 0 ? `建议：${output.action_tips.join("；")}` : "",
  ];
  return sections.filter(Boolean).join("\n");
}

export function getDefaultCreatorSource(hasReading: boolean, hasCases: boolean): CreatorSourceType {
  void hasCases;
  return hasReading ? "reading" : "case";
}

export function buildCreatorExportPayload(input: {
  sourceType: CreatorSourceType;
  readingId?: string;
  caseId?: string;
  exportType: CreatorExportType;
}) {
  if (input.sourceType === "reading") {
    if (!input.readingId) throw new Error("reading_id is required");
    return {
      reading_id: input.readingId,
      export_type: input.exportType,
    };
  }
  if (!input.caseId) throw new Error("case_id is required");
  return {
    case_id: input.caseId,
    export_type: input.exportType,
  };
}

export function formatCreatorExportText(exportResult: CreatorExportResult): string {
  return [
    `# ${exportResult.title}`,
    "",
    "## 素材内容",
    ...exportResult.content_sections.map((section, index) => `${index + 1}. ${section}`),
    "",
    "## 安全提示",
    exportResult.safety_notice,
  ].join("\n");
}

function toCreatorExportTypeLabel(exportType: CreatorExportType): string {
  return creatorMaterialTypes.find((type) => type.value === exportType)?.label ?? exportType;
}

export function getLearningNodeStatuses(
  nodes: LearningPathNode[],
  progress: Array<{ subject_id: string; subject_type: string }>,
): Record<string, LearningNodeStatus> {
  const completedIds = new Set(
    progress.filter((item) => item.subject_type === "exercise").map((item) => item.subject_id),
  );
  const firstOpenIndex = nodes.findIndex((node) => !completedIds.has(node.id));
  const currentIndex = firstOpenIndex === -1 ? nodes.length - 1 : firstOpenIndex;
  return Object.fromEntries(
    nodes.map((node, index) => {
      if (completedIds.has(node.id)) return [node.id, "completed"];
      return [node.id, index === currentIndex ? "current" : "locked"];
    }),
  );
}

export function getDefaultLearningNodeId(
  nodes: LearningPathNode[],
  progress: Array<{ subject_id: string; subject_type: string }>,
): string {
  const statuses = getLearningNodeStatuses(nodes, progress);
  return nodes.find((node) => statuses[node.id] === "current")?.id ?? nodes[0]?.id ?? "";
}

export function buildLearningExerciseProgress(node: LearningPathNode) {
  return {
    subject_id: node.id,
    subject_type: "exercise" as const,
    completed: true,
    badge: node.title,
    score: 100,
  };
}

function getLearningContextForNode(node: LearningPathNode): LearningContext {
  return {
    scenario: node.scenario,
    ruleId: node.ruleId,
    term: node.term,
    difficulty: node.difficulty,
  };
}

type CoinToss = 2 | 3;

export function rollCoinsFromTosses(tosses: [CoinToss, CoinToss, CoinToss]): LineValue {
  return (tosses[0] + tosses[1] + tosses[2]) as LineValue;
}

function rollCoins(): LineValue {
  return rollCoinsFromTosses(Array.from({ length: 3 }, () => (Math.random() > 0.5 ? 3 : 2)) as [CoinToss, CoinToss, CoinToss]);
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
