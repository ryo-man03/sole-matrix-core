import {
  recommendCoreV1,
  type RecommendCoreV1Dependencies,
} from "../../../_lib/core-v1/service";
import { validateRecommendRequest } from "../../../_lib/core-v1/validation";

export const POST = createRecommendHandler();

export function createRecommendHandler(
  dependencies: RecommendCoreV1Dependencies = {},
) {
  return async function handleRecommend(request: Request): Promise<Response> {
    const body = await readJson(request);
    const validation = validateRecommendRequest(body);

    if (!validation.ok) {
      return Response.json(
        { ok: false, error: validation.error },
        { status: 400 },
      );
    }

    try {
      const recommendation = await recommendCoreV1(
        validation.value,
        dependencies,
      );

      return Response.json({ ok: true, data: recommendation });
    } catch {
      return Response.json(
        {
          ok: false,
          error: {
            code: "RECOMMENDATION_UNAVAILABLE",
            message:
              "推薦結果を作成できませんでした。時間をおいて再度お試しください。",
          },
        },
        { status: 503 },
      );
    }
  };
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
