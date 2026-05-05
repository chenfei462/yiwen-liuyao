import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getPrivacySettings, updatePrivacySettings } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json(getPrivacySettings());
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(updatePrivacySettings(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "privacy_settings_update_failed" }, { status: 500 });
  }
}

