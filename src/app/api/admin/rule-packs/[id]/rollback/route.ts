import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rollbackRulePackVersion } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ rule_pack: rollbackRulePackVersion(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Rule pack not found")) {
      return NextResponse.json({ error: "rule_pack_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "rule_pack_rollback_failed" }, { status: 500 });
  }
}

