import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import type { MarketProviderResult } from "../../../app/_lib/market/contracts";
import { emptyProviderAudit } from "../../../app/_lib/market/contracts";
import { resetMarketReliabilityForTests } from "../../../app/_lib/market/reliability";
import { searchCurrentMarketPrices, type MarketProviderSearch } from "../../../app/_lib/market/search";

describe("measured performance contracts", () => {
  it("starts all three provider operations before the shared gate is released", async () => {
    resetMarketReliabilityForTests();
    let started = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const providers = (["rakuten", "yahoo", "ebay"] as const).map((provider): MarketProviderSearch => ({
      provider,
      search: async () => { started += 1; await gate; return empty(provider); },
    }));
    const search = searchCurrentMarketPrices(context(), providers);
    await vi.waitFor(() => expect(started).toBe(3));
    release();
    await search;
    expect(started).toBe(3);
  });

  it("keeps Today at one nested database read", () => {
    const repository = readFileSync("src/infrastructure/repositories/dailyPickRepository.ts", "utf8");
    const body = functionSlice(repository, "getDailyPickBatch", "saveDailyFeedback");
    expect((body.match(/db\.from\(/gu) ?? []).length).toBe(1);
    expect(body).toContain("daily_picks(");
    expect(body).toContain("release_items(");
  });

  it.each([
    ["loadProviderAdminData", "loadReleaseAdminData", 2],
    ["loadReleaseAdminData", "loadEvidenceAdminData", 2],
    ["loadEvidenceAdminData", "loadConflictAdminData", 2],
    ["loadConflictAdminData", "loadAuditLog", 1],
    ["loadAuditLog", "loadDataQuality", 1],
    ["loadDataQuality", "createManualReleaseDraft", 13],
  ] as const)("keeps %s query count bounded at %s", (name, nextName, expected) => {
    const repository = readFileSync("src/infrastructure/repositories/dataStewardRepository.ts", "utf8");
    const body = functionSlice(repository, name, nextName);
    expect((body.match(/db\.from\(/gu) ?? []).length).toBe(expected);
    if (expected > 1) expect(body).toContain("Promise.all(");
  });
});

function functionSlice(source: string, name: string, nextName: string): string {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  expect(start, name).toBeGreaterThanOrEqual(0);
  expect(end, nextName).toBeGreaterThan(start);
  return source.slice(start, end);
}

function context() {
  return {
    query: "Example Shoe",
    identity: { brand: "Example", modelName: "Shoe", colorwayName: null, styleCode: null, verificationState: "model_only" as const },
    gender: "unknown" as const,
    sizeSystem: "UNKNOWN" as const,
    size: null,
    condition: "unknown" as const,
  };
}

function empty(provider: "rakuten" | "yahoo" | "ebay"): MarketProviderResult {
  return { provider, status: "empty", listings: [], fetchedAt: null, audit: emptyProviderAudit(provider), message: "empty" };
}
