import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { resolveEcosystemRiskEvent } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ risk_event: resolveEcosystemRiskEvent(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "risk_event_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "risk_event_resolve_failed" }, { status: 500 });
  }
}

