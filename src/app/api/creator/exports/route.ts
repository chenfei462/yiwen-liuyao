import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCreatorExport } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ export: createCreatorExport(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Case not found")) {
      return NextResponse.json({ error: "case_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("High-risk")) {
      return NextResponse.json({ error: "creator_export_blocked" }, { status: 422 });
    }
    return NextResponse.json({ error: "creator_export_failed" }, { status: 500 });
  }
}
