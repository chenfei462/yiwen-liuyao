import { beforeEach, describe, expect, test } from "vitest";
import { SCENARIOS } from "@/domain/contracts";
import { castReading, initReading, resetReadingStoreForTests } from "@/domain/reading-service";
import { POST } from "./route";

describe("POST /api/readings/analyze", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("rejects analysis for a reading owned by another anonymous principal", async () => {
    const ownerScope = { owner_id: "anonymous:owner-a" };
    const init = await initReading({
      question: "Will this interview review help?",
      scenario: SCENARIOS[0],
      timezone: "Asia/Shanghai",
    }, ownerScope);
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    }, ownerScope);

    const response = await postAnalyze({ reading_id: init.reading_id, mode: "learning" }, "owner-b");
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("forbidden");
  });
});

function postAnalyze(payload: unknown, anonymousId: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/readings/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-anonymous-id": anonymousId },
      body: JSON.stringify(payload),
    }),
  );
}
