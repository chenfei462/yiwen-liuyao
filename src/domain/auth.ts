import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";
import { z } from "zod";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = "yiwen-liuyao-session";
export const ANONYMOUS_COOKIE_NAME = "yiwen-liuyao-anonymous-id";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const TOKEN_BYTES = 32;
const HASH_BYTES = 64;

export type AuthRole = "user" | "admin";

export type Principal =
  | {
      kind: "anonymous";
      user_id: null;
      anonymous_id: string;
      email: null;
      roles: [];
      session_id: null;
    }
  | {
      kind: "user" | "admin";
      user_id: string;
      anonymous_id: string | null;
      email: string;
      roles: AuthRole[];
      session_id: string;
    };

type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

type SessionRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  anonymous_id: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

type AuthAuditRecord = {
  id: string;
  action: string;
  user_id: string | null;
  anonymous_id: string | null;
  detail: string;
  created_at: string;
};

type AuthStore = {
  users: UserRecord[];
  sessions: SessionRecord[];
  password_reset_tokens: Array<TokenRecord>;
  email_verification_tokens: Array<TokenRecord>;
  audit_logs: AuthAuditRecord[];
};

type TokenRecord = {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

const RegisterSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(256),
  anonymous_id: z.string().trim().min(1).max(160).optional(),
});

const LoginSchema = RegisterSchema.pick({ email: true, password: true }).extend({
  anonymous_id: z.string().trim().min(1).max(160).optional(),
});

const PasswordResetRequestSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

const PasswordResetSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8).max(256),
});

export type AuthResult = {
  principal: Principal;
  session_token: string;
};

export async function registerUser(rawInput: unknown): Promise<AuthResult> {
  const input = RegisterSchema.parse(rawInput);
  const store = loadAuthStore();
  if (store.users.some((user) => user.email === input.email)) {
    throw new AuthError("email_already_registered", 409);
  }

  const now = new Date().toISOString();
  const user: UserRecord = {
    id: `user_${randomUUID()}`,
    email: input.email,
    password_hash: await hashPassword(input.password),
    email_verified_at: null,
    status: "active",
    created_at: now,
    updated_at: now,
    last_login_at: now,
  };
  store.users.push(user);
  const result = createSessionForUser(store, user, input.anonymous_id ?? null);
  appendAuthAudit(store, "user_registered", user.id, input.anonymous_id ?? null, "public_registration");
  if (input.anonymous_id) appendAuthAudit(store, "anonymous_principal_merged", user.id, input.anonymous_id, "login_registration_merge");
  saveAuthStore(store);
  return result;
}

export async function loginUser(rawInput: unknown): Promise<AuthResult> {
  const input = LoginSchema.parse(rawInput);
  const store = loadAuthStore();
  const user = store.users.find((candidate) => candidate.email === input.email);
  if (!user || !(await verifyPassword(input.password, user.password_hash))) {
    throw new AuthError("invalid_credentials", 401);
  }
  if (user.status !== "active") {
    throw new AuthError("user_disabled", 403);
  }

  user.last_login_at = new Date().toISOString();
  user.updated_at = user.last_login_at;
  const result = createSessionForUser(store, user, input.anonymous_id ?? null);
  appendAuthAudit(store, "user_logged_in", user.id, input.anonymous_id ?? null, "password");
  if (input.anonymous_id) appendAuthAudit(store, "anonymous_principal_merged", user.id, input.anonymous_id, "login_merge");
  saveAuthStore(store);
  return result;
}

export function logoutSession(request: Request): void {
  const token = readCookie(request, SESSION_COOKIE_NAME);
  if (!token) return;
  const store = loadAuthStore();
  const tokenHash = hashToken(token);
  const session = store.sessions.find((candidate) => candidate.token_hash === tokenHash && !candidate.revoked_at);
  if (!session) return;
  session.revoked_at = new Date().toISOString();
  appendAuthAudit(store, "user_logged_out", session.user_id, session.anonymous_id, session.id);
  saveAuthStore(store);
}

export function getPrincipal(request: Request): Principal {
  const anonymousId = getAnonymousIdFromRequest(request);
  const token = readCookie(request, SESSION_COOKIE_NAME);
  if (!token) return makeAnonymousPrincipal(anonymousId);

  const store = loadAuthStore();
  const session = store.sessions.find((candidate) => candidate.token_hash === hashToken(token) && !candidate.revoked_at);
  if (!session || Date.parse(session.expires_at) <= Date.now()) {
    return makeAnonymousPrincipal(anonymousId);
  }
  const user = store.users.find((candidate) => candidate.id === session.user_id && candidate.status === "active");
  if (!user) return makeAnonymousPrincipal(anonymousId);

  const roles = getRolesForEmail(user.email);
  return {
    kind: roles.includes("admin") ? "admin" : "user",
    user_id: user.id,
    anonymous_id: session.anonymous_id ?? anonymousId,
    email: user.email,
    roles,
    session_id: session.id,
  };
}

export function requirePrincipal(request: Request): Principal | NextResponse {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;
  const principal = getPrincipal(request);
  if (!principal.anonymous_id && principal.kind === "anonymous") {
    return unauthorized();
  }
  return principal;
}

export function requireUser(request: Request): Principal | NextResponse {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;
  const principal = getPrincipal(request);
  if (principal.kind === "anonymous") return unauthorized();
  return principal;
}

export function requireAdmin(request: Request): NextResponse | null {
  const unsafeOrigin = assertSafeOrigin(request);
  if (unsafeOrigin) return unsafeOrigin;
  const principal = getPrincipal(request);
  if (principal.kind === "anonymous") return unauthorized();
  if (!principal.roles.includes("admin")) return forbidden();
  return null;
}

export function assertSafeOrigin(request: Request): NextResponse | null {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return null;
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const host = request.headers.get("host");
  if (!host) return null;
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    return forbidden("invalid_origin");
  }
  return forbidden("invalid_origin");
}

export function toPublicPrincipal(principal: Principal) {
  return {
    kind: principal.kind,
    user_id: principal.user_id,
    anonymous_id: principal.anonymous_id,
    email: principal.email,
    roles: principal.roles,
    session_id: principal.session_id,
  };
}

export function getPrincipalDataKey(principal: Principal): string {
  if (principal.user_id) return principal.user_id;
  if (principal.anonymous_id === "anonymous") return "anonymous";
  return `anonymous:${principal.anonymous_id}`;
}

export function makeSessionCookie(token: string): string {
  return serializeCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(): string {
  return serializeCookie(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

export function makeAnonymousCookie(anonymousId: string): string {
  return serializeCookie(ANONYMOUS_COOKIE_NAME, anonymousId, {
    httpOnly: false,
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(1000 * 60 * 60 * 24 * 365 * 2),
  });
}

export function issueEmailVerificationToken(email: string): string {
  const store = loadAuthStore();
  const user = store.users.find((candidate) => candidate.email === email.toLowerCase());
  if (!user) throw new AuthError("user_not_found", 404);
  const token = randomToken();
  store.email_verification_tokens.push(createTokenRecord(user.id, token, 1000 * 60 * 60 * 24));
  appendAuthAudit(store, "email_verification_requested", user.id, null, "token_issued");
  saveAuthStore(store);
  return token;
}

export function verifyEmailToken(token: string): Principal {
  const store = loadAuthStore();
  const record = consumeToken(store.email_verification_tokens, token);
  const user = store.users.find((candidate) => candidate.id === record.user_id);
  if (!user) throw new AuthError("user_not_found", 404);
  user.email_verified_at = new Date().toISOString();
  user.updated_at = user.email_verified_at;
  appendAuthAudit(store, "email_verified", user.id, null, "token");
  saveAuthStore(store);
  return principalForUser(user, null, null);
}

export function requestPasswordReset(rawInput: unknown): { reset_token?: string; status: "sent" } {
  const input = PasswordResetRequestSchema.parse(rawInput);
  const store = loadAuthStore();
  const user = store.users.find((candidate) => candidate.email === input.email);
  if (!user) return { status: "sent" };
  const token = randomToken();
  store.password_reset_tokens.push(createTokenRecord(user.id, token, 1000 * 60 * 30));
  appendAuthAudit(store, "password_reset_requested", user.id, null, "token_issued");
  saveAuthStore(store);
  return process.env.NODE_ENV === "production" ? { status: "sent" } : { status: "sent", reset_token: token };
}

export async function resetPassword(rawInput: unknown): Promise<{ status: "reset" }> {
  const input = PasswordResetSchema.parse(rawInput);
  const store = loadAuthStore();
  const record = consumeToken(store.password_reset_tokens, input.token);
  const user = store.users.find((candidate) => candidate.id === record.user_id);
  if (!user) throw new AuthError("user_not_found", 404);
  user.password_hash = await hashPassword(input.password);
  user.updated_at = new Date().toISOString();
  for (const session of store.sessions) {
    if (session.user_id === user.id && !session.revoked_at) session.revoked_at = user.updated_at;
  }
  appendAuthAudit(store, "password_reset_completed", user.id, null, "token");
  saveAuthStore(store);
  return { status: "reset" };
}

export function resetAuthStoreForTests(): void {
  saveAuthStore(makeEmptyStore());
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function createSessionForUser(store: AuthStore, user: UserRecord, anonymousId: string | null): AuthResult {
  const token = randomToken();
  const now = new Date();
  const session: SessionRecord = {
    id: `session_${randomUUID()}`,
    user_id: user.id,
    token_hash: hashToken(token),
    anonymous_id: anonymousId,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    revoked_at: null,
  };
  store.sessions.push(session);
  return {
    principal: principalForUser(user, session, anonymousId),
    session_token: token,
  };
}

function principalForUser(user: UserRecord, session: SessionRecord | null, anonymousId: string | null): Principal {
  const roles = getRolesForEmail(user.email);
  return {
    kind: roles.includes("admin") ? "admin" : "user",
    user_id: user.id,
    anonymous_id: anonymousId,
    email: user.email,
    roles,
    session_id: session?.id ?? "",
  };
}

function makeAnonymousPrincipal(anonymousId: string): Principal {
  return {
    kind: "anonymous",
    user_id: null,
    anonymous_id: anonymousId,
    email: null,
    roles: [],
    session_id: null,
  };
}

function getRolesForEmail(email: string): AuthRole[] {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase()) ? ["user", "admin"] : ["user"];
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, HASH_BYTES)) as Buffer;
  return `scrypt$${salt}$${derived.toString("base64url")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [scheme, salt, digest] = storedHash.split("$");
  if (scheme !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "base64url");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function getAnonymousIdFromRequest(request: Request): string {
  return (
    readCookie(request, ANONYMOUS_COOKIE_NAME) ??
    request.headers.get("x-anonymous-id")?.trim() ??
    "anonymous"
  );
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === name) return decodeURIComponent(rawValue.join("="));
  }
  return null;
}

function serializeCookie(name: string, value: string, options: { httpOnly: boolean; sameSite: "Lax"; path: string; maxAge: number }): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Max-Age=${options.maxAge}`, `Path=${options.path}`, `SameSite=${options.sameSite}`];
  if (options.httpOnly) parts.push("HttpOnly");
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

function unauthorized(error = "unauthorized"): NextResponse {
  return NextResponse.json({ error }, { status: 401 });
}

function forbidden(error = "forbidden"): NextResponse {
  return NextResponse.json({ error }, { status: 403 });
}

function randomToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function createTokenRecord(userId: string, token: string, ttlMs: number): TokenRecord {
  const now = new Date();
  return {
    id: `token_${randomUUID()}`,
    user_id: userId,
    token_hash: hashToken(token),
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ttlMs).toISOString(),
    used_at: null,
  };
}

function consumeToken(records: TokenRecord[], token: string): TokenRecord {
  const record = records.find((candidate) => candidate.token_hash === hashToken(token) && !candidate.used_at);
  if (!record || Date.parse(record.expires_at) <= Date.now()) {
    throw new AuthError("invalid_or_expired_token", 401);
  }
  record.used_at = new Date().toISOString();
  return record;
}

function appendAuthAudit(store: AuthStore, action: string, userId: string | null, anonymousId: string | null, detail: string): void {
  store.audit_logs.push({
    id: `auth_audit_${randomUUID()}`,
    action,
    user_id: userId,
    anonymous_id: anonymousId,
    detail,
    created_at: new Date().toISOString(),
  });
}

function loadAuthStore(): AuthStore {
  const filePath = getAuthStorePath();
  if (!existsSync(/*turbopackIgnore: true*/ filePath)) return makeEmptyStore();
  return AuthStoreSchema.parse(JSON.parse(readFileSync(/*turbopackIgnore: true*/ filePath, "utf8")));
}

function saveAuthStore(store: AuthStore): void {
  const filePath = getAuthStorePath();
  mkdirSync(/*turbopackIgnore: true*/ dirname(filePath), { recursive: true });
  writeFileSync(/*turbopackIgnore: true*/ filePath, JSON.stringify(store, null, 2));
}

function getAuthStorePath(): string {
  if (process.env.NODE_ENV === "test" && process.env.AUTH_STORE_PATH) return process.env.AUTH_STORE_PATH;
  return join(/*turbopackIgnore: true*/ process.cwd(), ".data", "auth.json");
}

function makeEmptyStore(): AuthStore {
  return {
    users: [],
    sessions: [],
    password_reset_tokens: [],
    email_verification_tokens: [],
    audit_logs: [],
  };
}

const TokenRecordSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  token_hash: z.string(),
  created_at: z.string(),
  expires_at: z.string(),
  used_at: z.string().nullable(),
});

const AuthStoreSchema: z.ZodType<AuthStore> = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      password_hash: z.string(),
      email_verified_at: z.string().nullable(),
      status: z.enum(["active", "disabled"]),
      created_at: z.string(),
      updated_at: z.string(),
      last_login_at: z.string().nullable(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.string(),
      user_id: z.string(),
      token_hash: z.string(),
      anonymous_id: z.string().nullable(),
      created_at: z.string(),
      expires_at: z.string(),
      revoked_at: z.string().nullable(),
    }),
  ),
  password_reset_tokens: z.array(TokenRecordSchema),
  email_verification_tokens: z.array(TokenRecordSchema),
  audit_logs: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      user_id: z.string().nullable(),
      anonymous_id: z.string().nullable(),
      detail: z.string(),
      created_at: z.string(),
    }),
  ),
});
