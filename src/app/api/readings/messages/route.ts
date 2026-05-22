import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { messageReading } from "@/domain/reading-service";
import type { AiStreamEvent } from "@/domain/ai-orchestrator";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  try {
    const payload = await request.json();
    const events = await messageReading(payload, scope);
    return toSseResponse(events);
  } catch (error) {
    return toErrorResponse(error);
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

function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
  }
  if (error instanceof Error && error.message.startsWith("Reading not found")) {
    return NextResponse.json({ error: "reading_not_found" }, { status: 404 });
  }
  if (error instanceof Error && error.message.startsWith("Reading forbidden")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (error instanceof Error && error.message.startsWith("Cast not found")) {
    return NextResponse.json({ error: "chart_not_found" }, { status: 404 });
  }
  if (error instanceof Error && error.message.includes("safety validation")) {
    return NextResponse.json({ error: "unsafe_ai_output" }, { status: 422 });
  }
  return NextResponse.json({ error: "message_failed" }, { status: 500 });
}
