import { type NextRequest, NextResponse } from "next/server";
import { callSupabaseAuth, getSupabaseAuthConfig, readSafeAuthUser } from "../../../_lib/auth-session/supabaseAuthServer";

export async function GET(request: NextRequest) {
  const config = getSupabaseAuthConfig();
  if (!config) return NextResponse.json({ ok: true, data: { configured: false, status: "signed_out" } });
  const accessToken = request.cookies.get("smx_access_token")?.value;
  if (!accessToken) return NextResponse.json({ ok: true, data: { configured: true, status: "signed_out" } });
  const result = await callSupabaseAuth(config, "user", { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } });
  const user = result.ok ? readSafeAuthUser(result.data) : null;
  if (!user) {
    const response = NextResponse.json({ ok: true, data: { configured: true, status: "signed_out" } });
    response.cookies.delete("smx_access_token");
    response.cookies.delete("smx_refresh_token");
    return response;
  }
  return NextResponse.json({ ok: true, data: { configured: true, status: "user", user } });
}
