import { NextResponse } from "next/server";
import { authErrorMessage, callSupabaseAuth, getSupabaseAuthConfig, readAuthTokens, readSafeAuthUser } from "../../../_lib/auth-session/supabaseAuthServer";

export async function POST(request: Request) {
  const config = getSupabaseAuthConfig();
  if (!config) return unavailable();
  const body = await safeJson(request);
  const email = isRecord(body) ? text(body["email"], 254) : null;
  const password = isRecord(body) ? text(body["password"], 200) : null;
  const displayName = isRecord(body) ? text(body["displayName"], 80) : null;
  if (!email || !password || password.length < 8 || !displayName) return invalid();

  const result = await callSupabaseAuth(config, "signup", {
    method: "POST",
    body: JSON.stringify({ email, password, data: { display_name: displayName } }),
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: { code: "SIGN_UP_FAILED", message: authErrorMessage(result.status) } }, { status: result.status >= 500 ? 503 : 400 });
  }
  const tokens = readAuthTokens(result.data);
  const directUser = isRecord(result.data) ? readSafeAuthUser(result.data["user"]) : null;
  const user = tokens?.user ?? directUser;
  if (!user) return NextResponse.json({ ok: false, error: { code: "INVALID_AUTH_RESPONSE", message: "登録結果を確認できませんでした。" } }, { status: 502 });

  const response = NextResponse.json({ ok: true, data: { user, sessionCreated: Boolean(tokens), emailConfirmationRequired: !tokens } });
  if (tokens) {
    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("smx_access_token", tokens.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: tokens.expiresIn });
    if (tokens.refreshToken) response.cookies.set("smx_refresh_token", tokens.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}

async function safeJson(request: Request): Promise<unknown> { try { return await request.json(); } catch { return null; } }
function text(value: unknown, max: number): string | null { return typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null; }
function invalid() { return NextResponse.json({ ok: false, error: { code: "INVALID_AUTH_INPUT", message: "表示名・メールアドレス・8文字以上のパスワードを入力してください。" } }, { status: 400 }); }
function unavailable() { return NextResponse.json({ ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "認証は現在準備中です。ゲストモードは引き続き利用できます。" } }, { status: 503 }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
