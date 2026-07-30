import type { CandidateProfile } from "../core-v1/types";
import { RYO_CALIBRATION_CASES } from "./calibration-cases";
import {
  createRyoModeCandidateAnchors,
  rerankRyoModeCandidates,
  selectRecommendationDisplaySet,
} from "./candidates";
import { RYO_MODE_V4_QUESTIONS } from "./questions";
import { RYO_STRENGTH_BLENDS } from "./score-breakdown";
import { buildRyoPreferenceVector } from "./vector";

describe("Ryo Mode v2 calibration matrix", () => {
  it("defines at least 36 complete, uniquely identified fixed cases", () => {
    expect(RYO_CALIBRATION_CASES.length).toBeGreaterThanOrEqual(36);
    expect(new Set(RYO_CALIBRATION_CASES.map((item) => item.id)).size).toBe(RYO_CALIBRATION_CASES.length);
    for (const item of RYO_CALIBRATION_CASES) {
      expect(Object.keys(item.answers).sort()).toEqual(RYO_MODE_V4_QUESTIONS.map((question) => question.id).sort());
      expect(item.expectedTopFamilies.length).toBeGreaterThan(0);
      expect(item.acceptableTopModels.length).toBeGreaterThan(0);
      expect(item.mustNotRankFirst).toBeDefined();
      expect(item.expectedVerificationStates.length).toBeGreaterThan(0);
      expect(item.scoreRange.min).toBeGreaterThanOrEqual(0);
      expect(item.scoreRange.max).toBeLessThanOrEqual(100);
    }
  });

  it("keeps every calibrated winner in an accepted family and outside forbidden first place", () => {
    for (const item of RYO_CALIBRATION_CASES) {
      const vector = buildRyoPreferenceVector(item.answers);
      const candidates = createRyoModeCandidateAnchors(vector, budget(item.answers.budget));
      const ranked = rerankRyoModeCandidates(
        candidates.map((candidate) => scored(candidate, item.answers)),
        vector,
        item.answers.ryoStrength === "balanced" ? "balanced" : "ryo",
        item.context,
      );
      const winner = ranked[0];
      expect(winner, item.id).toBeDefined();
      expect(
        item.expectedTopFamilies.some((family) => winner!.candidate.name.toLocaleLowerCase("en-US").includes(family.toLocaleLowerCase("en-US"))),
        `${item.id}: ${winner?.candidate.name}`,
      ).toBe(true);
      expect(
        item.mustNotRankFirst.some((name) => winner!.candidate.name.toLocaleLowerCase("en-US").includes(name.toLocaleLowerCase("en-US"))),
        `${item.id}: ${winner?.candidate.name}`,
      ).toBe(false);
      expect(item.expectedBuckets).toContain(winner!.ryoSignature.bucket);
      expect(item.expectedVerificationStates).toContain(winner!.candidate.verificationStatus ?? "unverified");
      expectScoreRange(winner!.scoreBreakdownV2, item.scoreRange);
    }
  });

  it("keeps display roles unique and alternatives above the calibrated score floor", () => {
    for (const item of RYO_CALIBRATION_CASES) {
      const vector = buildRyoPreferenceVector(item.answers);
      const ranked = rerankRyoModeCandidates(
        createRyoModeCandidateAnchors(vector, budget(item.answers.budget))
          .map((candidate) => scored(candidate, item.answers)),
        vector,
        item.answers.ryoStrength === "balanced" ? "balanced" : "ryo",
        item.context,
      );
      const displaySet = selectRecommendationDisplaySet(ranked, item.context);
      expect(displaySet?.primary.candidate.id, item.id).toBe(ranked[0]?.candidate.id);
      const visibleIds = [
        displaySet?.primary.candidate.id,
        displaySet?.practicalAlternative?.candidate.id,
        displaySet?.ryoAlternative?.candidate.id,
      ].filter(Boolean);
      expect(new Set(visibleIds).size, item.id).toBe(visibleIds.length);
      for (const alternative of [
        displaySet?.practicalAlternative,
        displaySet?.ryoAlternative,
      ]) {
        if (!alternative) continue;
        expect(alternative.finalRecommendationScore, item.id)
          .toBeGreaterThanOrEqual(Math.max(32, ranked[0]!.finalRecommendationScore - 22));
      }
    }
  });

  it("centralizes strength blends and keeps balanced/beginner practical while strong explores", () => {
    expect(Object.values(RYO_STRENGTH_BLENDS)).toHaveLength(5);
    for (const blend of Object.values(RYO_STRENGTH_BLENDS)) {
      expect(blend.userFit + blend.ryoIdentity + blend.practicalFit + blend.exploration).toBeCloseTo(1);
    }
    expect(RYO_STRENGTH_BLENDS.balanced.userFit).toBeGreaterThan(RYO_STRENGTH_BLENDS.balanced.ryoIdentity);
    expect(RYO_STRENGTH_BLENDS.beginner.practicalFit).toBeGreaterThan(RYO_STRENGTH_BLENDS.beginner.ryoIdentity);
    expect(RYO_STRENGTH_BLENDS.strong.ryoIdentity + RYO_STRENGTH_BLENDS.strong.exploration)
      .toBeGreaterThan(RYO_STRENGTH_BLENDS.strong.userFit);
  });

  it("applies owned, disliked-model, and disliked-signal context without NaN", () => {
    const item = RYO_CALIBRATION_CASES.find((entry) => entry.id === "owned-puma-second-pair")!;
    const vector = buildRyoPreferenceVector(item.answers);
    const candidates = createRyoModeCandidateAnchors(vector, 25_000);
    const ranked = rerankRyoModeCandidates(candidates.map((candidate) => scored(candidate, item.answers)), vector, "ryo", {
      ...item.context,
      dislikedModels: ["PUMA Suede"],
      dislikedSignals: ["ハイテク"],
    });
    const owned = ranked.find((entry) => entry.candidate.name.includes("PUMA Suede"));
    expect(owned?.scoreBreakdownV2.contextPenalty).toBeGreaterThan(20);
    expect(owned?.contextReasons.join(" ")).toMatch(/所有モデル|避けたいモデル/);
    expect(ranked[0]?.candidate.name).not.toContain("PUMA Suede");
    expect(ranked.every((entry) => Number.isFinite(entry.finalRecommendationScore))).toBe(true);
  });
});

function scored(candidate: CandidateProfile, answers: { sportOrigin: string; style: string; taste: string }) {
  const sportBoost = answers.sportOrigin === "running" && candidate.tags.includes("running")
    ? 30
    : answers.sportOrigin === "basketball" && candidate.tags.includes("basketball")
      ? 20
      : answers.sportOrigin === "skate" && candidate.tags.includes("street")
        ? 15
        : 0;
  const styleBoost = answers.style === "normcore" && candidate.tags.includes("minimal")
    ? 8
    : answers.style === "street" && candidate.tags.includes("street")
      ? 8
      : 0;
  const total = Math.min(98, 65 + sportBoost + styleBoost);
  return {
    candidate,
    balancedScore: {
      total,
      featureFit: total,
      tagMatch: total,
      budgetFit: candidate.budgetFit,
      versatility: 74,
      informationConfidence: 86,
    },
    ryoScore: {
      total,
      preferenceFit: total,
      culturalFit: total,
      classicRetroFit: total,
      streetFit: total,
      calmStyleFit: total,
      enthusiastValue: total,
    },
    decision: "consider" as const,
  };
}

function budget(value: string): number | undefined {
  if (value === "under_15000") return 15_000;
  if (value === "under_20000") return 20_000;
  if (value === "under_25000") return 25_000;
  if (value === "under_35000") return 35_000;
  return undefined;
}

function expectScoreRange(score: {
  userFitScore: number;
  ryoIdentityScore: number;
  practicalFitScore: number;
  explorationScore: number;
  contextPenalty: number;
  finalRecommendationScore: number;
}, range: { min: number; max: number }) {
  for (const value of Object.values(score)) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(range.min);
    expect(value).toBeLessThanOrEqual(range.max);
  }
}
