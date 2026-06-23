import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { runGeminiIsolatedSmoke } from "./geminiSmoke";
import { classifyExternalSmokeReadiness } from "./readiness";
import {
  isGeminiGenerateContentResponse,
  isRakutenItemSearchResponse,
} from "./responseValidators";
import { runRakutenIsolatedSmoke } from "./rakutenSmoke";
import {
  formatExternalSmokeStatusSummary,
  printExternalSmokeStatusSummary,
  runGeminiIsolatedSmokeStatusReport,
  runRakutenIsolatedSmokeStatusReport,
  summarizeExternalSmokeResult,
} from "./statusReport";

describe("external smoke readiness", () => {
  it("classifies missing environment variables before the opt-in flag", () => {
    expect(
      classifyExternalSmokeReadiness({
        provider: "gemini",
        env: {},
        requiredEnvVars: ["GEMINI_API_KEY"],
        endpointContractAvailable: true,
      })
    ).toEqual({
      provider: "gemini",
      status: "missing_env",
      missingEnvVars: ["GEMINI_API_KEY"],
    });
  });

  it("classifies configured credentials without opt-in as skipped", () => {
    expect(
      classifyExternalSmokeReadiness({
        provider: "rakuten",
        env: {
          RAKUTEN_APPLICATION_ID: "application-id",
          RAKUTEN_ACCESS_KEY: "access-key",
        },
        requiredEnvVars: ["RAKUTEN_APPLICATION_ID", "RAKUTEN_ACCESS_KEY"],
        endpointContractAvailable: true,
      })
    ).toEqual({
      provider: "rakuten",
      status: "skipped_external_smoke",
    });
  });

  it("blocks opted-in communication without a confirmed endpoint contract", () => {
    expect(
      classifyExternalSmokeReadiness({
        provider: "gemini",
        env: {
          GEMINI_API_KEY: "secret",
          RUN_EXTERNAL_SMOKE: "1",
        },
        requiredEnvVars: ["GEMINI_API_KEY"],
        endpointContractAvailable: false,
      })
    ).toEqual({
      provider: "gemini",
      status: "blocked_missing_endpoint_contract",
    });
  });
});

describe("external response shape validators", () => {
  it("validates a Gemini generateContent fixture", () => {
    expect(
      isGeminiGenerateContentResponse({
        candidates: [{ content: { parts: [{ text: "smoke-ok" }] } }],
      })
    ).toBe(true);
    expect(isGeminiGenerateContentResponse({ candidates: [] })).toBe(false);
  });

  it("validates a Rakuten formatVersion=2 item search fixture", () => {
    expect(
      isRakutenItemSearchResponse({
        items: [
          {
            itemName: "Smoke Sneaker",
            itemPrice: 12_000,
            itemUrl: "https://example.test/item",
          },
        ],
      })
    ).toBe(true);
    expect(
      isRakutenItemSearchResponse({
        items: [{ itemName: "Missing fields" }],
      })
    ).toBe(false);
  });
});

describe("external smoke isolation", () => {
  it("does not import Core input, recommendSneakers, or Result UI", () => {
    const sources = ["geminiSmoke.ts", "rakutenSmoke.ts"].map((fileName) =>
      readFileSync(new URL(fileName, import.meta.url), "utf8")
    );

    for (const source of sources) {
      expect(source).not.toMatch(
        /buildCoreInput|RecommendSneakersInput|recommendSneakers/
      );
      expect(source).not.toMatch(/React|ResultUI|ResultList|ResultDetail/);
    }
  });
});

describe("Gemini isolated smoke", () => {
  it("runs the environment-gated smoke entrypoint", async () => {
    const result = await runGeminiIsolatedSmokeStatusReport();
    printExternalSmokeStatusSummary("Gemini", result);

    if (!process.env.GEMINI_API_KEY?.trim()) {
      expect(result.status).toBe("missing_env");
    } else if (process.env.RUN_EXTERNAL_SMOKE !== "1") {
      expect(result.status).toBe("skipped_external_smoke");
    } else {
      expect([
        "ok",
        "network_error",
        "invalid_response_shape",
      ]).toContain(result.status);
    }
    expect(result.provider).toBe("gemini");
    expect(typeof result.networkAttempted).toBe("boolean");
    expect(typeof result.shapeValid).toBe("boolean");
  });

  it("returns missing_env without calling fetch", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      runGeminiIsolatedSmoke({ env: {}, fetcher })
    ).resolves.toEqual({
      provider: "gemini",
      status: "missing_env",
      missingEnvVars: ["GEMINI_API_KEY"],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns skipped_external_smoke without calling fetch", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      runGeminiIsolatedSmoke({
        env: { GEMINI_API_KEY: "secret" },
        fetcher,
      })
    ).resolves.toEqual({
      provider: "gemini",
      status: "skipped_external_smoke",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses fake fetch only after explicit opt-in", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "smoke-ok" }] } }],
        }),
        { status: 200 }
      )
    );

    await expect(
      runGeminiIsolatedSmoke({
        env: {
          GEMINI_API_KEY: "secret",
          RUN_EXTERNAL_SMOKE: "1",
        },
        fetcher,
      })
    ).resolves.toEqual({ provider: "gemini", status: "ok" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("classifies an invalid fake response without exposing it to Core", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ candidates: [] })));

    await expect(
      runGeminiIsolatedSmoke({
        env: {
          GEMINI_API_KEY: "secret",
          RUN_EXTERNAL_SMOKE: "1",
        },
        fetcher,
      })
    ).resolves.toEqual({
      provider: "gemini",
      status: "invalid_response_shape",
    });
  });
});

describe("Rakuten isolated smoke", () => {
  it("runs the environment-gated smoke entrypoint", async () => {
    const result = await runRakutenIsolatedSmokeStatusReport();
    printExternalSmokeStatusSummary("Rakuten", result);
    const hasCredentials =
      Boolean(process.env.RAKUTEN_APPLICATION_ID?.trim()) &&
      Boolean(process.env.RAKUTEN_ACCESS_KEY?.trim());

    if (!hasCredentials) {
      expect(result.status).toBe("missing_env");
    } else if (process.env.RUN_EXTERNAL_SMOKE !== "1") {
      expect(result.status).toBe("skipped_external_smoke");
    } else {
      expect([
        "ok",
        "network_error",
        "invalid_response_shape",
      ]).toContain(result.status);
    }
    expect(result.provider).toBe("rakuten");
    expect(typeof result.networkAttempted).toBe("boolean");
    expect(typeof result.shapeValid).toBe("boolean");
  });

  it("returns missing_env without calling fetch", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      runRakutenIsolatedSmoke({ env: {}, fetcher })
    ).resolves.toEqual({
      provider: "rakuten",
      status: "missing_env",
      missingEnvVars: ["RAKUTEN_APPLICATION_ID", "RAKUTEN_ACCESS_KEY"],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns skipped_external_smoke without calling fetch", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      runRakutenIsolatedSmoke({
        env: {
          RAKUTEN_APPLICATION_ID: "application-id",
          RAKUTEN_ACCESS_KEY: "access-key",
        },
        fetcher,
      })
    ).resolves.toEqual({
      provider: "rakuten",
      status: "skipped_external_smoke",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses fake fetch only after explicit opt-in", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              itemName: "Smoke Sneaker",
              itemPrice: 12_000,
              itemUrl: "https://example.test/item",
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(
      runRakutenIsolatedSmoke({
        env: {
          RAKUTEN_APPLICATION_ID: "application-id",
          RAKUTEN_ACCESS_KEY: "access-key",
          RUN_EXTERNAL_SMOKE: "1",
        },
        fetcher,
      })
    ).resolves.toEqual({
      provider: "rakuten",
      status: "ok",
      diagnostic: {
        provider: "rakuten",
        phase: "shape_validation",
        networkAttempted: true,
        httpStatus: 200,
        responseOk: true,
      },
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("classifies a fetch throw without retaining the thrown error", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("credential-like-sensitive-text"));

    const result = await runRakutenIsolatedSmoke({
      env: rakutenOptInEnv(),
      fetcher,
    });

    expect(result).toEqual({
      provider: "rakuten",
      status: "network_error",
      diagnostic: {
        provider: "rakuten",
        phase: "fetch_throw",
        networkAttempted: true,
        errorKind: "fetch_throw",
      },
    });
    expect(JSON.stringify(result)).not.toContain("credential-like-sensitive-text");
  });

  it.each([
    [400, "http_400"],
    [401, "http_401"],
    [403, "http_403"],
    [404, "http_404"],
    [429, "http_429"],
    [500, "http_5xx"],
  ] as const)("classifies HTTP %i safely", async (status, errorKind) => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("credential-like-sensitive-response", { status })
      );

    const result = await runRakutenIsolatedSmoke({
      env: rakutenOptInEnv(),
      fetcher,
    });

    expect(result).toEqual({
      provider: "rakuten",
      status: "network_error",
      diagnostic: {
        provider: "rakuten",
        phase: "http_response",
        networkAttempted: true,
        httpStatus: status,
        responseOk: false,
        errorKind,
      },
    });
    expect(JSON.stringify(result)).not.toContain(
      "credential-like-sensitive-response"
    );
  });

  it("classifies invalid JSON without retaining the response body", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not-json-and-sensitive"));

    const result = await runRakutenIsolatedSmoke({
      env: rakutenOptInEnv(),
      fetcher,
    });

    expect(result.diagnostic).toEqual({
      provider: "rakuten",
      phase: "json_parse",
      networkAttempted: true,
      httpStatus: 200,
      responseOk: true,
      errorKind: "json_parse_error",
    });
    expect(JSON.stringify(result)).not.toContain("not-json-and-sensitive");
  });

  it("classifies an invalid fake response without exposing it to Core", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ items: [{}] })));

    await expect(
      runRakutenIsolatedSmoke({
        env: rakutenOptInEnv(),
        fetcher,
      })
    ).resolves.toEqual({
      provider: "rakuten",
      status: "invalid_response_shape",
      diagnostic: {
        provider: "rakuten",
        phase: "shape_validation",
        networkAttempted: true,
        httpStatus: 200,
        responseOk: true,
        errorKind: "invalid_response_shape",
      },
    });
  });

  it("builds only the expected Rakuten endpoint and parameter names", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = input instanceof URL ? input : new URL(input.toString());

      expect(url.origin).toBe("https://openapi.rakuten.co.jp");
      expect(url.pathname).toBe(
        "/ichibams/api/IchibaItem/Search/20260401"
      );
      expect([...url.searchParams.keys()].sort()).toEqual(
        ["applicationId", "elements", "formatVersion", "hits", "keyword"].sort()
      );

      return new Response(JSON.stringify({ items: [{}] }));
    });

    await runRakutenIsolatedSmoke({
      env: rakutenOptInEnv(),
      fetcher,
    });
  });

  it("classifies URL construction failure before network access", async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      runRakutenIsolatedSmoke({
        env: rakutenOptInEnv(),
        fetcher,
        endpoint: "not a url",
      })
    ).resolves.toEqual({
      provider: "rakuten",
      status: "network_error",
      diagnostic: {
        provider: "rakuten",
        phase: "url_build",
        networkAttempted: false,
        errorKind: "url_build_error",
      },
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("external smoke status report", () => {
  it("evaluates Gemini credentials independently from Rakuten credentials", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const summary = await runGeminiIsolatedSmokeStatusReport({
      env: {
        RAKUTEN_APPLICATION_ID: "application-id",
        RAKUTEN_ACCESS_KEY: "access-key",
        RUN_EXTERNAL_SMOKE: "1",
      },
      fetcher,
    });

    expect(summary.status).toBe("missing_env");
    expect(summary.networkAttempted).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("evaluates Rakuten credentials independently from Gemini credentials", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const summary = await runRakutenIsolatedSmokeStatusReport({
      env: {
        GEMINI_API_KEY: "credential-placeholder",
        RUN_EXTERNAL_SMOKE: "1",
      },
      fetcher,
    });

    expect(summary.status).toBe("missing_env");
    expect(summary.networkAttempted).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("summarizes readiness without carrying credential metadata", () => {
    const summary = summarizeExternalSmokeResult({
      provider: "gemini",
      status: "missing_env",
      missingEnvVars: ["GEMINI_API_KEY"],
    });

    expect(summary).toEqual({
      provider: "gemini",
      status: "missing_env",
      networkAttempted: false,
      shapeValid: false,
    });
    expect(JSON.stringify(summary)).not.toContain("GEMINI_API_KEY");
  });

  it("reports only a sanitized error kind after a failed attempt", () => {
    const summary = summarizeExternalSmokeResult({
      provider: "rakuten",
      status: "network_error",
    });

    expect(summary).toEqual({
      provider: "rakuten",
      status: "network_error",
      networkAttempted: true,
      shapeValid: false,
      errorKind: "network_error",
    });
  });

  it("formats only the approved status summary fields", () => {
    const output = formatExternalSmokeStatusSummary("Gemini", {
      provider: "gemini",
      status: "invalid_response_shape",
      networkAttempted: true,
      shapeValid: false,
      errorKind: "invalid_response_shape",
    });

    expect(output).toBe(
      [
        "Gemini isolated smoke status summary:",
        "provider: gemini",
        "status: invalid_response_shape",
        "networkAttempted: true",
        "shapeValid: false",
        "errorKind: invalid_response_shape",
      ].join("\n")
    );
  });

  it("formats Rakuten diagnostics without request or response data", () => {
    const output = formatExternalSmokeStatusSummary("Rakuten", {
      provider: "rakuten",
      status: "network_error",
      networkAttempted: true,
      shapeValid: false,
      phase: "http_response",
      httpStatus: 401,
      responseOk: false,
      errorKind: "http_401",
    });

    expect(output).toBe(
      [
        "Rakuten isolated smoke status summary:",
        "provider: rakuten",
        "status: network_error",
        "networkAttempted: true",
        "shapeValid: false",
        "phase: http_response",
        "httpStatus: 401",
        "responseOk: false",
        "errorKind: http_401",
      ].join("\n")
    );
  });
});

function rakutenOptInEnv() {
  return {
    RAKUTEN_APPLICATION_ID: "application-id",
    RAKUTEN_ACCESS_KEY: "access-key",
    RUN_EXTERNAL_SMOKE: "1",
  };
}
