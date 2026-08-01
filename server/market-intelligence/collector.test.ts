import type {
  MarketDataProvider,
  MarketProviderCapability,
  MarketSnapshotResult,
} from "../../app/_lib/market-intelligence/provider";
import type { MarketSnapshot } from "../../app/_lib/market-intelligence/snapshot";
import {
  InMemoryMarketHistoryRepository,
} from "./marketHistoryRepository";
import {
  collectMarketSnapshots,
  type MarketCollectionTarget,
} from "./collector";

const NOW = new Date("2026-07-30T12:00:00.000Z");
const target: MarketCollectionTarget = {
  identity: {
    brand: "Nike",
    modelName: "Air Jordan 1 Retro High OG",
    colorwayName: "Chicago",
    styleCode: "DZ5485-612",
    releaseYear: 2022,
  },
  variant: { sizeSystem: "US_M", sizeValue: "9", condition: "new" },
};

function snapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    provider: "stockx",
    identity: target.identity,
    variant: target.variant,
    priceType: "lowest_ask",
    amount: 42_000,
    currency: "JPY",
    observedAt: NOW.toISOString(),
    sourceReference: "stockx:product:variant",
    sampleCount: null,
    identityMatch: "exact",
    sourceQuality: "official_api",
    includesFees: null,
    includesShipping: null,
    includesTax: null,
    ...overrides,
  };
}

const readyCapability: MarketProviderCapability = {
  provider: "stockx",
  access: "approved_account",
  catalogSearch: true,
  currentAsk: true,
  currentBid: true,
  soldPrice: false,
  listingSearch: false,
  historicalSeries: false,
  sizeSpecific: true,
  automatedCollectionAllowed: true,
  credentialsAvailable: true,
  termsCheckedAt: "2026-07-30",
};

function provider(
  getResult: () => Promise<MarketSnapshotResult>,
  capability: MarketProviderCapability = readyCapability,
): MarketDataProvider {
  return {
    id: "stockx",
    getCapability: () => capability,
    searchCatalog: async () => ({ status: "not_supported" }),
    getCurrentSnapshot: getResult,
  };
}

function repository(): InMemoryMarketHistoryRepository {
  return new InMemoryMarketHistoryRepository({ now: () => NOW });
}

describe("bounded market snapshot collector", () => {
  it("honors the maximum requested count", async () => {
    let calls = 0;
    const result = await collectMarketSnapshots({
      provider: provider(async () => {
        calls += 1;
        return {
          status: "success",
          data: { ...target, snapshots: [snapshot()] },
        };
      }),
      repository: repository(),
      targets: Array.from({ length: 150 }, () => target),
      limit: 500,
      dryRun: true,
    });
    expect(result.limit).toBe(100);
    expect(calls).toBe(100);
  });

  it("does not persist in dry-run mode", async () => {
    const history = repository();
    const result = await collectMarketSnapshots({
      provider: provider(async () => ({
        status: "success",
        data: { ...target, snapshots: [snapshot()] },
      })),
      repository: history,
      targets: [target],
      limit: 10,
      dryRun: true,
    });
    expect(result).toMatchObject({
      status: "dry_run",
      collected: 1,
      saved: 0,
    });
    expect(await history.listSnapshots()).toEqual([]);
  });

  it("stops immediately on 429 without retrying", async () => {
    let calls = 0;
    const result = await collectMarketSnapshots({
      provider: provider(async () => {
        calls += 1;
        return { status: "rate_limited", retryAfter: 60 };
      }),
      repository: repository(),
      targets: [target, target],
      limit: 10,
      dryRun: false,
    });
    expect(result.status).toBe("rate_limited");
    expect(calls).toBe(1);
    expect(result.retries).toBe(0);
  });

  it("retries a transient network failure at most once", async () => {
    let calls = 0;
    const result = await collectMarketSnapshots({
      provider: provider(async () => {
        calls += 1;
        return calls === 1
          ? { status: "network_error" }
          : {
              status: "success",
              data: { ...target, snapshots: [snapshot()] },
            };
      }),
      repository: repository(),
      targets: [target],
      limit: 10,
      dryRun: false,
    });
    expect(calls).toBe(2);
    expect(result).toMatchObject({ retries: 1, saved: 1 });
  });

  it("rejects invalid or model-only identities before calling a provider", async () => {
    let calls = 0;
    const result = await collectMarketSnapshots({
      provider: provider(async () => {
        calls += 1;
        return { status: "not_supported" };
      }),
      repository: repository(),
      targets: [{
        ...target,
        identity: { ...target.identity, styleCode: null },
      }],
      limit: 10,
      dryRun: false,
    });
    expect(result.rejected).toBe(1);
    expect(calls).toBe(0);
  });

  it("deduplicates a series already observed on the same UTC day", async () => {
    const history = repository();
    await history.saveSnapshots([
      snapshot({ observedAt: "2026-07-30T01:00:00.000Z" }),
    ]);
    const result = await collectMarketSnapshots({
      provider: provider(async () => ({
        status: "success",
        data: {
          ...target,
          snapshots: [snapshot({ observedAt: "2026-07-30T20:00:00.000Z" })],
        },
      })),
      repository: history,
      targets: [target],
      limit: 10,
      dryRun: false,
    });
    expect(result).toMatchObject({ duplicates: 1, saved: 0 });
    expect(await history.listSnapshots()).toHaveLength(1);
  });

  it("returns not_configured without provider calls", async () => {
    let calls = 0;
    const result = await collectMarketSnapshots({
      provider: provider(async () => {
        calls += 1;
        return { status: "not_configured" };
      }, { ...readyCapability, credentialsAvailable: false }),
      repository: repository(),
      targets: [target],
      limit: 10,
      dryRun: false,
    });
    expect(result.status).toBe("not_configured");
    expect(calls).toBe(0);
  });
});

