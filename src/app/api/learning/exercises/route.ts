import { NextResponse } from "next/server";
import { ExerciseDifficultySchema } from "@/domain/contracts";
import { listLearningExercises } from "@/domain/reading-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const difficulty = url.searchParams.get("difficulty");
  const parsedDifficulty = difficulty ? ExerciseDifficultySchema.safeParse(difficulty) : undefined;
  if (parsedDifficulty && !parsedDifficulty.success) {
    return NextResponse.json({ error: "invalid_difficulty" }, { status: 400 });
  }

  return NextResponse.json({
    exercises: listLearningExercises({
      term: url.searchParams.get("term") ?? undefined,
      rule_id: url.searchParams.get("rule_id") ?? undefined,
      difficulty: parsedDifficulty?.data,
      limit: toLimit(url.searchParams.get("limit"), 40),
    }),
  });
}

function toLimit(value: string | null, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
