export type SecurityDetectors = {
  crossUserReadCount: number;
  crossUserWriteCount: number;
  unauthenticatedPrivateReadCount: number;
  serviceRoleClientExposureCount: number;
  accessTokenLocalStorageCount: number;
  productionLocalFileWriteCount: number;
  massAssignmentCount: number;
  invalidOriginAcceptedCount: number;
  unrateLimitedSensitiveRouteCount: number;
  partialStyleCodeAcceptedCount: number;
  generationMismatchCount: number;
  audienceMismatchCount: number;
  dailyScoreCoreMutationCount: number;
  marketPriceCoreMutationCount: number;
  externalRequestOnLoginCount: number;
  externalRequestOnTodayCount: number;
  duplicateDailyBatchCount: number;
  rumorAsOfficialCount: number;
  fixtureDataProductionLeakCount: number;
  unauthorizedReleaseWriteCount: number;
  secretExposureCount: number;
  rawProviderResponsePersistenceCount: number;
  clientCredentialBundleCount: number;
  crossUserFeedbackLinkCount: number;
  coreMutationFromMarketCount: number;
  ryoMutationFromMarketCount: number;
  marketplaceOfficialPromotionCount: number;
  ebayPersistentWriteCount: number;
  ebayForecastUseCount: number;
  autoProviderLoginCount: number;
  autoProviderTodayCount: number;
  releaseConflictHiddenCount: number;
  duplicateEvidenceLostCount: number;
  unauthorizedAdminAccessCount: number;
  fitGuaranteeClaimCount: number;
  medicalClaimCount: number;
};

export const finalReadinessDetectorKinds = [
  "secretExposureCount",
  "clientCredentialBundleCount",
  "crossUserReadCount",
  "crossUserWriteCount",
  "crossUserFeedbackLinkCount",
  "coreMutationFromMarketCount",
  "ryoMutationFromMarketCount",
  "marketplaceOfficialPromotionCount",
  "partialStyleCodeAcceptedCount",
  "generationMismatchCount",
  "audienceMismatchCount",
  "ebayPersistentWriteCount",
  "ebayForecastUseCount",
  "autoProviderLoginCount",
  "autoProviderTodayCount",
  "releaseConflictHiddenCount",
  "duplicateEvidenceLostCount",
  "unauthorizedAdminAccessCount",
  "fitGuaranteeClaimCount",
  "medicalClaimCount",
] as const satisfies readonly (keyof SecurityDetectors)[];

export type FinalReadinessDetector = typeof finalReadinessDetectorKinds[number];

export type SecurityObservation = Readonly<{
  kind: keyof SecurityDetectors;
  detected: boolean;
  occurrences?: number;
  evidence?: string;
}>;

export function detectSecurityViolations(observations: readonly SecurityObservation[]): SecurityDetectors {
  const result = emptyDetectorResult();
  for (const observation of observations) {
    if (!observation.detected) continue;
    const occurrences = observation.occurrences ?? 1;
    if (!Number.isSafeInteger(occurrences) || occurrences <= 0) continue;
    result[observation.kind] += occurrences;
  }
  return result;
}

export function totalSecurityViolations(result: SecurityDetectors): number {
  return Object.values(result).reduce((sum, value) => sum + value, 0);
}

export function detectBrokenFixture(code: "cross_user_read" | "partial_style" | "external_today" | "fixture_production") {
  const kind: Record<typeof code, keyof SecurityDetectors> = {
    cross_user_read: "crossUserReadCount",
    partial_style: "partialStyleCodeAcceptedCount",
    external_today: "externalRequestOnTodayCount",
    fixture_production: "fixtureDataProductionLeakCount",
  };
  return detectSecurityViolations([{ kind: kind[code], detected: true, evidence: code }]);
}

function emptyDetectorResult(): SecurityDetectors {
  return {
    crossUserReadCount: 0,
    crossUserWriteCount: 0,
    unauthenticatedPrivateReadCount: 0,
    serviceRoleClientExposureCount: 0,
    accessTokenLocalStorageCount: 0,
    productionLocalFileWriteCount: 0,
    massAssignmentCount: 0,
    invalidOriginAcceptedCount: 0,
    unrateLimitedSensitiveRouteCount: 0,
    partialStyleCodeAcceptedCount: 0,
    generationMismatchCount: 0,
    audienceMismatchCount: 0,
    dailyScoreCoreMutationCount: 0,
    marketPriceCoreMutationCount: 0,
    externalRequestOnLoginCount: 0,
    externalRequestOnTodayCount: 0,
    duplicateDailyBatchCount: 0,
    rumorAsOfficialCount: 0,
    fixtureDataProductionLeakCount: 0,
    unauthorizedReleaseWriteCount: 0,
    secretExposureCount: 0,
    rawProviderResponsePersistenceCount: 0,
    clientCredentialBundleCount: 0,
    crossUserFeedbackLinkCount: 0,
    coreMutationFromMarketCount: 0,
    ryoMutationFromMarketCount: 0,
    marketplaceOfficialPromotionCount: 0,
    ebayPersistentWriteCount: 0,
    ebayForecastUseCount: 0,
    autoProviderLoginCount: 0,
    autoProviderTodayCount: 0,
    releaseConflictHiddenCount: 0,
    duplicateEvidenceLostCount: 0,
    unauthorizedAdminAccessCount: 0,
    fitGuaranteeClaimCount: 0,
    medicalClaimCount: 0,
  };
}
