import { NextResponse } from "next/server";
import { listAdminFeedback } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ feedback: listAdminFeedback() });
}
