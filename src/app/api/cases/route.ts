import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SCENARIOS, type CaseDifficulty, type CaseSourceType, type CaseStatus, type Scenario } from "@/domain/contracts";
import { listCases } from "@/domain/reading-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scenario = url.searchParams.get("scenario");
    if (scenario && !SCENARIOS.includes(scenario as Scenario)) {
      return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
    }

    return NextResponse.json({
      cases: await listCases({
        scenario: scenario ? (scenario as Scenario) : undefined,
        hexagram: url.searchParams.get("hexagram") ?? undefined,
        rule_id: url.searchParams.get("rule_id") ?? undefined,
        yongshen: url.searchParams.get("yongshen") ?? undefined,
        difficulty: (url.searchParams.get("difficulty") as CaseDifficulty | null) ?? undefined,
        source_type: (url.searchParams.get("source_type") as CaseSourceType | null) ?? undefined,
        status: (url.searchParams.get("status") as CaseStatus | null) ?? "approved",
        limit: toLimit(url.searchParams.get("limit"), 20),
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "case_query_failed" }, { status: 500 });
  }
}

function toLimit(value: string | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
