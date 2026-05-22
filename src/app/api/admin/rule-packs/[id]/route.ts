import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { ZodError } from "zod";
import { patchRulePack } from "@/domain/reading-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ rule_pack: await patchRulePack(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Rule pack not found")) {
      return NextResponse.json({ error: "rule_pack_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("regression")) {
      return NextResponse.json({ error: "rule_pack_regression_required" }, { status: 422 });
    }
    if (error instanceof Error && error.message.includes("reviews")) {
      return NextResponse.json({ error: "rule_pack_review_required" }, { status: 422 });
    }
    return NextResponse.json({ error: "rule_pack_patch_failed" }, { status: 500 });
  }
}
