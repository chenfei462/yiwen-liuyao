import { NextResponse } from "next/server";
import { getCommunityPost } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ post: await getCommunityPost(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Community post not found")) {
      return NextResponse.json({ error: "community_post_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "community_post_detail_failed" }, { status: 500 });
  }
}
