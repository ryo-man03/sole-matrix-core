import type {
  GeminiCapabilityReadiness,
  RecommendationExplanation,
  RecommendationResult,
} from "./types";

export function createGeminiResearchReadiness(
  candidateResearch: RecommendationResult["candidateResearch"],
): GeminiCapabilityReadiness {
  return {
    capability: "candidate_research",
    status: candidateResearch.status,
    detail: candidateResearch.detail,
    reasonCode: candidateResearch.reasonCode,
  };
}

export function createGeminiExplanationReadiness(
  explanation: RecommendationExplanation,
  configured: boolean,
): GeminiCapabilityReadiness {
  if (explanation.source === "gemini") {
    return {
      capability: "explanation",
      status: "ready",
      detail: "推薦理由の補助説明にGeminiを使用しています。最終DecisionはCoreが決定します。",
      reasonCode: null,
    };
  }
  return configured
    ? {
        capability: "explanation",
        status: "fallback",
        detail: "Gemini補助説明を安全に採用できなかったため、rule-based説明を表示しています。",
        reasonCode: null,
      }
    : {
        capability: "explanation",
        status: "not_configured",
        detail: "Geminiは未設定です。推薦理由にはrule-based説明を使用しています。",
        reasonCode: "missing_env",
      };
}

export function isGeminiResearchShowcaseReady(
  result: Pick<RecommendationResult, "candidate" | "candidateResearch" | "readiness" | "balancedScore" | "ryoScore" | "decision">,
): boolean {
  return result.candidateResearch.source === "gemini" &&
    result.candidateResearch.status === "ready" &&
    result.candidateResearch.validCandidateCount > 0 &&
    result.candidate.researchSource === "gemini" &&
    Boolean(result.candidate.evidenceUrls?.length) &&
    result.readiness.geminiResearch.status === "ready" &&
    Number.isFinite(result.balancedScore.total) &&
    Number.isFinite(result.ryoScore.total) &&
    Boolean(result.decision);
}
