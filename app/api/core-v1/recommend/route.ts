import {
  createRecommendationHandler,
} from "../../../../server/routes/recommendations";
import type { RecommendCoreV1Dependencies } from "../../../_lib/core-v1/service";

export const POST = createRecommendHandler();

export function createRecommendHandler(
  dependencies: RecommendCoreV1Dependencies = {},
) {
  return createRecommendationHandler(dependencies);
}
