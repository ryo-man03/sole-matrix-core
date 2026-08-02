import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../src/infrastructure/auth/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const client = await createSupabaseServerClient();
  if (code && client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
}
function safeNext(value: string | null) { return value?.startsWith("/") && !value.startsWith("//") ? value : "/settings/profile"; }
