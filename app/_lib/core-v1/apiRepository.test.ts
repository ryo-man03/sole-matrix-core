import { POST as postFeedback } from "../../api/core-v1/feedback/route";
import { createRecommendHandler } from "../../api/core-v1/recommend/route";
import { createMockFeedbackRepository } from "./repository";
import { validateFeedbackRequest } from "./validation";

const postRecommendation = createRecommendHandler({ env: {} });

describe("Core v1 recommend API", () => {
  it("returns a safe validation error", async () => {
    const response = await postRecommendation(
      jsonRequest("http://localhost/api/core-v1/recommend", {}),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容を確認してください。",
        field: "diagnosisAnswers",
      },
    });
  });

  it("returns a recommendation using a local candidate", async () => {
    const response = await postRecommendation(
      jsonRequest("http://localhost/api/core-v1/recommend", {
        diagnosisAnswers: {
          "trusted-classic": "like",
          "simple-daily": "like",
          "walking-comfort": "like",
        },
        preferenceTags: ["classic", "minimal"],
        budgetYen: 20_000,
      }),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        candidate: { source: string };
        decision: string;
        explanation: { source: string };
        readiness: { rakuten: { status: string } };
      };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.candidate.source).toBe("local");
    expect(payload.data.decision).toMatch(/strong_buy|consider|wait|avoid|unknown/);
    expect(payload.data.explanation.source).toBe("rule_based");
    expect(payload.data.readiness.rakuten.status).toBe("manual_only");
  });

  it("validates and applies the 11-question Ryo Mode payload", async () => {
    const response = await postRecommendation(
      jsonRequest("http://localhost/api/core-v1/recommend", {
        diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }],
        preferenceTags: ["classic", "basketball", "low_tech"],
        mode: "ryo",
        ryoModeAnswers: {
          pantsFit: "work_pants",
          sportOrigin: "basketball",
          materialAging: "leather_sinking",
          color: "black_white",
          ryoStrength: "ryo_strong",
        },
        purchasePurpose: "second_pair",
        ownedModels: ["PUMA Suede"],
        dislikedModels: ["Nike Air Force 1 Low"],
        dislikedSignals: ["真っ白"],
      }),
    );
    const payload = (await response.json()) as {
      ok: boolean;
      data: {
        candidate: { ryoMetadata?: { recommendationBucket?: string; ryoSignature?: { bucket: string } } };
        ryoReranking: {
          applied: boolean;
          strength: string;
          selectedBucket?: string;
          selectedRyoSignature?: { bucket: string; reasons: string[] };
          selectedScoreBreakdownV2?: {
            userFitScore: number;
            ryoIdentityScore: number;
            practicalFitScore: number;
            explorationScore: number;
            contextPenalty: number;
            finalRecommendationScore: number;
          };
          strengthBlend?: {
            userFit: number;
            ryoIdentity: number;
            practicalFit: number;
            exploration: number;
          };
        };
      };
    };
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.ryoReranking).toMatchObject({ applied: true, strength: "strong" });
    expect(payload.data.ryoReranking.selectedBucket).toMatch(/anchor_classic|ryo_signature|adjacent_discovery|practical_buy|wildcard/);
    expect(payload.data.ryoReranking.selectedRyoSignature?.bucket).toBe(payload.data.ryoReranking.selectedBucket);
    expect(payload.data.ryoReranking.selectedScoreBreakdownV2).toMatchObject({
      userFitScore: expect.any(Number),
      ryoIdentityScore: expect.any(Number),
      practicalFitScore: expect.any(Number),
      explorationScore: expect.any(Number),
      contextPenalty: expect.any(Number),
      finalRecommendationScore: expect.any(Number),
    });
    expect(payload.data.ryoReranking.strengthBlend).toEqual({
      userFit: 0.28,
      ryoIdentity: 0.38,
      practicalFit: 0.1,
      exploration: 0.24,
    });
    expect(payload.data.candidate.ryoMetadata?.recommendationBucket).toBe(payload.data.ryoReranking.selectedBucket);

    const invalid = await postRecommendation(
      jsonRequest("http://localhost/api/core-v1/recommend", {
        diagnosisAnswers: [{ questionId: "trusted-classic", value: "like" }],
        preferenceTags: ["classic"],
        ryoModeAnswers: { pantsFit: "not-an-option" },
      }),
    );
    expect(invalid.status).toBe(400);
  });
});

describe("Core v1 feedback API and repository", () => {
  it("validates feedback input", () => {
    expect(validateFeedbackRequest({ recommendationId: "x" }).ok).toBe(false);
    expect(
      validateFeedbackRequest({
        recommendationId: "x",
        sentiment: "helpful",
        comment: "役に立った",
      }).ok,
    ).toBe(true);
  });

  it("saves feedback in the mock repository", async () => {
    const repository = createMockFeedbackRepository();
    const input = {
      recommendationId: "core-v1:test",
      sentiment: "helpful" as const,
      createdAt: "2026-06-27T00:00:00.000Z",
    };

    await expect(repository.saveFeedback(input)).resolves.toEqual({ ok: true });
    expect(repository.getSavedFeedback()).toEqual([input]);
  });

  it("returns validation errors and mock-save success", async () => {
    const invalidResponse = await postFeedback(
      jsonRequest("http://localhost/api/core-v1/feedback", {}),
    );
    const validResponse = await postFeedback(
      jsonRequest("http://localhost/api/core-v1/feedback", {
        recommendationId: "core-v1:test",
        sentiment: "helpful",
      }),
    );

    expect(invalidResponse.status).toBe(400);
    expect(validResponse.status).toBe(200);
    await expect(validResponse.json()).resolves.toEqual({
      ok: true,
      data: { saved: true, repository: "mock" },
    });
  });
});

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
