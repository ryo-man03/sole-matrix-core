import "server-only";
import type { UserProfile, ProfileUpdate } from "../../domain/profile/profile";
import type { ConsentType } from "../../domain/consent/consent";
import { CONSENT_POLICY_VERSION } from "../../domain/consent/consent";
import { createSupabaseServerClient } from "../auth/supabase/server";

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const db = await createSupabaseServerClient();
  if (!db) return null;
  const { data, error } = await db.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data);
}

export async function upsertProfile(userId: string, input: ProfileUpdate): Promise<UserProfile> {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const { data, error } = await db.from("profiles").upsert({ user_id: userId, display_name: input.displayName, locale: input.locale, timezone: input.timezone, experience_level: input.experienceLevel }, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error("PROFILE_WRITE_FAILED");
  return mapProfile(data);
}

export async function recordConsent(userId: string, type: ConsentType, granted: boolean) {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const { error } = await db.from("consent_records").insert({ user_id: userId, consent_type: type, granted, policy_version: CONSENT_POLICY_VERSION });
  if (error) throw new Error("CONSENT_WRITE_FAILED");
}

export async function createPrivacyRequest(userId: string, requestType: "export" | "delete") {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const { data: existing } = await db.from("privacy_requests").select("id,status,requested_at").eq("user_id", userId).eq("request_type", requestType).eq("status", "pending").maybeSingle();
  if (existing) return { duplicate: true, request: existing };
  const { data, error } = await db.from("privacy_requests").insert({ user_id: userId, request_type: requestType, status: "pending" }).select("id,status,requested_at").single();
  if (error) throw new Error("PRIVACY_REQUEST_FAILED");
  return { duplicate: false, request: data };
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return { userId: String(row.user_id), displayName: String(row.display_name), locale: String(row.locale), timezone: String(row.timezone), experienceLevel: row.experience_level as UserProfile["experienceLevel"], createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}
