import type { MarketProviderId } from "./contracts";

export type MarketProviderOperation =
  | "temporary_display"
  | "persist"
  | "forecast"
  | "recommendation_score";

export class MarketProviderOperationDeniedError extends Error {
  override name = "MarketProviderOperationDeniedError";

  constructor(
    readonly provider: MarketProviderId,
    readonly operation: MarketProviderOperation,
  ) {
    super(`market_provider_operation_denied:${provider}:${operation}`);
  }
}

export function isMarketProviderOperationAllowed(
  _provider: MarketProviderId,
  operation: MarketProviderOperation,
): boolean {
  return operation === "temporary_display";
}

export function assertMarketProviderOperationAllowed(
  provider: MarketProviderId,
  operation: MarketProviderOperation,
): void {
  if (!isMarketProviderOperationAllowed(provider, operation)) {
    throw new MarketProviderOperationDeniedError(provider, operation);
  }
}

export function countForbiddenMarketProviderOperations(
  operations: readonly Readonly<{ provider: MarketProviderId; operation: MarketProviderOperation }>[],
): number {
  return operations.filter(({ provider, operation }) => !isMarketProviderOperationAllowed(provider, operation)).length;
}

export function countMarketProviderPolicyBreaches(
  observations: readonly Readonly<{
    provider: MarketProviderId;
    operation: MarketProviderOperation;
    allowed: boolean;
  }>[],
): number {
  return observations.filter(({ provider, operation, allowed }) => (
    allowed !== isMarketProviderOperationAllowed(provider, operation)
  )).length;
}

export function countRecommendationRankingMutations(
  before: readonly string[],
  after: readonly string[],
): number {
  if (before.length !== after.length) return 1;
  return before.some((id, index) => id !== after[index]) ? 1 : 0;
}

export function countSensitiveMarketValueExposures(
  value: unknown,
  sensitiveValues: readonly string[],
): number {
  const serialized = safeSerialize(value);
  const markerMatches = sensitiveValues
    .filter((item) => item.length >= 4)
    .filter((item) => serialized.includes(item))
    .length;
  return markerMatches + (/(?:basic|bearer)\s+[a-z0-9._<>-]{8,}/iu.test(serialized) ? 1 : 0);
}

export function countRawProviderResponsePersistence(value: unknown): number {
  const forbiddenKeys = new Set([
    "rawpayload",
    "rawresponse",
    "rawproviderpayload",
    "rawproviderresponse",
    "upstreampayload",
    "upstreamresponse",
    "providerpayload",
    "providerresponse",
  ]);
  const visited = new WeakSet<object>();

  function visit(current: unknown): number {
    if (!current || typeof current !== "object") return 0;
    if (visited.has(current)) return 0;
    visited.add(current);
    if (Array.isArray(current)) return current.reduce((sum, item) => sum + visit(item), 0);
    return Object.entries(current).reduce((sum, [key, item]) => {
      const normalizedKey = key.toLocaleLowerCase("en-US").replace(/[^a-z]/gu, "");
      return sum + (forbiddenKeys.has(normalizedKey) ? 1 : 0) + visit(item);
    }, 0);
  }

  return visit(value);
}

function safeSerialize(value: unknown): string {
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}
