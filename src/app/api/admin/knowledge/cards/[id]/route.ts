import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { patchKnowledgeCardStatus } from "@/domain/reading-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ card: patchKnowledgeCardStatus(id, await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Knowledge card not found")) {
      return NextResponse.json({ error: "knowledge_card_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "knowledge_card_review_failed" }, { status: 500 });
  }
}
