import { NextResponse } from "next/server";
import { getLearningCard } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ card: getLearningCard(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Knowledge card not found")) {
      return NextResponse.json({ error: "knowledge_card_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "learning_card_failed" }, { status: 500 });
  }
}
