import { NextResponse } from "next/server";
import { getContributorRevenuePreview } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(await getContributorRevenuePreview());
}

