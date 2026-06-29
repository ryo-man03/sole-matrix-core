import {
  formatAllInOneSmokeResult,
  runGeminiImageSmoke,
  runRecommendationApiSmoke,
} from "./allInOneSmoke";

describe("all-in-one external smoke", () => {
  it("does not run image network smoke without explicit opt-in", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await runGeminiImageSmoke({
      env: { GEMINI_API_KEY: "configured" },
      fetcher,
    });
    expect(result.status).toBe("skipped_external_smoke");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not run recommendation smoke without explicit opt-in", async () => {
    const result = await runRecommendationApiSmoke({ env: {} });
    expect(result.status).toBe("skipped_external_smoke");
  });

  it("runs real image and recommendation smoke only under RUN_EXTERNAL_SMOKE", async () => {
    const imageResult = await runGeminiImageSmoke();
    const recommendationResult = await runRecommendationApiSmoke();
    console.info(formatAllInOneSmokeResult(imageResult));
    console.info(formatAllInOneSmokeResult(recommendationResult));

    if (process.env.RUN_EXTERNAL_SMOKE !== "1") {
      expect(imageResult.status).toBe("skipped_external_smoke");
      expect(recommendationResult.status).toBe("skipped_external_smoke");
      return;
    }
    if (!process.env.GEMINI_API_KEY?.trim()) {
      expect(imageResult.status).toBe("missing_env");
    } else {
      expect(["ok", "fallback"]).toContain(imageResult.status);
      expect(imageResult.networkAttempted).toBe(true);
      expect(imageResult.shapeValid).toBe(true);
    }
    expect(recommendationResult).toMatchObject({
      status: "ok",
      responseOk: true,
      shapeValid: true,
      decisionSource: "typescript",
    });
  }, 30_000);
});
