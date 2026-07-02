import { NextResponse } from "next/server";
import { authErrorMessage, callSupabaseAuth, getSupabaseAuthConfig, readAuthTokens } from "../../../_lib/auth-session/supabaseAuthServer";

export async function POST(request: Request) {
  const config = getSupabaseAuthConfig();
  if (!config) return unavailable();
  const body = await safeJson(request);
  const email = isRecord(body) ? text(body["email"], 254) : null;
  const password = isRecord(body) ? text(body["password"], 200) : null;
  if (!email || !password) return invalid();

  const result = await callSupabaseAuth(config, "token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const tokens = result.ok ? readAuthTokens(result.data) : null;
  if (!tokens) {
    return NextResponse.json({ ok: false, error: { code: "AUTH_FAILED", message: authErrorMessage(result.status) } }, { status: result.status >= 500 ? 503 : 401 });
  }
  const response = NextResponse.json({ ok: true, data: { user: tokens.user } });
  setAuthCookies(response, tokens);
  return response;
}

function setAuthCookies(response: NextResponse, tokens: NonNullable<ReturnType<typeof readAuthTokens>>) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("smx_access_token", tokens.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: tokens.expiresIn });
  if (tokens.refreshToken) response.cookies.set("smx_refresh_token", tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
}

async function safeJson(request: Request): Promise<unknown> { try { return await request.json(); } catch { return null; } }
function text(value: unknown, max: number): string | null { return typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null; }
function invalid() { return NextResponse.json({ ok: false, error: { code: "INVALID_AUTH_INPUT", message: "メールアドレスとパスワードを確認してください。" } }, { status: 400 }); }
function unavailable() { return NextResponse.json({ ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "認証は現在準備中です。ゲストモードは引き続き利用できます。" } }, { status: 503 }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
