import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { ZodError } from "zod";
import { resolveEcosystemRiskEvent } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ risk_event: await resolveEcosystemRiskEvent(id, await request.json()) });
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

