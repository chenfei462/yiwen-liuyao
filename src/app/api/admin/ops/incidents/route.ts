import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOpsIncident, listOpsIncidents } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ incidents: listOpsIncidents() });
}

export async function POST(request: Request) {
  try {
    return NextResponse.json({ incident: createOpsIncident(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "ops_incident_create_failed" }, { status: 500 });
  }
}

