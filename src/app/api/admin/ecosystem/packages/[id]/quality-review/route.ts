import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { reviewEcosystemPackageQuality } from "@/domain/reading-service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ review: reviewEcosystemPackageQuality(id, await request.json()) });
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

