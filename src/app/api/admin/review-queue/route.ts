import { NextResponse } from "next/server";
import { listReviewQueue } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ review_queue: listReviewQueue() });
}
