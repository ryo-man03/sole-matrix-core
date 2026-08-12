export type RecommendationFeedbackAttempt = {
  authenticatedUserId: string;
  feedbackUserId: string;
  snapshotId: string;
  snapshot: { id: string; userId: string } | null;
};

export type RecommendationFeedbackOwnershipDetectors = {
  crossUserRecommendationFeedbackLinkCount: number;
  crossUserWriteCount: number;
};

export function detectRecommendationFeedbackOwnership(
  attempts: readonly RecommendationFeedbackAttempt[],
): RecommendationFeedbackOwnershipDetectors {
  const detectors: RecommendationFeedbackOwnershipDetectors = {
    crossUserRecommendationFeedbackLinkCount: 0,
    crossUserWriteCount: 0,
  };

  for (const attempt of attempts) {
    if (attempt.authenticatedUserId !== attempt.feedbackUserId) {
      detectors.crossUserWriteCount += 1;
    }
    if (
      attempt.snapshot
      && attempt.snapshot.id === attempt.snapshotId
      && attempt.snapshot.userId !== attempt.feedbackUserId
    ) {
      detectors.crossUserRecommendationFeedbackLinkCount += 1;
      detectors.crossUserWriteCount += 1;
    }
  }

  return detectors;
}
