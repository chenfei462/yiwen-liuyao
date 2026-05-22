import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getPrivacySettings, updatePrivacySettings } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function GET(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  return NextResponse.json(await getPrivacySettings(scope));
}

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    return NextResponse.json(await updatePrivacySettings(await request.json(), scope));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "privacy_settings_update_failed" }, { status: 500 });
  }
}
