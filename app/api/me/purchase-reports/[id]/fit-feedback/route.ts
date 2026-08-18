import { NextResponse } from "next/server";

import { failure, guard, privateUser, unauthenticated, validUuid } from "../../../../../../src/application/personalization/routeHelpers";
import { parseFitFeedback } from "../../../../../../src/domain/feedback/postPurchase";
import { createFitFeedback } from "../../../../../../src/infrastructure/repositories/postPurchaseRepository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const mutation = guard(request, "fit-feedback");
  if (!mutation.ok) return NextResponse.json({ ok: false, error: { code: mutation.code } }, { status: mutation.status });
  const user = await privateUser();
  if (!user) return unauthenticated();
  const { id } = await context.params;
  if (!validUuid(id)) return NextResponse.json({ ok: false, error: { code: "INVALID_PURCHASE" } }, { status: 400 });
  try {
    const result = await createFitFeedback(user.id, id, parseFitFeedback(await request.json()));
    return NextResponse.json({
      ok: true,
      data: {
        ...result,
        message: result.preferenceProfileUpdated ? "Preference Profileを更新しました" : "フィット感を保存しました",
      },
    }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return failure(error);
  }
}
