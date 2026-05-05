import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { initReading } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    return NextResponse.json(initReading(payload));
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
