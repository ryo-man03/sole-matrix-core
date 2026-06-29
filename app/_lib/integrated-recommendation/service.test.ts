import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { ExplanationInput } from "../core-v1/explanation";
import { createRakutenProviderReadiness } from "../core-v1/rakutenReadiness";
import type { RecommendationExplanation } from "../core-v1/types";
import { createUserMemoryService } from "../user-memory/userMemoryService";
import { recommendIntegratedSneaker } from "./service";
import { validateIntegratedRecommendationRequest } from "./validation";

describe("integrated mode-aware recommendation", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "sole-matrix-integrated-"));
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("integrates analysis, Rakuten query context, Core, mode, and untrusted memory", async () => {
    const memoryService = createUserMemoryService({ rootDir });
    await memoryService.registerUser({ userId: "ryo", displayName: "Ryo" });
    await memoryService.saveFeedback("ryo", {
      sneakerName: "Puma Clyde MIJ",
      mode: "ryo",
      decision: "wait",
      balancedScore: 60,
      ryoScore: 70,
      userRating: 2,
      userComment: "サイズ感が合わなかった",
    });
    const validation = validateIntegratedRecommendationRequest(validRequest());
    expect(validation.ok).toBe(true);
    if (!validation.ok) return;

    let explanationInput: ExplanationInput | undefined;
    const rakutenProvider = vi.fn(async () => ({
      status: "missing_config" as const,
      candidates: [],
      evidence: [],
      readiness: createRakutenProviderReadiness("missing_config"),
      networkAttempted: false,
      responseOk: false,
      shapeValid: false,
    }));
    const result = await recommendIntegratedSneaker(validation.value, {
      userMemoryService: memoryService,
      core: {
        env: {},
        rakutenCandidateProvider: rakutenProvider,
        explanationProvider: async (input) => {
          explanationInput = input;
          return explanation;
        },
      },
    });

    expect(result.modeRecommendation).toMatchObject({ mode: "ryo" });
    expect(result.modeRecommendation.cautions).toContain(
      "過去のfeedback評価が低いため、以前の不満点を購入前に再確認してください。",
    );
    expect(result.analysis.visualAnalysis?.detectedBrand).toBe("Puma");
    expect(result.userContext).toMatchObject({ userId: "ryo", feedbackCount: 1 });
    expect(explanationInput?.userMemoryContext).toMatchObject({
      source: "user_memory",
      trust: "untrusted_user_data",
    });
    expect(rakutenProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        sneakerName: "Puma Clyde MIJ",
        brand: "Puma",
        color: "navy",
        urlNameHint: "Puma Clyde MIJ",
      }),
    );
    const memory = await memoryService.getUserMemory("ryo");
    expect(memory.diagnosisHistoryCount).toBe(1);
  });

  it("rejects tampered analysis scores and unsafe user ids", () => {
    const invalidScore = validRequest();
    invalidScore.analysis.visualAnalysis.uniquenessScore = 999;
    expect(validateIntegratedRecommendationRequest(invalidScore)).toMatchObject({
      ok: false,
      error: { field: "analysis" },
    });

    expect(
      validateIntegratedRecommendationRequest({
        ...validRequest(),
        userId: "../admin",
      }),
    ).toMatchObject({ ok: false, error: { field: "userId" } });
  });
});

function validRequest() {
  return {
    diagnosisAnswers: [
      { questionId: "trusted-classic", value: "like" },
      { questionId: "simple-daily", value: "like" },
    ],
    preferenceTags: [],
    budgetYen: 25_000,
    mode: "ryo",
    userId: "ryo",
    analysis: {
      sneakerName: "Puma Clyde MIJ",
      urlAnalysis: {
        inputUrl: "https://shop.example/clyde",
        finalUrl: "https://shop.example/clyde",
        title: "Puma Clyde MIJ",
        extractedNameHint: "Puma Clyde MIJ",
        confidence: 0.8,
        cautions: [],
      },
      visualAnalysis: {
        detectedBrand: "Puma",
        detectedModelName: "Clyde MIJ",
        mainColors: ["navy"],
        silhouette: "low",
        category: "basketball",
        materialHints: ["suede"],
        vintageScore: 90,
        streetScore: 60,
        cleanScore: 60,
        uniquenessScore: 60,
        culturalContext: ["basketball heritage", "Japanese production"],
        confidence: 0.8,
        cautions: [],
      },
    },
  };
}

const explanation: RecommendationExplanation = {
  source: "rule_based",
  summary: "TypeScriptが確定した結果の説明です。",
  reasons: ["決定論的なscoreを説明しています。"],
  cautions: [],
  balancedView: "Balancedの説明です。",
  ryoView: "Ryoの説明です。",
  finalTone: "balanced",
};
