import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { ZodError } from "zod";
import { createAdminReview } from "@/domain/reading-service";

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    return NextResponse.json({ review: await createAdminReview(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "admin_review_failed" }, { status: 500 });
  }
}
