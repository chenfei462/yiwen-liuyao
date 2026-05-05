import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { upsertRulePack } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ rule_pack: upsertRulePack(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "rule_pack_upsert_failed" }, { status: 500 });
  }
}
