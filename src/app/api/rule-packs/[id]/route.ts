import { NextResponse } from "next/server";
import { getRulePack } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ rule_pack: getRulePack(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Rule pack not found")) {
      return NextResponse.json({ error: "rule_pack_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "rule_pack_detail_failed" }, { status: 500 });
  }
}
