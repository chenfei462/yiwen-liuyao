import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { ZodError } from "zod";
import { createOpsIncident, listOpsIncidents } from "@/domain/reading-service";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ incidents: await listOpsIncidents() });
}

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ incident: await createOpsIncident(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "ops_incident_create_failed" }, { status: 500 });
  }
}

