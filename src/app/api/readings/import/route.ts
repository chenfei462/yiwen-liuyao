import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createReadingImport } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ import_record: createReadingImport(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "reading_import_failed" }, { status: 500 });
  }
}
