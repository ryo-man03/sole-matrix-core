import { NextResponse } from "next/server";

import type { ColorwayVerificationState, MarketSearchContext, MarketSizeSystem } from "../../../_lib/market/contracts";
import { searchCurrentMarketPrices } from "../../../_lib/market/search";

export async function POST(request: Request) {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json", message: "検索条件を読み取れませんでした。" }, { status: 400 });
  }
  const context = parseContext(value);
  if (!context) return NextResponse.json({ error: "invalid_context", message: "検索条件を確認してください。" }, { status: 400 });
  return NextResponse.json(await searchCurrentMarketPrices(context), {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function parseContext(value: unknown): MarketSearchContext | null {
  if (!isRecord(value) || !isRecord(value["identity"])) return null;
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
  return typeof value === "string" && ["new", "used", "refurbished", "unknown"].includes(value);
}

function isSizeSystem(value: unknown): value is MarketSizeSystem {
  return typeof value === "string" && ["US_M", "US_W", "UK", "EU", "JP", "UNKNOWN"].includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
