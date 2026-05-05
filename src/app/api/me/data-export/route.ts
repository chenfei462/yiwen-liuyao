import { NextResponse } from "next/server";
import { requestPrivacyDataExport } from "@/domain/reading-service";

export async function POST() {
  return NextResponse.json({ export_job: requestPrivacyDataExport() });
}

