import { NextResponse } from "next/server";
import { authorizeInternalJob } from "../../../../../src/application/daily-picks/internalJobAuth";
import { buildDailyBatch } from "../../../../../src/application/daily-picks/buildDailyBatch";

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && (!/^\d+$/u.test(contentLength) || Number(contentLength) > 65_536)) return NextResponse.json({ ok: false, error: { code: "BODY_TOO_LARGE" } }, { status: 413 });
  const rawBody = await request.text();
  const authorization = authorizeInternalJob(request, rawBody, "build-daily-picks");
  if (!authorization.ok) return NextResponse.json({ ok: false, error: { code: authorization.code } }, { status: authorization.status });
  try {
    const body: unknown = JSON.parse(rawBody);
    if (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).some((key) => !["userId", "targetDate"].includes(key))) throw new Error("INVALID_JOB");
    const value = body as Record<string, unknown>;
    if (typeof value.userId !== "string" || !/^[0-9a-f-]{36}$/iu.test(value.userId) || typeof value.targetDate !== "string") throw new Error("INVALID_JOB");
    return NextResponse.json({ ok: true, data: await buildDailyBatch(value.userId, value.targetDate) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: { code: error instanceof Error ? error.message : "JOB_FAILED" } }, { status: 400 });
  }
}
