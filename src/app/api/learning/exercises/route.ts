import { NextResponse } from "next/server";
import { ExerciseDifficultySchema, SCENARIOS, type Scenario } from "@/domain/contracts";
import { listLearningExercises } from "@/domain/reading-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const difficulty = url.searchParams.get("difficulty");
  const scenario = url.searchParams.get("scenario");
  const parsedDifficulty = difficulty ? ExerciseDifficultySchema.safeParse(difficulty) : undefined;
  if (parsedDifficulty && !parsedDifficulty.success) {
    return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 });
  }
  if (scenario && !SCENARIOS.includes(scenario as Scenario)) {
    return NextResponse.json({ error: "invalid_scenario" }, { status: 400 });
  }

  return NextResponse.json({
    exercises: await listLearningExercises({
      term: url.searchParams.get("term") ?? undefined,
      rule_id: url.searchParams.get("rule_id") ?? undefined,
      scenario: scenario ? (scenario as Scenario) : undefined,
      difficulty: parsedDifficulty?.data,
      limit: toLimit(url.searchParams.get("limit"), 40),
    }),
  });
}

function toLimit(value: string | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
