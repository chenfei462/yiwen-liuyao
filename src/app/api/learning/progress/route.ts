import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateLearningProgress } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json(updateLearningProgress(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "learning_progress_failed" }, { status: 500 });
  }
}
