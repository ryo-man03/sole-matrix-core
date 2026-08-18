import {
  recommendCoreV1,
  type RecommendCoreV1Dependencies,
  validateRecommendRequest,
} from "../services/recommendationService";
import { readBoundedJsonBody } from "../../src/application/http/requestSecurity";

export function createRecommendationHandler(
  dependencies: RecommendCoreV1Dependencies = {},
) {
  return async function handleRecommendation(request: Request): Promise<Response> {
    const body = await readJson(request);
    const validation = validateRecommendRequest(body);
    if (!validation.ok) {
      return Response.json(
        { ok: false, error: validation.error },
        { status: 400 },
      );
    }

    try {
      const data = await recommendCoreV1(validation.value, dependencies);
      return Response.json({ ok: true, data });
    } catch {
      return Response.json(
        {
          ok: false,
          error: {
            code: "RECOMMENDATION_UNAVAILABLE",
            message: "推薦結果を作成できませんでした。時間をおいて再度お試しください。",
          },
        },
        { status: 503 },
      );
    }
  };
}

async function readJson(request: Request): Promise<unknown> {
  try { return await readBoundedJsonBody(request); } catch { return null; }
}
