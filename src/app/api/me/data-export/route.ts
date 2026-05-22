import { NextResponse } from "next/server";
import { requestPrivacyDataExport } from "@/domain/reading-service";
import { requireOwnerScope } from "../../_auth";

export async function POST(request: Request) {
  const scope = requireOwnerScope(request);
  if (scope instanceof NextResponse) return scope;
  const exportJob = await requestPrivacyDataExport(scope);
  return NextResponse.json({
    export_job: {
      id: exportJob.id,
      status: exportJob.status,
      export_format: exportJob.export_format,
      includes_raw_question_text: exportJob.includes_raw_question_text,
      includes_private_followups: exportJob.includes_private_followups,
      download_url: "/api/me/data-export/latest",
      created_at: exportJob.created_at,
      completed_at: exportJob.completed_at,
    },
  });
}
