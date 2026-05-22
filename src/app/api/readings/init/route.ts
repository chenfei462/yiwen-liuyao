import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { initReading } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    const payload = await request.json();
    return NextResponse.json(await initReading(payload, scope));
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
  }
  return NextResponse.json({ error: "init_failed" }, { status: 500 });
}
