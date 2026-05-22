import { NextResponse } from "next/server";
import { getPrincipalDataKey, requirePrincipal, type Principal } from "@/domain/auth";

export function requireOwnerScope(request: Request): { owner_id: string; principal: Principal } | NextResponse {
  const principal = requirePrincipal(request);
  if (principal instanceof NextResponse) return principal;
  return {
    owner_id: getPrincipalDataKey(principal),
    principal,
  };
}
