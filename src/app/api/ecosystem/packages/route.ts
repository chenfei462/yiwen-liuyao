import { NextResponse } from "next/server";
import { listEcosystemPackages } from "@/domain/reading-service";

export async function GET() {
  return NextResponse.json({ packages: await listEcosystemPackages() });
}

