import { describe, expect, test } from "vitest";

import type { PreferenceProfile } from "../../profile/preferenceTypes";
import type { SneakerTag } from "../../sneaker/sneakerTag";
import type {
  OwnedSneakerSummary,
  SneakerCandidate,
} from "../../sneaker/sneakerVector";
import { calculateBalancedScore } from "../balancedScore";
import { createRecommendationSnapshot, FIXED_TEST_NOW } from "../snapshot";

import { expectedDecisions } from "../__fixtures__/expectedDecisions";
import { expectedDemotions } from "../__fixtures__/expectedDemotions";
import { expectedScoreBreakdowns } from "../__fixtures__/expectedScoreBreakdowns";
import { expectedSnapshots } from "../__fixtures__/expectedSnapshots";
import { sampleOwnedSneakers } from "../__fixtures__/sampleOwnedSneakers";
import { samplePreferenceProfiles } from "../__fixtures__/samplePreferenceProfiles";
import { sampleSneakerVectors } from "../__fixtures__/sampleSneakerVectors";

const preferredTags = {
  caseA: ["low_tech", "classic", "minimal", "canvas"],
  caseB: ["street", "chunky", "basketball", "skate"],
  caseC: ["comfortable", "durable", "running"],
  caseD: ["low_tech", "classic", "minimal", "canvas"],
  caseE: ["premium", "comfortable", "classic"],
  caseF: ["heritage", "street", "classic"],
  caseG: ["heritage", "street", "classic"],
} as const;

type CaseKey = keyof typeof samplePreferenceProfiles;

function runCandidate(caseKey: CaseKey, candidateKey: string) {
  const candidateGroup = sampleSneakerVectors[caseKey] as Record<string, unknown>;
  const candidate = candidateGroup[candidateKey] as SneakerCandidate;

  const result = calculateBalancedScore({
    profile: samplePreferenceProfiles[caseKey] as PreferenceProfile,
    candidate,
    ownedSneakers: sampleOwnedSneakers[
      caseKey
    ] as unknown as OwnedSneakerSummary[],
    preferredTags: preferredTags[caseKey] as unknown as SneakerTag[],
  });

  const snapshot = createRecommendationSnapshot({
    profile: samplePreferenceProfiles[caseKey] as PreferenceProfile,
    candidate,
    ownedSneakers: sampleOwnedSneakers[
      caseKey
    ] as unknown as OwnedSneakerSummary[],
    preferredTags: preferredTags[caseKey] as unknown as SneakerTag[],
    scoreBreakdown: result.scoreBreakdown,
    rawDecision: result.rawDecision,
    finalDecision: result.finalDecision,
    demotions: result.demotions,
    createdAt: FIXED_TEST_NOW,
  });

  return { result, snapshot };
}

describe("SOLE//MATRIX Core v0.1 golden tests", () => {
  test("Case A: A1_canvas_high_overlap becomes WAIT without Demotion", () => {
    const { result, snapshot } = runCandidate("caseA", "A1_canvas_high_overlap");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseA.A1_canvas_high_overlap
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseA.A1_canvas_high_overlap.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseA.A1_canvas_high_overlap.finalDecision
    );
    expect(result.demotions).toEqual(
      expectedDemotions.caseA.A1_canvas_high_overlap
    );
    expect(snapshot).toEqual(expectedSnapshots.caseA.A1_canvas_high_overlap);
  });

  test("Case B: street and volume candidate is Best Fit candidate", () => {
    const { result, snapshot } = runCandidate("caseB", "B1_chunky_street");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseB.B1_chunky_street
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseB.B1_chunky_street.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseB.B1_chunky_street.finalDecision
    );
    expect(result.demotions).toEqual(expectedDemotions.caseB.B1_chunky_street);
    expect(snapshot).toEqual(expectedSnapshots.caseB.B1_chunky_street);
  });

  test("Case C: comfort and durability candidate is evaluated above low-comfort heritage candidate", () => {
    const c1 = runCandidate("caseC", "C1_comfort_runner");
    const c2 = runCandidate("caseC", "C2_culture_low_comfort");

    expect(c1.result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseC.C1_comfort_runner
    );
    expect(c2.result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseC.C2_culture_low_comfort
    );
    expect(c1.result.scoreBreakdown.finalScore).toBeGreaterThan(
      c2.result.scoreBreakdown.finalScore
    );
  });

  test("Case D: HIGH_CLOSET_OVERLAP demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseD", "D1_high_overlap_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseD.D1_high_overlap_buy_to_wait
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseD.D1_high_overlap_buy_to_wait.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseD.D1_high_overlap_buy_to_wait.finalDecision
    );
    expect(result.demotions).toEqual(["HIGH_CLOSET_OVERLAP"]);
  });

  test("Case E: LOW_PRICE_FIT demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseE", "E1_low_price_fit_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseE.E1_low_price_fit_buy_to_wait
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.finalDecision
    );
    expect(result.demotions).toEqual(["LOW_PRICE_FIT"]);
  });

  test("Case F: LOW_COMFORT demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseF", "F1_low_comfort_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseF.F1_low_comfort_buy_to_wait
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseF.F1_low_comfort_buy_to_wait.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseF.F1_low_comfort_buy_to_wait.finalDecision
    );
    expect(result.demotions).toEqual(["LOW_COMFORT"]);
  });

  test("Case G: LOW_DURABILITY demotes BUY or above to WAIT", () => {
    const { result } = runCandidate("caseG", "G1_low_durability_buy_to_wait");

    expect(result.scoreBreakdown).toEqual(
      expectedScoreBreakdowns.caseG.G1_low_durability_buy_to_wait
    );
    expect(result.rawDecision).toBe(
      expectedDecisions.caseG.G1_low_durability_buy_to_wait.rawDecision
    );
    expect(result.finalDecision).toBe(
      expectedDecisions.caseG.G1_low_durability_buy_to_wait.finalDecision
    );
    expect(result.demotions).toEqual(["LOW_DURABILITY"]);
  });
});
