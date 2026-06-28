import type {
  BalancedScore,
  CandidateProfile,
  Decision,
  PreferenceVector,
  RecommendationExplanation,
  RyoScore,
} from "./types";
import type { UntrustedUserMemoryContext } from "../user-memory/types";

export type ExplanationInput = {
  decision: Decision;
  balancedScore: BalancedScore;
  ryoScore: RyoScore;
  candidate: CandidateProfile;
  preferenceVector: PreferenceVector;
  inputTags: string[];
  budgetYen?: number;
  userMemoryContext?: UntrustedUserMemoryContext;
};

const decisionSummaries: Record<Decision, string> = {
  strong_buy:
    "総合的な合わせやすさとあなたらしさがともに高く、前向きに検討しやすい仮候補です。",
  consider:
    "相性のよい要素が複数あります。条件を確認しながら検討したい仮候補です。",
  wait: "魅力はありますが、予算または情報の確認を待ってから判断したい仮候補です。",
  avoid:
    "現在の入力では相性より注意点が上回るため、優先度を下げたい仮候補です。",
  unknown:
    "判断に必要な情報がまだ不足しています。入力を増やして再評価してください。",
};

export function createRuleBasedExplanation(
  input: ExplanationInput,
): RecommendationExplanation {
  const reasons = [
    `Balanced Score は ${formatScore(input.balancedScore.total)} です。`,
    `Ryo Score は ${formatScore(input.ryoScore.total)} です。`,
  ];

  if (input.balancedScore.featureFit >= 70) {
    reasons.push("診断ベクトルと候補の特徴が広い範囲で合っています。");
  }

  if (input.ryoScore.classicRetroFit >= 70) {
    reasons.push("クラシック／レトロの文脈に納得感があります。");
  }

  if (input.ryoScore.calmStyleFit >= 70) {
    reasons.push("落ち着いて合わせやすいスタイルとの相性が良好です。");
  }

  const cautions = [
    "外部検索結果ではなく、診断結果をもとにしたローカルの仮候補です。",
  ];

  if (input.balancedScore.budgetFit < 60) {
    cautions.push("入力予算との適合度が低いため、実際の価格確認が必要です。");
  }

  if (input.candidate.informationCompleteness < 70) {
    cautions.push("候補情報が限定的なため、素材や履き心地の確認が必要です。");
  }

  return {
    source: "rule_based",
    summary: decisionSummaries[input.decision],
    reasons,
    cautions,
    balancedView: `一般的な合わせやすさ・予算適合・情報量をまとめた評価は ${formatScore(input.balancedScore.total)} です。`,
    ryoView: `文化背景やクラシック感、ストリート感を含む個人相性の評価は ${formatScore(input.ryoScore.total)} です。`,
    finalTone: toneForDecision(input.decision),
  };
}

function toneForDecision(
  decision: Decision,
): RecommendationExplanation["finalTone"] {
  switch (decision) {
    case "strong_buy":
      return "positive";
    case "consider":
      return "balanced";
    case "wait":
      return "cautious";
    case "avoid":
      return "negative";
    case "unknown":
      return "unknown";
  }
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
