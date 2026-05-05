import { NextResponse } from "next/server";
import { getOpsSlo } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getOpsSlo());
}

