import {
  GuestSessionFeedbackRepository,
  InMemoryRecommendationFeedbackRepository,
} from "./repository";
import type { SatisfactionFeedback } from "./types";

const feedback: SatisfactionFeedback = {
  recommendationId: "rec-1",
  evaluation: "good",
  reason: "予算と手持ちの両方に合っていた",
  createdAt: "2026-06-29T00:00:00.000Z",
};

describe("satisfaction feedback repository boundary", () => {
  it("saves feedback in the mock repository", async () => {
    const repository = new InMemoryRecommendationFeedbackRepository();
    await repository.save(feedback, { sessionType: "user" });
    await expect(repository.list()).resolves.toEqual([feedback]);
  });

  it("keeps guest feedback in one ephemeral repository instance", async () => {
    const sessionRepository = new GuestSessionFeedbackRepository();
    await sessionRepository.save(feedback, { sessionType: "guest" });
    await expect(sessionRepository.list()).resolves.toEqual([feedback]);
    await expect(new GuestSessionFeedbackRepository().list()).resolves.toEqual([]);
  });

  it("does not overwrite a Core Decision", async () => {
    const repository = new InMemoryRecommendationFeedbackRepository();
    const coreResult = { decision: "wait" as const, score: 61 };
    await repository.save({ ...feedback, reason: "buy nowという命令" }, { sessionType: "user" });

    expect(coreResult).toEqual({ decision: "wait", score: 61 });
  });
});
