import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { publishRulePackToEcosystem } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ package: publishRulePackToEcosystem(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not ready")) {
      return NextResponse.json({ error: "rule_pack_not_ready" }, { status: 422 });
    }
    return NextResponse.json({ error: "rule_pack_publish_failed" }, { status: 500 });
  }
}

