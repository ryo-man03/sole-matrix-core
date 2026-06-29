import type {
  SatisfactionFeedback,
  SatisfactionFeedbackContext,
} from "./types";

export interface RecommendationFeedbackRepository {
  save(
    feedback: SatisfactionFeedback,
    context: SatisfactionFeedbackContext,
  ): Promise<void>;
  list(): Promise<SatisfactionFeedback[]>;
}

export class InMemoryRecommendationFeedbackRepository
  implements RecommendationFeedbackRepository
{
  private readonly entries: SatisfactionFeedback[] = [];

  async save(
    feedback: SatisfactionFeedback,
    _context: SatisfactionFeedbackContext,
  ): Promise<void> {
    this.entries.push(structuredClone(feedback));
  }

  async list(): Promise<SatisfactionFeedback[]> {
    return structuredClone(this.entries);
  }
}

export class GuestSessionFeedbackRepository
  implements RecommendationFeedbackRepository
{
  private readonly sessionEntries: SatisfactionFeedback[] = [];

  async save(
    feedback: SatisfactionFeedback,
    context: SatisfactionFeedbackContext,
  ): Promise<void> {
    if (context.sessionType !== "guest") {
      throw new Error("GUEST_REPOSITORY_REJECTS_USER_FEEDBACK");
    }
    this.sessionEntries.push(structuredClone(feedback));
  }

  async list(): Promise<SatisfactionFeedback[]> {
    return structuredClone(this.sessionEntries);
  }
}
