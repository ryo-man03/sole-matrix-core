import { sneakerFallbackCatalog } from "../ai/sneaker-fallback-catalog";
import type { CandidateProfile, FeedbackInput } from "./types";

export type CandidateRepository = {
  listCandidates(input: { budgetYen?: number }): Promise<CandidateProfile[]>;
};

export type FeedbackRepository = {
  saveFeedback(input: FeedbackInput): Promise<{ ok: true } | { ok: false; error: string }>;
};

export const mockCandidateRepository: CandidateRepository = {
  async listCandidates(input) {
    return sneakerFallbackCatalog.map((candidate) => ({
      id: `fallback-${candidate.id}`,
      name: candidate.modelName,
      source: "local" as const,
      description: candidate.reason,
      tags: [...candidate.tags],
      vector: { ...candidate.vector },
      budgetFit: calculateLocalBudgetFit(input.budgetYen, candidate.vector.priceLevel),
      risk: candidate.risk,
      informationCompleteness: candidate.informationCompleteness,
      readiness: "ready_local" as const,
      modelType: candidate.modelType,
      searchKeywords: [...candidate.searchKeywords],
      evidenceUrls: [...candidate.evidenceUrls],
      researchReason: candidate.reason,
      researchCautions: [...candidate.cautions],
      researchSource: "fallback_catalog" as const,
    }));
  },
};

export function createMockFeedbackRepository(): FeedbackRepository & { getSavedFeedback(): FeedbackInput[] } {
  const savedFeedback: FeedbackInput[] = [];
  return {
    async saveFeedback(input) { savedFeedback.push({ ...input }); return { ok: true }; },
    getSavedFeedback() { return savedFeedback.map((input) => ({ ...input })); },
  };
}

export function calculateLocalBudgetFit(
  budgetYen: number | undefined,
  candidatePriceLevel: number,
): number {
  if (budgetYen === undefined) return 65;
  const budgetLevel = clampScore(((budgetYen - 5_000) / 30_000) * 100);
  return budgetLevel >= candidatePriceLevel
    ? 100
    : Math.round((budgetLevel / Math.max(candidatePriceLevel, 1)) * 100);
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
