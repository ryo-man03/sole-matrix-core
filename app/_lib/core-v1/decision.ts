import type {
  BalancedScore,
  CandidateReadiness,
  CandidateRisk,
  Decision,
  RyoScore,
} from "./types";

export function decideRecommendation(input: {
  balancedScore: BalancedScore;
  ryoScore: RyoScore;
  budgetFit: number;
  risk: CandidateRisk;
  informationCompleteness: number;
  readiness: CandidateReadiness;
}): Decision {
  const {
    balancedScore,
    ryoScore,
    budgetFit,
    risk,
    informationCompleteness,
    readiness,
  } = input;

  if (readiness === "not_ready" || informationCompleteness < 35) {
    return "unknown";
  }

  if (
    risk === "high" &&
    balancedScore.total < 55 &&
    ryoScore.total < 55
  ) {
    return "avoid";
  }

  if (budgetFit < 45 || informationCompleteness < 55) {
    return "wait";
  }

  if (
    balancedScore.total >= 78 &&
    ryoScore.total >= 72 &&
    budgetFit >= 70 &&
    risk === "low" &&
    readiness === "ready_local"
  ) {
    return "strong_buy";
  }

  if (balancedScore.total >= 60 || ryoScore.total >= 60) {
    return "consider";
  }

  return risk === "high" ? "avoid" : "wait";
}
