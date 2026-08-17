import type { ColorwayVerificationState, MarketProviderResult } from "./contracts";
import { normalizeStyleCode } from "./listing-match";

export type FitConfidenceResult = Readonly<{
  state: "strong_reference" | "some_reference" | "limited_reference" | "unknown";
  reasons: string[];
  cautions: string[];
  referenceCount: number;
}>;

export type PurchaseConfidence = Readonly<{
  productIdentity: "high" | "medium" | "low";
  marketMatch: "high" | "medium" | "low" | "unavailable";
  fitConfidence: "high" | "medium" | "low" | "unknown";
  evidenceWarnings: string[];
  purchaseChecks: string[];
}>;

export type FitCandidateIdentity = Readonly<{
  brand: string | null;
  modelName: string;
  modelFamily: string | null;
  generation: string | null;
  styleCode: string | null;
  audience: "men" | "women" | "unisex" | "kids" | "unknown";
}>;

export function evaluateFitConfidence(
  candidate: FitCandidateIdentity,
  ownedValues: readonly unknown[],
  sizeValues: readonly unknown[],
): FitConfidenceResult {
  const candidateFamily = candidate.modelFamily ?? inferFamily(candidate.modelName);
  const candidateGeneration = candidate.generation ?? inferGeneration(candidate.modelName);
  const owned = ownedValues.flatMap((value) => parseOwned(value));
  const sizes = sizeValues.flatMap((value) => parseSize(value));
  const expectedStyle = normalizeStyleCode(candidate.styleCode);
  const exact = owned.filter((item) => (
    (expectedStyle && item.styleCode === expectedStyle)
    || (same(item.brand, candidate.brand) && same(item.modelName, candidate.modelName))
  ));
  const sameFamily = owned.filter((item) => !exact.includes(item)
    && same(item.brand, candidate.brand) && Boolean(item.modelFamily && candidateFamily && same(item.modelFamily, candidateFamily)));
  const sameBrand = owned.filter((item) => !exact.includes(item) && !sameFamily.includes(item) && same(item.brand, candidate.brand));
  const references = [...exact, ...sameFamily, ...sameBrand];
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (exact.length) reasons.push(`同じモデルの所有履歴が${exact.length}件あります。`);
  if (sameFamily.length) reasons.push(`同じモデルファミリーの所有履歴が${sameFamily.length}件あります。`);
  if (!exact.length && !sameFamily.length && sameBrand.length) reasons.push(`同じブランドの所有履歴が${sameBrand.length}件あります。`);
  if (sizes.length) reasons.push(`登録サイズ${sizes.length}件を参考にしています。`);

  const differentGeneration = sameFamily.some((item) => Boolean(item.generation && candidateGeneration && !same(item.generation, candidateGeneration)));
  if (differentGeneration) cautions.push("同じモデルファミリーでも別世代のため、サイズ感は同一とは限りません。");
  if (references.some((item) => audienceConflict(candidate.audience, item.audience))) {
    cautions.push("メンズ・ウィメンズ・キッズのサイズ基準が異なる履歴を含みます。");
  }
  const referenceSystems = new Set(references.map((item) => item.sizeSystem).filter(Boolean));
  const primarySystems = new Set(sizes.filter((item) => item.primary).map((item) => item.sizeSystem));
  if (referenceSystems.size && primarySystems.size && ![...referenceSystems].some((system) => primarySystems.has(system!))) {
    cautions.push("所有履歴と通常サイズの表記体系が異なるため、換算表を確認してください。");
  }
  if (hasConflictingSizes([...references, ...sizes])) cautions.push("登録履歴にサイズ差があるため、足入れの好みや着用メモも確認してください。");

  let state: FitConfidenceResult["state"] = "unknown";
  if (exact.some((item) => item.sizeValue !== null)) state = "strong_reference";
  else if (exact.length || sameFamily.length) state = "some_reference";
  else if (sameBrand.length || sizes.length) state = "limited_reference";
  if (state === "unknown") cautions.push("サイズ履歴がないため、メーカーサイズ表と返品条件を確認してください。");
  else if (state === "limited_reference") cautions.push("参考情報が少ないため、販売先のサイズ表と返品条件も確認してください。");

  return { state, reasons, cautions, referenceCount: references.length + sizes.length };
}

export function parseFitConfidencePayload(value: unknown): FitConfidenceResult | null {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data) || !isRecord(value.data.fit)) return null;
  const fit = value.data.fit;
  if (typeof fit.state !== "string" || !["strong_reference", "some_reference", "limited_reference", "unknown"].includes(fit.state)
    || !strings(fit.reasons) || !strings(fit.cautions) || !Number.isSafeInteger(fit.referenceCount) || Number(fit.referenceCount) < 0) return null;
  return {
    state: fit.state as FitConfidenceResult["state"],
    reasons: fit.reasons,
    cautions: fit.cautions,
    referenceCount: Number(fit.referenceCount),
  };
}

export function evaluatePurchaseConfidence(input: Readonly<{
  verificationState: ColorwayVerificationState;
  providers: readonly MarketProviderResult[];
  fit: FitConfidenceResult;
}>): PurchaseConfidence {
  const listings = input.providers.flatMap((provider) => provider.listings);
  const productIdentity = input.verificationState === "model_color_style_verified" ? "high"
    : input.verificationState === "model_color_verified" || input.verificationState === "model_only" ? "medium" : "low";
  const marketMatch = listings.some(({ matchLevel }) => matchLevel === "exact") ? "high"
    : listings.some(({ matchLevel }) => matchLevel === "probable") ? "medium"
    : listings.some(({ matchLevel }) => matchLevel === "related") ? "low" : "unavailable";
  const fitConfidence = input.fit.state === "strong_reference" ? "high"
    : input.fit.state === "some_reference" ? "medium"
    : input.fit.state === "limited_reference" ? "low" : "unknown";
  const evidenceWarnings = [
    ...(productIdentity === "low" ? ["商品情報の確認が十分ではありません。"] : []),
    ...(marketMatch === "low" ? ["表示中の商品は関連候補のみです。"] : []),
    ...(marketMatch === "unavailable" ? ["現在の販売・出品情報は未確認です。"] : []),
    ...input.fit.cautions,
  ];
  return {
    productIdentity,
    marketMatch,
    fitConfidence,
    evidenceWarnings,
    purchaseChecks: [
      "商品名・カラー・Style Codeが販売ページと一致するか",
      "新品・中古の状態と付属品の有無",
      "送料・関税を含む支払総額",
      "自分のサイズ表記体系と販売ページのサイズ体系",
      "返品・キャンセル条件と出品者評価",
    ],
  };
}

function parseOwned(value: unknown) {
  if (!isRecord(value)) return [];
  const brand = text(value.brand);
  const modelName = text(value.model_name);
  if (!brand || !modelName) return [];
  return [{
    brand,
    modelName,
    modelFamily: text(value.model_family),
    generation: text(value.generation),
    styleCode: normalizeStyleCode(text(value.style_code)),
    audience: audience(value.audience),
    sizeSystem: sizeSystem(value.size_system),
    sizeValue: number(value.size_value),
  }];
}

function parseSize(value: unknown) {
  if (!isRecord(value)) return [];
  const system = sizeSystem(value.size_system);
  const sizeValue = number(value.size_value);
  if (!system || sizeValue === null) return [];
  return [{ sizeSystem: system, sizeValue, primary: value.primary_size === true }];
}

function hasConflictingSizes(values: readonly { sizeSystem: string | null; sizeValue: number | null }[]): boolean {
  const grouped = new Map<string, number[]>();
  for (const value of values) {
    if (!value.sizeSystem || value.sizeValue === null) continue;
    grouped.set(value.sizeSystem, [...(grouped.get(value.sizeSystem) ?? []), value.sizeValue]);
  }
  return [...grouped.values()].some((group) => group.length > 1 && Math.max(...group) - Math.min(...group) >= 1);
}

function audience(value: unknown): FitCandidateIdentity["audience"] {
  return typeof value === "string" && ["men", "women", "unisex", "kids"].includes(value)
    ? value as FitCandidateIdentity["audience"] : "unknown";
}

function audienceConflict(expected: FitCandidateIdentity["audience"], observed: FitCandidateIdentity["audience"]): boolean {
  if (expected === "unknown" || observed === "unknown" || expected === "unisex" || observed === "unisex") return false;
  return expected !== observed;
}

function sizeSystem(value: unknown): string | null {
  return typeof value === "string" && ["JP", "US_M", "US_W", "UK", "EU"].includes(value) ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.normalize("NFKC").trim().slice(0, 200) : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value < 100 ? value : null;
}

function same(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return left.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "")
    === right.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
}

function inferFamily(modelName: string): string | null {
  const normalized = modelName.normalize("NFKC").toLocaleLowerCase("en-US");
  const match = normalized.match(/\b(99[01]|991|samba|authentic|air\s*jordan\s*1|aj1)\b/iu);
  return match?.[1]?.replace(/\s+/gu, " ") ?? null;
}

function inferGeneration(modelName: string): string | null {
  return modelName.normalize("NFKC").match(/\b(v\d+|og|adv|44\s*dx|golf)\b/iu)?.[1]?.toLocaleLowerCase("en-US").replace(/\s+/gu, "") ?? null;
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 40 && value.every((item) => typeof item === "string" && item.length <= 500);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
