import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { patchExperiment } from "@/domain/reading-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ experiment: patchExperiment(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Experiment not found")) {
      return NextResponse.json({ error: "experiment_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "experiment_patch_failed" }, { status: 500 });
  }
}
