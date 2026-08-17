import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repository = readFileSync("src/infrastructure/repositories/dataStewardRepository.ts", "utf8");
const route = readFileSync("app/api/market/search/route.ts", "utf8");

describe("provider observability boundary", () => {
  it.each(["request_id", "provider_id", "operation", "status", "duration_ms", "retry_count", "cache_status", "normalized_count", "safe_error_code"])("records structured field %s", (field) => {
    expect(repository).toContain(field);
  });

  it("runs observation persistence after the response path and never fails market search", () => {
    expect(route).toContain("after(async () =>");
    expect(route).toContain("Observability must not delay or fail a market response");
  });

  it("persists request-scoped cache hit, miss, bypass, and single-flight state", () => {
    expect(route).toContain("providerMetrics");
    expect(repository).toContain("providerCacheStatus");
    expect(repository).toContain('statuses.includes("single_flight_hit")');
    expect(repository).toContain('statuses.includes("cache_hit")');
    expect(repository).toContain('return statuses.length ? "miss"');
  });

  it.each(["rawProviderResponse", "oauth_token", "provider_secret", "authorization", "cookie", "password"])("does not store secret/raw field %s", (field) => {
    expect(repository).not.toContain(field);
  });

  it("does not attach user identity or the search query to provider observations", () => {
    const observationFunction = repository.slice(repository.indexOf("export async function recordMarketProviderObservations"), repository.indexOf("export async function loadProviderAdminData"));
    expect(observationFunction).not.toMatch(/user_id|query_text|item_url|source_url/iu);
  });
});
