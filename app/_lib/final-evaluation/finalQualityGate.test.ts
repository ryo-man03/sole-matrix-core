import { describe, expect, it } from "vitest";

import {
  assertFinalQualityGate,
  evaluateFinalQuality,
  type FinalEvaluationCandidate,
  type FinalEvaluationScenario,
} from "./finalQualityGate";

const modes = ["balanced", "ryo"] as const;
const ryoStrengths = ["off", "light", "standard", "strong"] as const;
const purposes = ["daily", "first_pair", "second_pair"] as const;
const providerStates = ["ready", "timeout", "rate_limited", "invalid_schema"] as const;

describe("final quality gate", () => {
  it("passes the deterministic 96-scenario cross-product with every violation at zero", () => {
    const scenarios = modes.flatMap((mode) =>
      ryoStrengths.flatMap((ryoStrength) =>
        purposes.flatMap((purpose) =>
          providerStates.map((providerState) =>
            createPassingScenario({ mode, ryoStrength, purpose, providerState }),
          ),
        ),
      ),
    );
    const metrics = evaluateFinalQuality(scenarios);

    expect(metrics).toEqual({
      scenarioCount: 96,
      unsupportedModelDisplayed: 0,
      unsupportedColorwayDisplayed: 0,
      unsupportedStyleCodeDisplayed: 0,
      unsupportedExplanationDisplayed: 0,
      primaryConstraintViolation: 0,
      duplicateCandidateCount: 0,
      duplicateParentCount: 0,
      singleBrandTopThreeCount: 0,
      safeOnlySecondPairCount: 0,
      invalidRyoAlternativeCount: 0,
      modeStateLeakCount: 0,
      responsiveStateResetCount: 0,
      duplicateRequestCount: 0,
      unhandledErrorCount: 0,
      horizontalOverflowCount: 0,
    });
    expect(() => assertFinalQualityGate(metrics)).not.toThrow();
  });

  it("detects every forbidden outcome instead of allowing a vacuous pass", () => {
    const badCandidate: FinalEvaluationCandidate = {
      id: "duplicate",
      parentId: "same-parent",
      brand: "Same Brand",
      modelDisplayed: true,
      modelVerified: false,
      colorwayDisplayed: true,
      colorwayVerified: false,
      styleCodeDisplayed: true,
      styleCodeVerified: false,
      explanationDisplayed: true,
      explanationSupported: false,
      violatesPrimaryConstraint: true,
      role: "practical",
    };
    const scenario: FinalEvaluationScenario = {
      id: "deliberate-failure",
      topThree: [badCandidate, { ...badCandidate }, {
        ...badCandidate,
        id: "third",
      }],
      secondPairPurpose: true,
      safeOnlySecondPair: true,
      ryoAlternativeValid: false,
      modeStateLeak: true,
      responsiveStateReset: true,
      submittedRequestCount: 2,
      handledErrorCount: 0,
      unhandledErrorCount: 1,
      horizontalOverflow: true,
    };
    const metrics = evaluateFinalQuality([scenario]);

    expect(metrics).toMatchObject({
      unsupportedModelDisplayed: 3,
      unsupportedColorwayDisplayed: 3,
      unsupportedStyleCodeDisplayed: 3,
      unsupportedExplanationDisplayed: 3,
      primaryConstraintViolation: 3,
      duplicateCandidateCount: 1,
      duplicateParentCount: 2,
      singleBrandTopThreeCount: 1,
      safeOnlySecondPairCount: 1,
      invalidRyoAlternativeCount: 1,
      modeStateLeakCount: 1,
      responsiveStateResetCount: 1,
      duplicateRequestCount: 1,
      unhandledErrorCount: 1,
      horizontalOverflowCount: 1,
    });
    expect(() => assertFinalQualityGate(metrics, 1)).toThrow(
      /FINAL_QUALITY_GATE_FAILED/,
    );
  });

  it("rejects a matrix smaller than the required 80 scenarios", () => {
    const metrics = evaluateFinalQuality([
      createPassingScenario({
        mode: "balanced",
        ryoStrength: "standard",
        purpose: "daily",
        providerState: "ready",
      }),
    ]);
    expect(() => assertFinalQualityGate(metrics)).toThrow(
      "FINAL_QUALITY_GATE_TOO_FEW_SCENARIOS:1/80",
    );
  });
});

function createPassingScenario(input: {
  mode: typeof modes[number];
  ryoStrength: typeof ryoStrengths[number];
  purpose: typeof purposes[number];
  providerState: typeof providerStates[number];
}): FinalEvaluationScenario {
  const scenarioKey = [
    input.mode,
    input.ryoStrength,
    input.purpose,
    input.providerState,
  ].join(":");
  const providerHasVerifiedDetail = input.providerState === "ready";
  const topThree: FinalEvaluationCandidate[] = [
    verifiedCandidate(`${scenarioKey}:primary`, "parent-primary", "New Balance", "primary", providerHasVerifiedDetail),
    verifiedCandidate(`${scenarioKey}:practical`, "parent-practical", "adidas", "practical", false),
    verifiedCandidate(
      `${scenarioKey}:${input.purpose === "second_pair" ? "archive" : "ryo"}`,
      "parent-discovery",
      "Puma",
      input.purpose === "second_pair" ? "archive" : "ryo",
      providerHasVerifiedDetail,
    ),
  ];

  return {
    id: scenarioKey,
    topThree,
    secondPairPurpose: input.purpose === "second_pair",
    safeOnlySecondPair: false,
    ryoAlternativeValid: true,
    modeStateLeak: false,
    responsiveStateReset: false,
    submittedRequestCount: 1,
    handledErrorCount: input.providerState === "ready" ? 0 : 1,
    unhandledErrorCount: 0,
    horizontalOverflow: false,
  };
}

function verifiedCandidate(
  id: string,
  parentId: string,
  brand: string,
  role: FinalEvaluationCandidate["role"],
  includeVerifiedDetail: boolean,
): FinalEvaluationCandidate {
  return {
    id,
    parentId,
    brand,
    modelDisplayed: true,
    modelVerified: true,
    colorwayDisplayed: includeVerifiedDetail,
    colorwayVerified: includeVerifiedDetail,
    styleCodeDisplayed: false,
    styleCodeVerified: false,
    explanationDisplayed: true,
    explanationSupported: true,
    violatesPrimaryConstraint: false,
    role,
  };
}

