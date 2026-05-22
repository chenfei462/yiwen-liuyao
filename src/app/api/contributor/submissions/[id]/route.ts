import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSubmission, patchContributorSubmission } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ submission: await getSubmission(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Submission not found")) {
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "submission_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ submission: await patchContributorSubmission(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Submission not found")) {
      return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("unsafe ecosystem content")) {
      return NextResponse.json({ error: "unsafe_ecosystem_content" }, { status: 422 });
    }
    return NextResponse.json({ error: "submission_patch_failed" }, { status: 500 });
  }
}

