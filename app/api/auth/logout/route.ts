import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../src/infrastructure/auth/supabase/server";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "logout", bodyRequired: false });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const client = await createSupabaseServerClient();
  if (client) await client.auth.signOut();
  return NextResponse.json({ ok: true, data: { signedOut: true } });
}
