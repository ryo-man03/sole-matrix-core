import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202608020003_recommendation_history.sql", "utf8")
  .toLowerCase()
  .replace(/\s+/g, " ");

describe("recommendation history migration", () => {
  it.each(["recommendation_snapshots", "recommendation_feedback"])("creates %s", (table) => {
    expect(sql).toContain(`create table public.${table}`);
    expect(sql).toContain(`alter table public.${table} enable row level security`);
  });

  it("binds feedback to the snapshot owner with a composite foreign key", () => {
    expect(sql).toContain("constraint recommendation_snapshots_id_user_id_key unique(id,user_id)");
    expect(sql).toContain("constraint recommendation_feedback_snapshot_owner_fkey foreign key(recommendation_snapshot_id,user_id) references public.recommendation_snapshots(id,user_id) on delete cascade");
    expect(sql).not.toContain("recommendation_snapshot_id uuid not null references public.recommendation_snapshots(id)");
  });

  it("keeps RLS responsible for authenticated row ownership", () => {
    expect(sql).toContain("recommendation_snapshots_own");
    expect(sql).toContain("recommendation_feedback_own");
    expect(sql).toContain("using((select auth.uid())=user_id)");
    expect(sql).toContain("with check((select auth.uid())=user_id)");
  });

  it("cascades owned feedback when its snapshot is deleted", () => {
    expect(sql).toContain("foreign key(recommendation_snapshot_id,user_id) references public.recommendation_snapshots(id,user_id) on delete cascade");
  });

  it("keeps snapshots and feedback unreadable across users through RLS", () => {
    expect(sql).toContain("alter table public.recommendation_snapshots enable row level security");
    expect(sql).toContain("alter table public.recommendation_feedback enable row level security");
    expect(sql).toContain("revoke all on public.recommendation_snapshots,public.recommendation_feedback from anon");
  });

  it.each([
    "recommendation_snapshots_user_created_idx",
    "recommendation_feedback_user_created_idx",
    "auth.uid()",
    "canonical_key",
    "algorithm_version",
    "input_snapshot",
    "result_snapshot",
    "on delete cascade",
    "from anon",
    "to authenticated",
    "begin;",
    "commit;",
  ])("contains %s", (clause) => expect(sql).toContain(clause));

  it.each(["service_role", "raw_provider", "gemini", "credential", "token", "drop table", "truncate ", "using(true)"])(
    "does not persist or grant %s",
    (clause) => expect(sql).not.toContain(clause),
  );
});
