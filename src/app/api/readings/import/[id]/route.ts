import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getReadingImport, patchReadingImport } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ import_record: await getReadingImport(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Reading import not found")) {
      return NextResponse.json({ error: "reading_import_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "reading_import_detail_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ import_record: await patchReadingImport(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading import not found")) {
      return NextResponse.json({ error: "reading_import_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "reading_import_patch_failed" }, { status: 500 });
  }
}
