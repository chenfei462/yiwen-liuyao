import { NextResponse } from "next/server";
import { requireAdmin } from "@/domain/auth";
import { listAdminAuditLogs } from "@/domain/reading-service";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ audit_logs: await listAdminAuditLogs() });
}
