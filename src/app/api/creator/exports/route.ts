import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCreatorExport } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    return NextResponse.json({ export: await createCreatorExport(await request.json(), scope) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Reading forbidden")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
