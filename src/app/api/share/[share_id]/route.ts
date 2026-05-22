import { NextResponse } from "next/server";
import { getPublicShare } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ share_id: string }> }) {
  try {
    const { share_id } = await params;
    return NextResponse.json(await getPublicShare(share_id));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Share not found")) {
      return NextResponse.json({ error: "share_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "share_failed" }, { status: 500 });
  }
}
