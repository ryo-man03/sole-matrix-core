import { authErrorMessage, getSupabaseAuthConfig, readAuthTokens, readSafeAuthUser } from "./supabaseAuthServer";

describe("Supabase auth server boundary", () => {
  it("supports server or public environment names without exposing values", () => {
    expect(getSupabaseAuthConfig({})).toBeNull();
    expect(getSupabaseAuthConfig({ SUPABASE_URL: "https://example.supabase.co", SUPABASE_ANON_KEY: "anon" })).toEqual({ url: "https://example.supabase.co", anonKey: "anon" });
  });

  it("normalizes only safe user and token fields", () => {
    const raw = { id: "user-1", email: "user@example.com", user_metadata: { display_name: "Ryo", secret: "hidden" } };
    expect(readSafeAuthUser(raw)).toEqual({ userId: "user-1", email: "user@example.com", displayName: "Ryo" });
    expect(readAuthTokens({ access_token: "token", refresh_token: "refresh", expires_in: 3600, user: raw })).toMatchObject({ accessToken: "token", expiresIn: 3600, user: { userId: "user-1" } });
  });

  it("returns stable user-facing errors without provider internals", () => {
    expect(authErrorMessage(401)).toContain("メールアドレス");
    expect(authErrorMessage(503)).not.toContain("Supabase");
  });
});
