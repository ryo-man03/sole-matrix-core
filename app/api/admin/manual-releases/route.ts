import { NextResponse } from "next/server";

import { authorizeDataSteward } from "../../../../src/application/admin/authorization";
import { adminRequestId } from "../../../../src/application/admin/request";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";
import { parseManualReleaseDraft } from "../../../../src/domain/admin/manualEntry";
import { createManualReleaseDraft } from "../../../../src/infrastructure/repositories/dataStewardRepository";

export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "admin-manual-release", limit: 15 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const authorization = await authorizeDataSteward();
  if (!authorization.authorized) return denied(authorization.reason);
  try {
    const item = await createManualReleaseDraft(authorization.actorId, parseManualReleaseDraft(await request.json()), adminRequestId(request));
    return NextResponse.json({ ok: true, data: { item, productionWritePerformed: false } }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

function denied(reason: "unauthenticated" | "role_unavailable" | "forbidden") {
  const status = reason === "unauthenticated" ? 401 : reason === "forbidden" ? 403 : 503;
  return NextResponse.json({ ok: false, error: { code: reason.toLocaleUpperCase("en-US") } }, { status });
}

function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "REQUEST_FAILED";
  return NextResponse.json({ ok: false, error: { code } }, { status: code.endsWith("NOT_FOUND") ? 404 : 400 });
}
