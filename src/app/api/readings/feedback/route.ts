import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { submitFeedback } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json(submitFeedback(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "feedback_failed" }, { status: 500 });
  }
}
