import type { BalancedScore, CandidateProfile, Decision, PreferenceVector, RecommendationExplanation, RyoScore } from "./types";
import type { UntrustedUserMemoryContext } from "../user-memory/types";

export type ExplanationInput = { decision: Decision; balancedScore: BalancedScore; ryoScore: RyoScore; candidate: CandidateProfile; preferenceVector: PreferenceVector; inputTags: string[]; budgetYen?: number; userMemoryContext?: UntrustedUserMemoryContext };

const decisionSummaries: Record<Decision, string> = {
  strong_buy: "好みとの相性と予算適合度が高く、前向きに比較検討できる候補です。",
  consider: "相性の良い要素があります。注意点と販売条件を確認しながら比較してください。",
  wait: "魅力はありますが、予算または情報の確認を待ってから判断したい候補です。",
  avoid: "現在の入力では注意点が相性を上回るため、優先度を下げたい候補です。",
  unknown: "判断に必要な情報が不足しています。商品情報を追加して再評価してください。",
};

export function createRuleBasedExplanation(input: ExplanationInput): RecommendationExplanation {
  const reasons = [`Balanced Scoreは${formatScore(input.balancedScore.total)}です。`, `Ryo Scoreは${formatScore(input.ryoScore.total)}です。`];
  if (input.balancedScore.featureFit >= 70) reasons.push("8問診断の好みと候補の特徴が広い範囲で合っています。");
  if (input.ryoScore.classicRetroFit >= 70) reasons.push("クラシック・レトロの方向に相性があります。");
  if (input.ryoScore.calmStyleFit >= 70) reasons.push("落ち着いた日常スタイルに合わせやすい傾向があります。");
  const cautions = ["価格・在庫・サイズ・真贋・購入可能性は販売元で確認してください。"];
  if (input.balancedScore.budgetFit < 60) cautions.push("予算適合度が低いため、実際の販売価格を確認してください。");
  if (input.candidate.informationCompleteness < 70) cautions.push("候補情報が限定的なため、素材や履き心地を追加確認してください。");
  return {
    source: "rule_based",
    summary: decisionSummaries[input.decision],
    reasons,
    cautions,
    balancedView: `汎用性・予算・情報の確かさをまとめた評価は${formatScore(input.balancedScore.total)}です。`,
    ryoView: `文化的背景やスタイルの好みを含む評価は${formatScore(input.ryoScore.total)}です。`,
    finalTone: toneForDecision(input.decision),
  };
}

function toneForDecision(decision: Decision): RecommendationExplanation["finalTone"] {
  if (decision === "strong_buy") return "positive";
  if (decision === "consider") return "balanced";
  if (decision === "wait") return "cautious";
  if (decision === "avoid") return "negative";
  return "unknown";
}

function formatScore(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
