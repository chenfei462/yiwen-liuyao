import { NextResponse } from "next/server";
import { getVoiceJob } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ job: await getVoiceJob(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Voice job not found")) {
      return NextResponse.json({ error: "voice_job_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "voice_job_failed" }, { status: 500 });
  }
}
