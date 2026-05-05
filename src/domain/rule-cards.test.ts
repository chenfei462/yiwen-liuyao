import { describe, expect, test } from "vitest";
import { RULE_CARD_SEEDS } from "./rule-cards";

describe("MVP 0.2 rule card seeds", () => {
  test("covers the locked stage-2 rule families with traceable metadata", () => {
    const families = new Set(RULE_CARD_SEEDS.map((card) => card.rule_id.split("-").slice(0, 2).join("-")));

    expect(families).toEqual(new Set(["B-YS", "B-WR", "B-DV", "B-XK", "B-SY", "B-HC"]));
    expect(RULE_CARD_SEEDS.every((card) => card.level === "B")).toBe(true);
    expect(RULE_CARD_SEEDS.every((card) => card.source_refs.length > 0)).toBe(true);
    expect(RULE_CARD_SEEDS.every((card) => card.default_weight > 0)).toBe(true);
  });
});
