import type {
  CandidateProfile,
  RecommendationResult,
} from "../_lib/core-v1/types";

type CandidatePresentation = {
  badge: string;
  badgeTone: "verified" | "partial" | "core";
  modelName: string;
  colorwayName: string | null;
  colorwayMessage: string | null;
  styleCode: string | null;
  sourceQualityLabel: string;
};

const sourceQualityLabels = {
  official: "公式",
  authorized_retailer: "正規取扱店",
  reputable_retailer: "信頼できる販売店",
  reputable_media: "信頼できるメディア",
  marketplace: "マーケットプレイス",
  unknown: "未分類",
} as const;

export function buildCandidatePresentation(candidate: CandidateProfile): CandidatePresentation {
  const source = candidate.researchSource ?? "fallback_catalog";
  const isGemini = source === "gemini";
  const isVerifiedColorway =
    isGemini &&
    candidate.verificationStatus === "model_and_colorway_verified" &&
    Boolean(candidate.colorwayName);
  const isVerifiedModel =
    isGemini &&
    (candidate.verificationStatus === "model_and_colorway_verified" ||
      candidate.verificationStatus === "model_verified_colorway_unverified");
  const isCoreCandidate = source === "fallback_catalog" || source === "ryo_anchor";

  return {
    badge: isVerifiedColorway
      ? "モデル・カラー確認済み"
      : isVerifiedModel
        ? "モデル確認済み・カラー未確認"
        : isCoreCandidate
          ? "Core候補"
          : "入力商品",
    badgeTone: isVerifiedColorway ? "verified" : isVerifiedModel ? "partial" : "core",
    modelName: candidate.modelName?.trim() || candidate.name,
    colorwayName: isVerifiedColorway || isCoreCandidate
      ? candidate.colorwayName?.trim() || null
      : null,
    colorwayMessage: isVerifiedColorway || (isCoreCandidate && candidate.colorwayName)
      ? null
      : "配色: 実在確認できず",
    styleCode: isVerifiedColorway ? candidate.styleCode?.trim() || null : null,
    sourceQualityLabel: sourceQualityLabels[candidate.sourceQuality ?? "unknown"],
  };
}

export function VerifiedCandidateResult({
  candidate,
  decisionLabel,
}: {
  candidate: CandidateProfile;
  decisionLabel: string;
}) {
  const presentation = buildCandidatePresentation(candidate);

  return (
    <section className="verified-candidate-result" aria-labelledby="verified-candidate-model">
      <div className="verified-candidate-topline">
        <span
          className="verified-candidate-badge"
          data-verification-tone={presentation.badgeTone}
          data-verification-status={candidate.verificationStatus ?? "unverified"}
        >
          {presentation.badge}
        </span>
        <strong data-decision={decisionLabel.toLowerCase()}>{decisionLabel}</strong>
      </div>
      <p className="diagnosis-summary-kicker">おすすめモデル</p>
      {candidate.brand ? <p className="verified-candidate-brand">{candidate.brand}</p> : null}
      <h4 id="verified-candidate-model">{presentation.modelName}</h4>
      {presentation.colorwayName ? (
        <p className="verified-candidate-colorway">
          <span>カラー</span>
          <strong>{presentation.colorwayName}</strong>
        </p>
      ) : null}
      {presentation.colorwayMessage ? (
        <p className="verified-candidate-unverified">{presentation.colorwayMessage}</p>
      ) : null}
      {presentation.styleCode ? (
        <p className="verified-candidate-style-code">
          <span>Style Code</span>
          <code>{presentation.styleCode}</code>
        </p>
      ) : null}
      {candidate.modelType ? <p>タイプ: {candidate.modelType}</p> : null}
      <p>{candidate.description}</p>
      <p className="verified-candidate-source-quality">
        根拠の主な出典種別: {presentation.sourceQualityLabel}
      </p>
      <CandidateEvidence candidate={candidate} />
    </section>
  );
}

function CandidateEvidence({ candidate }: { candidate: CandidateProfile }) {
  const links = collectEvidence(candidate);
  if (!links.length) return null;

  const initialLinks = links.slice(0, 2);
  const remainingLinks = links.slice(2);

  return (
    <section className="verified-candidate-evidence" aria-labelledby="verified-candidate-evidence-title">
      <h5 id="verified-candidate-evidence-title">確認根拠</h5>
      <EvidenceList links={initialLinks} />
      {remainingLinks.length ? (
        <details className="result-detail-accordion">
          <summary>残りの根拠を見る（{remainingLinks.length}件）</summary>
          <EvidenceList links={remainingLinks} />
        </details>
      ) : null}
    </section>
  );
}

function EvidenceList({ links }: { links: EvidenceItem[] }) {
  return (
    <ul className="verified-candidate-evidence-list">
      {links.map((link) => (
        <li key={`${link.role}-${link.url}`}>
          <a href={link.url} rel="noopener noreferrer" target="_blank">
            {link.domain}
          </a>
          <span>{link.role}</span>
        </li>
      ))}
    </ul>
  );
}

type EvidenceItem = {
  url: string;
  domain: string;
  role: string;
};

function collectEvidence(candidate: CandidateProfile): EvidenceItem[] {
  const modelUrls = new Set(candidate.modelEvidenceUrls ?? []);
  const colorwayUrls = new Set(candidate.colorwayEvidenceUrls ?? []);
  const styleCodeUrls = new Set(candidate.styleCodeEvidenceUrls ?? []);
  const urls = [
    ...modelUrls,
    ...colorwayUrls,
    ...styleCodeUrls,
    ...(candidate.evidenceUrls ?? []),
  ];
  const uniqueUrls = [...new Set(urls)].filter(isSafeHttpUrl);

  return uniqueUrls.map((url) => ({
    url,
    domain: getEvidenceDomain(url),
    role: [
      modelUrls.has(url) ? "モデル" : null,
      colorwayUrls.has(url) ? "カラー" : null,
      styleCodeUrls.has(url) ? "Style Code" : null,
    ].filter(Boolean).join("・") || "候補",
  }));
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getEvidenceDomain(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "参照元";
  }
}

export function RyoScoreBreakdown({
  result,
}: {
  result: RecommendationResult;
}) {
  const breakdown = result.ryoReranking.selectedScoreBreakdownV2;
  const scores = breakdown ?? {
    userFitScore: result.balancedScore.total,
    ryoIdentityScore: result.ryoScore.total,
    practicalFitScore: Math.round(
      (result.balancedScore.budgetFit + result.balancedScore.informationConfidence) / 2,
    ),
    explorationScore: result.ryoScore.enthusiastValue,
    contextPenalty: 0,
    finalRecommendationScore: result.ryoReranking.selectedRecommendationScore,
  };

  return (
    <section className="ryo-score-breakdown" aria-labelledby="ryo-score-breakdown-title">
      <div>
        <p className="diagnosis-summary-kicker">Ryo Mode Score</p>
        <h4 id="ryo-score-breakdown-title">この候補を4つの視点で評価</h4>
      </div>
      <div className="core-v1-score-grid core-v1-score-grid-v2">
        <ScoreCard
          description="11問と購入文脈への近さ"
          label="あなたの回答との相性"
          value={scores.userFitScore}
        />
        <ScoreCard
          description="定番に寄りすぎないRyoらしさ"
          label="Ryo Modeらしさ"
          value={scores.ryoIdentityScore}
        />
        <ScoreCard
          description="予算や使い方を含む現実性"
          label="現実的な選びやすさ"
          value={scores.practicalFitScore}
        />
        <ScoreCard
          description="二足目やアーカイブ枠としての面白さ"
          label="二足目・アーカイブ適性"
          value={scores.explorationScore}
        />
      </div>
      <details className="result-detail-accordion">
        <summary>スコア内訳と補正を見る</summary>
        <dl className="ryo-score-raw-values">
          <RawScore label="userFitScore" value={scores.userFitScore} />
          <RawScore label="ryoIdentityScore" value={scores.ryoIdentityScore} />
          <RawScore label="practicalFitScore" value={scores.practicalFitScore} />
          <RawScore label="explorationScore" value={scores.explorationScore} />
          <RawScore label="contextPenalty" value={scores.contextPenalty} />
          <RawScore label="finalRecommendationScore" value={scores.finalRecommendationScore} />
        </dl>
        {result.ryoReranking.selectedContextReasons?.length ? (
          <ul className="ryo-score-context-reasons">
            {result.ryoReranking.selectedContextReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
      </details>
    </section>
  );
}

function ScoreCard({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: number;
}) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  return (
    <div className="core-v1-score-card">
      <span>{label}</span>
      <strong>{safeValue}</strong>
      <meter max="100" min="0" value={safeValue} />
      <small>{description}</small>
    </div>
  );
}

function RawScore({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{Number.isFinite(value) ? Math.round(value) : 0}</dd>
    </div>
  );
}
