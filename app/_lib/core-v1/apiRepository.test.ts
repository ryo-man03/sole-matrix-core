import { POST as postFeedback } from "../../api/core-v1/feedback/route";
import { POST as postRecommendation } from "../../api/core-v1/recommend/route";
import { createRakutenReadiness } from "./readiness";
import { createMockFeedbackRepository } from "./repository";
import { validateFeedbackRequest } from "./validation";

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
    expect(payload.data.readiness.rakuten.status).toBe("missing_config");
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

describe("Rakuten readiness", () => {
  it("reports blocked_forbidden without exposing response data", () => {
    expect(
      createRakutenReadiness(
        {
          RAKUTEN_APPLICATION_ID: "configured",
          RAKUTEN_ACCESS_KEY: "configured",
        },
        "blocked_forbidden",
      ),
    ).toEqual({
      provider: "rakuten",
      status: "blocked_forbidden",
      detail:
        "楽天APIは現在HTTP 403のため、商品データ取得には使っていません。Dashboard / credential / referrer-origin確認が必要です。",
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
