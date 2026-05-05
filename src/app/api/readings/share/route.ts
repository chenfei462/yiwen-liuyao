import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createReadingShare } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json(createReadingShare(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Cast not found")) {
      return NextResponse.json({ error: "chart_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("High-risk")) {
      return NextResponse.json({ error: "share_blocked" }, { status: 422 });
    }
    return NextResponse.json({ error: "share_failed" }, { status: 500 });
  }
}
