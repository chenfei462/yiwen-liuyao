import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, assertSafeOrigin, requestPasswordReset, resetPassword } from "@/domain/auth";

export async function POST(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  try {
    return NextResponse.json(requestPasswordReset(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "password_reset_request_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  try {
    return NextResponse.json(await resetPassword(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "password_reset_failed" }, { status: 500 });
  }
}
