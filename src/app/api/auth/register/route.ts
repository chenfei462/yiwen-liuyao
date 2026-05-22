import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, assertSafeOrigin, makeSessionCookie, registerUser, toPublicPrincipal } from "@/domain/auth";

export async function POST(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  try {
    const result = await registerUser(await request.json());
    const response = NextResponse.json({ principal: toPublicPrincipal(result.principal) }, { status: 201 });
    response.headers.append("Set-Cookie", makeSessionCookie(result.session_token));
    return response;
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }
}
