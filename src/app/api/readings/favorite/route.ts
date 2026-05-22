import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { favoriteReading } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    return NextResponse.json(await favoriteReading(await request.json(), scope));
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
    return NextResponse.json({ error: "favorite_failed" }, { status: 500 });
  }
}
