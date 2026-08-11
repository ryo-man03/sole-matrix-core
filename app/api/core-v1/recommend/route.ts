import {
  createRecommendationHandler,
} from "../../../../server/routes/recommendations";
import type { RecommendCoreV1Dependencies } from "../../../_lib/core-v1/service";
import { persistRecommendationSoftly } from "../../../../src/application/recommendation-history/persistSnapshot";

const coreHandler = createRecommendHandler();
export async function POST(request: Request) {
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
