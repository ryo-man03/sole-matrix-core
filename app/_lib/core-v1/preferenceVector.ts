import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type {
  DiagnosisAnswer,
  DiagnosisAnswerValue,
  PreferenceVector,
} from "./types";

type PreferenceAxis = keyof PreferenceVector;
type AxisContribution = Partial<Record<PreferenceAxis, number>>;

const neutralValue = 50;
const answerValues: Record<DiagnosisAnswerValue, number> = {
  like: 85,
  neutral: neutralValue,
  dislike: 15,
};

const questionAxisWeights: Record<string, AxisContribution> = {
  "trusted-classic": { culture: 1, simplicity: 0.35 },
  "simple-daily": { styleFit: 0.8, simplicity: 1 },
  "street-presence": { street: 1, styleFit: 0.35 },
  "soft-volume": { volume: 1 },
  "walking-comfort": { comfort: 1 },
  "long-use": { durability: 1 },
  "sporty-mood": { styleFit: 0.45, street: 0.25, volume: 0.2 },
  "premium-detail": { culture: 0.25, priceLevel: 1 },
};

const tagAxisValues: Partial<Record<SneakerTag, AxisContribution>> = {
  classic: { culture: 88, simplicity: 68 },
  heritage: { culture: 92, durability: 66 },
  retro: { culture: 86, styleFit: 68 },
  low_tech: { simplicity: 90, volume: 28 },
  minimal: { simplicity: 92, styleFit: 82 },
  street: { street: 92, styleFit: 74 },
  chunky: { volume: 92, street: 72 },
  running: { comfort: 78, styleFit: 66 },
  basketball: { street: 82, volume: 80 },
  comfortable: { comfort: 94 },
  durable: { durability: 94 },
  premium: { priceLevel: 86, culture: 70 },
};

const preferenceAxes: PreferenceAxis[] = [
  "culture",
  "styleFit",
  "simplicity",
  "street",
  "volume",
  "comfort",
  "durability",
  "priceLevel",
];

export function createPreferenceVector(input: {
  answers?: readonly DiagnosisAnswer[];
  tags?: readonly string[];
}): PreferenceVector {
  const totals = createAxisRecord(0);
  const weights = createAxisRecord(0);

  for (const answer of input.answers ?? []) {
    const contributions = questionAxisWeights[answer.questionId];

    if (!contributions) {
      continue;
    }

    addContributions(
      totals,
      weights,
      contributions,
      answerValues[answer.value],
    );
  }

  for (const tag of uniqueStrings(input.tags ?? []).slice(0, 5)) {
    const contributions = tagAxisValues[tag as SneakerTag];

    if (!contributions) {
      continue;
    }

    for (const [axis, rawValue] of Object.entries(contributions)) {
      if (typeof rawValue !== "number") {
        continue;
      }

      const preferenceAxis = axis as PreferenceAxis;
      totals[preferenceAxis] += rawValue * 0.8;
      weights[preferenceAxis] += 0.8;
    }
  }

  return Object.fromEntries(
    preferenceAxes.map((axis) => [
      axis,
      weights[axis] === 0
        ? neutralValue
        : clampScore(Math.round(totals[axis] / weights[axis])),
    ]),
  ) as PreferenceVector;
}

function addContributions(
  totals: PreferenceVector,
  weights: PreferenceVector,
  contributions: AxisContribution,
  answerValue: number,
) {
  for (const [axis, rawWeight] of Object.entries(contributions)) {
    if (typeof rawWeight !== "number") {
      continue;
    }

    const preferenceAxis = axis as PreferenceAxis;
    totals[preferenceAxis] += answerValue * rawWeight;
    weights[preferenceAxis] += rawWeight;
  }
}

function createAxisRecord(value: number): PreferenceVector {
  return {
    culture: value,
    styleFit: value,
    simplicity: value,
    street: value,
    volume: value,
    comfort: value,
    durability: value,
    priceLevel: value,
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => typeof value === "string"))];
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
