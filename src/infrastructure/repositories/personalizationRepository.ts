import "server-only";

import { createSupabaseServerClient } from "../auth/supabase/server";
import { recordExplicitProductAction } from "./postPurchaseRepository";

type Table = "user_sizes" | "owned_sneakers" | "wishlist_items";

export async function listOwnedRows(table: Table, userId: string) {
  const db = await requiredDb();
  const { data, error } = await db.from(table).select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error("READ_FAILED");
  return data;
}

export async function createOwnedRow(table: Table, userId: string, input: Record<string, unknown>) {
  const db = await requiredDb();
  const { data, error } = await db.from(table).insert({ ...input, user_id: userId }).select("*").single();
  if (error) throw new Error("WRITE_FAILED");
  if (table === "owned_sneakers") {
    await recordExplicitProductAction(userId, `owned:${String(data.id)}`, "owned_sneaker_added", "owned_sneaker", String(data.id)).catch(() => undefined);
  } else if (table === "wishlist_items") {
    await recordExplicitProductAction(userId, `wishlist-add:${String(data.id)}`, "wishlist_added", "wishlist_item", String(data.id)).catch(() => undefined);
  }
  return data;
}

export async function updateOwnedRow(table: Table, userId: string, id: string, input: Record<string, unknown>) {
  const db = await requiredDb();
  const { data, error } = await db.from(table).update(input).eq("id", id).eq("user_id", userId).select("*").maybeSingle();
  if (error || !data) throw new Error("NOT_FOUND");
  return data;
}

export async function deleteOwnedRow(table: Table, userId: string, id: string) {
  const db = await requiredDb();
  const { data, error } = await db.from(table).delete().eq("id", id).eq("user_id", userId).select("id").maybeSingle();
  if (error) throw new Error("DELETE_FAILED");
  if (!data) throw new Error("NOT_FOUND");
  if (table === "wishlist_items") {
    await recordExplicitProductAction(userId, `wishlist-remove:${id}`, "wishlist_removed", "wishlist_item", id).catch(() => undefined);
  }
}

export async function getPreferences(userId: string) {
  const db = await requiredDb();
  const { data, error } = await db.from("user_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw new Error("READ_FAILED");
  return data;
}

export async function putPreferences(userId: string, input: Record<string, unknown>) {
  const db = await requiredDb();
  const { data, error } = await db.from("user_preferences").upsert({ ...input, user_id: userId }, { onConflict: "user_id" }).select("*").single();
  if (error) throw new Error("WRITE_FAILED");
  return data;
}

async function requiredDb() {
  const db = await createSupabaseServerClient();
  if (!db) throw new Error("DATABASE_NOT_CONFIGURED");
  return db;
}
