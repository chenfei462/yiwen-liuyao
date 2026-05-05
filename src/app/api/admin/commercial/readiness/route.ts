import { NextResponse } from "next/server";
import { getCommercialReadiness } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getCommercialReadiness());
}

