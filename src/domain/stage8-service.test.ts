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

  test("scores ecosystem packages, hides needs-review packages, and resolves risk events", async () => {
    const published = await publishHealthyRulePack("rule-pack-v35-quality", "V3.5 Quality Pack");
    await installEcosystemPackage({ package_id: published.id });

    expect(((await listEcosystemPackages()).map((item) => item.id))).toContain(published.id);
    expect((await getEcosystemQuality()).packages[0]).toMatchObject({
      package_id: published.id,
      quality_status: "healthy",
    });

    const review = await reviewEcosystemPackageQuality(published.id, {
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
    expect(((await listEcosystemPackages()).map((item) => item.id))).not.toContain(published.id);

    const riskEvent = (await listEcosystemRiskEvents())[0];
    expect(riskEvent).toMatchObject({
      package_id: published.id,
      risk_level: "high",
      status: "open",
      moderation_action: "hide",
    });

    const resolved = await resolveEcosystemRiskEvent(riskEvent.id, {
      resolution: "hidden from catalog and sent to contributor review",
      action: "hide",
    });
    expect(resolved.status).toBe("resolved");
  });

  test("tracks operations SLOs and incident lifecycle without changing rule safety", async () => {
    const slo = await getOpsSlo();
    expect(slo.targets.cast_p95_ms).toBeLessThanOrEqual(500);
    expect(slo.targets.first_ai_delta_p95_ms).toBeLessThanOrEqual(2000);
    expect(slo.current.ecosystem_catalog_p95_ms).toBeLessThanOrEqual(1500);

    const incident = await createOpsIncident({
      title: "ecosystem catalog latency breach",
      severity: "sev3",
      affected_surface: "ecosystem_catalog",
      summary: "catalog p95 crossed target during package review",
    });
    expect(incident.status).toBe("open");
    expect(await listOpsIncidents()).toHaveLength(1);

    const resolved = await patchOpsIncident(incident.id, {
      status: "resolved",
      mitigation: "hidden low-quality packages and warmed catalog cache",
    });
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolved_at).toBeTruthy();
  });

  test("prepares commercial sandbox and revenue preview without real settlement side effects", async () => {
    const published = await publishHealthyRulePack("rule-pack-v35-commercial", "V3.5 Commercial Pack");
    await installEcosystemPackage({ package_id: published.id });

    const readiness = await getCommercialReadiness();
    expect(readiness.mode).toBe("simulated");
    expect(readiness.overall_status).toBe("blocked");
    expect(readiness.gates.some((gate) => gate.gate === "billing_sandbox" && gate.status === "ready")).toBe(true);
    expect(readiness.gates.some((gate) => gate.gate === "kyb_kyc" && gate.status === "missing")).toBe(true);

    const billing = await simulateCommercialBilling({
      contributor_id: "contributor_demo",
      period: "2026-05",
      include_entitlements: true,
    });
    expect(billing.mode).toBe("simulated");
    expect(billing.real_money_movement).toBe(false);
    expect(billing.total_amount_cents).toBeGreaterThan(0);

    const preview = await getContributorRevenuePreview();
    expect(preview.mode).toBe("simulated");
    expect(preview.total_amount_cents).toBeGreaterThanOrEqual(billing.total_amount_cents);
  });

  test("reports V3.5 growth and retention metrics without changing safety or rule behavior", async () => {
    const first = await publishHealthyRulePack("rule-pack-v35-growth-a", "V3.5 Growth Pack A");
    await publishHealthyRulePack("rule-pack-v35-growth-b", "V3.5 Growth Pack B");
    await installEcosystemPackage({ package_id: first.id });
    await updateLearningProgress({
      subject_id: "term-yongshen",
      subject_type: "term",
      completed: true,
      score: 92,
    });
    await recordEvent({
      anonymous_id: "anon_v35_growth",
      event_name: "case_opened",
      surface: "learning",
      entity_id: "case-001",
      variant: "control",
    });
    await recordEvent({
      anonymous_id: "anon_v35_growth",
      event_name: "course_completed",
      surface: "course",
      entity_id: "course-001",
      variant: "control",
    });

    const metrics = await getEcosystemMetrics();

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

  test("supports privacy settings, data export, compliance review, and commitment-word scanning", async () => {
    const settings = await updatePrivacySettings({
      save_history: false,
      allow_personalization: false,
      allow_sensitive_review: true,
      retain_history_days: 30,
      export_format: "json",
    });
    expect(settings.save_history).toBe(false);
    expect((await getPrivacySettings()).retain_history_days).toBe(30);

    const exportJob = await requestPrivacyDataExport();
    expect(exportJob.status).toBe("completed");
    expect(exportJob.includes_raw_question_text).toBe(false);
    expect(exportJob).toMatchObject({
      includes_raw_question_text: false,
      includes_private_followups: false,
    });

    expect((await listComplianceReviews())).toHaveLength(1);
    const review = (await listComplianceReviews())[0];
    const resolved = await resolveComplianceReview(review.id, {
      resolution: "privacy export reviewed",
      action: "warn",
    });
    expect(resolved.status).toBe("resolved");

    const published = await publishHealthyRulePack("rule-pack-v35-compliance", "V3.5 Compliance Pack");
    await expect(
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
    ).rejects.toThrow(/commitment wording/);
  });
});

async function publishHealthyRulePack(rulePackId: string, title: string) {
  const submission = await createContributorSubmission({
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
  await submitContributorSubmission(submission.id, {});
  await approveRulePackSubmissionForTests(submission.id);
  await runRulePackRegression(rulePackId, { force: true });
  return await publishRulePackToEcosystem(rulePackId, {
    release_note: "v3.5 service test release",
  });
}
