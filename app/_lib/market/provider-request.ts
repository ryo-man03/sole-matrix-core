import "server-only";

import type { MarketProviderStatus } from "./contracts";

const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 8_000;

export class MarketProviderRequestError extends Error {
  override name = "MarketProviderRequestError";

  constructor(
    readonly status: MarketProviderStatus,
    readonly upstreamStatus: number | null = null,
    readonly retryAfter: number | null = null,
  ) {
    super(status);
  }
}

export async function fetchMarketJson(
  url: URL | string,
  init: RequestInit,
  fetcher: typeof fetch = globalThis.fetch,
): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetcher(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        const retryable = (response.status === 502 || response.status === 503) && attempt === 0;
        if (retryable) continue;
        if (response.status === 401 || response.status === 403) throw new MarketProviderRequestError("unauthorized", response.status);
        if (response.status === 429) throw new MarketProviderRequestError("rate_limited", 429, parseRetryAfter(response.headers.get("retry-after")));
        if (response.status === 502 || response.status === 503 || response.status >= 500) {
          throw new MarketProviderRequestError("temporarily_unavailable", response.status);
        }
        throw new MarketProviderRequestError("schema_error", response.status);
      }
      const declaredLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
        throw new MarketProviderRequestError("schema_error", response.status);
      }
      const body = await response.text();
      if (Buffer.byteLength(body, "utf8") > MAX_RESPONSE_BYTES) throw new MarketProviderRequestError("schema_error", response.status);
      if (!body.trim()) throw new MarketProviderRequestError("schema_error", response.status);
      try {
        return JSON.parse(body) as unknown;
      } catch {
        throw new MarketProviderRequestError("schema_error", response.status);
      }
    } catch (error) {
      if (error instanceof MarketProviderRequestError) throw error;
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      const reset = error instanceof Error && /ECONNRESET|connection reset/iu.test(`${error.message} ${String(error.cause ?? "")}`);
      if ((timeout || reset) && attempt === 0) continue;
      throw new MarketProviderRequestError(timeout ? "timeout" : "network_error");
    }
  }
  throw new MarketProviderRequestError("temporarily_unavailable");
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds, 86_400);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - Date.now()) / 1_000)) : null;
}
