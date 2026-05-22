import { beforeEach, describe, expect, test, vi } from "vitest";
import { join } from "path";
import { randomUUID } from "crypto";
import {
  getPrincipal,
  getPrincipalDataKey,
  loginUser,
  makeSessionCookie,
  registerUser,
  resetAuthStoreForTests,
  verifyEmailToken,
  issueEmailVerificationToken,
} from "./auth";

describe("auth principal and sessions", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("AUTH_STORE_PATH", join(process.cwd(), ".data", `auth-test-${randomUUID()}.json`));
    resetAuthStoreForTests();
  });

  test("resolves anonymous principal from the anonymous device cookie", () => {
    const principal = getPrincipal(
      new Request("http://localhost/api/auth/me", {
        headers: { cookie: "yiwen-liuyao-anonymous-id=anon-device-1" },
      }),
    );

    expect(principal).toMatchObject({
      kind: "anonymous",
      anonymous_id: "anon-device-1",
      roles: [],
    });
    expect(getPrincipalDataKey(principal)).toBe("anonymous:anon-device-1");
  });

  test("registers, logs in, verifies password, and derives admin role from ADMIN_EMAILS", async () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");

    const registered = await registerUser({
      email: "admin@example.com",
      password: "correct-password",
      anonymous_id: "anon-before-login",
    });
    const sessionCookie = makeSessionCookie(registered.session_token);
    const principal = getPrincipal(new Request("http://localhost/api/auth/me", { headers: { cookie: sessionCookie } }));

    expect(registered.principal.kind).toBe("admin");
    expect(principal.kind).toBe("admin");
    expect(principal.roles).toEqual(["user", "admin"]);
    expect(principal.anonymous_id).toBe("anon-before-login");

    const loggedIn = await loginUser({
      email: "admin@example.com",
      password: "correct-password",
    });
    expect(loggedIn.principal.kind).toBe("admin");
  });

  test("rejects duplicate registration and wrong password", async () => {
    await registerUser({ email: "user@example.com", password: "correct-password" });

    await expect(registerUser({ email: "user@example.com", password: "correct-password" })).rejects.toThrow("email_already_registered");
    await expect(loginUser({ email: "user@example.com", password: "wrong-password" })).rejects.toThrow("invalid_credentials");
  });

  test("issues and consumes email verification tokens", async () => {
    await registerUser({ email: "verify@example.com", password: "correct-password" });
    const token = issueEmailVerificationToken("verify@example.com");
    const principal = verifyEmailToken(token);

    expect(principal.email).toBe("verify@example.com");
    expect(() => verifyEmailToken(token)).toThrow("invalid_or_expired_token");
  });
});
