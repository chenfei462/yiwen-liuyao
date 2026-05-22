import { describe, expect, test } from "vitest";
import { GET } from "./route";

describe("GET /api/learning/exercises", () => {
  test("filters exercises by scenario and rule id", async () => {
    const response = await GET(new Request("http://localhost/api/learning/exercises?scenario=财务&rule_id=B-YS-001"));
    const payload = (await response.json()) as { exercises: Array<{ scenario: string; answer: string }> };

    expect(response.status).toBe(200);
    expect(payload.exercises.length).toBeGreaterThan(0);
    expect(payload.exercises.every((exercise) => exercise.scenario === "财务" || exercise.scenario === "通用")).toBe(true);
    expect(payload.exercises.every((exercise) => exercise.answer === "B-YS-001")).toBe(true);
  });

  test("rejects invalid scenario", async () => {
    const response = await GET(new Request("http://localhost/api/learning/exercises?scenario=天气"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_scenario");
  });
});
