import { NextResponse } from "next/server";
import { getCourseProgress } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getCourseProgress());
}
