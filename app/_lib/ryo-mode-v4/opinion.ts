import type { RyoModeScoreResult, RyoOpinion, RyoPreferenceVector, RyoSneakerFeatures } from "./types";
import { summarizeRyoPreferenceVector } from "./vector";

export function buildRyoOpinion(
  vector: RyoPreferenceVector,
  scoreResult: RyoModeScoreResult,
  features: RyoSneakerFeatures,
): RyoOpinion {
  const preference = summarizeRyoPreferenceVector(vector);
  const difference = Math.round((scoreResult.recommendationScore - scoreResult.productScore) * 10) / 10;
  const strongestSignals = scoreResult.matchedSignals.length > 0
    ? scoreResult.matchedSignals.slice(0, 3)
    : scoreResult.bonuses.slice(0, 3);
  const fitDescription = difference >= 8
    ? "靴単体の評価以上に、今回の服装・履き方との相性が強い候補です。"
    : difference <= -8
      ? "靴単体の魅力はありますが、今回の回答条件では推薦適合が下がります。"
      : "靴単体の魅力と今回の推薦適合はおおむね釣り合っています。";
  const budgetCeilingYen = preference.budgetCeilingYen;
  const budgetCaution = budgetCeilingYen !== undefined
    && features.estimatedPriceYen !== undefined
    && features.estimatedPriceYen > budgetCeilingYen;
  const caution = budgetCaution
    ? `推定価格が予算上限${budgetCeilingYen.toLocaleString("ja-JP")}円を超えています。価格と購入可能性を別途確認してください。`
    : scoreResult.cautionSignals.length > 0
      ? `注意点: ${scoreResult.cautionSignals.slice(0, 2).join("、")}。`
      : "大きな注意信号はありません。価格・在庫・購入可能性はこの判定の対象外です。";
  const pants = preference.dominantSignals.find((signal) => signal.includes("pants") || signal === "denim") ?? "選んだパンツ";

  return {
    summary: `${features.displayNameOfficial}はproductScore ${scoreResult.productScore}、recommendationScore ${scoreResult.recommendationScore}です。${fitDescription}`,
    strongestSignals: strongestSignals.length > 0 ? strongestSignals : ["deterministic core evaluation"],
    ryoInterpretation: `Ryo解釈では、${preference.dominantSignals.slice(0, 3).join("・") || "回答済みの好み"}と、靴の形・素材・育ち方のバランスを見ています。`,
    caution,
    nextStep: `${pants}と合わせた全身バランスを確認し、次に素材の経年変化と実売価格を比較してください。`,
  };
}
