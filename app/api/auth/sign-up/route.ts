import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../src/infrastructure/auth/supabase/server";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "sign-up", limit: 5 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const body = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string" || body.password.length < 8 || body.password.length > 200 || typeof body.displayName !== "string" || !/^[^<>\u0000-\u001f\u007f]{1,80}$/u.test(body.displayName.trim())) return invalid();
  const client = await createSupabaseServerClient();
  if (!client) return unavailable();
  const origin = new URL(request.url).origin;
  const { data, error } = await client.auth.signUp({ email: body.email.trim().slice(0, 254), password: body.password, options: { data: { display_name: body.displayName.trim() }, emailRedirectTo: `${origin}/auth/callback` } });
  if (error || !data.user) return NextResponse.json({ ok: false, error: { code: "SIGN_UP_FAILED", message: "登録内容を確認してください。" } }, { status: 400 });
  return NextResponse.json({ ok: true, data: { user: { userId: data.user.id, email: data.user.email, displayName: body.displayName.trim() }, sessionCreated: Boolean(data.session), emailConfirmationRequired: !data.session } });
}
function invalid() { return NextResponse.json({ ok: false, error: { code: "INVALID_AUTH_INPUT", message: "表示名、メールアドレス、8文字以上のパスワードを確認してください。" } }, { status: 400 }); }
function unavailable() { return NextResponse.json({ ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "認証は現在準備中です。" } }, { status: 503 }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
