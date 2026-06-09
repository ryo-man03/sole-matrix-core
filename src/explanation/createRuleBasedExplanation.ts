import type {
  Decision,
  Demotion,
  RecommendationResult,
  ScoreBreakdown,
} from "../core/types";
import type { RuleBasedExplanation } from "./types";

type ScoreAxis = {
  key: NumericScoreKey;
  label: string;
};

type NumericScoreKey = Exclude<keyof ScoreBreakdown, "axisWeightsApplied">;

const scoreAxes: ScoreAxis[] = [
  { key: "cultureScore", label: "カルチャー面" },
  { key: "styleScore", label: "スタイル面" },
  { key: "simplicityScore", label: "シンプルさ" },
  { key: "streetScore", label: "ストリート感" },
  { key: "volumeScore", label: "ボリューム感" },
  { key: "comfortScore", label: "快適性" },
  { key: "durabilityScore", label: "耐久性" },
  { key: "featureFitScore", label: "特徴の相性" },
  { key: "priceScore", label: "価格評価" },
  { key: "nonOverlapScore", label: "所有靴との被りにくさ" },
];

const finalDecisionSummary: Record<Decision, string> = {
  STRONG_BUY:
    "この候補は総合スコアが非常に高く、現在の好みとの相性が強く出ているため、STRONG_BUY判定になりました。",
  BUY:
    "この候補は総合スコアが高く、現在の好みとの相性が比較的良いため、BUY判定になりました。",
  WAIT:
    "この候補は魅力がある一方で、いくつかの評価軸に注意点があるため、WAIT判定になりました。",
  WATCH:
    "この候補は一部に合う要素がありますが、総合的には様子見寄りのWATCH判定になりました。",
  SKIP:
    "この候補は現在の好みや条件との相性が弱めに出ているため、SKIP判定になりました。",
};

const demotionMessages: Record<Demotion, string> = {
  HIGH_CLOSET_OVERLAP:
    "所有靴との被りが強く出ているため、手持ちとの差別化には注意が必要です。",
  LOW_PRICE_FIT:
    "価格評価が低めに出ているため、条件との相性には注意が必要です。",
  LOW_COMFORT:
    "快適性の評価が低めに出ているため、履き心地を重視する場合は注意が必要です。",
  LOW_DURABILITY:
    "耐久性の評価が低めに出ているため、長く使う前提では注意が必要です。",
};

export function createRuleBasedExplanation(
  result: RecommendationResult
): RuleBasedExplanation {
  const reasons = createReasons(result.scoreBreakdown);
  const cautions = createCautions(result);
  const summary = createSummary(result);

  return {
    sneakerId: result.sneakerId,
    name: result.name,
    summary,
    reasons,
    cautions,
  };
}

function createSummary(result: RecommendationResult): string {
  const baseSummary = finalDecisionSummary[result.finalDecision];

  if (
    result.demotions.length > 0 &&
    result.rawDecision !== result.finalDecision
  ) {
    return `${baseSummary} ただし、注意点があるため、元の${result.rawDecision}判定から${result.finalDecision}判定に調整されています。`;
  }

  return baseSummary;
}

function createReasons(scoreBreakdown: ScoreBreakdown): string[] {
  const reasons = [
    `総合スコアは${formatScore(scoreBreakdown.finalScore)}です。`,
  ];

  const strongAxes = scoreAxes
    .map((axis) => ({
      ...axis,
      value: scoreBreakdown[axis.key],
    }))
    .filter((axis) => typeof axis.value === "number" && axis.value >= 70)
    .sort((left, right) => right.value - left.value)
    .slice(0, 2);

  for (const axis of strongAxes) {
    reasons.push(
      `${axis.label}の評価が${formatScore(axis.value)}と高めに出ています。`
    );
  }

  if (scoreBreakdown.tagBonus > 0) {
    reasons.push(
      `好みタグによる加点が${formatScore(scoreBreakdown.tagBonus)}あります。`
    );
  }

  return reasons;
}

function createCautions(result: RecommendationResult): string[] {
  const cautions = result.demotions.map(
    (demotion) => demotionMessages[demotion]
  );

  const weakAxes = scoreAxes
    .map((axis) => ({
      ...axis,
      value: result.scoreBreakdown[axis.key],
    }))
    .filter((axis) => typeof axis.value === "number" && axis.value < 45)
    .sort((left, right) => left.value - right.value)
    .slice(0, 2);

  for (const axis of weakAxes) {
    const caution = `${axis.label}の評価が${formatScore(axis.value)}と低めに出ています。`;

    if (!cautions.includes(caution)) {
      cautions.push(caution);
    }
  }

  if (
    result.demotions.length > 0 &&
    result.rawDecision !== result.finalDecision
  ) {
    cautions.push(
      `元の判定は${result.rawDecision}でしたが、注意点を反映して${result.finalDecision}になっています。`
    );
  }

  return cautions;
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? `${score}` : score.toFixed(1);
}
