import { expectedDecisions } from "./expectedDecisions";
import { expectedDemotions } from "./expectedDemotions";
import { expectedScoreBreakdowns } from "./expectedScoreBreakdowns";
import { sampleOwnedSneakers } from "./sampleOwnedSneakers";
import { samplePreferenceProfiles } from "./samplePreferenceProfiles";
import { sampleSneakerVectors } from "./sampleSneakerVectors";

const FIXED_TEST_NOW = "2026-06-09T00:00:00Z";

const preferredTags = {
  caseA: ["low_tech", "classic", "minimal", "canvas"],
  caseB: ["street", "chunky", "basketball", "skate"],
  caseC: ["comfortable", "durable", "running"],
  caseD: ["low_tech", "classic", "minimal", "canvas"],
  caseE: ["premium", "comfortable", "classic"],
  caseF: ["heritage", "street", "classic"],
  caseG: ["heritage", "street", "classic"],
} as const;

function buildExpectedSnapshot(input: {
  profile: unknown;
  candidate: unknown;
  ownedSneakers: unknown;
  preferredTags: readonly string[];
  scoreBreakdown: unknown;
  rawDecision: string;
  finalDecision: string;
  demotions: readonly string[];
}) {
  return {
    snapshotVersion: "core-v0.1-final-lock",
    profile: input.profile,
    candidate: input.candidate,
    ownedSneakers: input.ownedSneakers,
    preferredTags: input.preferredTags,
    scoreBreakdown: input.scoreBreakdown,
    rawDecision: input.rawDecision,
    finalDecision: input.finalDecision,
    demotions: input.demotions,
    createdAt: FIXED_TEST_NOW,
  };
}

export const expectedSnapshots = {
  caseA: {
    A1_canvas_high_overlap: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseA,
      candidate: sampleSneakerVectors.caseA.A1_canvas_high_overlap,
      ownedSneakers: sampleOwnedSneakers.caseA,
      preferredTags: preferredTags.caseA,
      scoreBreakdown: expectedScoreBreakdowns.caseA.A1_canvas_high_overlap,
      rawDecision: expectedDecisions.caseA.A1_canvas_high_overlap.rawDecision,
      finalDecision:
        expectedDecisions.caseA.A1_canvas_high_overlap.finalDecision,
      demotions: expectedDemotions.caseA.A1_canvas_high_overlap,
    }),
    A2_expensive_collab: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseA,
      candidate: sampleSneakerVectors.caseA.A2_expensive_collab,
      ownedSneakers: sampleOwnedSneakers.caseA,
      preferredTags: preferredTags.caseA,
      scoreBreakdown: expectedScoreBreakdowns.caseA.A2_expensive_collab,
      rawDecision: expectedDecisions.caseA.A2_expensive_collab.rawDecision,
      finalDecision: expectedDecisions.caseA.A2_expensive_collab.finalDecision,
      demotions: expectedDemotions.caseA.A2_expensive_collab,
    }),
    A3_comfortable_simple_runner: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseA,
      candidate: sampleSneakerVectors.caseA.A3_comfortable_simple_runner,
      ownedSneakers: sampleOwnedSneakers.caseA,
      preferredTags: preferredTags.caseA,
      scoreBreakdown:
        expectedScoreBreakdowns.caseA.A3_comfortable_simple_runner,
      rawDecision:
        expectedDecisions.caseA.A3_comfortable_simple_runner.rawDecision,
      finalDecision:
        expectedDecisions.caseA.A3_comfortable_simple_runner.finalDecision,
      demotions: expectedDemotions.caseA.A3_comfortable_simple_runner,
    }),
  },
  caseB: {
    B1_chunky_street: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseB,
      candidate: sampleSneakerVectors.caseB.B1_chunky_street,
      ownedSneakers: sampleOwnedSneakers.caseB,
      preferredTags: preferredTags.caseB,
      scoreBreakdown: expectedScoreBreakdowns.caseB.B1_chunky_street,
      rawDecision: expectedDecisions.caseB.B1_chunky_street.rawDecision,
      finalDecision: expectedDecisions.caseB.B1_chunky_street.finalDecision,
      demotions: expectedDemotions.caseB.B1_chunky_street,
    }),
    B2_clean_lowtech_safe: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseB,
      candidate: sampleSneakerVectors.caseB.B2_clean_lowtech_safe,
      ownedSneakers: sampleOwnedSneakers.caseB,
      preferredTags: preferredTags.caseB,
      scoreBreakdown: expectedScoreBreakdowns.caseB.B2_clean_lowtech_safe,
      rawDecision: expectedDecisions.caseB.B2_clean_lowtech_safe.rawDecision,
      finalDecision:
        expectedDecisions.caseB.B2_clean_lowtech_safe.finalDecision,
      demotions: expectedDemotions.caseB.B2_clean_lowtech_safe,
    }),
    B3_trail_discovery: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseB,
      candidate: sampleSneakerVectors.caseB.B3_trail_discovery,
      ownedSneakers: sampleOwnedSneakers.caseB,
      preferredTags: preferredTags.caseB,
      scoreBreakdown: expectedScoreBreakdowns.caseB.B3_trail_discovery,
      rawDecision: expectedDecisions.caseB.B3_trail_discovery.rawDecision,
      finalDecision: expectedDecisions.caseB.B3_trail_discovery.finalDecision,
      demotions: expectedDemotions.caseB.B3_trail_discovery,
    }),
  },
  caseC: {
    C1_comfort_runner: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseC,
      candidate: sampleSneakerVectors.caseC.C1_comfort_runner,
      ownedSneakers: sampleOwnedSneakers.caseC,
      preferredTags: preferredTags.caseC,
      scoreBreakdown: expectedScoreBreakdowns.caseC.C1_comfort_runner,
      rawDecision: expectedDecisions.caseC.C1_comfort_runner.rawDecision,
      finalDecision: expectedDecisions.caseC.C1_comfort_runner.finalDecision,
      demotions: expectedDemotions.caseC.C1_comfort_runner,
    }),
    C2_culture_low_comfort: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseC,
      candidate: sampleSneakerVectors.caseC.C2_culture_low_comfort,
      ownedSneakers: sampleOwnedSneakers.caseC,
      preferredTags: preferredTags.caseC,
      scoreBreakdown: expectedScoreBreakdowns.caseC.C2_culture_low_comfort,
      rawDecision: expectedDecisions.caseC.C2_culture_low_comfort.rawDecision,
      finalDecision:
        expectedDecisions.caseC.C2_culture_low_comfort.finalDecision,
      demotions: expectedDemotions.caseC.C2_culture_low_comfort,
    }),
    C3_premium_comfort: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseC,
      candidate: sampleSneakerVectors.caseC.C3_premium_comfort,
      ownedSneakers: sampleOwnedSneakers.caseC,
      preferredTags: preferredTags.caseC,
      scoreBreakdown: expectedScoreBreakdowns.caseC.C3_premium_comfort,
      rawDecision: expectedDecisions.caseC.C3_premium_comfort.rawDecision,
      finalDecision: expectedDecisions.caseC.C3_premium_comfort.finalDecision,
      demotions: expectedDemotions.caseC.C3_premium_comfort,
    }),
  },
  caseD: {
    D1_high_overlap_buy_to_wait: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseD,
      candidate: sampleSneakerVectors.caseD.D1_high_overlap_buy_to_wait,
      ownedSneakers: sampleOwnedSneakers.caseD,
      preferredTags: preferredTags.caseD,
      scoreBreakdown:
        expectedScoreBreakdowns.caseD.D1_high_overlap_buy_to_wait,
      rawDecision:
        expectedDecisions.caseD.D1_high_overlap_buy_to_wait.rawDecision,
      finalDecision:
        expectedDecisions.caseD.D1_high_overlap_buy_to_wait.finalDecision,
      demotions: expectedDemotions.caseD.D1_high_overlap_buy_to_wait,
    }),
  },
  caseE: {
    E1_low_price_fit_buy_to_wait: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseE,
      candidate: sampleSneakerVectors.caseE.E1_low_price_fit_buy_to_wait,
      ownedSneakers: sampleOwnedSneakers.caseE,
      preferredTags: preferredTags.caseE,
      scoreBreakdown:
        expectedScoreBreakdowns.caseE.E1_low_price_fit_buy_to_wait,
      rawDecision:
        expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.rawDecision,
      finalDecision:
        expectedDecisions.caseE.E1_low_price_fit_buy_to_wait.finalDecision,
      demotions: expectedDemotions.caseE.E1_low_price_fit_buy_to_wait,
    }),
  },
  caseF: {
    F1_low_comfort_buy_to_wait: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseF,
      candidate: sampleSneakerVectors.caseF.F1_low_comfort_buy_to_wait,
      ownedSneakers: sampleOwnedSneakers.caseF,
      preferredTags: preferredTags.caseF,
      scoreBreakdown: expectedScoreBreakdowns.caseF.F1_low_comfort_buy_to_wait,
      rawDecision:
        expectedDecisions.caseF.F1_low_comfort_buy_to_wait.rawDecision,
      finalDecision:
        expectedDecisions.caseF.F1_low_comfort_buy_to_wait.finalDecision,
      demotions: expectedDemotions.caseF.F1_low_comfort_buy_to_wait,
    }),
  },
  caseG: {
    G1_low_durability_buy_to_wait: buildExpectedSnapshot({
      profile: samplePreferenceProfiles.caseG,
      candidate: sampleSneakerVectors.caseG.G1_low_durability_buy_to_wait,
      ownedSneakers: sampleOwnedSneakers.caseG,
      preferredTags: preferredTags.caseG,
      scoreBreakdown:
        expectedScoreBreakdowns.caseG.G1_low_durability_buy_to_wait,
      rawDecision:
        expectedDecisions.caseG.G1_low_durability_buy_to_wait.rawDecision,
      finalDecision:
        expectedDecisions.caseG.G1_low_durability_buy_to_wait.finalDecision,
      demotions: expectedDemotions.caseG.G1_low_durability_buy_to_wait,
    }),
  },
} as const;
