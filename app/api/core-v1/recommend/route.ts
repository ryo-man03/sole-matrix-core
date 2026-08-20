import {
  createRecommendationHandler,
} from "../../../../server/routes/recommendations";
import type { RecommendCoreV1Dependencies } from "../../../_lib/core-v1/service";
import { persistRecommendationSoftly } from "../../../../src/application/recommendation-history/persistSnapshot";
import { validateMutationRequest } from "../../../../src/application/http/requestSecurity";

const coreHandler = createRecommendHandler();
export async function POST(request: Request) {
  const guard = validateMutationRequest(request, { key: "core-recommend", limit: 30 });
  if (!guard.ok) return Response.json({ ok: false, error: { code: guard.code } }, { status: guard.status });
  const input = await request.clone().json().catch(() => ({})) as Record<string, unknown>;
  const response = await coreHandler(request);
  if (response.ok) {
    const payload = await response.clone().json().catch(() => null) as { data?: Record<string, unknown> } | null;
    if (payload?.data) void persistRecommendationSoftly(input, payload.data);
  }
  return response;
}

export function createRecommendHandler(
  dependencies: RecommendCoreV1Dependencies = {},
) {
  return createRecommendationHandler(dependencies);
}
