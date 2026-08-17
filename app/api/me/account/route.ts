import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../src/infrastructure/auth/supabase/server";
import { createPrivacyRequest } from "../../../../src/infrastructure/repositories/accountRepository";
import { readBoundedJsonBody, validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function DELETE(request: Request) {
  const guard = validateMutationRequest(request, { key: "account-delete", limit: 3 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const { user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 });
  const body = await readBoundedJsonBody(request).catch(() => null);
  if (!isRecord(body) || Object.keys(body).some((key) => key !== "confirmation") || body.confirmation !== "DELETE MY ACCOUNT") return NextResponse.json({ ok: false, error: { code: "CONFIRMATION_REQUIRED" } }, { status: 400 });
  try { const result = await createPrivacyRequest(user.id, "delete"); return NextResponse.json({ ok: true, data: { status: "pending", duplicate: result.duplicate } }, { status: result.duplicate ? 200 : 202 }); }
  catch { return NextResponse.json({ ok: false, error: { code: "REQUEST_FAILED" } }, { status: 503 }); }
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
