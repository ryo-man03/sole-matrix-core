import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createMarketHistoryRepository,
  DisabledMarketHistoryRepository,
  InMemoryMarketHistoryRepository,
  LocalFileMarketHistoryRepository,
} from "./marketHistoryRepository";
import {
  getMarketSeriesKey,
  type MarketSnapshot,
} from "../../app/_lib/market-intelligence/snapshot";

const NOW = new Date("2026-07-30T12:00:00.000Z");

function snapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return {
    provider: "stockx",
    identity: {
      brand: "Nike",
      modelName: "Air Jordan 1 Retro High OG",
      colorwayName: "Chicago",
      styleCode: "DZ5485-612",
      releaseYear: 2022,
    },
    variant: {
      sizeSystem: "US_M",
      sizeValue: "9",
      condition: "new",
    },
    priceType: "lowest_ask",
    amount: 42_000,
    currency: "JPY",
    observedAt: "2026-07-30T00:00:00.000Z",
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

describe("normalized market history persistence", () => {
  it("deduplicates provider, identity, variant, price type, and observation time", async () => {
    const repository = new InMemoryMarketHistoryRepository({
      now: () => NOW,
    });
    const first = snapshot();
    expect(await repository.saveSnapshots([first, first])).toEqual({
      status: "ready",
      saved: 1,
      duplicates: 1,
      rejected: 0,
    });
    expect(await repository.saveSnapshots([
      snapshot({ amount: 41_000 }),
    ])).toEqual({
      status: "ready",
      saved: 0,
      duplicates: 1,
      rejected: 0,
    });
    expect(await repository.listSnapshots()).toHaveLength(1);
  });

  it("keeps distinct price types and observation times", async () => {
    const repository = new InMemoryMarketHistoryRepository({
      now: () => NOW,
    });
    await repository.saveSnapshots([
      snapshot(),
      snapshot({ priceType: "highest_bid" }),
      snapshot({ observedAt: "2026-07-30T01:00:00.000Z" }),
    ]);
    expect(await repository.listSnapshots()).toHaveLength(3);
  });

  it("serializes concurrent writes without losing a snapshot", async () => {
    const repository = new InMemoryMarketHistoryRepository({
      now: () => NOW,
    });
    await Promise.all([
      repository.saveSnapshots([snapshot()]),
      repository.saveSnapshots([
        snapshot({ observedAt: "2026-07-30T01:00:00.000Z" }),
      ]),
    ]);
    expect(await repository.listSnapshots()).toHaveLength(2);
  });

  it("applies retention and explicit delete policies", async () => {
    const repository = new InMemoryMarketHistoryRepository({
      now: () => NOW,
      retentionDays: 30,
    });
    expect(await repository.saveSnapshots([
      snapshot({ observedAt: "2026-06-01T00:00:00.000Z" }),
      snapshot(),
    ])).toMatchObject({ saved: 1, rejected: 1 });
    const seriesKey = getMarketSeriesKey(snapshot());
    expect(await repository.deleteSeries(seriesKey)).toBe(1);
    expect(await repository.listSnapshots()).toEqual([]);
  });

  it("persists only normalized snapshots in a workspace-scoped local file", async () => {
    const root = await mkdtemp(join(tmpdir(), "sole-matrix-market-"));
    try {
      const repository = new LocalFileMarketHistoryRepository(
        ".data/history.json",
        root,
        { now: () => NOW },
      );
      await repository.saveSnapshots([snapshot()]);
      const loaded = await repository.listSnapshots();
      expect(loaded).toHaveLength(1);
      const raw = await readFile(join(root, ".data", "history.json"), "utf8");
      expect(raw).not.toContain("accessToken");
      expect(raw).not.toContain("rawResponse");
      expect(JSON.parse(raw)).toMatchObject({ version: 1 });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("recovers safely from a corrupted local history file", async () => {
    const root = await mkdtemp(join(tmpdir(), "sole-matrix-market-corrupt-"));
    try {
      const filePath = join(root, ".data", "history.json");
      const repository = new LocalFileMarketHistoryRepository(
        ".data/history.json",
        root,
        { now: () => NOW },
      );
      await repository.saveSnapshots([snapshot()]);
      await writeFile(filePath, "{invalid", "utf8");
      await expect(repository.listSnapshots()).resolves.toEqual([]);
      await expect(repository.saveSnapshots([snapshot()])).resolves.toMatchObject({
        saved: 1,
      });
      await expect(repository.listSnapshots()).resolves.toHaveLength(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects local file paths outside the workspace", () => {
    expect(() =>
      new LocalFileMarketHistoryRepository("../history.json", "C:/workspace"),
    ).toThrow("market history file must be inside the workspace");
  });

  it("is disabled by default in production", async () => {
    const repository = createMarketHistoryRepository(
      { NODE_ENV: "production" },
      process.cwd(),
    );
    expect(repository).toBeInstanceOf(DisabledMarketHistoryRepository);
    expect(await repository.saveSnapshots([snapshot()])).toEqual({
      status: "disabled",
      saved: 0,
      duplicates: 0,
      rejected: 1,
    });
  });
});
