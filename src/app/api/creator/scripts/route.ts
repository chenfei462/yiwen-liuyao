import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCreatorScript } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ export: await createCreatorScript(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("High-risk")) {
      return NextResponse.json({ error: "creator_export_blocked" }, { status: 422 });
    }
    return NextResponse.json({ error: "creator_script_failed" }, { status: 500 });
  }
}
