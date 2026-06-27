import { recommendSneakers } from "../../../src/core/recommendSneakers";
import type { PreferenceProfile } from "../../../src/domain/profile/preferenceTypes";
import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type {
  BalancedScore,
  CandidateProfile,
  PreferenceVector,
  RyoScore,
} from "./types";

const profileAxes = [
  "culture",
  "styleFit",
  "simplicity",
  "street",
  "volume",
  "comfort",
  "durability",
] as const;

export function calculateBalancedScore(input: {
  preferenceVector: PreferenceVector;
  candidate: CandidateProfile;
  preferredTags?: readonly SneakerTag[];
}): BalancedScore {
  const preferenceProfile = toLegacyPreferenceProfile(input.preferenceVector);
  const [legacyResult] = recommendSneakers({
    preferenceProfile,
    candidates: [
      {
        sneakerId: input.candidate.id,
        name: input.candidate.name,
        vector: input.candidate.vector,
        tags: input.candidate.tags,
        budgetFit: input.candidate.budgetFit,
      },
    ],
    preferredTags: [...(input.preferredTags ?? [])],
  });

  if (!legacyResult) {
    return {
      total: 0,
      featureFit: 0,
      tagMatch: 0,
      budgetFit: input.candidate.budgetFit,
      versatility: 0,
      informationConfidence: 0,
    };
  }

  const versatility = average([
    input.candidate.vector.styleFit,
    input.candidate.vector.simplicity,
    input.candidate.vector.comfort,
  ]);

  return {
    total: legacyResult.scoreBreakdown.finalScore,
    featureFit: legacyResult.scoreBreakdown.featureFitScore,
    tagMatch: legacyResult.scoreBreakdown.tagBonus,
    budgetFit: input.candidate.budgetFit,
    versatility: roundScore(versatility),
    informationConfidence: input.candidate.informationCompleteness,
  };
}

export function calculateRyoScore(input: {
  preferenceVector: PreferenceVector;
  candidate: CandidateProfile;
}): RyoScore {
  const { preferenceVector, candidate } = input;
  const tags = new Set<SneakerTag>(candidate.tags);
  const preferenceFit = average(
    profileAxes.map((axis) => similarity(preferenceVector[axis], candidate.vector[axis])),
  );
  const culturalFit = similarity(
    preferenceVector.culture,
    candidate.vector.culture,
  );
  const classicRetroFit = average([
    culturalFit,
    tagAffinity(tags, ["classic", "retro", "heritage"]),
  ]);
  const streetFit = average([
    similarity(preferenceVector.street, candidate.vector.street),
    tagAffinity(tags, ["street", "basketball", "chunky"]),
  ]);
  const calmStyleFit = average([
    similarity(preferenceVector.simplicity, candidate.vector.simplicity),
    tagAffinity(tags, ["minimal", "low_tech", "classic"]),
  ]);
  const enthusiastValue = average([
    candidate.vector.culture,
    candidate.vector.durability,
    tagAffinity(tags, ["heritage", "retro", "premium", "classic"]),
  ]);
  const total =
    preferenceFit * 0.34 +
    culturalFit * 0.16 +
    classicRetroFit * 0.16 +
    streetFit * 0.12 +
    calmStyleFit * 0.12 +
    enthusiastValue * 0.1;

  return {
    total: roundScore(total),
    preferenceFit: roundScore(preferenceFit),
    culturalFit: roundScore(culturalFit),
    classicRetroFit: roundScore(classicRetroFit),
    streetFit: roundScore(streetFit),
    calmStyleFit: roundScore(calmStyleFit),
    enthusiastValue: roundScore(enthusiastValue),
  };
}

function toLegacyPreferenceProfile(vector: PreferenceVector): PreferenceProfile {
  const legacyVector = {
    culture: vector.culture,
    styleFit: vector.styleFit,
    simplicity: vector.simplicity,
    street: vector.street,
    volume: vector.volume,
    comfort: vector.comfort,
    durability: vector.durability,
  };

  return {
    userId: "core-v1-session",
    vector: legacyVector,
    policy: {
      priceSensitivity: clampScore(100 - vector.priceLevel),
      overlapSensitivity: 50,
      explorationTolerance: 50,
    },
    axisImportance: { ...legacyVector },
    sourceConfidence: {
      diagnosis: 100,
      ownedSneakers: 0,
      wantedSneakers: 0,
      feedback: 0,
    },
    profileVersion: 1,
    updatedAt: "2000-01-01T00:00:00.000Z",
  };
}

function tagAffinity(
  tags: ReadonlySet<SneakerTag>,
  targetTags: readonly SneakerTag[],
): number {
  const matchCount = targetTags.filter((tag) => tags.has(tag)).length;

  return matchCount === 0
    ? 45
    : Math.min(100, 60 + (matchCount / targetTags.length) * 40);
}

function similarity(left: number, right: number): number {
  return clampScore(100 - Math.abs(left - right));
}

function average(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundScore(value: number): number {
  return Math.round(clampScore(value) * 10) / 10;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
