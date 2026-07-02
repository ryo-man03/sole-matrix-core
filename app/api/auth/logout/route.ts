import { type NextRequest, NextResponse } from "next/server";
import { callSupabaseAuth, getSupabaseAuthConfig } from "../../../_lib/auth-session/supabaseAuthServer";

export async function POST(request: NextRequest) {
  const config = getSupabaseAuthConfig();
  const accessToken = request.cookies.get("smx_access_token")?.value;
  if (config && accessToken) {
    await callSupabaseAuth(config, "logout", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: "{}" });
  }
  const response = NextResponse.json({ ok: true, data: { signedOut: true } });
  response.cookies.delete("smx_access_token");
  response.cookies.delete("smx_refresh_token");
  return response;
}
