import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { patchCase } from "@/domain/reading-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ case: patchCase(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Case not found")) {
      return NextResponse.json({ error: "case_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "case_patch_failed" }, { status: 500 });
  }
}
