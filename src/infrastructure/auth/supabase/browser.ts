"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = getPublicSupabaseConfig();
  return config ? createBrowserClient(config.url, config.publishableKey) : null;
}
