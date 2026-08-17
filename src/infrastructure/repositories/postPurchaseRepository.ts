import "server-only";

import type { FitFeedbackInput, ProductEventInput, PurchaseReportInput } from "../../domain/feedback/postPurchase";
import { canPersistProductEvent, canUpdateFitPreferenceProfile } from "../../domain/feedback/eventPrivacy";
import { createSupabaseServerClient } from "../auth/supabase/server";
import { hasCurrentConsent } from "./accountRepository";

type Row = Record<string, unknown>;

export async function listPurchaseReports(userId: string) {
  const db = await requiredDb();
  const { data, error } = await db.from("purchase_reports").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("READ_FAILED");
  return data;
}

export async function createPurchaseReport(userId: string, input: PurchaseReportInput) {
  const db = await requiredDb();
  const existing = await purchaseByIdempotency(db, userId, input.idempotency_key);
  if (existing) return { item: existing, created: false };
  await assertOwnedReference(db, "recommendation_snapshots", userId, input.recommendation_snapshot_id);
  await assertOwnedReference(db, "wishlist_items", userId, input.wishlist_item_id);

  const { data: inserted, error } = await db.from("purchase_reports").insert({ ...input, user_id: userId }).select("*").single();
  if (error) {
    if (error.code === "23505") {
      const duplicate = await purchaseByIdempotency(db, userId, input.idempotency_key);
      if (duplicate) return { item: duplicate, created: false };
    }
    throw new Error(error.code === "23503" ? "FOREIGN_OWNERSHIP_MISMATCH" : "PURCHASE_WRITE_FAILED");
  }

  const ownedInput = {
    user_id: userId,
    brand: input.brand,
    model_name: input.model_name,
    model_family: input.model_family,
    generation: input.generation,
    colorway_name: input.colorway_name,
    style_code: input.style_code,
    audience: input.audience,
    size_system: input.purchased_size_system,
    size_value: input.purchased_size_value,
    user_rating: input.satisfaction_rating,
  };
  const { data: owned, error: ownedError } = await db.from("owned_sneakers").insert(ownedInput).select("*").single();
  if (ownedError || !owned) {
    await db.from("purchase_reports").delete().eq("id", String(inserted.id)).eq("user_id", userId);
    throw new Error("OWNED_SNEAKER_WRITE_FAILED");
  }
  const { data: linked, error: linkError } = await db.from("purchase_reports")
    .update({ owned_sneaker_id: owned.id })
    .eq("id", String(inserted.id))
    .eq("user_id", userId)
    .select("*")
    .single();
  if (linkError || !linked) throw new Error("PURCHASE_LINK_FAILED");

  await Promise.allSettled([
    recordExplicitEvent(db, userId, `purchase:${input.idempotency_key}`, "purchase_reported", "purchase_report", String(linked.id)),
    recordExplicitEvent(db, userId, `owned:${input.idempotency_key}`, "owned_sneaker_added", "owned_sneaker", String(owned.id)),
    ...(input.satisfaction_rating === null ? [] : [
      recordExplicitEvent(db, userId, `satisfaction:${input.idempotency_key}`, "purchase_satisfaction_submitted", "purchase_report", String(linked.id), { rating: input.satisfaction_rating }),
    ]),
  ]);
  return { item: linked, created: true };
}

export async function createFitFeedback(userId: string, purchaseReportId: string, input: FitFeedbackInput) {
  const db = await requiredDb();
  const existing = await feedbackByIdempotency(db, userId, input.idempotency_key);
  if (existing) return { item: existing, created: false, preferenceProfileUpdated: existing.preference_profile_update_applied === true };

  const { data: purchase, error: purchaseError } = await db.from("purchase_reports")
    .select("id,owned_sneaker_id")
    .eq("id", purchaseReportId)
    .eq("user_id", userId)
    .maybeSingle();
  if (purchaseError || !purchase || typeof purchase.owned_sneaker_id !== "string") throw new Error("PURCHASE_NOT_FOUND");
  const row = { ...input, user_id: userId, purchase_report_id: purchaseReportId, owned_sneaker_id: purchase.owned_sneaker_id };
  const { data: inserted, error } = await db.from("fit_feedback").insert(row).select("*").single();
  if (error) {
    if (error.code === "23505") {
      const duplicate = await feedbackByIdempotency(db, userId, input.idempotency_key);
      if (duplicate) return { item: duplicate, created: false, preferenceProfileUpdated: duplicate.preference_profile_update_applied === true };
    }
    throw new Error(error.code === "23503" ? "FOREIGN_OWNERSHIP_MISMATCH" : "FIT_FEEDBACK_WRITE_FAILED");
  }

  await recordExplicitEvent(db, userId, `fit:${input.idempotency_key}`, "fit_feedback_submitted", "fit_feedback", String(inserted.id)).catch(() => undefined);
  const preferenceProfileUpdated = canUpdateFitPreferenceProfile(await hasCurrentConsent(userId, "behavior_personalization"))
    ? await rebuildFitPreferenceProfile(db, userId)
    : false;
  if (preferenceProfileUpdated) {
    const { data } = await db.from("fit_feedback").update({ preference_profile_update_applied: true })
      .eq("id", String(inserted.id)).eq("user_id", userId).select("*").single();
    return { item: data ?? { ...inserted, preference_profile_update_applied: true }, created: true, preferenceProfileUpdated: true };
  }
  return { item: inserted, created: true, preferenceProfileUpdated: false };
}

export async function recordProductEvent(userId: string, input: ProductEventInput) {
  const analyticsConsent = input.event_class === "behavior_analytics" && await hasCurrentConsent(userId, "analytics");
  if (!canPersistProductEvent(input.event_class, analyticsConsent)) {
    return { recorded: false, duplicate: false, reason: "analytics_consent_required" as const };
  }
  const db = await requiredDb();
  const { data: existing } = await db.from("product_events").select("id").eq("user_id", userId).eq("idempotency_key", input.idempotency_key).maybeSingle();
  if (existing) return { recorded: true, duplicate: true, reason: null };
  const { error } = await db.from("product_events").insert({ ...input, user_id: userId });
  if (error && error.code !== "23505") throw new Error("EVENT_WRITE_FAILED");
  return { recorded: true, duplicate: error?.code === "23505", reason: null };
}

export async function recordExplicitProductAction(
  userId: string,
  idempotencyKey: string,
  eventName: "recommendation_feedback_submitted" | "wishlist_added" | "wishlist_removed" | "owned_sneaker_added",
  subjectType: string,
  subjectId: string,
) {
  const db = await requiredDb();
  await recordExplicitEvent(db, userId, idempotencyKey, eventName, subjectType, subjectId);
}

export async function listFitFeedbackRows(userId: string) {
  const db = await requiredDb();
  const { data, error } = await db.from("fit_feedback").select("*,owned_sneakers(*)").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("READ_FAILED");
  return data;
}

async function rebuildFitPreferenceProfile(db: Awaited<ReturnType<typeof requiredDb>>, userId: string): Promise<boolean> {
  const { data, error } = await db.from("fit_feedback")
    .select("overall_fit,width_feel,same_size_again")
    .eq("user_id", userId);
  if (error || !data) return false;
  const count = (predicate: (row: Row) => boolean) => data.filter((row) => predicate(row as Row)).length;
  const profile = {
    user_id: userId,
    profile_version: "fit-preference-v1",
    feedback_count: data.length,
    true_to_size_count: count((row) => row.overall_fit === "true_to_size"),
    small_count: count((row) => row.overall_fit === "too_small" || row.overall_fit === "slightly_small"),
    large_count: count((row) => row.overall_fit === "too_large" || row.overall_fit === "slightly_large"),
    width_tight_count: count((row) => row.width_feel === "tight" || row.width_feel === "slightly_tight"),
    width_roomy_count: count((row) => row.width_feel === "roomy" || row.width_feel === "slightly_roomy"),
    same_size_again_yes_count: count((row) => row.same_size_again === true),
    same_size_again_no_count: count((row) => row.same_size_again === false),
  };
  const { error: writeError } = await db.from("fit_preference_profiles").upsert(profile, { onConflict: "user_id" });
  return !writeError;
}

async function recordExplicitEvent(
  db: Awaited<ReturnType<typeof requiredDb>>,
  userId: string,
  idempotencyKey: string,
  eventName: string,
  subjectType: string,
  subjectId: string,
  properties: Record<string, unknown> = {},
) {
  const { error } = await db.from("product_events").insert({
    user_id: userId,
    idempotency_key: idempotencyKey,
    event_name: eventName,
    event_class: "explicit_product_action",
    subject_type: subjectType,
    subject_id: subjectId,
    properties,
  });
  if (error && error.code !== "23505") throw new Error("EVENT_WRITE_FAILED");
}

async function purchaseByIdempotency(db: Awaited<ReturnType<typeof requiredDb>>, userId: string, key: string) {
  const { data, error } = await db.from("purchase_reports").select("*").eq("user_id", userId).eq("idempotency_key", key).maybeSingle();
  if (error) throw new Error("READ_FAILED");
  return data as Row | null;
}

async function feedbackByIdempotency(db: Awaited<ReturnType<typeof requiredDb>>, userId: string, key: string) {
  const { data, error } = await db.from("fit_feedback").select("*").eq("user_id", userId).eq("idempotency_key", key).maybeSingle();
  if (error) throw new Error("READ_FAILED");
  return data as Row | null;
}

async function assertOwnedReference(
  db: Awaited<ReturnType<typeof requiredDb>>,
  table: "recommendation_snapshots" | "wishlist_items",
  userId: string,
  id: string | null,
) {
  if (!id) return;
  const { data, error } = await db.from(table).select("id").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error || !data) throw new Error("FOREIGN_OWNERSHIP_MISMATCH");
}

async function requiredDb() {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  return db;
}
