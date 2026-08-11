export type PublicSupabaseConfig = { url: string; publishableKey: string };

export function getPublicSupabaseConfig(env: NodeJS.ProcessEnv = process.env): PublicSupabaseConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL ?? env.SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? env.SUPABASE_ANON_KEY;
  if (!url?.trim() || !publishableKey?.trim()) return null;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return { url: parsed.toString().replace(/\/$/, ""), publishableKey: publishableKey.trim() };
  } catch { return null; }
}
