import { NextResponse } from "next/server";
import {
  adminMisconfigured,
  applySessionCookie,
  clearSessionCookie,
  createSessionToken,
  isAdminConfigured,
  passwordMatches,
  sessionIsValid,
  getSessionToken,
  unauthorized,
} from "@/lib/adminAuth";

export async function GET(request: Request) {
  if (!isAdminConfigured()) return adminMisconfigured();
  if (!sessionIsValid(getSessionToken(request))) return unauthorized();
  return NextResponse.json({ authenticated: true });
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) return adminMisconfigured();

  try {
    const body = await request.json();
    if (!passwordMatches(body?.password)) return unauthorized();

    const token = createSessionToken();
    if (!token) return adminMisconfigured();

    const response = NextResponse.json({ success: true });
    return applySessionCookie(response, token);
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}
