import type { BalancedScore, CandidateProfile, Decision, PreferenceVector, RecommendationExplanation, RyoScore } from "./types";
import type { UntrustedUserMemoryContext } from "../user-memory/types";
import type { RyoSignatureMetadata } from "../ryo-mode-v4/types";

export type ExplanationInput = { decision: Decision; balancedScore: BalancedScore; ryoScore: RyoScore; candidate: CandidateProfile; preferenceVector: PreferenceVector; inputTags: string[]; budgetYen?: number; userMemoryContext?: UntrustedUserMemoryContext };

const decisionSummaries: Record<Decision, string> = {
  strong_buy: "好みとの相性と予算適合度が高く、前向きに比較検討できる候補です。",
  consider: "相性の良い要素があります。注意点と販売条件を確認しながら比較してください。",
  wait: "魅力はありますが、予算または情報の確認を待ってから判断したい候補です。",
  avoid: "現在の入力では注意点が相性を上回るため、優先度を下げたい候補です。",
  unknown: "判断に必要な情報が不足しています。商品情報を追加して再評価してください。",
};

export function createRuleBasedExplanation(input: ExplanationInput): RecommendationExplanation {
  const signature = input.candidate.ryoMetadata?.ryoSignature;
  const reasons = [`Balanced Scoreは${formatScore(input.balancedScore.total)}です。`, `Ryo Scoreは${formatScore(input.ryoScore.total)}です。`];
  if (input.balancedScore.featureFit >= 70) reasons.push("8問診断の好みと候補の特徴が広い範囲で合っています。");
  if (input.ryoScore.classicRetroFit >= 70) reasons.push("クラシック・レトロの方向に相性があります。");
  if (input.ryoScore.calmStyleFit >= 70) reasons.push("落ち着いた日常スタイルに合わせやすい傾向があります。");
  if (signature) reasons.push(...buildRyoSignatureExplanationReasons(signature));
  const cautions = ["価格・在庫・サイズ・真贋・購入可能性は販売元で確認してください。"];
  if (signature?.ownedReferenceMatches.length) cautions.push(`所有済み参照に近い候補です: ${signature.ownedReferenceMatches.join(" / ")}。同一ペアとしてではなく、好みの軸として扱ってください。`);
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

function buildRyoSignatureExplanationReasons(signature: RyoSignatureMetadata): string[] {
  const reasons = [`Ryo Signature bucket: ${signature.bucket}.`];
  if (signature.ryoTwistBonus + signature.archiveContextBonus > 0) {
    reasons.push("アーカイブ、復刻、日本製、兄弟モデルなどの文脈があり、ただの定番より個人の好みに寄っています。");
  }
  if (signature.materialStoryBonus > 0) {
    reasons.push("革のシワ、スエードの毛並み、キャンバスの退色、ソールの変化など、素材の育ち方を評価しています。");
  }
  if (signature.adjacentDiscoveryBonus > 0) {
    reasons.push("既に好きな定番軸の近くにある、同一ではない隣接発見として評価しています。");
  }
  if (signature.colorPersonalityBonus > 0) {
    reasons.push("履きやすさを残したまま、色で少し外した面白さがあります。");
  }
  if (signature.obviousnessPenalty > 0) {
    reasons.push("分かりやすい定番が知名度だけで勝ちすぎないように調整しています。");
  }
  return reasons.slice(0, 4);
}

function toneForDecision(decision: Decision): RecommendationExplanation["finalTone"] {
  if (decision === "strong_buy") return "positive";
  if (decision === "consider") return "balanced";
  if (decision === "wait") return "cautious";
  if (decision === "avoid") return "negative";
  return "unknown";
}

function formatScore(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
