import "server-only";
import { compareReleaseIdentity, dedupeReleaseObservations, resolveReleaseEvidence, type ReleaseResolution } from "../../domain/release/releaseEvidence";
import type { ReleaseObservation, ReleaseProvider, ReleaseProviderAccessMode } from "../../domain/release/release";

export type ReleaseIngestionRequest = {
  idempotencyKey: string;
  cursor: string | null;
  dryRun: boolean;
  maxRecords?: number;
};

export type ReleaseObservationGroup = {
  observations: ReleaseObservation[];
  resolution: ReleaseResolution;
};

export type ReleaseRunResult = {
  runId: string;
  replayed: boolean;
  dryRun: boolean;
  cursorAfter: string | null;
  observedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  conflictCount: number;
};

export interface ReleaseEvidenceStore {
  beginRun(input: { providerId: string; accessMode: ReleaseProviderAccessMode; idempotencyKey: string; cursorBefore: string | null; dryRun: boolean }): Promise<{ runId: string; replayed: boolean }>;
  persistGroup(runId: string, group: ReleaseObservationGroup): Promise<ReleaseResolution>;
  completeRun(runId: string, result: Omit<ReleaseRunResult, "runId" | "replayed" | "dryRun"> & { dryRun: boolean }): Promise<void>;
  failRun(runId: string, safeErrorCode: string): Promise<void>;
}

export async function ingestReleases(provider: ReleaseProvider, store: ReleaseEvidenceStore, request: ReleaseIngestionRequest): Promise<ReleaseRunResult> {
  if (!provider.capability.persistentMetadataAllowed && !request.dryRun) throw new Error("PROVIDER_PERSISTENCE_DENIED");
  if (provider.capability.accessMode === "disabled") throw new Error("PROVIDER_DISABLED");
  const run = await store.beginRun({
    providerId: provider.capability.providerId,
    accessMode: provider.capability.accessMode,
    idempotencyKey: request.idempotencyKey,
    cursorBefore: request.cursor,
    dryRun: request.dryRun,
  });
  if (run.replayed) return { runId: run.runId, replayed: true, dryRun: request.dryRun, cursorAfter: request.cursor, observedCount: 0, acceptedCount: 0, rejectedCount: 0, conflictCount: 0 };

  let cursor = request.cursor;
  let observedCount = 0;
  let rejectedCount = 0;
  const normalized: ReleaseObservation[] = [];
  const seenCursors = new Set<string | null>();
  const maxRecords = Math.max(1, Math.min(request.maxRecords ?? 100, 100));
  try {
    while (observedCount < maxRecords) {
      if (seenCursors.has(cursor)) throw new Error("PROVIDER_CURSOR_REPLAY");
      seenCursors.add(cursor);
      const page = await provider.collect({ cursor, limit: Math.min(50, maxRecords - observedCount) });
      if (page.records.length > Math.min(50, maxRecords - observedCount)) throw new Error("PROVIDER_PAGE_LIMIT_EXCEEDED");
      for (const record of page.records) {
        observedCount += 1;
        try { normalized.push(provider.normalize(record)); }
        catch { rejectedCount += 1; }
      }
      cursor = page.nextCursor;
      if (cursor === null || page.records.length === 0) break;
    }

    const deduped = dedupeReleaseObservations(normalized);
    rejectedCount += normalized.length - deduped.length;
    const groups = groupObservations(deduped);
    const persistedResolutions = request.dryRun ? groups.map((group) => group.resolution) : await Promise.all(groups.map((group) => store.persistGroup(run.runId, group)));
    const conflictCount = persistedResolutions.filter((resolution) => resolution.hasConflict).length;
    const result = {
      runId: run.runId,
      replayed: false,
      dryRun: request.dryRun,
      cursorAfter: cursor,
      observedCount,
      acceptedCount: deduped.length,
      rejectedCount,
      conflictCount,
    };
    await store.completeRun(run.runId, result);
    return result;
  } catch (error) {
    await store.failRun(run.runId, safeErrorCode(error));
    throw new Error(safeErrorCode(error));
  }
}

export function groupObservations(observations: readonly ReleaseObservation[]): ReleaseObservationGroup[] {
  const groups: ReleaseObservation[][] = [];
  for (const observation of observations) {
    const group = groups.find((items) => {
      const match = compareReleaseIdentity(items[0]!, observation);
      return match === "exact_style_code" || match === "exact_verified_identity";
    });
    if (group) group.push(observation);
    else groups.push([observation]);
  }
  return groups.map((items) => ({ observations: items, resolution: resolveReleaseEvidence(items.map((item) => item.evidence)) }));
}

function safeErrorCode(error: unknown): string {
  const code = error instanceof Error ? error.message : "RELEASE_INGESTION_FAILED";
  return /^[A-Z0-9_]{3,80}$/u.test(code) ? code : "RELEASE_INGESTION_FAILED";
}
