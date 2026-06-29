import type { SneakerUrlAnalysis } from "../url-analysis/types";
import type { ExternalUrlEvidence } from "./types";

export function createExternalUrlEvidence(
  analysis: SneakerUrlAnalysis,
): ExternalUrlEvidence {
  const confidenceLabel =
    analysis.confidence < 0.6
      ? "uncertain"
      : analysis.confidence < 0.8
        ? "moderate"
        : "high";
  const domain = safeDomain(
    analysis.finalUrl ?? analysis.canonicalUrl ?? analysis.inputUrl,
  );
  const summary = [analysis.title, analysis.description]
    .filter((value): value is string => Boolean(value))
    .join(" — ")
    .slice(0, 500);
  const warnings = [
    ...analysis.cautions,
    "URL分析は外部証拠であり、商品情報や購入判断を確定しません。",
    ...(confidenceLabel === "uncertain"
      ? ["confidenceが低いため、このURL分析は不確かです。"]
      : []),
  ];

  return {
    kind: "external_url_analysis",
    provider: analysis.source ?? "metadata",
    domain,
    summary: summary || "URLから十分な商品情報を取得できませんでした。",
    confidence: analysis.confidence,
    confidenceLabel,
    warnings: [...new Set(warnings)],
    coreDecisionImpact: "none",
  };
}

function safeDomain(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "unknown-domain";
  }
}
