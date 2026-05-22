import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCommunityPost, listCommunityPosts } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function GET() {
  return NextResponse.json({ posts: await listCommunityPosts() });
}

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    return NextResponse.json({ post: await createCommunityPost(await request.json(), scope) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Reading forbidden")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("High-risk")) {
      return NextResponse.json({ error: "community_post_blocked" }, { status: 422 });
    }
    return NextResponse.json({ error: "community_post_failed" }, { status: 500 });
  }
}
