import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const path = "supabase/migrations/202608180001_release_intelligence_evolution.sql";
const sql = readFileSync(path, "utf8").toLowerCase();
const legacy = readFileSync("supabase/migrations/202608020004_release_daily_picks.sql", "utf8");

describe("release intelligence evolution migration", () => {
  it("leaves migration 004 byte-stable", () => {
    expect(createHash("sha256").update(legacy).digest("hex")).toBe("4498f6c7f4c61b685f7f081c86cc66d54e9a0bb9c032b11e8e138c6362801683");
  });

  it.each(["release_ingestion_runs", "release_evidence_status_history", "release_conflicts"])("creates service-only table %s with RLS", (table) => {
    expect(sql).toContain(`create table public.${table}`);
    expect(sql).toContain(`alter table public.${table} enable row level security`);
  });

  it.each([
    "conflicting_evidence",
    "provider_source_id",
    "external_item_id",
    "content_fingerprint",
    "source_domain",
    "source_independence_key",
    "canonical_origin_url",
    "supersedes_evidence_id",
    "provider_run_id",
    "release_variant_id",
    "first_seen_at",
    "last_seen_at",
    "last_verified_at",
    "review_state",
  ])("adds %s", (field) => expect(sql).toContain(field));

  it.each([
    "brand_official",
    "authorized_retailer",
    "licensed_feed",
    "editorial_authorized",
    "manual_official_reference",
    "manual_retailer_reference",
    "manual_other",
  ])("allows evidence kind %s", (kind) => expect(sql).toContain(`'${kind}'`));

  it("does not expose operational tables to users", () => {
    expect(sql).toContain("from anon,authenticated");
    expect(sql).not.toContain("to authenticated using(true)");
    expect(sql).not.toMatch(/grant\s+(?:select|insert|update|delete|all).*to authenticated/u);
  });

  it("allows only one open conflict while preserving resolved history", () => {
    expect(sql).toContain("release_conflicts_open_uidx");
    expect(sql).toContain("where status='open'");
    expect(sql).not.toContain("unique(release_item_id,conflict_field,status)");
  });

  it.each(["drop table", "truncate ", "disable row level security"])("does not contain destructive operation %s", (clause) => {
    expect(sql).not.toContain(clause);
  });
});
