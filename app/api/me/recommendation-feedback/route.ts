import { NextResponse } from "next/server";
import { canonicalSneakerKey } from "../../../../src/domain/identity/canonicalSneaker";
import { saveRecommendationFeedback } from "../../../../src/infrastructure/repositories/recommendationHistoryRepository";
import { failure, guard, privateUser, unauthenticated, validUuid } from "../../../../src/application/personalization/routeHelpers";
import { readBoundedJsonBody } from "../../../../src/application/http/requestSecurity";

export async function POST(request: Request) {
  const mutationGuard = guard(request, "recommendation-feedback");
  if (!mutationGuard.ok) return NextResponse.json({ ok: false }, { status: mutationGuard.status });
  const user = await privateUser();
  if (!user) return unauthenticated();

  try {
    const body: unknown = await readBoundedJsonBody(request);
    if (!isRecord(body) || Object.keys(body).some((key) => !["snapshotId", "sentiment", "reasonCodes", "comment", "sneaker"].includes(key))) {
      throw new Error("INVALID_FEEDBACK");
    }
    if (
      typeof body.snapshotId !== "string"
      || !validUuid(body.snapshotId)
      || !["liked", "disliked", "saved", "hidden", "purchased"].includes(String(body.sentiment))
      || !Array.isArray(body.reasonCodes)
      || body.reasonCodes.length > 10
      || !isRecord(body.sneaker)
      || Object.keys(body.sneaker).some((key) => !["brand", "modelName", "modelFamily", "generation", "styleCode", "audience"].includes(key))
    ) {
      throw new Error("INVALID_FEEDBACK");
    }

    const sneaker = body.sneaker;
    const canonicalKey = canonicalSneakerKey({
      brand: String(sneaker.brand ?? ""),
      modelName: String(sneaker.modelName ?? ""),
      modelFamily: typeof sneaker.modelFamily === "string" ? sneaker.modelFamily : null,
      generation: typeof sneaker.generation === "string" ? sneaker.generation : null,
      styleCode: typeof sneaker.styleCode === "string" ? sneaker.styleCode : null,
      audience: (sneaker.audience ?? "unknown") as never,
    });
    const result = await saveRecommendationFeedback(user.id, {
      snapshotId: body.snapshotId,
      canonicalKey,
      sentiment: String(body.sentiment),
      reasonCodes: body.reasonCodes.filter((value): value is string => typeof value === "string").slice(0, 10),
      comment: typeof body.comment === "string" ? body.comment.slice(0, 500) : null,
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SNAPSHOT_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: { code: "NOT_FOUND" } }, { status: 404 });
    }
    return failure(error);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
