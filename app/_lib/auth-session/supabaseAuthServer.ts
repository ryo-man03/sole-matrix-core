export type SafeAuthUser = {
  userId: string;
  email?: string;
  displayName?: string;
};

export type SupabaseAuthConfig = { url: string; anonKey: string };

export function getSupabaseAuthConfig(
  env: Record<string, string | undefined> = process.env,
): SupabaseAuthConfig | null {
  const rawUrl = env["SUPABASE_URL"] ?? env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = env["SUPABASE_ANON_KEY"] ?? env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!rawUrl?.trim() || !anonKey?.trim()) return null;
  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { url: url.toString().replace(/\/$/, ""), anonKey: anonKey.trim() };
  } catch {
    return null;
  }
}

export async function callSupabaseAuth(
  config: SupabaseAuthConfig,
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const response = await fetch(`${config.url}/auth/v1/${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        apikey: config.anonKey,
        ...init.headers,
      },
    });
    let data: unknown = null;
    try { data = await response.json(); } catch { /* stable fallback below */ }
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: false, status: 503, data: null };
  }
}

export function readAuthTokens(value: unknown): {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: SafeAuthUser;
} | null {
  if (!isRecord(value)) return null;
  const accessToken = value["access_token"];
  const refreshToken = value["refresh_token"];
  const expiresIn = value["expires_in"];
  const user = readSafeAuthUser(value["user"]);
  if (typeof accessToken !== "string" || !accessToken || !user) return null;
  return {
    accessToken,
    ...(typeof refreshToken === "string" && refreshToken ? { refreshToken } : {}),
    expiresIn: typeof expiresIn === "number" && Number.isFinite(expiresIn) ? Math.max(60, Math.floor(expiresIn)) : 3_600,
    user,
  };
}

export function readSafeAuthUser(value: unknown): SafeAuthUser | null {
  if (!isRecord(value) || typeof value["id"] !== "string" || !value["id"]) return null;
  const metadata = isRecord(value["user_metadata"]) ? value["user_metadata"] : {};
  const displayName = typeof metadata["display_name"] === "string"
    ? clean(metadata["display_name"], 80)
    : undefined;
  const email = typeof value["email"] === "string" ? clean(value["email"], 254) : undefined;
  return {
    userId: value["id"],
    ...(email ? { email } : {}),
    ...(displayName ? { displayName } : {}),
  };
}

export function authErrorMessage(status: number): string {
  if (status === 400 || status === 401) return "メールアドレスまたはパスワードを確認してください。";
  if (status === 422) return "登録内容を確認してください。既に登録済みの場合はログインをお試しください。";
  if (status === 429) return "試行回数が多すぎます。少し時間をおいてからお試しください。";
  return "認証サービスに接続できませんでした。時間をおいて再度お試しください。";
}

function clean(value: string, maxLength: number): string | undefined {
  const normalized = value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return normalized || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
