import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { simulateContributorSettlements } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ settlement: await simulateContributorSettlements(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "settlement_simulation_failed" }, { status: 500 });
  }
}

