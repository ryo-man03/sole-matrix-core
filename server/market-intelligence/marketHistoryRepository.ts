import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import {
  getMarketSeriesKey,
  validateMarketSnapshot,
  type MarketSnapshot,
} from "../../app/_lib/market-intelligence/snapshot";
import type { MarketProviderId } from "../../app/_lib/market-intelligence/provider";

export type MarketRepositoryStatus = "ready" | "disabled";

export type SaveSnapshotsResult = Readonly<{
  status: MarketRepositoryStatus;
  saved: number;
  duplicates: number;
  rejected: number;
}>;

export type MarketHistoryQuery = Readonly<{
  provider?: MarketProviderId;
  seriesKey?: string;
  observedFrom?: string;
  observedTo?: string;
  limit?: number;
}>;

export interface MarketHistoryRepository {
  getStatus(): MarketRepositoryStatus;
  saveSnapshots(
    snapshots: readonly MarketSnapshot[],
  ): Promise<SaveSnapshotsResult>;
  listSnapshots(query?: MarketHistoryQuery): Promise<readonly MarketSnapshot[]>;
  deleteBefore(cutoff: string): Promise<number>;
  deleteSeries(seriesKey: string): Promise<number>;
}

export type MarketRepositoryOptions = Readonly<{
  retentionDays?: number;
  now?: () => Date;
}>;

function snapshotIdentityKey(snapshot: MarketSnapshot): string {
  return `${getMarketSeriesKey(snapshot)}|${snapshot.observedAt}`;
}

function applyQuery(
  snapshots: readonly MarketSnapshot[],
  query: MarketHistoryQuery = {},
): readonly MarketSnapshot[] {
  const from = query.observedFrom ? Date.parse(query.observedFrom) : -Infinity;
  const to = query.observedTo ? Date.parse(query.observedTo) : Infinity;
  const limit = Math.max(1, Math.min(10_000, Math.floor(query.limit ?? 10_000)));
  return snapshots
    .filter((snapshot) =>
      (!query.provider || snapshot.provider === query.provider) &&
      (!query.seriesKey || getMarketSeriesKey(snapshot) === query.seriesKey) &&
      Date.parse(snapshot.observedAt) >= from &&
      Date.parse(snapshot.observedAt) <= to
    )
    .sort(
      (left, right) =>
        Date.parse(left.observedAt) - Date.parse(right.observedAt),
    )
    .slice(-limit);
}

abstract class MutableMarketHistoryRepository
implements MarketHistoryRepository {
  readonly #retentionDays: number;
  readonly #now: () => Date;
  #mutationQueue: Promise<void> = Promise.resolve();

  constructor(options: MarketRepositoryOptions = {}) {
    this.#retentionDays = Math.max(
      1,
      Math.min(3_650, Math.floor(options.retentionDays ?? 730)),
    );
    this.#now = options.now ?? (() => new Date());
  }

  getStatus(): MarketRepositoryStatus {
    return "ready";
  }

  protected abstract readAll(): Promise<readonly MarketSnapshot[]>;
  protected abstract writeAll(
    snapshots: readonly MarketSnapshot[],
  ): Promise<void>;

  async saveSnapshots(
    snapshots: readonly MarketSnapshot[],
  ): Promise<SaveSnapshotsResult> {
    return this.#withMutationLock(() => this.#saveSnapshotsUnlocked(snapshots));
  }

  async #saveSnapshotsUnlocked(
    snapshots: readonly MarketSnapshot[],
  ): Promise<SaveSnapshotsResult> {
    const current = [...await this.readAll()];
    const existingKeys = new Set(current.map(snapshotIdentityKey));
    const retentionCutoff =
      this.#now().getTime() - this.#retentionDays * 24 * 60 * 60 * 1_000;
    let saved = 0;
    let duplicates = 0;
    let rejected = 0;

    for (const snapshot of snapshots) {
      const validation = validateMarketSnapshot(snapshot);
      if (
        !validation.valid ||
        Date.parse(snapshot.observedAt) < retentionCutoff
      ) {
        rejected += 1;
        continue;
      }
      const key = snapshotIdentityKey(snapshot);
      if (existingKeys.has(key)) {
        duplicates += 1;
        continue;
      }
      current.push(structuredClone(snapshot));
      existingKeys.add(key);
      saved += 1;
    }

    const retained = current.filter(
      (snapshot) => Date.parse(snapshot.observedAt) >= retentionCutoff,
    );
    if (saved > 0 || retained.length !== current.length) {
      await this.writeAll(retained);
    }
    return { status: "ready", saved, duplicates, rejected };
  }

  async listSnapshots(
    query: MarketHistoryQuery = {},
  ): Promise<readonly MarketSnapshot[]> {
    return applyQuery(await this.readAll(), query);
  }

  async deleteBefore(cutoff: string): Promise<number> {
    return this.#withMutationLock(() => this.#deleteBeforeUnlocked(cutoff));
  }

  async #deleteBeforeUnlocked(cutoff: string): Promise<number> {
    const cutoffTime = Date.parse(cutoff);
    if (!Number.isFinite(cutoffTime)) return 0;
    const current = await this.readAll();
    const retained = current.filter(
      (snapshot) => Date.parse(snapshot.observedAt) >= cutoffTime,
    );
    const deleted = current.length - retained.length;
    if (deleted > 0) await this.writeAll(retained);
    return deleted;
  }

  async deleteSeries(seriesKey: string): Promise<number> {
    return this.#withMutationLock(() => this.#deleteSeriesUnlocked(seriesKey));
  }

  async #deleteSeriesUnlocked(seriesKey: string): Promise<number> {
    const current = await this.readAll();
    const retained = current.filter(
      (snapshot) => getMarketSeriesKey(snapshot) !== seriesKey,
    );
    const deleted = current.length - retained.length;
    if (deleted > 0) await this.writeAll(retained);
    return deleted;
  }

  async #withMutationLock<T>(operation: () => Promise<T>): Promise<T> {
    let release: () => void = () => undefined;
    const previous = this.#mutationQueue;
    this.#mutationQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

export class InMemoryMarketHistoryRepository
extends MutableMarketHistoryRepository {
  #snapshots: MarketSnapshot[] = [];

  protected async readAll(): Promise<readonly MarketSnapshot[]> {
    return this.#snapshots;
  }

  protected async writeAll(
    snapshots: readonly MarketSnapshot[],
  ): Promise<void> {
    this.#snapshots = [...structuredClone(snapshots)];
  }
}

type LocalFilePayload = Readonly<{
  version: 1;
  snapshots: readonly MarketSnapshot[];
}>;

function isLocalFilePayload(value: unknown): value is LocalFilePayload {
  if (
    typeof value !== "object" ||
    value === null ||
    !("version" in value) ||
    value.version !== 1 ||
    !("snapshots" in value) ||
    !Array.isArray(value.snapshots)
  ) {
    return false;
  }
  return value.snapshots.every((snapshot) => {
    if (typeof snapshot !== "object" || snapshot === null) return false;
    return validateMarketSnapshot(snapshot as MarketSnapshot).valid;
  });
}

export class LocalFileMarketHistoryRepository
extends MutableMarketHistoryRepository {
  readonly #filePath: string;

  constructor(
    filePath: string,
    workspaceRoot: string,
    options: MarketRepositoryOptions = {},
  ) {
    super(options);
    const root = resolve(workspaceRoot);
    const target = resolve(root, filePath);
    const relativeTarget = relative(root, target);
    if (
      !relativeTarget ||
      relativeTarget.startsWith("..") ||
      isAbsolute(relativeTarget)
    ) {
      throw new Error("market history file must be inside the workspace");
    }
    this.#filePath = target;
  }

  protected async readAll(): Promise<readonly MarketSnapshot[]> {
    try {
      const value: unknown = JSON.parse(
        await readFile(this.#filePath, "utf8"),
      );
      return isLocalFilePayload(value) ? value.snapshots : [];
    } catch (error) {
      if (error instanceof SyntaxError) {
        return [];
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return [];
      }
      throw error;
    }
  }

  protected async writeAll(
    snapshots: readonly MarketSnapshot[],
  ): Promise<void> {
    await mkdir(dirname(this.#filePath), { recursive: true });
    const temporaryPath = `${this.#filePath}.tmp`;
    const payload: LocalFilePayload = {
      version: 1,
      snapshots: structuredClone(snapshots),
    };
    await writeFile(temporaryPath, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryPath, this.#filePath);
  }
}

export class DisabledMarketHistoryRepository
implements MarketHistoryRepository {
  getStatus(): MarketRepositoryStatus {
    return "disabled";
  }

  async saveSnapshots(
    snapshots: readonly MarketSnapshot[],
  ): Promise<SaveSnapshotsResult> {
    return {
      status: "disabled",
      saved: 0,
      duplicates: 0,
      rejected: snapshots.length,
    };
  }

  async listSnapshots(): Promise<readonly MarketSnapshot[]> {
    return [];
  }

  async deleteBefore(): Promise<number> {
    return 0;
  }

  async deleteSeries(): Promise<number> {
    return 0;
  }
}

export function createMarketHistoryRepository(
  env: Readonly<Record<string, string | undefined>>,
  workspaceRoot: string,
  options: MarketRepositoryOptions = {},
): MarketHistoryRepository {
  if (env.NODE_ENV === "production") {
    return new DisabledMarketHistoryRepository();
  }
  return new LocalFileMarketHistoryRepository(
    env.MARKET_HISTORY_FILE?.trim() || ".data/market-history.json",
    workspaceRoot,
    options,
  );
}
