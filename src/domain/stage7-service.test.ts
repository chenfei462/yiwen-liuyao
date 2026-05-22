import { beforeEach, describe, expect, test } from "vitest";
import {
  approveRulePackSubmissionForTests,
  createContributorSubmission,
  disableEcosystemPackage,
  getContributorDashboard,
  getContributorSettlementList,
  getEcosystemMetrics,
  getEcosystemPackage,
  getRulePack,
  getSubmission,
  installEcosystemPackage,
  listAdminSubmissions,
  listContributorSubmissions,
  listEcosystemPackages,
  patchContributorSubmission,
  publishRulePackToEcosystem,
  resetReadingStoreForTests,
  reviewContributorSubmission,
  rollbackRulePackVersion,
  runRulePackRegression,
  simulateContributorSettlements,
  submitContributorSubmission,
  suspendEcosystemPackage,
} from "./reading-service";

describe("V3.0 controlled ecosystem and contributor governance service", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("supports contributor draft, submit, review, regression, publish, install, and disable flow", async () => {
    const dashboard = await getContributorDashboard();
    expect(dashboard.roles).toEqual(["creator", "expert"]);
    expect(dashboard.settlement_mode).toBe("simulated");

    const submission = await createContributorSubmission({
      submission_type: "rule_pack",
      title: "Controlled yongshen extension",
      payload: {
        id: "rule-pack-v3-controlled",
        name: "V3 Controlled Pack",
        scope: "yongshen",
        rule_ids: ["B-YS-001"],
        validation_case_ids: ["case-001", "case-002"],
        source_refs: ["v3-controlled"],
      },
      source_refs: ["v3-controlled"],
    });
    expect(submission.status).toBe("draft");
    expect(submission.contributor_id).toBe("contributor_demo");

    const patched = await patchContributorSubmission(submission.id, {
      title: "Controlled yongshen extension v1",
      payload: { release_note: "tightened review copy" },
    });
    expect(patched.version).toBe(2);
    expect(patched.diff_summary).toContain("title");

    const submitted = await submitContributorSubmission(submission.id, {});
    expect(submitted.status).toBe("in_review");
    expect((await listAdminSubmissions()).some((item) => item.id === submission.id)).toBe(true);

    const professional = await reviewContributorSubmission(submission.id, {
      review_gate: "professional",
      decision: "approved",
      note: "professional review passed",
    });
    expect(professional.gates.professional).toBe("approved");

    await reviewContributorSubmission(submission.id, {
      review_gate: "compliance",
      decision: "approved",
      note: "compliance review passed",
    });
    await reviewContributorSubmission(submission.id, {
      review_gate: "safety",
      decision: "approved",
      note: "safety scan passed",
    });

    const regression = await runRulePackRegression("rule-pack-v3-controlled", {
      validation_case_ids: ["case-001", "case-002"],
      force: true,
    });
    expect(regression.status).toBe("passed");
    expect(regression.p95_ms).toBeLessThan(10_000);

    const approved = await getSubmission(submission.id);
    expect(approved.status).toBe("approved");

    const published = await publishRulePackToEcosystem("rule-pack-v3-controlled", {
      release_note: "first controlled ecosystem release",
    });
    expect(published.status).toBe("published");
    expect(published.package_type).toBe("rule_pack");
    expect(((await getRulePack("rule-pack-v3-controlled")).rule_pack_version)).toBe(1);
    expect(((await listEcosystemPackages()).some((item) => item.id === published.id))).toBe(true);

    const install = await installEcosystemPackage({ package_id: published.id });
    expect(install.status).toBe("installed");
    expect(((await getEcosystemPackage(published.id)).install_count)).toBe(1);

    const disabled = await disableEcosystemPackage({ package_id: published.id });
    expect(disabled.status).toBe("disabled");
  });

  test("blocks publish before gates, handles change requests, and supports rollback and suspension", async () => {
    const submission = await createContributorSubmission({
      submission_type: "rule_pack",
      title: "Needs more review",
      payload: {
        id: "rule-pack-v3-review-block",
        name: "Review Block Pack",
        scope: "style",
        rule_ids: ["B-YS-001"],
        validation_case_ids: ["case-001"],
        source_refs: ["v3-review-block"],
      },
      source_refs: ["v3-review-block"],
    });
    await submitContributorSubmission(submission.id, {});

    await expect(
      publishRulePackToEcosystem("rule-pack-v3-review-block", {
        release_note: "should fail",
      }),
    ).rejects.toThrow(/not ready/);

    const changeRequest = await reviewContributorSubmission(submission.id, {
      review_gate: "editorial",
      decision: "changes_requested",
      note: "source wording needs revision",
    });
    expect(changeRequest.status).toBe("changes_requested");

    await patchContributorSubmission(submission.id, {
      payload: { source_refs: ["v3-review-block", "revised-source"] },
    });
    await submitContributorSubmission(submission.id, {});
    await approveRulePackSubmissionForTests(submission.id);
    await runRulePackRegression("rule-pack-v3-review-block", { force: true });

    const published = await publishRulePackToEcosystem("rule-pack-v3-review-block", {
      release_note: "approved after revision",
    });
    expect(published.status).toBe("published");

    const rollback = await rollbackRulePackVersion("rule-pack-v3-review-block", {
      target_version: 1,
      reason: "quality rollback",
    });
    expect(rollback.status).toBe("deprecated");

    const suspended = await suspendEcosystemPackage(published.id, { reason: "unsafe marketplace copy" });
    expect(suspended.status).toBe("suspended");
    expect(((await listEcosystemPackages()).some((item) => item.id === published.id))).toBe(false);
  });

  test("calculates simulated settlement events from ecosystem installs without real payouts", async () => {
    const submission = await createContributorSubmission({
      submission_type: "rule_pack",
      title: "Settlement demo",
      payload: {
        id: "rule-pack-v3-settlement",
        name: "Settlement Pack",
        scope: "timing",
        rule_ids: ["B-YS-001"],
        validation_case_ids: ["case-001"],
        source_refs: ["v3-settlement"],
      },
      source_refs: ["v3-settlement"],
    });
    await submitContributorSubmission(submission.id, {});
    await approveRulePackSubmissionForTests(submission.id);
    await runRulePackRegression("rule-pack-v3-settlement", { force: true });
    const published = await publishRulePackToEcosystem("rule-pack-v3-settlement", {
      release_note: "settlement demo",
    });
    await installEcosystemPackage({ package_id: published.id });

    const settlement = await simulateContributorSettlements({
      contributor_id: "contributor_demo",
      period: "2026-05",
    });
    expect(settlement.mode).toBe("simulated");
    expect(settlement.status).toBe("calculated");
    expect(settlement.total_amount_cents).toBeGreaterThan(0);

    const list = await getContributorSettlementList();
    expect(list.some((item) => item.id === settlement.id)).toBe(true);

    const metrics = await getEcosystemMetrics();
    expect(metrics.published_package_count).toBe(1);
    expect(metrics.install_count).toBe(1);
    expect(metrics.simulated_revenue_cents).toBe(settlement.total_amount_cents);
    expect(metrics.regression_failure_rate).toBe(0);
  });

  test("prevents marketplace publication of unsafe contributor content", async () => {
    await expect(
      createContributorSubmission({
        submission_type: "case",
        title: "Unsafe promise",
        payload: {
          body: "This pack is guaranteed to make someone return and get rich.",
        },
        source_refs: ["unsafe"],
      }),
    ).rejects.toThrow(/unsafe ecosystem content/);

    expect((await listContributorSubmissions())).toHaveLength(0);
  });
});
