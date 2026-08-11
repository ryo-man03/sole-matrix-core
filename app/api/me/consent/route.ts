import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../src/infrastructure/auth/supabase/server";
import { recordConsent } from "../../../../src/infrastructure/repositories/accountRepository";
import { parseConsentUpdate } from "../../../../src/domain/consent/consent";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function PUT(request: Request) {
  const guard = validateMutationRequest(request, { key: "consent-update", limit: 20 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  try { const input = parseConsentUpdate(await request.json()); await recordConsent(user.id, input.type, input.granted); return NextResponse.json({ ok: true, data: input }); }
  catch { return NextResponse.json({ ok: false, error: { code: "INVALID_CONSENT" } }, { status: 400 }); }
}
