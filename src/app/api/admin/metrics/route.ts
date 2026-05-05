import { NextResponse } from "next/server";
import { getAdminMetrics } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getAdminMetrics());
}
