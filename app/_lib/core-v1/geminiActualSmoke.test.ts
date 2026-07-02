import {
  formatGeminiActualSmokeResult,
  runGeminiActualGenerationSmoke,
} from "./geminiActualSmoke";

describe("Gemini actual generation smoke", () => {
  it("does not call the network without explicit opt-in", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await runGeminiActualGenerationSmoke({
      env: { GEMINI_API_KEY: "configured" },
      fetcher,
    });

    expect(result.status).toBe("skipped_external_smoke");
    expect(result.networkAttempted).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports missing_env safely", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await runGeminiActualGenerationSmoke({
      env: { RUN_EXTERNAL_SMOKE: "1" },
      fetcher,
    });

    expect(result).toMatchObject({
      provider: "gemini",
      status: "missing_env",
      networkAttempted: false,
      shapeValid: false,
      decisionSource: "typescript",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("validates structured generation without accepting a Gemini Decision", async () => {
    const result = await runGeminiActualGenerationSmoke({
      env: {
        RUN_EXTERNAL_SMOKE: "1",
        GEMINI_API_KEY: "configured",
      },
      fetcher: vi.fn(async () =>
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "日常に合わせやすい候補です。",
                      reasons: ["診断結果との相性が良好です。"],
                      cautions: [],
                      balancedView: "一般的な使いやすさがあります。",
                      ryoView: "クラシック志向と相性があります。",
                      finalTone: "balanced",
                      decision: "avoid",
                    }),
                  },
                ],
              },
            },
          ],
        }),
      ),
    });

    expect(result).toMatchObject({
      status: "ok",
      networkAttempted: true,
      shapeValid: true,
      summaryNonEmpty: true,
      reasonsCount: 2,
      cautionsIsArray: true,
      source: "gemini",
      decisionSource: "typescript",
    });
    expect(result.decision).not.toBe("avoid");
  });

  it("falls back safely when the request fails", async () => {
    const result = await runGeminiActualGenerationSmoke({
      env: {
        RUN_EXTERNAL_SMOKE: "1",
        GEMINI_API_KEY: "configured",
      },
      fetcher: vi.fn(async () => {
        throw new Error("raw network detail");
      }),
    });
    const output = formatGeminiActualSmokeResult(result);

    expect(result).toMatchObject({
      status: "network_error",
      networkAttempted: true,
      source: "rule_based",
      fallback: "rule_based",
      decisionSource: "typescript",
    });
    expect(output).not.toContain("raw network detail");
  });

  it("runs the real API only when this test command explicitly opts in", async () => {
    const result = await runGeminiActualGenerationSmoke();
    const output = formatGeminiActualSmokeResult(result);

    console.info(output);

    if (process.env.RUN_EXTERNAL_SMOKE !== "1") {
      expect(result.status).toBe("skipped_external_smoke");
    } else if (!process.env.GEMINI_API_KEY?.trim()) {
      expect(result.status).toBe("missing_env");
    } else {
      expect(result).toMatchObject({
        status: "ok",
        networkAttempted: true,
        shapeValid: true,
        summaryNonEmpty: true,
        cautionsIsArray: true,
        source: "gemini",
        decisionSource: "typescript",
      });
      expect(result.reasonsCount).toBeGreaterThanOrEqual(1);
    }
  }, 30_000);
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
