import { NextResponse } from "next/server";
import { listAdminExperiments } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ experiments: listAdminExperiments() });
}
