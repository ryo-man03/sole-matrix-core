export type FinalEvaluationMetrics = {
  scenarioCount: number;
  unsupportedModelDisplayed: number;
  unsupportedColorwayDisplayed: number;
  unsupportedStyleCodeDisplayed: number;
  unsupportedExplanationDisplayed: number;
  primaryConstraintViolation: number;
  duplicateCandidateCount: number;
  duplicateParentCount: number;
  singleBrandTopThreeCount: number;
  safeOnlySecondPairCount: number;
  invalidRyoAlternativeCount: number;
  modeStateLeakCount: number;
  responsiveStateResetCount: number;
  duplicateRequestCount: number;
  unhandledErrorCount: number;
  horizontalOverflowCount: number;
};

export type FinalEvaluationCandidate = {
  id: string;
  parentId: string;
  brand: string;
  modelDisplayed: boolean;
  modelVerified: boolean;
  colorwayDisplayed: boolean;
  colorwayVerified: boolean;
  styleCodeDisplayed: boolean;
  styleCodeVerified: boolean;
  explanationDisplayed: boolean;
  explanationSupported: boolean;
  violatesPrimaryConstraint: boolean;
  role: "primary" | "practical" | "ryo" | "archive";
};

export type FinalEvaluationScenario = {
  id: string;
  topThree: readonly FinalEvaluationCandidate[];
  secondPairPurpose: boolean;
  safeOnlySecondPair: boolean;
  ryoAlternativeValid: boolean;
  modeStateLeak: boolean;
  responsiveStateReset: boolean;
  submittedRequestCount: number;
  handledErrorCount: number;
  unhandledErrorCount: number;
  horizontalOverflow: boolean;
};

const violationMetricKeys = [
  "unsupportedModelDisplayed",
  "unsupportedColorwayDisplayed",
  "unsupportedStyleCodeDisplayed",
  "unsupportedExplanationDisplayed",
  "primaryConstraintViolation",
  "duplicateCandidateCount",
  "duplicateParentCount",
  "singleBrandTopThreeCount",
  "safeOnlySecondPairCount",
  "invalidRyoAlternativeCount",
  "modeStateLeakCount",
  "responsiveStateResetCount",
  "duplicateRequestCount",
  "unhandledErrorCount",
  "horizontalOverflowCount",
] as const satisfies readonly (keyof FinalEvaluationMetrics)[];

export function evaluateFinalQuality(
  scenarios: readonly FinalEvaluationScenario[],
): FinalEvaluationMetrics {
  const metrics: FinalEvaluationMetrics = {
    scenarioCount: scenarios.length,
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
  };

  for (const scenario of scenarios) {
    metrics.unsupportedModelDisplayed += scenario.topThree.filter(
      (candidate) => candidate.modelDisplayed && !candidate.modelVerified,
    ).length;
    metrics.unsupportedColorwayDisplayed += scenario.topThree.filter(
      (candidate) => candidate.colorwayDisplayed && !candidate.colorwayVerified,
    ).length;
    metrics.unsupportedStyleCodeDisplayed += scenario.topThree.filter(
      (candidate) => candidate.styleCodeDisplayed && !candidate.styleCodeVerified,
    ).length;
    metrics.unsupportedExplanationDisplayed += scenario.topThree.filter(
      (candidate) => candidate.explanationDisplayed && !candidate.explanationSupported,
    ).length;
    metrics.primaryConstraintViolation += scenario.topThree.filter(
      (candidate) => candidate.violatesPrimaryConstraint,
    ).length;
    metrics.duplicateCandidateCount += duplicateCount(
      scenario.topThree.map((candidate) => candidate.id),
    );
    metrics.duplicateParentCount += duplicateCount(
      scenario.topThree.map((candidate) => candidate.parentId),
    );
    metrics.singleBrandTopThreeCount += scenario.topThree.length === 3
      && new Set(scenario.topThree.map((candidate) => normalize(candidate.brand))).size === 1
      ? 1
      : 0;
    metrics.safeOnlySecondPairCount += scenario.secondPairPurpose
      && scenario.safeOnlySecondPair
      ? 1
      : 0;
    metrics.invalidRyoAlternativeCount += scenario.ryoAlternativeValid ? 0 : 1;
    metrics.modeStateLeakCount += scenario.modeStateLeak ? 1 : 0;
    metrics.responsiveStateResetCount += scenario.responsiveStateReset ? 1 : 0;
    metrics.duplicateRequestCount += Math.max(0, scenario.submittedRequestCount - 1);
    metrics.unhandledErrorCount += Math.max(0, scenario.unhandledErrorCount);
    metrics.horizontalOverflowCount += scenario.horizontalOverflow ? 1 : 0;
  }

  return metrics;
}

export function assertFinalQualityGate(
  metrics: FinalEvaluationMetrics,
  minimumScenarioCount = 80,
): void {
  if (metrics.scenarioCount < minimumScenarioCount) {
    throw new Error(
      `FINAL_QUALITY_GATE_TOO_FEW_SCENARIOS:${metrics.scenarioCount}/${minimumScenarioCount}`,
    );
  }
  const failures = violationMetricKeys.filter((key) => metrics[key] !== 0);
  if (failures.length) {
    throw new Error(`FINAL_QUALITY_GATE_FAILED:${failures.join(",")}`);
  }
}

function duplicateCount(values: readonly string[]): number {
  const normalized = values.map(normalize).filter(Boolean);
  return normalized.length - new Set(normalized).size;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").trim();
}

