import { NextResponse } from "next/server";
import { listAdminSubmissions } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ submissions: listAdminSubmissions() });
}

