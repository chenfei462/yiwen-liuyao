import { beforeEach, describe, expect, test } from "vitest";
import { SCENARIOS } from "@/domain/contracts";
import { castReading, initReading, resetReadingStoreForTests } from "@/domain/reading-service";
import { GET } from "./route";

describe("GET /api/knowledge/cards", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("keeps public card queries open when no reading_id is supplied", async () => {
    const response = await getCards("http://localhost/api/knowledge/cards?limit=2");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.cards.length).toBeGreaterThan(0);
  });

  test("rejects reading-context card queries for another anonymous principal", async () => {
    const ownerScope = { owner_id: "anonymous:owner-a" };
    const init = await initReading({
      question: "Will this exam review help?",
      scenario: SCENARIOS[3],
      timezone: "Asia/Shanghai",
    }, ownerScope);
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    }, ownerScope);

    const response = await getCards(`http://localhost/api/knowledge/cards?reading_id=${init.reading_id}`, "owner-b");
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe("forbidden");
  });
});

function getCards(url: string, anonymousId?: string): Promise<Response> {
  return GET(
    new Request(url, {
      headers: anonymousId ? { "x-anonymous-id": anonymousId } : undefined,
    }),
  );
}
