import type { UserSneakerContext } from "../diagnosis/sneakerContext";
import type {
  CandidateProfile,
  RecommendationExplanation,
} from "../core-v1/types";
import type { RyoScoreBreakdownV2 } from "../ryo-mode-v4/types";
import { createExplanationTrustEvaluation } from "./evaluation";
import type {
  ExplanationClaim,
  ExplanationClaimKind,
  ExplanationTrustEvaluation,
} from "./types";

export type ExplanationAuditInput = {
  candidate: CandidateProfile;
  explanation: RecommendationExplanation;
  scoreBreakdown?: RyoScoreBreakdownV2;
  context?: UserSneakerContext;
  budgetYen?: number;
};

export type ExplanationAuditResult = {
  evaluation: ExplanationTrustEvaluation;
  displayClaims: ExplanationClaim[];
};

const factualPattern = /由来|素材|レザー|スエード|キャンバス|カラー|配色|made in|アーカイブ|復刻|high|low|ハイカット|ローカット|バスケット|ランニング/iu;
const inferencePattern = /回答|診断|予算|パンツ|服|合わせ|相性|適合|日常|選びやす|履きやす|使いやす/iu;
const editorialPattern = /ryo|定番から|外し|ズラし|育てる|コレクション|二足目|発見|遊び/iu;
const concreteColorPattern = /\b(?:black|white|navy|olive|red|blue|green|orange|cream|gum|grey|gray|brown|burgundy)\b|白黒|真っ白|黒白/iu;

export function auditRecommendationExplanation(
  input: ExplanationAuditInput,
): ExplanationAuditResult {
  const texts = uniqueText([
    ...input.explanation.reasons,
    ...input.explanation.cautions,
    input.explanation.summary,
  ]);
  const claims = texts.map((text, index) => auditClaim(text, index, input));
  const evaluation = createExplanationTrustEvaluation(claims);
  return {
    evaluation,
    displayClaims: evaluation.claims
      .filter((claim) => claim.kind !== "unsupported" && claim.contradictionReasons.length === 0)
      .slice(0, 4),
  };
}

function auditClaim(
  text: string,
  index: number,
  input: ExplanationAuditInput,
): ExplanationClaim {
  const contradictionReasons = detectExplanationContradictions(text, input);
  const kind = classifyClaim(text, input, contradictionReasons);
  return {
    id: `claim-${index + 1}`,
    text,
    kind,
    evidenceUrls: kind === "verified_fact" ? evidenceUrlsFor(text, input.candidate) : [],
    supportingScoreKeys: kind === "core_inference"
      ? scoreKeysFor(text, input.scoreBreakdown)
      : [],
    supportingCandidateFields: candidateFieldsFor(text, input.candidate),
    contradictionReasons,
  };
}

function classifyClaim(
  text: string,
  input: ExplanationAuditInput,
  contradictions: readonly string[],
): ExplanationClaimKind {
  if (contradictions.length) return "unsupported";
  if (factualPattern.test(text)) {
    return evidenceUrlsFor(text, input.candidate).length ? "verified_fact" : "unsupported";
  }
  if (inferencePattern.test(text)) return "core_inference";
  if (editorialPattern.test(text)) return "ryo_editorial";
  return input.explanation.source === "rule_based" ? "core_inference" : "unsupported";
}

export function detectExplanationContradictions(
  text: string,
  input: ExplanationAuditInput,
): string[] {
  const candidateText = [
    input.candidate.name,
    input.candidate.modelName,
    input.candidate.modelType,
    input.candidate.description,
    ...(input.candidate.ryoMetadata?.materialSignals ?? []),
  ].filter(Boolean).join(" ").toLocaleLowerCase("ja-JP");
  const contradictions: string[] = [];
  const hasCanvas = input.candidate.tags.includes("canvas") || /canvas|キャンバス/u.test(candidateText);
  const hasLeather = /leather|レザー/u.test(candidateText);
  const hasSuede = /suede|スエード|スウェード/u.test(candidateText);
  if (hasCanvas && /レザーの履きジワ|leather creas/iu.test(text)) {
    contradictions.push("キャンバス候補にレザーの履きジワ説明があります。");
  }
  if ((hasLeather || hasSuede) && /キャンバス.*(?:退色|色落ち)|canvas fad/iu.test(text)) {
    contradictions.push("レザー／スエード候補にキャンバス退色の説明があります。");
  }
  if (/\blow\b|ロー(?:カット)?/iu.test(candidateText) && /\bhigh\b|ハイカット/iu.test(text)) {
    contradictions.push("Low候補をHighカットとして説明しています。");
  }
  if (/\bhigh\b|ハイカット/iu.test(candidateText) && /\blow\b|ローカット/iu.test(text)) {
    contradictions.push("High候補をLowカットとして説明しています。");
  }
  if (
    concreteColorPattern.test(text) &&
    input.candidate.verificationStatus !== "model_and_colorway_verified"
  ) {
    contradictions.push("未確認カラーを具体的に断定しています。");
  }
  if (input.candidate.tags.includes("running") && /バスケット(?:ボール)?由来|basketball origin/iu.test(text)) {
    contradictions.push("ランニング候補をバスケットボール由来として説明しています。");
  }
  if (input.candidate.tags.includes("basketball") && /ランニング由来|running origin/iu.test(text)) {
    contradictions.push("バスケットボール候補をランニング由来として説明しています。");
  }
  if (!/made in (?:usa|uk)|米国製|英国製/iu.test(candidateText) && /made in (?:usa|uk)|米国製|英国製/iu.test(text)) {
    contradictions.push("生産国の根拠がないMade説明です。");
  }
  if (input.candidate.tags.includes("running") && /古いローテク|純ローテク/iu.test(text) && !input.candidate.tags.includes("low_tech")) {
    contradictions.push("テクノロジー区分と説明が一致しません。");
  }
  if (input.context?.ownedModels.some((model) => comparable(input.candidate.name).includes(comparable(model))) &&
      /新しい発見|初めての選択肢/iu.test(text)) {
    contradictions.push("所有モデル重複を新しい発見として説明しています。");
  }
  if (
    input.budgetYen &&
    input.candidate.priceYen &&
    input.candidate.priceYen > input.budgetYen * 1.3 &&
    /買いやす|予算内|手頃/iu.test(text)
  ) {
    contradictions.push("予算を大幅に超える候補を買いやすいと説明しています。");
  }
  if (
    (input.candidate.researchSource === "fallback_catalog" || input.candidate.researchSource === "ryo_anchor") &&
    /gemini.*(?:確認|検証)|AI.*(?:確認|検証)/iu.test(text)
  ) {
    contradictions.push("Core fallbackをGemini確認済みとして説明しています。");
  }
  return [...new Set(contradictions)];
}

function evidenceUrlsFor(text: string, candidate: CandidateProfile): string[] {
  const urls = new Set<string>();
  if (/カラー|配色|black|white|navy|olive|cream|gum/iu.test(text)) {
    candidate.colorwayEvidenceUrls?.forEach((url) => urls.add(url));
  }
  if (/style code|sku|品番/iu.test(text)) {
    candidate.styleCodeEvidenceUrls?.forEach((url) => urls.add(url));
  }
  if (factualPattern.test(text)) {
    candidate.modelEvidenceUrls?.forEach((url) => urls.add(url));
  }
  return [...urls];
}

function scoreKeysFor(
  text: string,
  score: RyoScoreBreakdownV2 | undefined,
): string[] {
  if (!score) return [];
  return [
    /回答|診断|相性|適合/iu.test(text) ? "userFitScore" : null,
    /予算|日常|選びやす|履きやす|使いやす/iu.test(text) ? "practicalFitScore" : null,
    /二足目|発見|コレクション/iu.test(text) ? "explorationScore" : null,
    /ryo|外し|ズラし/iu.test(text) ? "ryoIdentityScore" : null,
  ].filter((key): key is string => Boolean(key));
}

function candidateFieldsFor(text: string, candidate: CandidateProfile): string[] {
  return [
    factualPattern.test(text) ? "modelName" : null,
    /カラー|配色|black|white|navy|olive|cream|gum/iu.test(text) && candidate.colorwayName
      ? "colorwayName"
      : null,
    /style code|sku|品番/iu.test(text) && candidate.styleCode ? "styleCode" : null,
    /素材|レザー|スエード|キャンバス/iu.test(text) ? "tags" : null,
  ].filter((field): field is string => Boolean(field));
}

function comparable(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/[^\p{L}\p{N}]+/gu, "");
}

function uniqueText(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
