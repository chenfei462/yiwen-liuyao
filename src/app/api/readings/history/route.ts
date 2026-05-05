import { NextResponse } from "next/server";
import { listReadingHistory } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({
    history: listReadingHistory(),
  });
}
