import "server-only";
import { createSupabaseServerClient } from "../auth/supabase/server";
import { createSupabaseAdminClient } from "../db/supabase/admin";

export async function getDailyPickBatch(userId: string) {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await db.from("daily_pick_batches").select("id,target_date,preference_version,algorithm_version,generated_at,daily_picks(id,rank,total_score,score_breakdown,explanation,verification_state,release_items(id,canonical_brand,canonical_model_name,model_family,generation,information_state,release_date,release_date_precision,region,source_confidence,last_verified_at,release_variants(colorway_name,style_code,audience,verification_state),release_evidence(source_kind,observed_release_date,review_state,verification_state,source_independence_key,fetched_at)))").eq("user_id", userId).lte("target_date", today).order("target_date", { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error("DAILY_READ_FAILED");
  return data ? { ...data, stale: data.target_date !== today } : null;
}

export async function saveDailyFeedback(userId: string, input: { dailyPickId: string; action: string; reasonCodes: string[]; comment: string | null }) {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const { data, error } = await db.from("daily_pick_feedback").insert({ user_id: userId, daily_pick_id: input.dailyPickId, action: input.action, reason_codes: input.reasonCodes, comment: input.comment }).select("id").single();
  if (error) throw new Error("FEEDBACK_WRITE_FAILED");
  return data;
}

export async function getReleaseItem(id: string) {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  const { data, error } = await db.from("release_items").select("*,release_variants(*),release_evidence(provider_id,provider_source_id,external_item_id,source_kind,source_url,source_title,source_domain,canonical_origin_url,source_independence_key,content_fingerprint,supports_model,supports_colorway,supports_style_code,supports_release_date,supports_region,observed_release_date,observed_state,fetched_at,source_quality,verification_state,review_state,first_seen_at,last_seen_at,last_verified_at)").eq("id", id).maybeSingle();
  if (error) throw new Error("RELEASE_READ_FAILED");
  return data;
}

export async function internalAdmin() {
  const db = createSupabaseAdminClient();
  if (!db) throw new Error("ADMIN_NOT_CONFIGURED");
  return db;
}
