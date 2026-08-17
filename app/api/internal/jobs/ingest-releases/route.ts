import { NextResponse } from "next/server";
import { authorizeInternalJob } from "../../../../../src/application/daily-picks/internalJobAuth";
import { ingestReleases } from "../../../../../src/application/release-ingestion/ingestReleases";
import { createManualReleaseProvider } from "../../../../../src/infrastructure/release-providers/manualReleaseProvider";
import { createReleaseEvidenceStore } from "../../../../../src/infrastructure/repositories/releaseEvidenceStore";

export async function POST(request: Request) {
  if (declaredBodyTooLarge(request, 65_536)) return NextResponse.json({ ok: false, error: { code: "BODY_TOO_LARGE" } }, { status: 413 });
  const rawBody = await request.text();
  const authorization = authorizeInternalJob(request, rawBody, "release-ingestion", { maxBodyBytes: 65_536, rateLimit: 5 });
  if (!authorization.ok) return NextResponse.json({ ok: false, error: { code: authorization.code } }, { status: authorization.status });
  try {
    const body = parseBody(rawBody);
    const result = await ingestReleases(createManualReleaseProvider(body.records), createReleaseEvidenceStore(), {
      idempotencyKey: authorization.idempotencyKey,
      cursor: body.cursor,
      dryRun: body.dryRun,
      maxRecords: 100,
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const code = safeCode(error);
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "ADMIN_NOT_CONFIGURED" ? 503 : 400 });
  }
}

function declaredBodyTooLarge(request: Request, limit: number): boolean {
  const value = request.headers.get("content-length");
  return value !== null && (!/^\d+$/u.test(value) || Number(value) > limit);
}

function parseBody(rawBody: string): { records: unknown[]; cursor: string | null; dryRun: boolean } {
  const value: unknown = JSON.parse(rawBody);
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("INVALID_JOB");
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !["providerId", "records", "cursor", "dryRun"].includes(key))) throw new Error("INVALID_JOB");
  if (body.providerId !== "manual_seed" || !Array.isArray(body.records) || body.records.length > 100) throw new Error("INVALID_JOB");
  if (body.cursor !== undefined && body.cursor !== null && (typeof body.cursor !== "string" || !/^\d{1,8}$/u.test(body.cursor))) throw new Error("INVALID_JOB");
  if (typeof body.dryRun !== "boolean") throw new Error("INVALID_JOB");
  return { records: body.records, cursor: typeof body.cursor === "string" ? body.cursor : null, dryRun: body.dryRun };
}

function safeCode(error: unknown): string {
  const code = error instanceof Error ? error.message : "RELEASE_INGESTION_FAILED";
  return /^[A-Z0-9_]{3,80}$/u.test(code) ? code : "RELEASE_INGESTION_FAILED";
}
