import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { updatePushSettings } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ settings: updatePushSettings(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Device not found")) {
      return NextResponse.json({ error: "device_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "push_settings_failed" }, { status: 500 });
  }
}
