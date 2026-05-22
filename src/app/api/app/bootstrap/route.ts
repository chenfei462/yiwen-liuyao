import { NextResponse } from "next/server";
import { ClientPlatformSchema, type ClientPlatform } from "@/domain/contracts";
import { getAppBootstrap } from "@/domain/reading-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") ?? "web";
  const parsedPlatform = ClientPlatformSchema.safeParse(platform);
  if (!parsedPlatform.success) {
    return NextResponse.json({ error: "invalid_platform", issues: parsedPlatform.error.issues }, { status: 400 });
  }
  return NextResponse.json(
    await getAppBootstrap({
      platform: parsedPlatform.data as ClientPlatform,
      anonymous_id: url.searchParams.get("anonymous_id") ?? "anonymous",
    }),
  );
}
