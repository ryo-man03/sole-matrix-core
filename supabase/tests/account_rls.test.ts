import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync("supabase/migrations/202608020001_account_persistence.sql", "utf8").toLowerCase();
describe("account migration static RLS gate", () => {
  it.each([
    "create table public.profiles", "create table public.consent_records", "create table public.privacy_requests",
    "alter table public.profiles enable row level security", "alter table public.consent_records enable row level security", "alter table public.privacy_requests enable row level security",
    "profiles_select_own", "profiles_insert_own", "profiles_update_own", "consent_records_select_own", "consent_records_insert_own", "privacy_requests_select_own", "privacy_requests_insert_own",
    "auth.uid()", "on delete cascade", "privacy_requests_one_pending_idx", "consent_records_user_type_recorded_idx", "revoke all", "from anon",
    "set_updated_at", "security invoker", "set search_path = ''", "begin;", "commit;",
  ])("contains %s", (clause) => expect(sql).toContain(clause));
  it.each(["service_role", "supabase_service_role_key", "drop table", "truncate ", "disable row level security", "using (true)", "with check (true)"])("does not contain unsafe clause %s", (clause) => expect(sql).not.toContain(clause));
});
