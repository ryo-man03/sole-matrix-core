export type SatisfactionEvaluation = "good" | "neutral" | "bad";

export type SatisfactionFeedback = {
  recommendationId: string;
  evaluation: SatisfactionEvaluation;
  reason: string;
  createdAt: string;
};

export type SatisfactionFeedbackContext = {
  sessionType: "guest" | "user";
};
