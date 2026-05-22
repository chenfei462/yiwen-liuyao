import { beforeEach, describe, expect, test, vi } from "vitest";
import { join } from "path";
import { randomUUID } from "crypto";
import { makeSessionCookie, registerUser, resetAuthStoreForTests } from "@/domain/auth";
import { resetReadingStoreForTests } from "@/domain/reading-service";
import { GET } from "./route";

describe("GET /api/admin/metrics auth", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("AUTH_STORE_PATH", join(process.cwd(), ".data", `auth-admin-route-test-${randomUUID()}.json`));
    resetAuthStoreForTests();
    resetReadingStoreForTests();
  });

  test("returns 401 for anonymous, 403 for user, and 200 for admin", async () => {
    const anonymousResponse = await GET(new Request("http://localhost/api/admin/metrics"));
    expect(anonymousResponse.status).toBe(401);

    const user = await registerUser({ email: "user@example.com", password: "correct-password" });
    const userResponse = await GET(
      new Request("http://localhost/api/admin/metrics", {
        headers: { cookie: makeSessionCookie(user.session_token) },
      }),
    );
    expect(userResponse.status).toBe(403);

    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    const admin = await registerUser({ email: "admin@example.com", password: "correct-password" });
    const adminResponse = await GET(
      new Request("http://localhost/api/admin/metrics", {
        headers: { cookie: makeSessionCookie(admin.session_token) },
      }),
    );
    expect(adminResponse.status).toBe(200);
  });

  test("rejects unsafe cross-origin admin requests", async () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    const admin = await registerUser({ email: "admin@example.com", password: "correct-password" });
    const response = await GET(
      new Request("http://localhost/api/admin/metrics", {
        method: "POST",
        headers: {
          cookie: makeSessionCookie(admin.session_token),
          host: "localhost",
          origin: "https://attacker.example",
        },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: "invalid_origin" });
  });
});
