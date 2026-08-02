import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../../../src/infrastructure/auth/supabase/server";

export async function GET() {
  const { configured, user } = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ ok: true, data: { configured, status: "signed_out" } });
  return NextResponse.json({ ok: true, data: { configured, status: "user", user: { userId: user.id, email: user.email, displayName: typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name.slice(0, 80) : undefined } } });
}
