import { NextResponse } from "next/server";
import { getMemberProgress } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getMemberProgress());
}
