import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { disableEcosystemPackage } from "@/domain/reading-service";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ install: disableEcosystemPackage(await request.json()) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "invalid_request", issues: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Package install not found")) {
      return NextResponse.json({ error: "ecosystem_package_install_not_found" }, { status: 404 });
    }
    return NextResponse.json({ error: "ecosystem_package_disable_failed" }, { status: 500 });
  }
}

