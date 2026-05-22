import { NextResponse } from "next/server";
import { getContributorSettlementList } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ settlements: await getContributorSettlementList() });
}

