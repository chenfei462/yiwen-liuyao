import { NextResponse } from "next/server";
import { deleteReadingHistory } from "@/domain/reading-service";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{ reading_id: string }>;
  },
) {
  const { reading_id: readingId } = await context.params;
  return NextResponse.json(deleteReadingHistory(readingId));
}
