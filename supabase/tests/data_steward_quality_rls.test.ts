import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202608180003_data_steward_quality.sql", "utf8").toLowerCase();

describe("data steward quality migration", () => {
  it.each(["staff_role_assignments", "manual_release_drafts", "manual_evidence_drafts", "provider_observations", "data_steward_audit_log"])("keeps %s behind RLS", (table) => {
    expect(sql).toContain(`create table public.${table}`);
    expect(sql).toContain(`alter table public.${table} enable row level security`);
  });

  it("uses a server-evaluated, default-deny data steward role", () => {
    expect(sql).toContain("create function public.is_data_steward()");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("assignment.revoked_at is null");
    expect(sql).toContain("revoke all on public.staff_role_assignments");
    expect(sql).toContain("grant execute on function public.is_data_steward() to authenticated");
  });

  it("does not grant admin tables to normal authenticated users", () => {
    expect(sql).not.toMatch(/grant\s+(?:select|insert|update|delete|all).*staff_role_assignments.*to authenticated/u);
    expect(sql).not.toMatch(/grant\s+(?:select|insert|update|delete|all).*manual_release_drafts.*to authenticated/u);
    expect(sql).not.toContain("using (true)");
    expect(sql).not.toContain("with check (true)");
  });

  it.each(["actor_id", "action", "entity_type", "entity_id", "request_id", "before_fingerprint", "after_fingerprint", "created_at"])("stores audit field %s", (field) => {
    expect(sql).toContain(field);
  });

  it("keeps secrets and raw provider payloads out of observations and audit logs", () => {
    expect(sql).not.toContain("raw_token");
    expect(sql).not.toContain("oauth_token");
    expect(sql).not.toContain("provider_secret");
    expect(sql).not.toContain("raw_provider_response");
  });
});
