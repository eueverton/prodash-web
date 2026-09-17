import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const ADMIN_COOKIE = "prodash_admin";
const MAX_AGE_SEC = 60 * 60 * 12;

function getAdminPassword() {
  const password = process.env.ADMIN_PASSWORD;
  return password && password.length > 0 ? password : null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function hmac(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function isAdminConfigured() {
  return getAdminPassword() !== null;
}

export function passwordMatches(password: unknown) {
  const master = getAdminPassword();
  if (!master || typeof password !== "string" || password.length === 0) {
    return false;
  }
  return timingSafeEqual(sha256(password), sha256(master));
}

export function createSessionToken() {
  const secret = getAdminPassword();
  if (!secret) return null;
  const payload = String(Date.now() + MAX_AGE_SEC * 1000);
  return `${payload}.${hmac(payload, secret)}`;
}

export function sessionIsValid(token: string | undefined) {
  const secret = getAdminPassword();
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(payload, secret);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return false;
  }
  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

export function getSessionToken(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;
  const part = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${ADMIN_COOKIE}=`));
  if (!part) return undefined;
  return decodeURIComponent(part.slice(ADMIN_COOKIE.length + 1));
}

export function isAdminRequest(request: Request, password?: unknown) {
  return sessionIsValid(getSessionToken(request)) || passwordMatches(password);
}

export function unauthorized() {
  return NextResponse.json({ error: "Senha de Administrador Incorreta!" }, { status: 401 });
}

export function adminMisconfigured() {
  return NextResponse.json(
    { error: "ADMIN_PASSWORD não configurada no servidor." },
    { status: 500 },
  );
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
