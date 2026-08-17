import { NextResponse } from "next/server";

import { failure, guard, privateUser, unauthenticated } from "../../../../src/application/personalization/routeHelpers";
import { parsePurchaseReport } from "../../../../src/domain/feedback/postPurchase";
import { createPurchaseReport, listPurchaseReports } from "../../../../src/infrastructure/repositories/postPurchaseRepository";

export async function GET() {
  const user = await privateUser();
  if (!user) return unauthenticated();
  try {
    return NextResponse.json({ ok: true, data: { items: await listPurchaseReports(user.id) } }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const mutation = guard(request, "purchase-report");
  if (!mutation.ok) return NextResponse.json({ ok: false, error: { code: mutation.code } }, { status: mutation.status });
  const user = await privateUser();
  if (!user) return unauthenticated();
  try {
    const result = await createPurchaseReport(user.id, parsePurchaseReport(await request.json()));
    return NextResponse.json({ ok: true, data: result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return failure(error);
  }
}
