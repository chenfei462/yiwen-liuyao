import { NextResponse } from "next/server";
import { getEcosystemPackage } from "@/domain/reading-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return NextResponse.json({ package: await getEcosystemPackage(id) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Ecosystem package not found")) {
      return NextResponse.json({ error: "ecosystem_package_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "ecosystem_package_detail_failed" }, { status: 500 });
  }
}

