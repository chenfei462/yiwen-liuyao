import { beforeEach, describe, expect, test } from "vitest";
import { castReading, initReading, messageReading, resetReadingStoreForTests } from "@/domain/reading-service";
import { GET as getPublicShare } from "../../share/[share_id]/route";
import { POST as createShare } from "./route";

describe("reading share APIs", () => {
  beforeEach(() => {
    resetReadingStoreForTests();
  });

  test("share preview and public share responses omit raw questions and private followups", async () => {
    const rawQuestion = "这次面试有没有机会，想看三周内的真实结果和个人隐私细节";
    const privateFollowup = "私密追问：我和某位面试官的私人关系会不会影响结果";
    const init = await initReading({
      question: rawQuestion,
      scenario: "事业",
      timezone: "Asia/Shanghai",
    });
    await castReading({
      reading_id: init.reading_id,
      cast_method: "manual",
      line_values: [7, 7, 7, 7, 7, 7],
      cast_time: "2026-04-30",
    });
    await messageReading({
      reading_id: init.reading_id,
      message: privateFollowup,
      followup_type: "free_text",
    });

    const shareResponse = await postShare({
      reading_id: init.reading_id,
      visibility: "public_anonymous",
    });
    const sharePayload = await shareResponse.json();
    const shareSerialized = JSON.stringify(sharePayload);

    expect(shareResponse.status).toBe(200);
    expect(sharePayload.card_payload.question_preview).toBe("问题已脱敏");
    expect(shareSerialized).not.toContain(rawQuestion);
    expect(shareSerialized).not.toContain(privateFollowup);

    const publicShareResponse = await getPublicShare(new Request("http://localhost/api/share/test"), {
      params: Promise.resolve({ share_id: sharePayload.share_id }),
    });
    const publicPayload = await publicShareResponse.json();
    const publicSerialized = JSON.stringify(publicPayload);

    expect(publicShareResponse.status).toBe(200);
    expect(publicPayload.card_payload.question_preview).toBe("问题已脱敏");
    expect(publicSerialized).not.toContain(rawQuestion);
    expect(publicSerialized).not.toContain(privateFollowup);
  });
});

function postShare(payload: unknown): Promise<Response> {
  return createShare(
    new Request("http://localhost/api/readings/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}
