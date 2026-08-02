import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../src/infrastructure/auth/supabase/server";
import { getProfile, upsertProfile } from "../../../../src/infrastructure/repositories/accountRepository";
import { parseProfileUpdate } from "../../../../src/domain/profile/profile";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) return unauthorized();
  return NextResponse.json({ ok: true, data: { profile: await getProfile(user.id) } });
}
export async function PATCH(request: Request) {
  const guard = validateMutationRequest(request, { key: "profile-update", limit: 20 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const { user } = await getAuthenticatedUser();
  if (!user) return unauthorized();
  try { return NextResponse.json({ ok: true, data: { profile: await upsertProfile(user.id, parseProfileUpdate(await request.json())) } }); }
  catch (error) { return NextResponse.json({ ok: false, error: { code: error instanceof Error ? error.message : "PROFILE_WRITE_FAILED" } }, { status: 400 }); }
}
function unauthorized() { return NextResponse.json({ ok: false, error: { code: "UNAUTHENTICATED" } }, { status: 401 }); }
