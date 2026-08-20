import { describe, expect, it } from "vitest";
import { assessMigrationRisks, buildStagingPreflightReport } from "./stagingPreflight";

const readyEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  SOLE_MATRIX_ENVIRONMENT: "staging",
  NEXT_PUBLIC_SUPABASE_URL: "https://stagingref.supabase.co",
  STAGING_SUPABASE_PROJECT_REF: "stagingref",
  PRODUCTION_SUPABASE_PROJECT_REF: "productionref",
  STAGING_BACKUP_VERIFIED: "true",
  STAGING_ROLLBACK_PLAN_VERIFIED: "true",
  STAGING_DATA_REWRITE_APPROVED: "true",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-only",
  SUPABASE_SECRET_KEY: "fixture-only",
  SUPABASE_ACCESS_TOKEN: "fixture-only",
  SUPABASE_DB_PASSWORD: "fixture-only",
  INTERNAL_JOB_SIGNING_SECRET: "fixture-only",
};

describe("staging preflight", () => {
  it("accepts an explicitly separated staging environment", () => {
    const report = buildStagingPreflightReport(readyEnv, [{ name: "001.sql", sql: "begin; create table example(id int); commit;" }]);
    expect(report.status).toBe("READY");
    expect(report.hardBlockers).toEqual([]);
  });

  it("blocks a generic environment that is not designated as staging", () => {
    const report = buildStagingPreflightReport({ ...readyEnv, SOLE_MATRIX_ENVIRONMENT: undefined }, []);
    expect(report.status).toBe("BLOCKED");
    expect(report.checks.environmentDesignation).toBe(false);
  });

  it("blocks a staging ref that equals the production ref", () => {
    const report = buildStagingPreflightReport({ ...readyEnv, PRODUCTION_SUPABASE_PROJECT_REF: "stagingref" }, []);
    expect(report.status).toBe("BLOCKED");
    expect(report.checks.productionProjectIsDifferent).toBe(false);
  });

  it("requires explicit approval for a reviewed data rewrite", () => {
    const report = buildStagingPreflightReport(
      { ...readyEnv, STAGING_DATA_REWRITE_APPROVED: undefined },
      [{ name: "005.sql", sql: "begin; update public.items set state = 'reviewed'; commit;" }],
    );
    expect(report.status).toBe("BLOCKED");
    expect(report.checks.dataRewriteApproved).toBe(false);
    expect(report.migrationFindings[0]?.risks).toContain("data-rewrite");
  });

  it("does not confuse policy or foreign-key clauses with DML", () => {
    const findings = assessMigrationRisks([
      {
        name: "safe.sql",
        sql: "begin; create policy own_update on public.items for update using (true); create table child(parent_id uuid references public.parent(id) on delete cascade); commit;",
      },
    ]);
    expect(findings).toEqual([]);
  });

  it("hard-blocks destructive migration operations", () => {
    const findings = assessMigrationRisks([
      { name: "008.sql", sql: "begin; alter table public.items drop column style_code; truncate public.items; commit;" },
    ]);
    expect(findings[0]?.risks).toEqual(["drop-column", "truncate"]);
    expect(buildStagingPreflightReport(readyEnv, [{ name: "008.sql", sql: "drop table public.items;" }]).status).toBe("BLOCKED");
  });

  it("reports presence without copying credential values", () => {
    const report = buildStagingPreflightReport(readyEnv, []);
    expect(report.secretInventory.SUPABASE_SECRET_KEY).toBe("present");
    expect(JSON.stringify(report)).not.toContain("fixture-only");
  });
});
