import { describe, expect, test } from "vitest";

import { recommendSneakers } from "../../core/recommendSneakers";
import type { RecommendSneakersInput } from "../../core/types";
import { expectedDecisions } from "../../domain/recommendation/__fixtures__/expectedDecisions";
import { expectedScoreBreakdowns } from "../../domain/recommendation/__fixtures__/expectedScoreBreakdowns";
import { sampleSneakerVectors } from "../../domain/recommendation/__fixtures__/sampleSneakerVectors";
import {
  sampleOwnedSneakersByProfile,
  sampleProfiles,
  sampleSneakers,
} from "../index";

function buildInput(profile = sampleProfiles[0]): RecommendSneakersInput {
  if (!profile) {
    throw new Error("sampleProfiles must contain at least one profile");
  }

  const { preferredTags, ...preferenceProfile } = profile;

  return {
    preferenceProfile,
    candidates: sampleSneakers,
    ownedSneakers: sampleOwnedSneakersByProfile[profile.userId] ?? [],
    preferredTags,
  };
}

describe("v0.2 sample data", () => {
  test("contains at least 10 sample sneakers", () => {
    expect(sampleSneakers.length).toBeGreaterThanOrEqual(10);
  });

  test("each sneaker has a sneakerId and name", () => {
    for (const sneaker of sampleSneakers) {
      expect(sneaker.sneakerId).toEqual(expect.any(String));
      expect(sneaker.sneakerId.length).toBeGreaterThan(0);
      expect(sneaker.name).toEqual(expect.any(String));
      expect(sneaker.name.length).toBeGreaterThan(0);
    }
  });

  test("sneakerId values are unique", () => {
    const sneakerIds = sampleSneakers.map((sneaker) => sneaker.sneakerId);
    const uniqueSneakerIds = new Set(sneakerIds);

    expect(uniqueSneakerIds.size).toBe(sneakerIds.length);
  });

  test("each sneaker can be passed to recommendSneakers input", () => {
    const profile = sampleProfiles[0];

    if (!profile) {
      throw new Error("sampleProfiles must contain at least one profile");
    }

    const { preferredTags, ...preferenceProfile } = profile;

    for (const candidate of sampleSneakers) {
      const results = recommendSneakers({
        preferenceProfile,
        candidates: [candidate],
        ownedSneakers: sampleOwnedSneakersByProfile[profile.userId] ?? [],
        preferredTags,
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.sneakerId).toBe(candidate.sneakerId);
    }
  });

  test("contains at least 3 sample profiles", () => {
    expect(sampleProfiles.length).toBeGreaterThanOrEqual(3);
  });

  test("recommendSneakers runs with the sample data", () => {
    const results = recommendSneakers(buildInput());

    expect(results.length).toBeGreaterThan(0);
  });

  test("recommendation result returns at least one item for every sample profile", () => {
    for (const profile of sampleProfiles) {
      const results = recommendSneakers(buildInput(profile));

      expect(results.length).toBeGreaterThan(0);
    }
  });

  test("keeps the existing golden test fixtures unchanged", () => {
    expect(sampleSneakerVectors.caseA.A1_canvas_high_overlap.name).toBe(
      "Canvas Low-Tech High Overlap"
    );
    expect(expectedDecisions.caseA.A3_comfortable_simple_runner).toEqual({
      rawDecision: "BUY",
      finalDecision: "BUY",
    });
    expect(expectedScoreBreakdowns.caseA.A3_comfortable_simple_runner.finalScore).toBe(
      78.52
    );
  });
});
