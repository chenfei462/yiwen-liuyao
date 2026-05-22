import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateLearningProgress } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    return NextResponse.json(await updateLearningProgress(await request.json(), scope));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "learning_progress_failed" }, { status: 500 });
  }
}
