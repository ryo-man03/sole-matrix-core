import type { ColorwayVerificationState, MarketProviderResult } from "./contracts";
import { normalizeStyleCode } from "./listing-match";

export type FitConfidenceResult = Readonly<{
  state: "strong" | "medium" | "limited" | "unknown";
  reasons: string[];
  cautions: string[];
  referenceCount: number;
  feedbackCount: number;
}>;

export type PurchaseConfidence = Readonly<{
  productIdentity: "high" | "medium" | "low";
  marketMatch: "high" | "medium" | "low" | "unavailable";
  fitConfidence: "high" | "medium" | "low" | "unknown";
  conditionClarity: "high" | "medium" | "low" | "unavailable";
  shippingClarity: "high" | "medium" | "low" | "unavailable";
  listingFreshness: "high" | "medium" | "low" | "unavailable";
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
  feedbackValues: readonly unknown[] = [],
): FitConfidenceResult {
  const candidateFamily = candidate.modelFamily ?? inferFamily(candidate.modelName);
  const candidateGeneration = candidate.generation ?? inferGeneration(candidate.modelName);
  const owned = ownedValues.flatMap((value) => parseOwned(value));
  const sizes = sizeValues.flatMap((value) => parseSize(value));
  const feedback = feedbackValues.flatMap((value) => parseFeedback(value));
  const expectedStyle = normalizeStyleCode(candidate.styleCode);
  const exact = owned.filter((item) => compatibleAudience(candidate.audience, item.audience)
    && same(item.brand, candidate.brand)
    && ((expectedStyle && item.styleCode === expectedStyle) || same(item.modelName, candidate.modelName)));
  const sameFamily = owned.filter((item) => !exact.includes(item)
    && compatibleAudience(candidate.audience, item.audience)
    && same(item.brand, candidate.brand)
    && Boolean(item.modelFamily && candidateFamily && same(item.modelFamily, candidateFamily))
    && Boolean(item.generation && candidateGeneration && same(item.generation, candidateGeneration)));
  const differentGeneration = owned.filter((item) => !exact.includes(item) && !sameFamily.includes(item)
    && compatibleAudience(candidate.audience, item.audience)
    && same(item.brand, candidate.brand)
    && Boolean(item.modelFamily && candidateFamily && same(item.modelFamily, candidateFamily)));
  const sameBrand = owned.filter((item) => !exact.includes(item) && !sameFamily.includes(item) && !differentGeneration.includes(item) && same(item.brand, candidate.brand));
  const references = [...exact, ...sameFamily, ...differentGeneration, ...sameBrand];
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (exact.length) reasons.push(`同じモデルの所有履歴が${exact.length}件あります。`);
  if (sameFamily.length) reasons.push(`同じモデルファミリーの所有履歴が${sameFamily.length}件あります。`);
  if (differentGeneration.length) reasons.push(`同じモデルファミリーの別世代履歴が${differentGeneration.length}件あります。`);
  if (!exact.length && !sameFamily.length && sameBrand.length) reasons.push(`同じブランドの所有履歴が${sameBrand.length}件あります。`);
  if (sizes.length) reasons.push(`登録サイズ${sizes.length}件を参考にしています。`);
  if (feedback.length) reasons.push(`購入後のフィット感${feedback.length}件を参考にしています。`);

  if (differentGeneration.length) cautions.push("同じモデルファミリーでも別世代のため、サイズ感は同一とは限りません。");
  if (references.some((item) => audienceConflict(candidate.audience, item.audience))) {
    cautions.push("メンズ・ウィメンズ・キッズのサイズ基準が異なる履歴を含みます。");
  }
  const referenceSystems = new Set(references.map((item) => item.sizeSystem).filter(Boolean));
  const primarySystems = new Set(sizes.filter((item) => item.primary).map((item) => item.sizeSystem));
  if (referenceSystems.size && primarySystems.size && ![...referenceSystems].some((system) => primarySystems.has(system!))) {
    cautions.push("所有履歴と通常サイズの表記体系が異なるため、換算表を確認してください。");
  }
  if (hasConflictingSizes([...references, ...sizes])) cautions.push("登録履歴にサイズ差があるため、足入れの好みや着用メモも確認してください。");

  if (feedback.some((item) => item.overallFit === "too_small" || item.overallFit === "too_large" || item.sameSizeAgain === false)) {
    cautions.push("過去のフィット感に大きさの不一致があるため、同じサイズを前提にしないでください。");
  }

  let state: FitConfidenceResult["state"] = "unknown";
  if (exact.some((item) => item.sizeValue !== null) || feedback.some((item) => item.sizeValue !== null
    && compatibleAudience(candidate.audience, item.audience)
    && same(item.brand, candidate.brand)
    && ((expectedStyle && item.styleCode === expectedStyle) || same(item.modelName, candidate.modelName)))) state = "strong";
  else if (sameFamily.some((item) => item.sizeValue !== null) || feedback.some((item) => item.sizeValue !== null
    && compatibleAudience(candidate.audience, item.audience)
    && same(item.brand, candidate.brand)
    && Boolean(item.modelFamily && candidateFamily && same(item.modelFamily, candidateFamily))
    && Boolean(item.generation && candidateGeneration && same(item.generation, candidateGeneration)))) state = "medium";
  else if (differentGeneration.length || sameBrand.length || sizes.length || feedback.length) state = "limited";
  if (state === "unknown") cautions.push("サイズ履歴がないため、メーカーサイズ表と返品条件を確認してください。");
  else if (state === "limited") cautions.push("参考情報が少ないため、販売先のサイズ表と返品条件も確認してください。");

  return { state, reasons, cautions, referenceCount: references.length + sizes.length + feedback.length, feedbackCount: feedback.length };
}

export function parseFitConfidencePayload(value: unknown): FitConfidenceResult | null {
  if (!isRecord(value) || value.ok !== true || !isRecord(value.data) || !isRecord(value.data.fit)) return null;
  const fit = value.data.fit;
  if (typeof fit.state !== "string" || !["strong", "medium", "limited", "unknown"].includes(fit.state)
    || !strings(fit.reasons) || !strings(fit.cautions) || !Number.isSafeInteger(fit.referenceCount) || Number(fit.referenceCount) < 0
    || !Number.isSafeInteger(fit.feedbackCount) || Number(fit.feedbackCount) < 0) return null;
  return {
    state: fit.state as FitConfidenceResult["state"],
    reasons: fit.reasons,
    cautions: fit.cautions,
    referenceCount: Number(fit.referenceCount),
    feedbackCount: Number(fit.feedbackCount),
  };
}

export function evaluatePurchaseConfidence(input: Readonly<{
  verificationState: ColorwayVerificationState;
  providers: readonly MarketProviderResult[];
  fit: FitConfidenceResult;
  now?: string;
}>): PurchaseConfidence {
  const listings = input.providers.flatMap((provider) => provider.listings);
  const primaryListings = listings.filter((listing) => listing.matchLevel !== "related" && listing.matchLevel !== "rejected");
  const productIdentity = input.verificationState === "model_color_style_verified" ? "high"
    : input.verificationState === "model_color_verified" || input.verificationState === "model_only" ? "medium" : "low";
  const marketMatch = listings.some(({ matchLevel }) => matchLevel === "exact") ? "high"
    : listings.some(({ matchLevel }) => matchLevel === "probable") ? "medium"
    : listings.some(({ matchLevel }) => matchLevel === "related") ? "low" : "unavailable";
  const fitConfidence = input.fit.state === "strong" ? "high"
    : input.fit.state === "medium" ? "medium"
    : input.fit.state === "limited" ? "low" : "unknown";
  const conditionClarity = evidenceClarity(primaryListings.map((listing) => listing.condition !== "unknown"));
  const shippingClarity = evidenceClarity(primaryListings.map((listing) => listing.shippingKnown));
  const listingFreshness = freshness(primaryListings.map((listing) => listing.fetchedAt), input.now ?? new Date().toISOString());
  const evidenceWarnings = [
    ...(productIdentity === "low" ? ["商品情報の確認が十分ではありません。"] : []),
    ...(marketMatch === "low" ? ["表示中の商品は関連候補のみです。"] : []),
    ...(marketMatch === "unavailable" ? ["現在の販売・出品情報は未確認です。"] : []),
    ...(conditionClarity === "low" ? ["商品の状態が確認できない販売情報があります。"] : []),
    ...(shippingClarity === "low" ? ["送料が未確認のため、表示価格だけでは支払総額を判断できません。"] : []),
    ...(listingFreshness === "low" ? ["販売情報の取得時刻が古いため、販売ページで在庫と価格を再確認してください。"] : []),
    ...input.fit.cautions,
  ];
  return {
    productIdentity,
    marketMatch,
    fitConfidence,
    conditionClarity,
    shippingClarity,
    listingFreshness,
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

function parseFeedback(value: unknown) {
  if (!isRecord(value)) return [];
  const owned = isRecord(value.owned_sneakers) ? parseOwned(value.owned_sneakers)[0] : undefined;
  if (!owned) return [];
  return [{
    ...owned,
    sizeSystem: sizeSystem(value.size_system) ?? owned.sizeSystem,
    sizeValue: number(value.size_value) ?? owned.sizeValue,
    overallFit: text(value.overall_fit),
    sameSizeAgain: typeof value.same_size_again === "boolean" ? value.same_size_again : null,
  }];
}

function evidenceClarity(values: readonly boolean[]): "high" | "medium" | "low" | "unavailable" {
  if (!values.length) return "unavailable";
  const known = values.filter(Boolean).length;
  return known === values.length ? "high" : known > 0 ? "medium" : "low";
}

function freshness(values: readonly string[], nowValue: string): "high" | "medium" | "low" | "unavailable" {
  if (!values.length) return "unavailable";
  const now = Date.parse(nowValue);
  if (!Number.isFinite(now)) return "low";
  const ages = values.map((value) => now - Date.parse(value)).filter(Number.isFinite);
  if (ages.length !== values.length || ages.some((age) => age < -5 * 60_000)) return "low";
  const oldest = Math.max(...ages);
  return oldest <= 15 * 60_000 ? "high" : oldest <= 24 * 60 * 60_000 ? "medium" : "low";
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
  if (expected === "unknown" || observed === "unknown" || expected === observed) return false;
  if (expected === "kids" || observed === "kids") return true;
  if (expected === "unisex" || observed === "unisex") return false;
  return expected !== observed;
}

function compatibleAudience(expected: FitCandidateIdentity["audience"], observed: FitCandidateIdentity["audience"]): boolean {
  if (expected === "unknown" || observed === "unknown") return false;
  return !audienceConflict(expected, observed);
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
