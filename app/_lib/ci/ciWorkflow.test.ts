import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  path.join(process.cwd(), ".github", "workflows", "ci.yml"),
  "utf8",
);

describe("CI workflow", () => {
  it("has no BOM and runs on pull requests, main pushes, merge queue, and manual dispatch", () => {
    expect(workflow.charCodeAt(0)).not.toBe(0xfeff);
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("push:");
    expect(workflow).toContain("merge_group:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("cancel-in-progress: true");
  });

  it("defines three independent quality-gate jobs with pinned runtimes", () => {
    for (const job of ["typecheck", "tests", "build"]) {
      expect(workflow).toMatch(new RegExp(`^  ${job}:$`, "m"));
    }
    expect(workflow).toContain("name: Typecheck");
    expect(workflow).toContain("name: Tests");
    expect(workflow).toContain("name: Production build");
    expect(workflow.match(/version: 11\.5\.2/g)).toHaveLength(3);
    expect(workflow.match(/node-version: 24/g)?.length).toBeGreaterThanOrEqual(3);
    expect(workflow.match(/pnpm install --frozen-lockfile/g)?.length).toBeGreaterThanOrEqual(3);
    expect(workflow).toContain("run: pnpm typecheck");
    expect(workflow).toContain("run: pnpm test");
    expect(workflow).toContain("run: pnpm web:build");
  });

  it("does not request secrets or weaken failures", () => {
    expect(workflow).not.toMatch(/secrets\.|GEMINI|RAKUTEN|SUPABASE|\.env\.local/);
    expect(workflow).not.toContain("continue-on-error");
  });
});
