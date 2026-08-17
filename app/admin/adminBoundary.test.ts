import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync("app/admin/layout.tsx", "utf8");
const authorization = readFileSync("src/application/admin/authorization.ts", "utf8");
const migration = readFileSync("supabase/migrations/202608180003_data_steward_quality.sql", "utf8");

describe("Data Steward UI boundary", () => {
  it.each(["/admin/providers", "/admin/releases", "/admin/evidence", "/admin/conflicts", "/admin/data-quality", "/admin/import"])("links protected route %s", (path) => {
    expect(layout).toContain(path);
  });

  it("does not use a client flag, public env, or local storage for admin authorization", () => {
    expect(authorization).toContain('db.rpc("is_data_steward")');
    expect(`${layout}\n${authorization}`).not.toMatch(/localStorage|sessionStorage|NEXT_PUBLIC_.*ADMIN|isAdmin\s*=/u);
  });

  it("keeps admin storage service-only and default deny", () => {
    expect(migration).toContain("from anon, authenticated");
    expect(migration).toContain("to service_role");
    expect(migration).not.toContain("to authenticated using (true)");
  });
});
