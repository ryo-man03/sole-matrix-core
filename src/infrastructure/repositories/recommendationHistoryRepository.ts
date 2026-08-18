import "server-only";
import { createSupabaseServerClient } from "../auth/supabase/server";
import type { CanonicalSneakerKey } from "../../domain/identity/canonicalSneaker";
import { recordExplicitProductAction } from "./postPurchaseRepository";

export async function saveRecommendationSnapshot(
  userId: string,
  input: {
    recommendationId: string;
    inputSnapshot: Record<string, unknown>;
    resultSnapshot: Record<string, unknown>;
    algorithmVersion: string;
  },
) {
  const db = await required();
  const { data, error } = await db
    .from("recommendation_snapshots")
    .upsert({
      user_id: userId,
      recommendation_id: input.recommendationId,
      input_snapshot: sanitize(input.inputSnapshot),
      result_snapshot: sanitize(input.resultSnapshot),
      algorithm_version: input.algorithmVersion,
    }, { onConflict: "user_id,recommendation_id" })
    .select("id")
    .single();
  if (error) throw new Error("SNAPSHOT_WRITE_FAILED");
  return data;
}

export async function listRecommendationHistory(userId: string) {
  const db = await required();
  const { data, error } = await db
    .from("recommendation_snapshots")
    .select("id,recommendation_id,result_snapshot,algorithm_version,created_at,recommendation_feedback(id,sentiment,reason_codes,canonical_key,created_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("HISTORY_READ_FAILED");
  return data;
}

export async function saveRecommendationFeedback(
  userId: string,
  input: {
    snapshotId: string;
    canonicalKey: CanonicalSneakerKey;
    sentiment: string;
    reasonCodes: string[];
    comment: string | null;
  },
) {
  const db = await required();
  const { data: snapshot, error: snapshotError } = await db
    .from("recommendation_snapshots")
    .select("id")
    .eq("id", input.snapshotId)
    .eq("user_id", userId)
    .maybeSingle();

  if (snapshotError) throw new Error("SNAPSHOT_LOOKUP_FAILED");
  if (!snapshot) throw new Error("SNAPSHOT_NOT_FOUND");

  const { data, error } = await db
    .from("recommendation_feedback")
    .insert({
      user_id: userId,
      recommendation_snapshot_id: input.snapshotId,
      canonical_key: input.canonicalKey,
      sentiment: input.sentiment,
      reason_codes: input.reasonCodes,
      comment: input.comment,
    })
    .select("id")
    .single();
  if (error) throw new Error("FEEDBACK_WRITE_FAILED");
  await recordExplicitProductAction(
    userId,
    `recommendation-feedback:${String(data.id)}`,
    "recommendation_feedback_submitted",
    "recommendation_feedback",
    String(data.id),
  ).catch(() => undefined);
  return data;
}

function sanitize(value: Record<string, unknown>) {
  const copy = structuredClone(value);
  for (const key of ["rawProviderResponse", "geminiPrompt", "groundingPayload", "credential", "token", "authorization", "cookie"]) {
    delete copy[key];
  }
  return copy;
}

async function required() {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  return db;
}
