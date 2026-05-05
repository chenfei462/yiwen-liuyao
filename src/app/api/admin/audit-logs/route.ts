import { NextResponse } from "next/server";
import { listAdminAuditLogs } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ audit_logs: listAdminAuditLogs() });
}
