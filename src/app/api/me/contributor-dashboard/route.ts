import { NextResponse } from "next/server";
import { getContributorDashboard } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getContributorDashboard());
}

