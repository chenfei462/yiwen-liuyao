import { NextResponse } from "next/server";
import { listRulePacks } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ rule_packs: await listRulePacks() });
}
