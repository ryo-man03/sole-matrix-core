import { after, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import type { ColorwayVerificationState, MarketSearchContext, MarketSizeSystem } from "../../../_lib/market/contracts";
import { searchCurrentMarketPrices } from "../../../_lib/market/search";
import { recordProviderMetric, type ProviderMetricEvent } from "../../../_lib/market/reliability";
import { readBoundedJsonBody, validateMutationRequest } from "../../../../src/application/http/requestSecurity";
import { recordMarketProviderObservations } from "../../../../src/infrastructure/repositories/dataStewardRepository";

export async function POST(request: Request) {
  const mutation = validateMutationRequest(request, { key: "market-search", limit: 30 });
  if (!mutation.ok) return NextResponse.json({ error: mutation.code, message: "検索条件を確認してください。" }, { status: mutation.status });
  let value: unknown;
  try {
    value = await readBoundedJsonBody(request);
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "検索条件を読み取れませんでした。" }, { status: 400 });
  }
  const context = parseContext(value);
  if (!context) return NextResponse.json({ error: "invalid_context", message: "検索条件を確認してください。" }, { status: 400 });
  const suppliedRequestId = request.headers.get("x-request-id");
  const requestId = suppliedRequestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(suppliedRequestId)
    ? suppliedRequestId : randomUUID();
  const startedAt = performance.now();
  const providerMetrics: Omit<ProviderMetricEvent, "at">[] = [];
  const result = await searchCurrentMarketPrices(context, undefined, (event) => {
    providerMetrics.push(event);
    recordProviderMetric(event);
  });
  const durationMs = performance.now() - startedAt;
  try {
    after(async () => { await recordMarketProviderObservations(requestId, durationMs, result.providers, providerMetrics).catch(() => false); });
  } catch { /* Observability must not delay or fail a market response outside a Next request context. */ }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store, max-age=0", "X-Request-Id": requestId },
  });
}

function parseContext(value: unknown): MarketSearchContext | null {
  if (!isRecord(value) || !isRecord(value["identity"])) return null;
  if (!hasOnlyKeys(value, ["query", "identity", "gender", "sizeSystem", "size", "condition"])) return null;
  if (!hasOnlyKeys(value["identity"], ["brand", "modelName", "colorwayName", "styleCode", "verificationState"])) return null;
  const query = safeText(value["query"], 128);
  const modelName = safeText(value["identity"]["modelName"], 160);
  if (!query || !modelName) return null;
  const verificationState = value["identity"]["verificationState"];
  if (!isVerificationState(verificationState)) return null;
  const colorwayName = safeText(value["identity"]["colorwayName"], 120);
  const styleCode = safeText(value["identity"]["styleCode"], 40);
  if (!isConsistentVerifiedIdentity(verificationState, colorwayName, styleCode)) return null;
  const gender = value["gender"];
  const condition = value["condition"];
  const sizeSystem = value["sizeSystem"];
  if (!isGender(gender) || !isCondition(condition) || !isSizeSystem(sizeSystem)) return null;
  return {
    query,
    identity: {
      brand: safeText(value["identity"]["brand"], 80),
      modelName,
      colorwayName,
      styleCode,
      verificationState,
    },
    gender,
    sizeSystem,
    size: safeText(value["size"], 20),
    condition,
  };
}

function safeText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]+/gu, " ").replace(/\s+/gu, " ").trim();
  return normalized ? normalized.slice(0, maximum) : null;
}

function isVerificationState(value: unknown): value is ColorwayVerificationState {
  return typeof value === "string" && ["model_color_style_verified", "model_color_verified", "model_only", "unverified"].includes(value);
}

function isConsistentVerifiedIdentity(
  state: ColorwayVerificationState,
  colorwayName: string | null,
  styleCode: string | null,
): boolean {
  if (state === "model_color_style_verified") return Boolean(colorwayName && styleCode);
  if (state === "model_color_verified") return Boolean(colorwayName) && styleCode === null;
  return colorwayName === null && styleCode === null;
}

function isGender(value: unknown): value is MarketSearchContext["gender"] {
  return typeof value === "string" && ["men", "women", "unisex", "kids", "unknown"].includes(value);
}

function isCondition(value: unknown): value is MarketSearchContext["condition"] {
  return typeof value === "string" && ["new", "used", "unknown"].includes(value);
}

function isSizeSystem(value: unknown): value is MarketSizeSystem {
  return typeof value === "string" && ["US_M", "US_W", "UK", "EU", "JP", "UNKNOWN"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
