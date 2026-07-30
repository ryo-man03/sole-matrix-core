import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildCandidatePresentation,
  VerifiedCandidateResult,
} from "../../_components/VerifiedCandidateResult";
import type { CandidateProfile } from "./types";
import {
  createExplanationTrustEvaluation,
  createFactualVerification,
  createRecommendationTrustEvaluation,
} from "../recommendation-trust/evaluation";

describe("verified candidate result UI", () => {
  it("presents the candidate as the primary recommendation", () => {
    const html = renderToStaticMarkup(
      createElement(VerifiedCandidateResult, {
        candidate: createCandidate(),
        decisionLabel: "おすすめ候補",
      }),
    );
    expect(html).toContain("あなたへの本命");
  });

  it("shows a verified Gemini model, colorway, style code, and safe evidence links", () => {
    const candidate = createCandidate({
      researchSource: "gemini",
      verificationStatus: "model_and_colorway_verified",
      sourceQuality: "official",
      colorwayName: "White / Black / Varsity Red",
      styleCode: "DZ5485-106",
      modelEvidenceUrls: ["https://www.nike.com/jp/t/air-jordan-1-retro-high-og"],
      colorwayEvidenceUrls: ["https://www.nike.com/jp/t/air-jordan-1-retro-high-og"],
      styleCodeEvidenceUrls: ["https://www.nike.com/jp/t/air-jordan-1-retro-high-og"],
      evidenceUrls: [
        "https://www.nike.com/jp/t/air-jordan-1-retro-high-og",
        "https://www.atmos-tokyo.com/item/nike/dz5485-106",
        "https://sneakernews.com/air-jordan-1-dz5485-106",
        "javascript:alert(1)",
      ],
    });
    const html = renderToStaticMarkup(
      createElement(VerifiedCandidateResult, { candidate, decisionLabel: "CONSIDER" }),
    );

    expect(html).toContain("モデル・カラー確認済み");
    expect(html).toContain("White / Black / Varsity Red");
    expect(html).toContain("DZ5485-106");
    expect(html).toContain("根拠の主な出典種別: 公式");
    expect(html).toContain("nike.com");
    expect(html).toContain("atmos-tokyo.com");
    expect(html).toContain("sneakernews.com");
    expect(html).toContain("残りの根拠を見る");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("javascript:");
  });

  it("never displays an unverified Gemini colorway or style code", () => {
    const candidate = createCandidate({
      name: "ASICS GEL-KAYANO 14 Imaginary Exclusive",
      modelName: "ASICS GEL-KAYANO 14",
      colorwayName: "Imaginary Exclusive",
      styleCode: "FAKE-001",
      researchSource: "gemini",
      verificationStatus: "model_verified_colorway_unverified",
      sourceQuality: "reputable_media",
    });
    const presentation = buildCandidatePresentation(candidate);
    const html = renderToStaticMarkup(
      createElement(VerifiedCandidateResult, { candidate, decisionLabel: "WAIT" }),
    );

    expect(presentation.modelName).toBe("ASICS GEL-KAYANO 14");
    expect(presentation.colorwayName).toBeNull();
    expect(presentation.styleCode).toBeNull();
    expect(html).toContain("モデル確認済み・カラー未確認");
    expect(html).toContain("配色: 実在確認できず");
    expect(html).not.toContain("Imaginary Exclusive");
    expect(html).not.toContain("FAKE-001");
  });

  it("labels fallback and Ryo anchor candidates as Core candidates without asserting an unverified color", () => {
    expect(buildCandidatePresentation(createCandidate({
      researchSource: "fallback_catalog",
      verificationStatus: "unverified",
    })).badge).toBe("Core候補");
    expect(buildCandidatePresentation(createCandidate({
      researchSource: "ryo_anchor",
      verificationStatus: "unverified",
      colorwayName: "Core curated color",
    }))).toMatchObject({
      badge: "Core候補",
      colorwayName: null,
    });
  });

  it("keeps a very long verified model name intact for responsive wrapping", () => {
    const longModelName =
      "New Balance Made in USA 990 Version 6 Extremely Long Collaborative Archive Edition";
    const html = renderToStaticMarkup(
      createElement(VerifiedCandidateResult, {
        candidate: createCandidate({ modelName: longModelName }),
        decisionLabel: "CONSIDER",
      }),
    );
    expect(html).toContain(longModelName);
    expect(html).toContain("verified-candidate-result");
  });

  it("renders a concise AI Trust Report from the server-side evaluation", () => {
    const factual = createFactualVerification({
      model: "officially_verified",
      colorway: "unverified",
      styleCode: "unverified",
      modelEvidence: [],
      colorwayEvidence: [],
      styleCodeEvidence: [],
      unsupportedClaims: [],
      contradictions: [],
    });
    const trustEvaluation = createRecommendationTrustEvaluation({
      factual,
      diagnosisFitScore: 82,
      ryoAuthenticity: {
        historyFit: 70,
        materialStoryFit: 65,
        outfitFit: 80,
        culturalFit: 75,
        adjacentDiscoveryFit: 60,
        collectionRoleFit: 78,
        wearableColorFit: 50,
        tooSafePenalty: 0,
        hypeOnlyPenalty: 0,
        contextMismatchPenalty: 0,
        total: 74,
        rubricVersion: "test-v1",
        reasons: [],
        penalties: [],
        matchedGoldRules: [],
      },
      explanationTrust: createExplanationTrustEvaluation([{
        id: "unsupported",
        text: "裏付けなし",
        kind: "unsupported",
        evidenceUrls: [],
        supportingScoreKeys: [],
        supportingCandidateFields: [],
        contradictionReasons: [],
      }]),
    });
    const html = renderToStaticMarkup(createElement(VerifiedCandidateResult, {
      candidate: createCandidate({ trustEvaluation }),
      decisionLabel: "CONSIDER",
    }));
    expect(html).toContain("AI Trust Report: 一部確認済み");
    expect(html).toContain("表示から除外した説明");
    expect(html).toContain("<dd>1件</dd>");
  });
});

function createCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate-1",
    name: "Air Jordan 1 Retro High OG",
    brand: "Nike",
    modelName: "Air Jordan 1 Retro High OG",
    source: "local",
    description: "11問と購入文脈から選んだ候補です。",
    tags: [],
    vector: {
      culture: 70,
      styleFit: 75,
      simplicity: 55,
      street: 80,
      volume: 50,
      comfort: 60,
      durability: 70,
      priceLevel: 65,
    },
    budgetFit: 70,
    risk: "low",
    informationCompleteness: 90,
    readiness: "ready_external",
    researchSource: "gemini",
    verificationStatus: "model_and_colorway_verified",
    sourceQuality: "official",
    colorwayName: "White / Black / Varsity Red",
    styleCode: "DZ5485-106",
    ...overrides,
  };
}
