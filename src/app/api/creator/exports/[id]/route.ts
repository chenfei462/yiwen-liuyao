import { NextResponse } from "next/server";
import { getCreatorExport } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ export: await getCreatorExport(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Creator export not found")) {
      return NextResponse.json({ error: "creator_export_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "creator_export_detail_failed" }, { status: 500 });
  }
}
