import type {
  Decision,
  ModeDecision,
  RecommendationMode,
} from "../core-v1/types";

export type LocalUserProfile = {
  userId: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

export type LocalUserFeedback = {
  createdAt: string;
  sneakerName: string;
  mode: RecommendationMode;
  decision: ModeDecision | Decision;
  balancedScore: number;
  ryoScore: number;
  userRating: number;
  userComment: string;
};

export type UserMemorySummary = {
  profile: LocalUserProfile;
  diagnosisHistoryCount: number;
  feedbackHistory: LocalUserFeedback[];
  learnedNoteCount: number;
};

export type UntrustedUserMemoryContext = {
  source: "user_memory";
  trust: "untrusted_user_data";
  content: string;
};
