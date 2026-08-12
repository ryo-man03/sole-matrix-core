import { describe, expect, it } from "vitest";
import { detectRecommendationFeedbackOwnership, type RecommendationFeedbackAttempt } from "./feedbackOwnershipDetector";

const ownAttempt: RecommendationFeedbackAttempt = {
  authenticatedUserId: "user-a",
  feedbackUserId: "user-a",
  snapshotId: "snapshot-a",
  snapshot: { id: "snapshot-a", userId: "user-a" },
};

describe("recommendation feedback ownership detector", () => {
  it("keeps all ownership counters at zero for an owned snapshot", () => {
    expect(detectRecommendationFeedbackOwnership([ownAttempt])).toEqual({
      crossUserRecommendationFeedbackLinkCount: 0,
      crossUserWriteCount: 0,
    });
  });

  it("detects a feedback row linked to another user's snapshot", () => {
    const result = detectRecommendationFeedbackOwnership([{
      ...ownAttempt,
      snapshot: { id: "snapshot-a", userId: "user-b" },
    }]);
    expect(result.crossUserRecommendationFeedbackLinkCount).toBeGreaterThan(0);
    expect(result.crossUserWriteCount).toBeGreaterThan(0);
  });

  it("detects an authenticated user writing a feedback row as another user", () => {
    const result = detectRecommendationFeedbackOwnership([{
      ...ownAttempt,
      feedbackUserId: "user-b",
      snapshot: { id: "snapshot-a", userId: "user-b" },
    }]);
    expect(result.crossUserWriteCount).toBeGreaterThan(0);
  });

  it("does not misclassify a missing snapshot as a cross-user data leak", () => {
    expect(detectRecommendationFeedbackOwnership([{ ...ownAttempt, snapshot: null }])).toEqual({
      crossUserRecommendationFeedbackLinkCount: 0,
      crossUserWriteCount: 0,
    });
  });
});
