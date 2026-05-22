import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { explainReading } from "@/domain/reading-service";
import type { AiStreamEvent } from "@/domain/ai-orchestrator";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const events = await explainReading(payload);
    if (payload?.stream === false) {
      return NextResponse.json(events.find((event) => event.type === "final")?.data ?? { error: "missing_final" });
    }
    return toSseResponse(events);
  } catch (error) {
    return toErrorResponse(error, "explain_failed");
  }
}

function toSseResponse(events: AiStreamEvent[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`event: ${event.type}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event.data)}\n\n`));
      }
      controller.close();
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function toErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Error && error.message.startsWith("Reading not found")) {
    return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
  }
  if (error instanceof Error && error.message.startsWith("Cast not found")) {
    return NextResponse.json({ error: "chart_not_found" }, { status: 404 });
  }
  if (error instanceof Error && error.message.includes("safety validation")) {
    return NextResponse.json({ error: "unsafe_ai_output" }, { status: 422 });
  }
  if (error instanceof Error) {
    console.error("[readings/explain]", error.message);
    return NextResponse.json({ error: fallback, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
