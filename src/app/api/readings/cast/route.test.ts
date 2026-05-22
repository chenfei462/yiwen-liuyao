import { beforeEach, describe, expect, test } from "vitest";
import { initReading, resetReadingStoreForTests } from "@/domain/reading-service";
import { POST } from "./route";

describe("POST /api/readings/cast", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("allows time casting without line_values", async () => {
    const init = await initReading({
      question: "今天用时间起卦看看项目复盘重点",
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });

    const response = await postCast({
      reading_id: init.reading_id,
      cast_method: "time",
      cast_time: "2026-05-05",
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.cast_method).toBe("time");
    expect(payload.lines).toHaveLength(6);
    expect(payload.lines.some((line: { moving: boolean }) => line.moving)).toBe(true);
  });

  test("rejects manual casting without six line_values", async () => {
    const response = await postCast({
      reading_id: "reading_missing_lines",
      cast_method: "manual",
      cast_time: "2026-05-05",
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("invalid_request");
    expect(JSON.stringify(payload.issues)).toContain("line_values must contain exactly six bottom-to-top values");
  });
});

function postCast(payload: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/readings/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
