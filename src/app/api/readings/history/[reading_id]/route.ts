import { NextResponse } from "next/server";
import { deleteReadingHistory } from "@/domain/reading-service";
import { requireOwnerScope } from "../../../_auth";

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ reading_id: string }>;
  },
) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  const { reading_id: readingId } = await context.params;
  try {
    return NextResponse.json(await deleteReadingHistory(readingId, scope));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Reading not found")) {
      return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
    }
    if (error instanceof Error && error.message.startsWith("Reading forbidden")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "history_delete_failed" }, { status: 500 });
  }
}
