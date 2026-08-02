import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../src/infrastructure/auth/supabase/server";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "password-reset", limit: 5 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const body = await request.json().catch(() => null);
  if (!isRecord(body) || typeof body.email !== "string" || body.email.length > 254) return NextResponse.json({ ok: false }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (client) await client.auth.resetPasswordForEmail(body.email.trim(), { redirectTo: `${new URL(request.url).origin}/auth/update-password` });
  return NextResponse.json({ ok: true, data: { accepted: true } });
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
