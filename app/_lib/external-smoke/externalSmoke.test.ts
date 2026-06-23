import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { runGeminiIsolatedSmoke } from "./geminiSmoke";
import { classifyExternalSmokeReadiness } from "./readiness";
import {
  isGeminiGenerateContentResponse,
  isRakutenItemSearchResponse,
} from "./responseValidators";
import { runRakutenIsolatedSmoke } from "./rakutenSmoke";

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
    const result = await runGeminiIsolatedSmoke();

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
    const result = await runRakutenIsolatedSmoke();
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
    ).resolves.toEqual({ provider: "rakuten", status: "ok" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("classifies an invalid fake response without exposing it to Core", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ items: [{}] })));

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
      status: "invalid_response_shape",
    });
  });
});
