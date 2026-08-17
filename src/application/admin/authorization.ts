import "server-only";

import { getAuthenticatedUser, createSupabaseServerClient } from "../../infrastructure/auth/supabase/server";

export type DataStewardAuthorization =
  | Readonly<{ authorized: true; actorId: string }>
  | Readonly<{ authorized: false; reason: "unauthenticated" | "role_unavailable" | "forbidden" }>;

export async function authorizeDataSteward(): Promise<DataStewardAuthorization> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { authorized: false, reason: "unauthenticated" };
  const db = await createSupabaseServerClient();
  if (!db) return { authorized: false, reason: "role_unavailable" };
  const { data, error } = await db.rpc("is_data_steward");
  if (error) return { authorized: false, reason: "role_unavailable" };
  return data === true ? { authorized: true, actorId: user.id } : { authorized: false, reason: "forbidden" };
}
