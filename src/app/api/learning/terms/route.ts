import { NextResponse } from "next/server";
import { SCENARIOS, type Scenario } from "@/domain/contracts";
import { listLearningTerms } from "@/domain/reading-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario");
  if (scenario && !SCENARIOS.includes(scenario as Scenario)) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  return NextResponse.json({
    terms: await listLearningTerms({
      term: url.searchParams.get("term") ?? undefined,
      rule_id: url.searchParams.get("rule_id") ?? undefined,
      scenario: scenario ? (scenario as Scenario) : undefined,
      limit: toLimit(url.searchParams.get("limit"), 100),
    }),
  });
}

function toLimit(value: string | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
