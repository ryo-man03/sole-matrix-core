import { inferMappedRyoTraits } from "./mappings";
import type { RyoSneakerFeatures } from "./types";
import { hasJapaneseText, isAbstractRecommendationName } from "./validation";

const discouragedPatterns = [
  /asics\s+gel[- ]kayano\s+14/i,
  /nike\s+shox/i,
  /onitsuka\s+tiger/i,
  /\bhoka\b/i,
  /puma\s+speedcat/i,
];

const explicitlyAllowedTechPatterns = [
  /nike\s+air\s+max\s+95/i,
  /new\s+balance\s+2002r/i,
  /new\s+balance\s+2010/i,
];

export function normalizeRyoSneakerFeatures(features: RyoSneakerFeatures): RyoSneakerFeatures {
  const name = features.displayNameOfficial.trim();
  const mappedTraits = inferMappedRyoTraits(name);
  const isAirForce1WhiteWhite = /nike\s+air\s+force\s+1.*\blow\b.*white\s*[/ -]\s*white/i.test(name);
  const discouraged = discouragedPatterns.some((pattern) => pattern.test(name));
  const techAllowed = explicitlyAllowedTechPatterns.some((pattern) => pattern.test(name));
  const largeNLogo = /new\s+balance\s+990v(?:[5-9]|\d{2,})\b/i.test(name);

  return {
    ...features,
    displayNameOfficial: name,
    brandOfficial: features.brandOfficial.trim(),
    modelOfficial: features.modelOfficial.trim(),
    isAbstractName: features.isAbstractName || isAbstractRecommendationName(name),
    hasLocalizedMainName: features.hasLocalizedMainName || hasJapaneseText(name),
    traits: {
      ...mappedTraits,
      ...(isAirForce1WhiteWhite ? { airForce1WhiteWhite: true, leather: true, lowCut: true } : {}),
      ...(discouraged ? { ryoDiscouragedModel: true } : {}),
      ...(techAllowed ? { techAllowedModel: true } : {}),
      ...(largeNLogo ? { largeNLogo: true } : {}),
      ...features.traits,
    },
  };
}

export function getRyoFeatureSignals(features: RyoSneakerFeatures): string[] {
  const normalized = normalizeRyoSneakerFeatures(features);
  const signals: string[] = [];
  const add = (condition: boolean | undefined, signal: string) => {
    if (condition) signals.push(signal);
  };
  add(normalized.traits.oldShape, "old shape");
  add(normalized.traits.vintage, "vintage / VTG");
  add(normalized.traits.timeLine, "TimeLine construction");
  add(normalized.traits.madeInJapan, "Made in Japan");
  add(normalized.traits.madeInGermany, "Made in Germany");
  add(normalized.traits.madeInUsa, "Made in USA");
  add(normalized.traits.leather, "leather aging");
  add(normalized.traits.suede, "suede fading and nap");
  add(normalized.traits.canvas, "canvas fading");
  add(normalized.traits.tiedSilhouetteGood, "tied silhouette");
  add(normalized.traits.rareWearableColor, "rare but wearable color");
  add(normalized.traits.airForce1WhiteWhite, "Air Force 1 White/White historical staple");
  return signals;
}
