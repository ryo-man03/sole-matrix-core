import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type {
  ModeAwareRecommendation,
  RecommendationMode,
  RecommendationResult,
} from "../core-v1/types";
import type { RecommendRequestInput } from "../core-v1/validation";
import type { SneakerVisualAnalysis } from "../image-analysis/types";
import type { SneakerUrlAnalysis } from "../url-analysis/types";

export type RecommendationAnalysisContext = {
  sneakerName?: string;
  urlAnalysis?: SneakerUrlAnalysis;
  visualAnalysis?: SneakerVisualAnalysis;
};

export type IntegratedRecommendationRequest = RecommendRequestInput & {
  mode: RecommendationMode;
  userId?: string;
  analysis?: RecommendationAnalysisContext;
  preferenceTags: SneakerTag[];
};

export type IntegratedRecommendationResult = RecommendationResult & {
  modeRecommendation: ModeAwareRecommendation;
  analysis: RecommendationAnalysisContext;
  userContext?: {
    userId: string;
    displayName: string;
    feedbackCount: number;
  };
  contextCautions: string[];
};
