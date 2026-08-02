import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../src/infrastructure/auth/supabase/server";
import { createPrivacyRequest } from "../../../../src/infrastructure/repositories/accountRepository";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "data-export", limit: 3, bodyRequired: false });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  try { const result = await createPrivacyRequest(user.id, "export"); return NextResponse.json({ ok: true, data: { status: "pending", duplicate: result.duplicate } }, { status: result.duplicate ? 200 : 202 }); }
  catch { return NextResponse.json({ ok: false, error: { code: "REQUEST_FAILED" } }, { status: 503 }); }
}
