import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { ZodError } from "zod";
import { reviewEcosystemPackageQuality } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    return NextResponse.json({ review: await reviewEcosystemPackageQuality(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "ecosystem_package_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes("commitment wording")) {
      return NextResponse.json({ error: "commitment_wording_blocked" }, { status: 422 });
    }
    return NextResponse.json({ error: "quality_review_failed" }, { status: 500 });
  }
}

