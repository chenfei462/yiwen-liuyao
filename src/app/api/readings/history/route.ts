import { NextResponse } from "next/server";
import { listReadingHistory } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function GET(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  return NextResponse.json({
    history: await listReadingHistory(8, scope),
  });
}
