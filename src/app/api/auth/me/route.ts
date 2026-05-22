import { NextResponse } from "next/server";
import { ANONYMOUS_COOKIE_NAME, getPrincipal, makeAnonymousCookie, toPublicPrincipal } from "@/domain/auth";

export async function GET(request: Request) {
  const principal = getPrincipal(request);
  const response = NextResponse.json({ principal: toPublicPrincipal(principal) });
  if (!request.headers.get("cookie")?.includes(`${ANONYMOUS_COOKIE_NAME}=`) && principal.anonymous_id) {
    response.headers.append("Set-Cookie", makeAnonymousCookie(principal.anonymous_id));
  }
  return response;
}
