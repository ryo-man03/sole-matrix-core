import { NextResponse } from "next/server";

import { authorizeDataSteward } from "../../../../../src/application/admin/authorization";
import { CSV_IMPORT_MAX_BYTES, previewStewardCsv } from "../../../../../src/application/admin/csvPreview";
import { validateMutationRequest } from "../../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "admin-csv-preview", limit: 10, bodyRequired: false });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  if (!(request.headers.get("content-type") ?? "").toLocaleLowerCase("en-US").startsWith("text/csv")) return NextResponse.json({ ok: false, error: { code: "CSV_REQUIRED" } }, { status: 415 });
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > CSV_IMPORT_MAX_BYTES) return NextResponse.json({ ok: false, error: { code: "CSV_TOO_LARGE" } }, { status: 413 });
  const authorization = await authorizeDataSteward();
  if (!authorization.authorized) return NextResponse.json({ ok: false, error: { code: authorization.reason.toLocaleUpperCase("en-US") } }, { status: authorization.reason === "unauthenticated" ? 401 : authorization.reason === "forbidden" ? 403 : 503 });
  try {
    const bytes = new Uint8Array(await request.arrayBuffer());
    const result = previewStewardCsv(bytes);
    return NextResponse.json({ ok: true, data: result }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_CSV";
    return NextResponse.json({ ok: false, error: { code } }, { status: code === "CSV_TOO_LARGE" || code === "CSV_TOO_MANY_ROWS" ? 413 : 400 });
  }
}
