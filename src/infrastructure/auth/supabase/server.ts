import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "./config";

export async function createSupabaseServerClient() {
  const config = getPublicSupabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try { values.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* Server Components cannot write; proxy performs refresh. */ }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  const client = await createSupabaseServerClient();
  if (!client) return { configured: false as const, user: null };
  const { data, error } = await client.auth.getUser();
  return { configured: true as const, user: error ? null : data.user };
}
