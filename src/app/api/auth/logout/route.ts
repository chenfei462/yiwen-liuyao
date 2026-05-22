import { NextResponse } from "next/server";
import { assertSafeOrigin, clearSessionCookie, logoutSession } from "@/domain/auth";

export async function POST(request: Request) {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;

  logoutSession(request);
  const response = NextResponse.json({ status: "signed_out" });
  response.headers.append("Set-Cookie", clearSessionCookie());
  return response;
}
