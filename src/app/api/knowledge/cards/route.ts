import { NextResponse } from "next/server";
import { SCENARIOS, type Scenario } from "@/domain/contracts";
import { queryKnowledgeCards } from "@/domain/reading-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scenario = url.searchParams.get("scenario");
  const limit = Number(url.searchParams.get("limit") ?? "8");

  if (scenario && !SCENARIOS.includes(scenario as Scenario)) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  try {
    return NextResponse.json({
      cards: await queryKnowledgeCards({
        reading_id: url.searchParams.get("reading_id") ?? undefined,
        rule_id: url.searchParams.get("rule_id") ?? undefined,
        term: url.searchParams.get("term") ?? undefined,
        scenario: scenario ? (scenario as Scenario) : undefined,
        limit: Number.isFinite(limit) ? limit : 8,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "knowledge_query_failed" }, { status: 500 });
  }
}
