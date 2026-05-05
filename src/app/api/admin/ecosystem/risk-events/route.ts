import { NextResponse } from "next/server";
import { listEcosystemRiskEvents } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ risk_events: listEcosystemRiskEvents() });
}

