import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/market/search", () => {
  it("rejects malformed contexts without provider requests", async () => {
    const response = await POST(request({ query: "" }));
    expect(response.status).toBe(400);
  });

  it("returns three safe provider states when external providers are disabled", async () => {
    vi.stubEnv("EXTERNAL_PROVIDERS_DISABLED", "true");
    const response = await POST(request({
      query: "Nike Air Force 1 Low",
      identity: { brand: "Nike", modelName: "Nike Air Force 1 Low", colorwayName: null, styleCode: null, verificationState: "model_only" },
      gender: "unknown",
      sizeSystem: "UNKNOWN",
      size: null,
      condition: "unknown",
    }));
    const body = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(body["recommendationRankingChanged"]).toBe(false);
    expect(body["providers"]).toHaveLength(3);
    expect(JSON.stringify(body)).not.toMatch(/CLIENT_SECRET|ACCESS_TOKEN|Bearer /u);
  });

  it("rejects color and Style Code fields that contradict verification state", async () => {
    const response = await POST(request({
      query: "Invented Shoe Purple",
      identity: {
        brand: "Example",
        modelName: "Invented Shoe",
        colorwayName: "Imaginary Purple",
        styleCode: "FAKE-001",
        verificationState: "unverified",
      },
      gender: "unknown",
      sizeSystem: "UNKNOWN",
      size: null,
      condition: "unknown",
    }));
    expect(response.status).toBe(400);
  });
});

function request(body: unknown): Request {
  return new Request("https://example.com/api/market/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
