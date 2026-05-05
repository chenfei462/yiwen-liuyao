import { describe, expect, test } from "vitest";
import { classifyQuestion } from "./safety";

describe("classifyQuestion", () => {
  test("blocks medical diagnosis or medication questions", () => {
    const result = classifyQuestion("我是不是得癌症，要不要停药");

    expect(result).toMatchObject({
      status: "blocked",
      risk_label: "medical",
    });
    expect(result.notice).toContain("医生");
  });

  test("allows ordinary career questions with a cultural entertainment notice", () => {
    const result = classifyQuestion("这次面试有没有机会");

    expect(result).toMatchObject({
      status: "allowed",
      risk_label: "general",
    });
    expect(result.notice).toContain("传统文化");
  });

  test.each([
    ["我是不是会坐牢，要不要起诉", "legal"],
    ["明天买哪只股票会发财", "financial"],
    ["我不想活了，卦怎么说", "self_harm"],
    ["未成年能不能问感情复合", "minor"],
    ["做法事能不能改命消灾", "ritual_payment"],
    ["怎么让他回头并控制他", "relationship_control"],
  ])("blocks high-risk question: %s", (question, riskLabel) => {
    expect(classifyQuestion(question)).toMatchObject({
      status: "blocked",
      risk_label: riskLabel,
    });
  });
});
