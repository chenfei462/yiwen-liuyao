import { NextResponse } from "next/server";
import { listCourses } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ courses: await listCourses() });
}
