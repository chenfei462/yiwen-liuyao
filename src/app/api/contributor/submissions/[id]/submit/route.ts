import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { submitContributorSubmission } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ submission: await submitContributorSubmission(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Submission not found")) {
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "submission_submit_failed" }, { status: 500 });
  }
}

