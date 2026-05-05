import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { castReading } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json(castReading(payload));
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
  return NextResponse.json({ error: "cast_failed" }, { status: 500 });
}
