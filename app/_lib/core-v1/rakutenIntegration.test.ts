import { recommendCoreV1 } from "./service";
import {
  createRakutenProviderReadiness,
  type RakutenProviderStatus,
} from "./rakutenReadiness";
import { mockCandidateRepository } from "./repository";
import type {
  CandidateProfile,
  RecommendationExplanation,
} from "./types";

const input = {
  diagnosisAnswers: [
    { questionId: "trusted-classic", value: "like" as const },
    { questionId: "simple-daily", value: "like" as const },
  ],
  preferenceTags: ["classic" as const, "minimal" as const],
  budgetYen: 20_000,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Core v1 Rakuten candidate integration", () => {
  it("keeps the production default manual and performs no Rakuten request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetcher);

    const result = await recommendCoreV1(input, {
      candidateRepository: mockCandidateRepository,
      explanationProvider: async () => explanation,
      env: {
        RAKUTEN_APPLICATION_ID: "configured-application",
        RAKUTEN_ACCESS_KEY: "configured-access-key",
      },
    });

    expect(result.readiness.rakuten.status).toBe("manual_only");
    expect(result.externalEvidence.listings).toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps normalized Rakuten listings outside Core scoring and Decision", async () => {
    const withRakuten = await recommendCoreV1(input, {
      candidateRepository: mockCandidateRepository,
      rakutenCandidateProvider: async () => providerResult("ready", [rakutenCandidate]),
      explanationProvider: async () => explanation,
      env: {},
    });
    const withoutRakuten = await recommendCoreV1(input, {
      candidateRepository: mockCandidateRepository,
      rakutenCandidateProvider: async () => providerResult("missing_config"),
      explanationProvider: async () => explanation,
      env: {},
    });

    expect(withRakuten.candidate.source).toBe("local");
    expect(withRakuten.readiness.rakuten.status).toBe("ready");
    expect(withRakuten.externalEvidence.listings[0]).toMatchObject({
      provider: "rakuten",
      priceYen: 15_000,
      budgetFitImpact: "none",
      coreDecisionImpact: "none",
    });
    expect(withRakuten.candidate).toEqual(withoutRakuten.candidate);
    expect(withRakuten.balancedScore).toEqual(withoutRakuten.balancedScore);
    expect(withRakuten.ryoScore).toEqual(withoutRakuten.ryoScore);
    expect(withRakuten.decision).toBe(withoutRakuten.decision);
  });

  it.each(["blocked_forbidden", "blocked_rate_limit", "invalid_response"] as const)(
    "keeps local fallback when Rakuten is %s",
    async (status) => {
      const result = await recommendCoreV1(input, {
        candidateRepository: mockCandidateRepository,
        rakutenCandidateProvider: async () => providerResult(status),
        explanationProvider: async () => explanation,
        env: {},
      });

      expect(result.candidate.source).toBe("local");
      expect(result.readiness.rakuten.status).toBe(status);
    },
  );

  it("contains provider exceptions and keeps local fallback", async () => {
    const result = await recommendCoreV1(input, {
      candidateRepository: mockCandidateRepository,
      rakutenCandidateProvider: async () => {
        throw new Error("raw provider detail");
      },
      explanationProvider: async () => explanation,
      env: {},
    });

    expect(result.candidate.source).toBe("local");
    expect(result.readiness.rakuten.status).toBe("network_or_http_error");
    expect(JSON.stringify(result)).not.toContain("raw provider detail");
  });

  it("does not let the explanation provider replace score or Decision", async () => {
    const result = await recommendCoreV1(input, {
      rakutenCandidateProvider: async () => providerResult("missing_config"),
      explanationProvider: async () => ({
        ...explanation,
        summary: "説明だけを返します。",
      }),
      env: {},
    });

    expect(result.explanation.summary).toBe("説明だけを返します。");
    expect(typeof result.balancedScore.total).toBe("number");
    expect(typeof result.ryoScore.total).toBe("number");
    expect(result.decision).toMatch(/strong_buy|consider|wait|avoid|unknown/);
  });
});

const rakutenCandidate: CandidateProfile = {
  id: "rakuten-item-1",
  name: "Classic Sneaker",
  source: "rakuten",
  description: "正規化済み楽天候補",
  tags: ["classic", "minimal"],
  vector: {
    culture: 82,
    styleFit: 82,
    simplicity: 86,
    street: 50,
    volume: 42,
    comfort: 72,
    durability: 70,
    priceLevel: 52,
  },
  budgetFit: 100,
  risk: "low",
  informationCompleteness: 88,
  readiness: "ready_external",
  priceYen: 15_000,
  url: "https://item.rakuten.co.jp/example/classic/",
};

const explanation: RecommendationExplanation = {
  source: "rule_based",
  summary: "Coreが確定した結果の説明です。",
  reasons: ["決定論的なscoreを説明しています。"],
  cautions: [],
  balancedView: "一般的な相性の説明です。",
  ryoView: "個人相性の説明です。",
  finalTone: "balanced",
};

function providerResult(
  status: RakutenProviderStatus,
  candidates: CandidateProfile[] = [],
) {
  const ready = status === "ready";

  return {
    status,
    candidates,
    evidence: candidates.map((candidate) => ({
      kind: "external_listing" as const,
      provider: "rakuten" as const,
      listingName: candidate.name,
      priceYen: candidate.priceYen ?? 0,
      productUrl: candidate.url ?? "https://example.com/",
      confidence: "normalized_listing" as const,
      warnings: ["参考情報"],
      budgetFitImpact: "none" as const,
      coreDecisionImpact: "none" as const,
    })),
    readiness: createRakutenProviderReadiness(status),
    networkAttempted: status !== "missing_config",
    responseOk: ready,
    shapeValid: ready,
  };
}
