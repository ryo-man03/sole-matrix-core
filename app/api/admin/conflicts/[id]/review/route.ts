import { NextResponse } from "next/server";

import { authorizeDataSteward } from "../../../../../../src/application/admin/authorization";
import { adminRequestId } from "../../../../../../src/application/admin/request";
import { validateMutationRequest } from "../../../../../../src/application/http/requestSecurity";
import { parseConflictReview } from "../../../../../../src/domain/admin/manualEntry";
import { reviewReleaseConflict } from "../../../../../../src/infrastructure/repositories/dataStewardRepository";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = validateMutationRequest(request, { key: "admin-conflict-review", limit: 30 });
  if (!guard.ok) return NextResponse.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const authorization = await authorizeDataSteward();
  if (!authorization.authorized) return NextResponse.json({ ok: false, error: { code: authorization.reason.toLocaleUpperCase("en-US") } }, { status: authorization.reason === "unauthenticated" ? 401 : authorization.reason === "forbidden" ? 403 : 503 });
  const { id } = await context.params;
  if (!uuid(id)) return NextResponse.json({ ok: false, error: { code: "INVALID_CONFLICT" } }, { status: 400 });
  try {
    const input = parseConflictReview(await request.json());
    const item = await reviewReleaseConflict(authorization.actorId, id, input.status, input.resolutionNote!, adminRequestId(request));
    return NextResponse.json({ ok: true, data: { item } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "REQUEST_FAILED";
    return NextResponse.json({ ok: false, error: { code } }, { status: code.endsWith("NOT_FOUND") ? 404 : 400 });
  }
}

function uuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value); }
