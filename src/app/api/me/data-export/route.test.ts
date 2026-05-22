import { beforeEach, describe, expect, test } from "vitest";
import { resetReadingStoreForTests, updatePrivacySettings } from "@/domain/reading-service";
import { POST } from "./route";

describe("POST /api/me/data-export", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("returns a privacy-safe export job without user identifiers", async () => {
    await updatePrivacySettings({
      save_history: false,
      allow_personalization: false,
      allow_sensitive_review: true,
      retain_history_days: 30,
      export_format: "json",
    });

    const response = await POST(new Request("http://localhost/api/me/data-export", { method: "POST" }));
    const payload = (await response.json()) as {
      export_job: Record<string, unknown>;
    };
    const serialized = JSON.stringify(payload);

    expect(response.status).toBe(200);
    expect(payload.export_job).toMatchObject({
      status: "completed",
      export_format: "json",
      includes_raw_question_text: false,
      includes_private_followups: false,
    });
    expect(payload.export_job).not.toHaveProperty("user_id");
    expect(serialized).not.toContain("anonymous");
    expect(serialized).not.toContain("user_demo");
  });
});
