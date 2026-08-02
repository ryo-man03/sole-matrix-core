import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../src/infrastructure/auth/supabase/server";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "sign-in", limit: 10 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const body = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.email !== "string" || typeof body.password !== "string" || body.email.length > 254 || body.password.length > 200) return invalid();
  const client = await createSupabaseServerClient();
  if (!client) return unavailable();
  const { data, error } = await client.auth.signInWithPassword({ email: body.email.trim(), password: body.password });
  if (error || !data.user) return NextResponse.json({ ok: false, error: { code: "AUTH_FAILED", message: "メールアドレスまたはパスワードを確認してください。" } }, { status: 401 });
  return NextResponse.json({ ok: true, data: { user: safeUser(data.user) } });
}
function safeUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown> }) { return { userId: user.id, ...(user.email ? { email: user.email } : {}), ...(typeof user.user_metadata?.display_name === "string" ? { displayName: user.user_metadata.display_name.slice(0, 80) } : {}) }; }
function invalid() { return NextResponse.json({ ok: false, error: { code: "INVALID_AUTH_INPUT", message: "入力内容を確認してください。" } }, { status: 400 }); }
function unavailable() { return NextResponse.json({ ok: false, error: { code: "AUTH_NOT_CONFIGURED", message: "認証は現在準備中です。" } }, { status: 503 }); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
