import { beforeEach, describe, expect, test } from "vitest";
import {
  approveRulePackSubmissionForTests,
  createContributorSubmission,
  createOpsIncident,
  getCommercialReadiness,
  getContributorRevenuePreview,
  getEcosystemMetrics,
  getEcosystemQuality,
  getOpsSlo,
  getPrivacySettings,
  installEcosystemPackage,
  listComplianceReviews,
  listEcosystemPackages,
  listEcosystemRiskEvents,
  listOpsIncidents,
  patchOpsIncident,
  publishRulePackToEcosystem,
  recordEvent,
  requestPrivacyDataExport,
  resetReadingStoreForTests,
  resolveComplianceReview,
  resolveEcosystemRiskEvent,
  reviewEcosystemPackageQuality,
  runRulePackRegression,
  simulateCommercialBilling,
  submitContributorSubmission,
  updateLearningProgress,
  updatePrivacySettings,
} from "./reading-service";

describe("V3.5 scalable operations, quality, commercial sandbox, and compliance service", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("scores ecosystem packages, hides needs-review packages, and resolves risk events", () => {
    const published = publishHealthyRulePack("rule-pack-v35-quality", "V3.5 Quality Pack");
    installEcosystemPackage({ package_id: published.id });

    expect(listEcosystemPackages().map((item) => item.id)).toContain(published.id);
    expect(getEcosystemQuality().packages[0]).toMatchObject({
      package_id: published.id,
      quality_status: "healthy",
    });

    const review = reviewEcosystemPackageQuality(published.id, {
      quality_score: 42,
      safety_score: 76,
      complaint_count: 6,
      regression_failure_count: 1,
      install_retention_rate: 0.18,
      user_feedback_score: 2.1,
      status: "needs_review",
      risk_level: "high",
      moderation_action: "hide",
      note: "complaints and low quality require hidden review",
    });
    expect(review.quality_status).toBe("needs_review");
    expect(listEcosystemPackages().map((item) => item.id)).not.toContain(published.id);

    const riskEvent = listEcosystemRiskEvents()[0];
    expect(riskEvent).toMatchObject({
      package_id: published.id,
      risk_level: "high",
      status: "open",
      moderation_action: "hide",
    });

    const resolved = resolveEcosystemRiskEvent(riskEvent.id, {
      resolution: "hidden from catalog and sent to contributor review",
      action: "hide",
    });
    expect(resolved.status).toBe("resolved");
  });

  test("tracks operations SLOs and incident lifecycle without changing rule safety", () => {
    const slo = getOpsSlo();
    expect(slo.targets.cast_p95_ms).toBeLessThanOrEqual(500);
    expect(slo.targets.first_ai_delta_p95_ms).toBeLessThanOrEqual(2000);
    expect(slo.current.ecosystem_catalog_p95_ms).toBeLessThanOrEqual(1500);

    const incident = createOpsIncident({
      title: "ecosystem catalog latency breach",
      severity: "sev3",
      affected_surface: "ecosystem_catalog",
      summary: "catalog p95 crossed target during package review",
    });
    expect(incident.status).toBe("open");
    expect(listOpsIncidents()).toHaveLength(1);

    const resolved = patchOpsIncident(incident.id, {
      status: "resolved",
      mitigation: "hidden low-quality packages and warmed catalog cache",
    });
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolved_at).toBeTruthy();
  });

  test("prepares commercial sandbox and revenue preview without real settlement side effects", () => {
    const published = publishHealthyRulePack("rule-pack-v35-commercial", "V3.5 Commercial Pack");
    installEcosystemPackage({ package_id: published.id });

    const readiness = getCommercialReadiness();
    expect(readiness.mode).toBe("simulated");
    expect(readiness.overall_status).toBe("blocked");
    expect(readiness.gates.some((gate) => gate.gate === "billing_sandbox" && gate.status === "ready")).toBe(true);
    expect(readiness.gates.some((gate) => gate.gate === "kyb_kyc" && gate.status === "missing")).toBe(true);

    const billing = simulateCommercialBilling({
      contributor_id: "contributor_demo",
      period: "2026-05",
      include_entitlements: true,
    });
    expect(billing.mode).toBe("simulated");
    expect(billing.real_money_movement).toBe(false);
    expect(billing.total_amount_cents).toBeGreaterThan(0);

    const preview = getContributorRevenuePreview();
    expect(preview.mode).toBe("simulated");
    expect(preview.total_amount_cents).toBeGreaterThanOrEqual(billing.total_amount_cents);
  });

  test("reports V3.5 growth and retention metrics without changing safety or rule behavior", () => {
    const first = publishHealthyRulePack("rule-pack-v35-growth-a", "V3.5 Growth Pack A");
    publishHealthyRulePack("rule-pack-v35-growth-b", "V3.5 Growth Pack B");
    installEcosystemPackage({ package_id: first.id });
    updateLearningProgress({
      subject_id: "term-yongshen",
      subject_type: "term",
      completed: true,
      score: 92,
    });
    recordEvent({
      anonymous_id: "anon_v35_growth",
      event_name: "case_opened",
      surface: "learning",
      entity_id: "case-001",
      variant: "control",
    });
    recordEvent({
      anonymous_id: "anon_v35_growth",
      event_name: "course_completed",
      surface: "course",
      entity_id: "course-001",
      variant: "control",
    });

    const metrics = getEcosystemMetrics();

    expect(metrics).toMatchObject({
      published_package_count: 2,
      install_count: 1,
      install_conversion_rate: 0.5,
      content_revisit_count: 1,
      learning_completion_count: 2,
      contributor_active_count: 1,
      review_sla_p95_ms: 300,
      complaint_resolution_p95_ms: 0,
    });
  });

  test("supports privacy settings, data export, compliance review, and commitment-word scanning", () => {
    const settings = updatePrivacySettings({
      save_history: false,
      allow_personalization: false,
      allow_sensitive_review: true,
      retain_history_days: 30,
      export_format: "json",
    });
    expect(settings.save_history).toBe(false);
    expect(getPrivacySettings().retain_history_days).toBe(30);

    const exportJob = requestPrivacyDataExport();
    expect(exportJob.status).toBe("completed");
    expect(exportJob.includes_raw_question_text).toBe(false);

    expect(listComplianceReviews()).toHaveLength(1);
    const review = listComplianceReviews()[0];
    const resolved = resolveComplianceReview(review.id, {
      resolution: "privacy export reviewed",
      action: "warn",
    });
    expect(resolved.status).toBe("resolved");

    const published = publishHealthyRulePack("rule-pack-v35-compliance", "V3.5 Compliance Pack");
    expect(() =>
      reviewEcosystemPackageQuality(published.id, {
        quality_score: 90,
        safety_score: 92,
        complaint_count: 0,
        regression_failure_count: 0,
        install_retention_rate: 0.9,
        user_feedback_score: 4.8,
        status: "healthy",
        risk_level: "critical",
        moderation_action: "warn",
        note: "contains guaranteed get rich language",
      }),
    ).toThrow(/commitment wording/);
  });
});

function publishHealthyRulePack(rulePackId: string, title: string) {
  const submission = createContributorSubmission({
    submission_type: "rule_pack",
    title,
    payload: {
      id: rulePackId,
      name: title,
      scope: "style",
      rule_ids: ["B-YS-001", "B-WR-001"],
      validation_case_ids: ["case-001", "case-002"],
      source_refs: ["v3.5-service-test"],
    },
    source_refs: ["v3.5-service-test"],
  });
  submitContributorSubmission(submission.id, {});
  approveRulePackSubmissionForTests(submission.id);
  runRulePackRegression(rulePackId, { force: true });
  return publishRulePackToEcosystem(rulePackId, {
    release_note: "v3.5 service test release",
  });
}
