import { NextResponse } from "next/server";
import { listComplianceReviews } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ reviews: listComplianceReviews() });
}

