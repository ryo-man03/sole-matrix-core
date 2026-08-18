import { NextResponse } from "next/server";

import { guard, privateUser, unauthenticated } from "../../../../src/application/personalization/routeHelpers";
import { readBoundedJsonBody } from "../../../../src/application/http/requestSecurity";
import { parseClientProductEvent } from "../../../../src/domain/feedback/postPurchase";
import { recordProductEvent } from "../../../../src/infrastructure/repositories/postPurchaseRepository";

export async function POST(request: Request) {
  const mutation = guard(request, "behavior-event");
  if (!mutation.ok) return NextResponse.json({ ok: false, error: { code: mutation.code } }, { status: mutation.status });
  const user = await privateUser();
  if (!user) return unauthenticated();
  try {
    const result = await recordProductEvent(user.id, parseClientProductEvent(await readBoundedJsonBody(request)));
    return NextResponse.json({ ok: true, data: result }, { status: result.recorded && !result.duplicate ? 201 : 200 });
  } catch {
    return NextResponse.json({ ok: false, error: { code: "INVALID_EVENT" } }, { status: 400 });
  }
}
