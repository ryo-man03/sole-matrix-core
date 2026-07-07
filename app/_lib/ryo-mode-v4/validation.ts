import type { RyoSneakerFeatures } from "./types";

const japaneseTextPattern = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/u;
const abstractNamePatterns = [
  /^(?:retro|classic|vintage|stylish|recommended|premium)\s+(?:sneaker|shoe)s?$/i,
  /^(?:white|black)\s+(?:leather\s+)?(?:sneaker|shoe)s?$/i,
  /^(?:basketball|tennis|running)\s+(?:sneaker|shoe)s?$/i,
  /おすすめ|レトロな|クラシックな/u,
];

export function hasJapaneseText(value: string): boolean {
  return japaneseTextPattern.test(value);
}

export function isAbstractRecommendationName(value: string): boolean {
  const normalized = value.trim();
  return normalized.length === 0 || abstractNamePatterns.some((pattern) => pattern.test(normalized));
}

export function isOfficialEnglishDisplayName(value: string): boolean {
  const normalized = value.trim();
  return normalized.length > 1
    && /[a-z]/i.test(normalized)
    && !hasJapaneseText(normalized)
    && !isAbstractRecommendationName(normalized);
}

export function validateRyoDisplayName(features: RyoSneakerFeatures): {
  ok: boolean;
  penalties: string[];
} {
  const penalties: string[] = [];
  const displayName = features.displayNameOfficial.trim();
  if (features.hasLocalizedMainName || hasJapaneseText(displayName)) {
    penalties.push("localized Japanese display name used as main title (-18)");
  }
  if (features.isAbstractName || isAbstractRecommendationName(displayName)) {
    penalties.push("abstract recommendation name (-20)");
  }
  if (!isOfficialEnglishDisplayName(displayName)) {
    penalties.push("official English display name validation failed");
  }
  const officialParts = [features.brandOfficial, features.modelOfficial].filter(Boolean);
  if (officialParts.some((part) => !displayName.toLocaleLowerCase("en-US").includes(part.toLocaleLowerCase("en-US")))) {
    penalties.push("display name does not contain official brand and model");
  }
  return { ok: penalties.length === 0, penalties: [...new Set(penalties)] };
}
