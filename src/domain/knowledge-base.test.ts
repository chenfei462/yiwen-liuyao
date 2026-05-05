import { describe, expect, test } from "vitest";
import { EXERCISE_SEEDS, KNOWLEDGE_CARD_SEEDS, searchKnowledgeCards } from "./knowledge-base";

describe("Beta 0.8 knowledge base", () => {
  test("ships the locked seed volume with traceable approved cards", () => {
    expect(KNOWLEDGE_CARD_SEEDS).toHaveLength(50);
    expect(EXERCISE_SEEDS).toHaveLength(20);
    expect(KNOWLEDGE_CARD_SEEDS.every((card) => card.status === "approved")).toBe(true);
    expect(KNOWLEDGE_CARD_SEEDS.every((card) => card.source_ref.length > 0 && card.license_note.length > 0)).toBe(true);
  });

  test("retrieves approved knowledge cards by rule_id, scenario, and term", () => {
    const byRule = searchKnowledgeCards({ rule_id: "B-YS-001", scenario: "事业", limit: 5 });
    expect(byRule.length).toBeGreaterThan(0);
    expect(byRule.every((card) => card.status === "approved")).toBe(true);
    expect(byRule[0]).toMatchObject({ rule_id: "B-YS-001" });

    const byTerm = searchKnowledgeCards({ term: "用神", limit: 5 });
    expect(byTerm.some((card) => card.term === "用神")).toBe(true);
  });
});
