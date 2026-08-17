import "server-only";

import { fetchMarketJson } from "./provider-request";

type TokenState = { accessToken: string; expiresAt: number };
let tokenState: TokenState | null = null;
let tokenFlight: Promise<string> | null = null;

export async function getEbayApplicationToken(
  credentials: Readonly<{ clientId: string; clientSecret: string }>,
  fetcher: typeof fetch = globalThis.fetch,
  now = Date.now(),
): Promise<string> {
  if (tokenState && tokenState.expiresAt > now + 60_000) return tokenState.accessToken;
  if (tokenFlight) return tokenFlight;
  tokenFlight = requestToken(credentials, fetcher, now).finally(() => { tokenFlight = null; });
  return tokenFlight;
}

export function invalidateEbayApplicationToken(token?: string): void {
  if (!token || tokenState?.accessToken === token) tokenState = null;
}

export function resetEbayTokenManagerForTests(): void {
  tokenState = null;
  tokenFlight = null;
}

async function requestToken(
  credentials: Readonly<{ clientId: string; clientSecret: string }>,
  fetcher: typeof fetch,
  now: number,
): Promise<string> {
  const payload = await fetchMarketJson("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
    cache: "no-store",
  }, fetcher);
  if (!isRecord(payload) || typeof payload.access_token !== "string" || payload.access_token.length < 8
    || typeof payload.expires_in !== "number" || !Number.isFinite(payload.expires_in) || payload.expires_in <= 0) {
    throw new Error("invalid_ebay_token_response");
  }
  tokenState = {
    accessToken: payload.access_token.slice(0, 8_192),
    expiresAt: now + Math.min(payload.expires_in, 7_200) * 1_000,
  };
  return tokenState.accessToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
