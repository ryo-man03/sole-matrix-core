import {
  recommendIntegratedSneaker,
  type IntegratedRecommendationDependencies,
} from "../../app/_lib/integrated-recommendation/service";
import { validateIntegratedRecommendationRequest } from "../../app/_lib/integrated-recommendation/validation";

export function createIntegratedRecommendationHandler(
  dependencies: IntegratedRecommendationDependencies = {},
) {
  return async function handleIntegratedRecommendation(request: Request): Promise<Response> {
    const body = await readJson(request);
    const validation = validateIntegratedRecommendationRequest(body);
    if (!validation.ok) {
      return Response.json({ ok: false, error: validation.error }, { status: 400 });
    }
    try {
      const data = await recommendIntegratedSneaker(validation.value, dependencies);
      return Response.json({ ok: true, data });
    } catch {
      return Response.json(
        {
          ok: false,
          error: {
            code: "RECOMMENDATION_UNAVAILABLE",
            message: "統合推薦を作成できませんでした。入力を確認して再度お試しください。",
          },
        },
        { status: 503 },
      );
    }
  };
}

async function readJson(request: Request): Promise<unknown> {
  try { return (await request.json()) as unknown; } catch { return null; }
}
