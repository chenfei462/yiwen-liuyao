-- PostgreSQL / JSONB baseline for Beta 0.8+.
-- External reading ids keep the current API shape: reading_<uuid>.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  nickname TEXT,
  age_gate BOOLEAN NOT NULL DEFAULT FALSE,
  region TEXT,
  privacy_level TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  question_hash TEXT NOT NULL,
  question_text_encrypted TEXT,
  question_preview TEXT NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('事业', '财务', '感情', '考试', '失物', '其他')),
  timezone TEXT NOT NULL,
  safety_status JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_charts (
  reading_id TEXT PRIMARY KEY REFERENCES readings(id) ON DELETE CASCADE,
  cast_method TEXT NOT NULL CHECK (cast_method IN ('coin', 'manual')),
  cast_time TEXT NOT NULL,
  day_ganzhi TEXT NOT NULL,
  month_branch TEXT NOT NULL,
  month_source TEXT NOT NULL CHECK (month_source IN ('explicit', 'jieqi_table')),
  base_hexagram_name TEXT NOT NULL,
  changed_hexagram_name TEXT NOT NULL,
  palace TEXT NOT NULL,
  shi_line INTEGER NOT NULL,
  ying_line INTEGER NOT NULL,
  xunkong JSONB NOT NULL,
  chart_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_lines (
  reading_id TEXT REFERENCES readings(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL CHECK (line_no BETWEEN 1 AND 6),
  value INTEGER NOT NULL CHECK (value IN (6, 7, 8, 9)),
  yin_yang TEXT NOT NULL,
  moving BOOLEAN NOT NULL,
  stem TEXT NOT NULL,
  branch TEXT NOT NULL,
  element TEXT NOT NULL,
  liuqin TEXT NOT NULL,
  liushen TEXT NOT NULL,
  changed_branch TEXT NOT NULL,
  changed_yin_yang TEXT NOT NULL,
  PRIMARY KEY (reading_id, line_no)
);

CREATE TABLE IF NOT EXISTS rule_cards (
  rule_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('A', 'B', 'C', 'D')),
  source_refs JSONB NOT NULL,
  condition_schema JSONB NOT NULL,
  explanation_template TEXT NOT NULL,
  default_weight NUMERIC(5, 4) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS evidences (
  id TEXT PRIMARY KEY,
  reading_id TEXT REFERENCES readings(id) ON DELETE CASCADE,
  rule_id TEXT REFERENCES rule_cards(rule_id),
  level TEXT NOT NULL CHECK (level IN ('A', 'B', 'C', 'D')),
  title TEXT NOT NULL,
  line_refs JSONB NOT NULL,
  premise TEXT NOT NULL,
  conclusion TEXT NOT NULL,
  polarity TEXT NOT NULL CHECK (polarity IN ('+', '-', 'neutral')),
  weight NUMERIC(5, 4) NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('低', '中', '高')),
  source_refs JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_analyses (
  reading_id TEXT REFERENCES readings(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('professional', 'light', 'learning')),
  rule_version TEXT NOT NULL,
  yongshen_json JSONB,
  verdict_json JSONB NOT NULL,
  action_tips JSONB NOT NULL,
  safety_notice TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (reading_id, mode)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  reading_id TEXT REFERENCES readings(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content_encrypted TEXT NOT NULL,
  safety_label TEXT NOT NULL,
  followup_type TEXT CHECK (followup_type IN ('why_yongshen', 'key_rule', 'counter_evidence', 'timing', 'learning_mode', 'free_text')),
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  knowledge_card_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_docs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  license_note TEXT NOT NULL,
  text_chunk TEXT NOT NULL,
  embedding_id TEXT,
  citation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_cards (
  id TEXT PRIMARY KEY,
  doc_id TEXT REFERENCES knowledge_docs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  term TEXT NOT NULL,
  rule_id TEXT REFERENCES rule_cards(rule_id),
  scenario TEXT CHECK (scenario IN ('事业', '财务', '感情', '考试', '失物', '其他')),
  content TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected')),
  license_note TEXT NOT NULL DEFAULT 'internal-review',
  review_status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES knowledge_cards(id) ON DELETE CASCADE,
  embedding_model TEXT NOT NULL,
  embedding vector(1536),
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_explanations (
  id TEXT PRIMARY KEY,
  reading_id TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('professional', 'light', 'learning', 'story')),
  output_json JSONB NOT NULL,
  knowledge_card_refs JSONB NOT NULL,
  safety_status JSONB NOT NULL,
  model_metadata JSONB NOT NULL,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_feedback (
  id TEXT PRIMARY KEY,
  reading_id TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
  rating TEXT NOT NULL CHECK (rating IN ('unclear', 'inaccurate', 'unsafe', 'helpful', 'off')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_terms (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL,
  rule_id TEXT REFERENCES rule_cards(rule_id),
  scenario TEXT CHECK (scenario IN ('事业', '财务', '感情', '考试', '失物', '其他', '通用')),
  definition TEXT NOT NULL,
  example TEXT NOT NULL,
  counter_example TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_exercises (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scenario TEXT CHECK (scenario IN ('事业', '财务', '感情', '考试', '失物', '其他', '通用')),
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  knowledge_card_id TEXT REFERENCES knowledge_cards(id),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  subject_id TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('term', 'knowledge_card', 'exercise')),
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  badge TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_shares (
  id TEXT PRIMARY KEY,
  reading_id TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL CHECK (visibility IN ('public_anonymous', 'private')),
  card_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_favorites (
  user_id TEXT REFERENCES users(id),
  reading_id TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reading_id)
);

CREATE TABLE IF NOT EXISTS reading_tags (
  user_id TEXT REFERENCES users(id),
  reading_id TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  tags JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, reading_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  risk_label TEXT NOT NULL,
  reading_id TEXT REFERENCES readings(id) ON DELETE SET NULL,
  model TEXT,
  latency_ms INTEGER,
  schema_error JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_cards_rule_scenario ON knowledge_cards(rule_id, scenario) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_ai_explanations_reading_mode ON ai_explanations(reading_id, mode);
CREATE INDEX IF NOT EXISTS idx_messages_reading_created ON messages(reading_id, created_at);
CREATE INDEX IF NOT EXISTS idx_learning_terms_rule ON learning_terms(rule_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_learning_exercises_difficulty ON learning_exercises(difficulty) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_reading_shares_visibility ON reading_shares(visibility);

-- V1.5 content growth baseline.

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scenario TEXT NOT NULL CHECK (scenario IN ('浜嬩笟', '璐㈠姟', '鎰熸儏', '鑰冭瘯', '澶辩墿', '鍏朵粬')),
  source_type TEXT NOT NULL CHECK (source_type IN ('classic', 'anonymized_user', 'editorial')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'rejected', 'archived')),
  question_preview TEXT NOT NULL,
  base_chart TEXT NOT NULL,
  changed_chart TEXT NOT NULL,
  yongshen TEXT NOT NULL,
  evidence_ids JSONB NOT NULL,
  rule_ids JSONB NOT NULL,
  learning_summary TEXT NOT NULL,
  counter_evidence JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  license_note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  summary TEXT NOT NULL,
  badge TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('article', 'quiz', 'case_review', 'practice')),
  summary TEXT NOT NULL,
  knowledge_card_ids JSONB NOT NULL,
  exercise_ids JSONB NOT NULL,
  case_ids JSONB NOT NULL,
  duration_minutes INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS course_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT TRUE,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  wrong_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS creator_exports (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  reading_id TEXT REFERENCES readings(id) ON DELETE SET NULL,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('article', 'short_video_script', 'long_image', 'chart_snapshot')),
  title TEXT NOT NULL,
  content_sections JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  safety_notice TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiments (
  id TEXT PRIMARY KEY,
  surface TEXT NOT NULL CHECK (surface IN ('home', 'result', 'learning', 'share', 'course')),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'archived')),
  variants JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS experiment_events (
  id TEXT PRIMARY KEY,
  anonymous_id_hash TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK (event_name IN ('cast_completed', 'explain_completed', 'followup_sent', 'share_created', 'case_opened', 'course_started', 'course_completed', 'creator_exported')),
  surface TEXT NOT NULL CHECK (surface IN ('home', 'result', 'learning', 'share', 'course')),
  entity_id TEXT,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'variant_a', 'variant_b')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cases_public_filters ON cases(scenario, difficulty, status);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_creator_exports_reading ON creator_exports(reading_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_name_surface ON experiment_events(event_name, surface, created_at);

-- V2.0 community, multi-client, voice, import, and rule governance baseline.

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  anonymous_id_hash TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'h5', 'mini_program', 'ios', 'android')),
  app_version TEXT NOT NULL,
  locale TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  safety_policy_version TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_push_settings (
  device_id TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  learning_reminders BOOLEAN NOT NULL DEFAULT FALSE,
  community_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_jobs (
  id TEXT PRIMARY KEY,
  reading_id TEXT REFERENCES readings(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'blocked')),
  platform TEXT NOT NULL CHECK (platform IN ('web', 'h5', 'mini_program', 'ios', 'android')),
  transcript TEXT NOT NULL,
  safety JSONB NOT NULL,
  raw_audio_stored BOOLEAN NOT NULL DEFAULT FALSE,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_imports (
  id TEXT PRIMARY KEY,
  reading_id TEXT REFERENCES readings(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pasted_text', 'structured_json', 'image_ocr')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'parsed', 'needs_review', 'accepted', 'rejected')),
  editable_fields JSONB NOT NULL,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  chart_json JSONB,
  ai_generated_chart_fields BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL CHECK (post_type IN ('case_discussion', 'course_checkin', 'knowledge_comment', 'wrong_question')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reading_id TEXT REFERENCES readings(id) ON DELETE SET NULL,
  case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
  knowledge_card_id TEXT REFERENCES knowledge_cards(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'hidden', 'removed')),
  author_label TEXT NOT NULL,
  question_preview TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'published', 'hidden', 'removed')),
  author_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsafe', 'privacy', 'spam', 'inaccurate')),
  status TEXT NOT NULL CHECK (status IN ('pending_review', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rule_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('yongshen', 'wangshuai', 'dongbian', 'timing', 'style', 'school')),
  status TEXT NOT NULL CHECK (status IN ('draft', 'testing', 'approved', 'rejected', 'deprecated')),
  rule_ids JSONB NOT NULL,
  weight_profile JSONB NOT NULL,
  validation_case_ids JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  regression_passed BOOLEAN NOT NULL DEFAULT FALSE,
  professional_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_reviews (
  id TEXT PRIMARY KEY,
  reviewer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('community_post', 'community_comment', 'rule_pack', 'case', 'knowledge_card')),
  target_id TEXT NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('professional', 'compliance', 'privacy', 'safety')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_anonymous_platform ON devices(anonymous_id_hash, platform);
CREATE INDEX IF NOT EXISTS idx_voice_jobs_reading_created ON voice_jobs(reading_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reading_imports_status ON reading_imports(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_public ON community_posts(post_type, updated_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_community_posts_review ON community_posts(status, updated_at) WHERE status IN ('pending_review', 'hidden');
CREATE INDEX IF NOT EXISTS idx_community_comments_post_status ON community_comments(post_id, status);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_rule_packs_scope_status ON rule_packs(scope, status);
CREATE INDEX IF NOT EXISTS idx_admin_reviews_target ON admin_reviews(target_type, target_id, created_at);

-- V3.0 controlled ecosystem, expert collaboration, and simulated settlement baseline.

ALTER TABLE IF EXISTS rule_packs ADD COLUMN IF NOT EXISTS rule_pack_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE IF EXISTS rule_packs ADD COLUMN IF NOT EXISTS safety_reviewed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS rule_packs ADD COLUMN IF NOT EXISTS regression_reviewed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS rule_packs ADD COLUMN IF NOT EXISTS regression_report_id TEXT;

CREATE TABLE IF NOT EXISTS contributors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  roles JSONB NOT NULL,
  invitation_status TEXT NOT NULL DEFAULT 'invited' CHECK (invitation_status IN ('invited', 'active', 'suspended')),
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributor_submissions (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('rule_pack', 'case', 'course', 'knowledge_card', 'exercise', 'creator_template')),
  title TEXT NOT NULL,
  payload JSONB NOT NULL,
  source_refs JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  target_id TEXT,
  target_type TEXT CHECK (target_type IN ('rule_pack', 'case', 'course', 'knowledge_card', 'exercise', 'creator_template')),
  gates JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_summary TEXT NOT NULL DEFAULT 'initial draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS submission_reviews (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES contributor_submissions(id) ON DELETE CASCADE,
  reviewer_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  review_gate TEXT NOT NULL CHECK (review_gate IN ('professional', 'compliance', 'privacy', 'safety', 'regression', 'editorial')),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rule_pack_regressions (
  id TEXT PRIMARY KEY,
  rule_pack_id TEXT NOT NULL REFERENCES rule_packs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed')),
  validation_case_ids JSONB NOT NULL,
  passed_case_count INTEGER NOT NULL DEFAULT 0,
  failed_case_count INTEGER NOT NULL DEFAULT 0,
  p95_ms INTEGER NOT NULL,
  report TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ecosystem_packages (
  id TEXT PRIMARY KEY,
  package_type TEXT NOT NULL CHECK (package_type IN ('rule_pack', 'course_pack', 'case_pack', 'knowledge_pack', 'creator_template_pack')),
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'testing', 'approved', 'published', 'suspended', 'deprecated')),
  contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE RESTRICT,
  source_submission_id TEXT REFERENCES contributor_submissions(id) ON DELETE SET NULL,
  entity_id TEXT NOT NULL,
  entity_version INTEGER NOT NULL,
  summary TEXT NOT NULL,
  source_refs JSONB NOT NULL,
  install_count INTEGER NOT NULL DEFAULT 0,
  quality_score INTEGER NOT NULL DEFAULT 0,
  safety_score INTEGER NOT NULL DEFAULT 0,
  release_note TEXT,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS package_installs (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES ecosystem_packages(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('installed', 'disabled', 'removed')),
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (package_id, user_id)
);

CREATE TABLE IF NOT EXISTS settlement_ledger (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES ecosystem_packages(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL CHECK (event_name IN ('package_installed', 'course_completed', 'template_exported')),
  amount_cents INTEGER NOT NULL,
  mode TEXT NOT NULL DEFAULT 'simulated' CHECK (mode = 'simulated'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contributor_settlements (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'simulated' CHECK (mode = 'simulated'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'calculated', 'frozen', 'voided')),
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  event_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contributor_id, period, mode)
);

CREATE INDEX IF NOT EXISTS idx_contributor_submissions_status ON contributor_submissions(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_submission_reviews_submission_gate ON submission_reviews(submission_id, review_gate, created_at);
CREATE INDEX IF NOT EXISTS idx_rule_pack_regressions_pack ON rule_pack_regressions(rule_pack_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ecosystem_packages_public ON ecosystem_packages(package_type, updated_at) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_package_installs_user_status ON package_installs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_settlement_ledger_contributor_period ON settlement_ledger(contributor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contributor_settlements_contributor ON contributor_settlements(contributor_id, period);

-- V3.5 scaled operations, commercial sandbox, and ecosystem quality baseline.

CREATE TABLE IF NOT EXISTS ecosystem_quality_reviews (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES ecosystem_packages(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('rule_pack', 'course_pack', 'case_pack', 'knowledge_pack', 'creator_template_pack')),
  title TEXT NOT NULL,
  quality_status TEXT NOT NULL CHECK (quality_status IN ('healthy', 'needs_review', 'suspended', 'deprecated')),
  quality_score INTEGER NOT NULL CHECK (quality_score BETWEEN 0 AND 100),
  safety_score INTEGER NOT NULL CHECK (safety_score BETWEEN 0 AND 100),
  complaint_count INTEGER NOT NULL DEFAULT 0,
  regression_failure_count INTEGER NOT NULL DEFAULT 0,
  install_retention_rate NUMERIC(4, 3) NOT NULL DEFAULT 0,
  user_feedback_score NUMERIC(3, 2) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  moderation_action TEXT NOT NULL CHECK (moderation_action IN ('warn', 'hide', 'suspend', 'rollback', 'reject')),
  note TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (package_id)
);

CREATE TABLE IF NOT EXISTS ecosystem_risk_events (
  id TEXT PRIMARY KEY,
  package_id TEXT NOT NULL REFERENCES ecosystem_packages(id) ON DELETE CASCADE,
  package_title TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  moderation_action TEXT NOT NULL CHECK (moderation_action IN ('warn', 'hide', 'suspend', 'rollback', 'reject')),
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  detail TEXT NOT NULL,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ops_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3', 'sev4')),
  affected_surface TEXT NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'mitigated', 'resolved')),
  mitigation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS commercial_billing_simulations (
  id TEXT PRIMARY KEY,
  contributor_id TEXT NOT NULL REFERENCES contributors(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'simulated' CHECK (mode = 'simulated'),
  line_items JSONB NOT NULL,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  real_money_movement BOOLEAN NOT NULL DEFAULT FALSE CHECK (real_money_movement = FALSE),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id TEXT PRIMARY KEY,
  save_history BOOLEAN NOT NULL DEFAULT TRUE,
  allow_personalization BOOLEAN NOT NULL DEFAULT TRUE,
  allow_sensitive_review BOOLEAN NOT NULL DEFAULT FALSE,
  retain_history_days INTEGER NOT NULL DEFAULT 180 CHECK (retain_history_days BETWEEN 0 AND 365),
  export_format TEXT NOT NULL DEFAULT 'json' CHECK (export_format IN ('json', 'csv')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS privacy_data_exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  export_format TEXT NOT NULL CHECK (export_format IN ('json', 'csv')),
  includes_raw_question_text BOOLEAN NOT NULL DEFAULT FALSE CHECK (includes_raw_question_text = FALSE),
  download_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS compliance_reviews (
  id TEXT PRIMARY KEY,
  review_type TEXT NOT NULL CHECK (review_type IN ('privacy_export', 'sensitive_content', 'commitment_scan', 'minor_protection')),
  target_id TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'resolved')),
  summary TEXT NOT NULL,
  action TEXT CHECK (action IN ('warn', 'hide', 'suspend', 'rollback', 'reject')),
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ecosystem_quality_status ON ecosystem_quality_reviews(quality_status, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_ecosystem_risk_events_status ON ecosystem_risk_events(status, risk_level, created_at);
CREATE INDEX IF NOT EXISTS idx_ops_incidents_status ON ops_incidents(status, severity, updated_at);
CREATE INDEX IF NOT EXISTS idx_commercial_billing_simulations_contributor ON commercial_billing_simulations(contributor_id, period);
CREATE INDEX IF NOT EXISTS idx_privacy_data_exports_user ON privacy_data_exports(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_status ON compliance_reviews(status, risk_level, created_at);
