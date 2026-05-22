import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { castReading } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    const payload = await request.json();
    return NextResponse.json(await castReading(payload, scope));
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Error && error.message.startsWith("Reading not found")) {
    return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
  }
  if (error instanceof Error && error.message.startsWith("Reading forbidden")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ error: "cast_failed" }, { status: 500 });
}
