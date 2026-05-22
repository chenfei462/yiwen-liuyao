import { NextResponse } from "next/server";
import { AuthError, assertSafeOrigin, issueEmailVerificationToken, toPublicPrincipal, verifyEmailToken } from "@/domain/auth";

export async function POST(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    const token = issueEmailVerificationToken(email);
    return NextResponse.json(process.env.NODE_ENV === "production" ? { status: "sent" } : { status: "sent", verification_token: token });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "email_verification_failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    return NextResponse.json({ principal: toPublicPrincipal(verifyEmailToken(token)) });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "email_verification_failed" }, { status: 500 });
  }
}
