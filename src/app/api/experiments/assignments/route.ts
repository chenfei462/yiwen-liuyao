import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assignExperiment } from "@/domain/reading-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    return NextResponse.json({
      assignment: assignExperiment({
        anonymous_id: url.searchParams.get("anonymous_id") ?? "",
        surface: url.searchParams.get("surface") ?? "home",
      }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "experiment_assignment_failed" }, { status: 500 });
  }
}
