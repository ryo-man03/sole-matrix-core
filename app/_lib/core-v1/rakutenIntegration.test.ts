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

describe("Core v1 Rakuten candidate integration", () => {
  it("scores a normalized ready candidate with the TypeScript Core", async () => {
    const result = await recommendCoreV1(input, {
      candidateRepository: { async listCandidates() { return []; } },
      rakutenCandidateProvider: async () => providerResult("ready", [rakutenCandidate]),
      explanationProvider: async () => explanation,
      env: {},
    });

    expect(result.candidate).toMatchObject({
      id: "rakuten-item-1",
      source: "rakuten",
      priceYen: 15_000,
      readiness: "ready_external",
    });
    expect(result.readiness.rakuten.status).toBe("ready");
    expect(result.decision).toMatch(/strong_buy|consider|wait|avoid|unknown/);
    expect(result.balancedScore.total).toBeGreaterThan(0);
    expect(result.ryoScore.total).toBeGreaterThan(0);
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
    readiness: createRakutenProviderReadiness(status),
    networkAttempted: status !== "missing_config",
    responseOk: ready,
    shapeValid: ready,
  };
}
