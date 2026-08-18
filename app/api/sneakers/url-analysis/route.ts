import { NextResponse } from "next/server";

import { analyzeSneakerUrlSafely } from "../../../../server/services/sneakerUrlService";
import { readBoundedJsonBody, validateMutationRequest } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const mutation = validateMutationRequest(request, { key: "url-analysis", limit: 15 });
  if (!mutation.ok) return NextResponse.json({ ok: false, error: { code: mutation.code } }, { status: mutation.status });
  try {
    const body = await readBoundedJsonBody(request);
    if (!isExactRecord(body, ["url"])) throw new Error("INVALID_INPUT");
    const url = String(body["url"] ?? "");
    const data = await analyzeSneakerUrlSafely(url);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "URL_ANALYSIS_ERROR", message: "商品URLを解析できませんでした。" },
      },
      { status: 400 },
    );
  }
}

function isExactRecord(value: unknown, allowed: readonly string[]): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).every((key) => allowed.includes(key));
}
