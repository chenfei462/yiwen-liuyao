import { NextResponse } from "next/server";
import { getCourse } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ course: await getCourse(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Course not found")) {
      return NextResponse.json({ error: "course_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "course_detail_failed" }, { status: 500 });
  }
}
