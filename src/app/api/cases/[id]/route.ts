import { NextResponse } from "next/server";
import { getCase } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ case: await getCase(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Case not found")) {
      return NextResponse.json({ error: "case_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "case_detail_failed" }, { status: 500 });
  }
}
