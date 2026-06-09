import { describe, expect, test } from "vitest";

import type { PreferenceProfile } from "../../domain/profile/preferenceTypes";
import type {
  OwnedSneakerSummary,
  SneakerCandidate,
} from "../../domain/sneaker/sneakerVector";
import { calculateBalancedScore } from "../../domain/recommendation/balancedScore";
import { sampleOwnedSneakers } from "../../domain/recommendation/__fixtures__/sampleOwnedSneakers";
import { samplePreferenceProfiles } from "../../domain/recommendation/__fixtures__/samplePreferenceProfiles";
import { sampleSneakerVectors } from "../../domain/recommendation/__fixtures__/sampleSneakerVectors";
import { recommendSneakers } from "../recommendSneakers";

const profile = samplePreferenceProfiles.caseA as PreferenceProfile;
const ownedSneakers = sampleOwnedSneakers.caseA as unknown as OwnedSneakerSummary[];

function toCandidate(
  candidate: (typeof sampleSneakerVectors.caseA)[keyof typeof sampleSneakerVectors.caseA]
): SneakerCandidate {
  return {
    ...candidate,
    vector: { ...candidate.vector },
    tags: [...candidate.tags],
  };
}

const a1CanvasHighOverlap = toCandidate(
  sampleSneakerVectors.caseA.A1_canvas_high_overlap
);
const a2ExpensiveCollab = toCandidate(
  sampleSneakerVectors.caseA.A2_expensive_collab
);
const a3ComfortableSimpleRunner = toCandidate(
  sampleSneakerVectors.caseA.A3_comfortable_simple_runner
);

describe("recommendSneakers", () => {
  test("returns recommendation results for multiple candidates", () => {
    const results = recommendSneakers({
      preferenceProfile: profile,
      candidates: [a1CanvasHighOverlap, a2ExpensiveCollab],
      ownedSneakers,
    });

    expect(results).toHaveLength(2);
    expect(results.map((result) => result.sneakerId).sort()).toEqual([
      "A1_canvas_high_overlap",
      "A2_expensive_collab",
    ]);
  });

  test("sorts results by finalScore in descending order", () => {
    const results = recommendSneakers({
      preferenceProfile: profile,
      candidates: [a2ExpensiveCollab, a3ComfortableSimpleRunner],
      ownedSneakers,
    });

    expect(results[0]?.sneakerId).toBe("A3_comfortable_simple_runner");
    expect(results[0]?.scoreBreakdown.finalScore).toBeGreaterThan(
      results[1]?.scoreBreakdown.finalScore ?? Number.NEGATIVE_INFINITY
    );
  });

  test("preserves input order when finalScore is tied", () => {
    const firstCandidate: SneakerCandidate = {
      ...a2ExpensiveCollab,
      sneakerId: "tie_first",
      name: "Tie First",
    };
    const secondCandidate: SneakerCandidate = {
      ...a2ExpensiveCollab,
      sneakerId: "tie_second",
      name: "Tie Second",
    };

    const results = recommendSneakers({
      preferenceProfile: profile,
      candidates: [firstCandidate, secondCandidate],
      ownedSneakers: [],
    });

    expect(results.map((result) => result.sneakerId)).toEqual([
      "tie_first",
      "tie_second",
    ]);
    expect(results[0]?.scoreBreakdown.finalScore).toBe(
      results[1]?.scoreBreakdown.finalScore
    );
  });

  test("includes the public recommendation result fields", () => {
    const results = recommendSneakers({
      preferenceProfile: profile,
      candidates: [a1CanvasHighOverlap],
      ownedSneakers,
    });
    const [result] = results;

    expect(result).toEqual(
      expect.objectContaining({
        sneakerId: "A1_canvas_high_overlap",
        name: "Canvas Low-Tech High Overlap",
        inputIndex: 0,
        scoreBreakdown: expect.any(Object),
        rawDecision: expect.any(String),
        finalDecision: expect.any(String),
        demotions: expect.any(Array),
      })
    );
  });

  test("delegates score, decision, and demotion calculation to existing core logic", () => {
    const candidate = a3ComfortableSimpleRunner;
    const [result] = recommendSneakers({
      preferenceProfile: profile,
      candidates: [candidate],
      ownedSneakers,
    });

    const existingCoreResult = calculateBalancedScore({
      profile,
      candidate,
      ownedSneakers,
      preferredTags: [],
    });

    expect(result?.scoreBreakdown).toEqual(existingCoreResult.scoreBreakdown);
    expect(result?.rawDecision).toBe(existingCoreResult.rawDecision);
    expect(result?.finalDecision).toBe(existingCoreResult.finalDecision);
    expect(result?.demotions).toEqual(existingCoreResult.demotions);
  });
});
