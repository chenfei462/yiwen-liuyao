import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCommunityComment } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ comment: createCommunityComment(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Community post not found")) {
      return NextResponse.json({ error: "community_post_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "community_comment_failed" }, { status: 500 });
  }
}
