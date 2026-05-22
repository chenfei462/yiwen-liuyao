import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createContributorSubmission, listContributorSubmissions } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ submissions: await listContributorSubmissions() });
}

export async function POST(request: Request) {
  try {
    return NextResponse.json({ submission: await createContributorSubmission(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("unsafe ecosystem content")) {
      return NextResponse.json({ error: "unsafe_ecosystem_content" }, { status: 422 });
    }
    return NextResponse.json({ error: "contributor_submission_create_failed" }, { status: 500 });
  }
}

