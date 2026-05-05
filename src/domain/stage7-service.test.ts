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

  test("supports contributor draft, submit, review, regression, publish, install, and disable flow", () => {
    const dashboard = getContributorDashboard();
    expect(dashboard.roles).toEqual(["creator", "expert"]);
    expect(dashboard.settlement_mode).toBe("simulated");

    const submission = createContributorSubmission({
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

    const patched = patchContributorSubmission(submission.id, {
      title: "Controlled yongshen extension v1",
      payload: { release_note: "tightened review copy" },
    });
    expect(patched.version).toBe(2);
    expect(patched.diff_summary).toContain("title");

    const submitted = submitContributorSubmission(submission.id, {});
    expect(submitted.status).toBe("in_review");
    expect(listAdminSubmissions().some((item) => item.id === submission.id)).toBe(true);

    const professional = reviewContributorSubmission(submission.id, {
      review_gate: "professional",
      decision: "approved",
      note: "professional review passed",
    });
    expect(professional.gates.professional).toBe("approved");

    reviewContributorSubmission(submission.id, {
      review_gate: "compliance",
      decision: "approved",
      note: "compliance review passed",
    });
    reviewContributorSubmission(submission.id, {
      review_gate: "safety",
      decision: "approved",
      note: "safety scan passed",
    });

    const regression = runRulePackRegression("rule-pack-v3-controlled", {
      validation_case_ids: ["case-001", "case-002"],
      force: true,
    });
    expect(regression.status).toBe("passed");
    expect(regression.p95_ms).toBeLessThan(10_000);

    const approved = getSubmission(submission.id);
    expect(approved.status).toBe("approved");

    const published = publishRulePackToEcosystem("rule-pack-v3-controlled", {
      release_note: "first controlled ecosystem release",
    });
    expect(published.status).toBe("published");
    expect(published.package_type).toBe("rule_pack");
    expect(getRulePack("rule-pack-v3-controlled").rule_pack_version).toBe(1);
    expect(listEcosystemPackages().some((item) => item.id === published.id)).toBe(true);

    const install = installEcosystemPackage({ package_id: published.id });
    expect(install.status).toBe("installed");
    expect(getEcosystemPackage(published.id).install_count).toBe(1);

    const disabled = disableEcosystemPackage({ package_id: published.id });
    expect(disabled.status).toBe("disabled");
  });

  test("blocks publish before gates, handles change requests, and supports rollback and suspension", () => {
    const submission = createContributorSubmission({
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
    submitContributorSubmission(submission.id, {});

    expect(() =>
      publishRulePackToEcosystem("rule-pack-v3-review-block", {
        release_note: "should fail",
      }),
    ).toThrow(/not ready/);

    const changeRequest = reviewContributorSubmission(submission.id, {
      review_gate: "editorial",
      decision: "changes_requested",
      note: "source wording needs revision",
    });
    expect(changeRequest.status).toBe("changes_requested");

    patchContributorSubmission(submission.id, {
      payload: { source_refs: ["v3-review-block", "revised-source"] },
    });
    submitContributorSubmission(submission.id, {});
    approveRulePackSubmissionForTests(submission.id);
    runRulePackRegression("rule-pack-v3-review-block", { force: true });

    const published = publishRulePackToEcosystem("rule-pack-v3-review-block", {
      release_note: "approved after revision",
    });
    expect(published.status).toBe("published");

    const rollback = rollbackRulePackVersion("rule-pack-v3-review-block", {
      target_version: 1,
      reason: "quality rollback",
    });
    expect(rollback.status).toBe("deprecated");

    const suspended = suspendEcosystemPackage(published.id, { reason: "unsafe marketplace copy" });
    expect(suspended.status).toBe("suspended");
    expect(listEcosystemPackages().some((item) => item.id === published.id)).toBe(false);
  });

  test("calculates simulated settlement events from ecosystem installs without real payouts", () => {
    const submission = createContributorSubmission({
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
    submitContributorSubmission(submission.id, {});
    approveRulePackSubmissionForTests(submission.id);
    runRulePackRegression("rule-pack-v3-settlement", { force: true });
    const published = publishRulePackToEcosystem("rule-pack-v3-settlement", {
      release_note: "settlement demo",
    });
    installEcosystemPackage({ package_id: published.id });

    const settlement = simulateContributorSettlements({
      contributor_id: "contributor_demo",
      period: "2026-05",
    });
    expect(settlement.mode).toBe("simulated");
    expect(settlement.status).toBe("calculated");
    expect(settlement.total_amount_cents).toBeGreaterThan(0);

    const list = getContributorSettlementList();
    expect(list.some((item) => item.id === settlement.id)).toBe(true);

    const metrics = getEcosystemMetrics();
    expect(metrics.published_package_count).toBe(1);
    expect(metrics.install_count).toBe(1);
    expect(metrics.simulated_revenue_cents).toBe(settlement.total_amount_cents);
    expect(metrics.regression_failure_rate).toBe(0);
  });

  test("prevents marketplace publication of unsafe contributor content", () => {
    expect(() =>
      createContributorSubmission({
        submission_type: "case",
        title: "Unsafe promise",
        payload: {
          body: "This pack is guaranteed to make someone return and get rich.",
        },
        source_refs: ["unsafe"],
      }),
    ).toThrow(/unsafe ecosystem content/);

    expect(listContributorSubmissions()).toHaveLength(0);
  });
});
