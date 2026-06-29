import type { SneakerVisualAnalysis } from "../image-analysis/types";
import type { ExternalVisualEvidence } from "./types";

export function createExternalVisualEvidence(
  analysis: SneakerVisualAnalysis,
): ExternalVisualEvidence {
  const identification =
    analysis.detectedBrand || analysis.detectedModelName
      ? "estimated"
      : "unknown";
  const confidenceLabel =
    analysis.confidence < 0.6
      ? "uncertain"
      : analysis.confidence < 0.8
        ? "moderate"
        : "high";
  const summaryParts = [
    analysis.detectedBrand,
    analysis.detectedModelName,
    analysis.detectedColorway,
    ...analysis.mainColors.slice(0, 3),
    analysis.category !== "unknown" ? analysis.category : undefined,
  ].filter((value): value is string => Boolean(value));
  const warnings = [
    ...analysis.cautions,
    "画像分析は外部の視覚証拠であり、商品同定を確定しません。",
    ...(confidenceLabel === "uncertain"
      ? ["confidenceが低いため、この画像分析は不確かです。"]
      : []),
  ];

  return {
    kind: "external_visual_analysis",
    provider: "gemini",
    identification,
    summary: summaryParts.join(" / ") || "視覚特徴を特定できませんでした。",
    confidence: analysis.confidence,
    confidenceLabel,
    warnings: [...new Set(warnings)],
    coreDecisionImpact: "none",
  };
}
