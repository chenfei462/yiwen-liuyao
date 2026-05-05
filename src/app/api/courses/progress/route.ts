import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updateCourseProgress } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json(updateCourseProgress(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "course_or_lesson_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "course_progress_failed" }, { status: 500 });
  }
}
