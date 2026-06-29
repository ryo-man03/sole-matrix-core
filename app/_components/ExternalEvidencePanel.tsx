import type { IntegratedRecommendationResult } from "../_lib/integrated-recommendation/types";

type ExternalEvidencePanelProps = {
  result: IntegratedRecommendationResult | null;
};

export function ExternalEvidencePanel({
  result,
}: ExternalEvidencePanelProps) {
  const evidence = result?.externalEvidence;
  const feedbackPatterns = evidence?.feedbackPatterns.flatMap(
    (item) => item.patterns,
  ) ?? [];

  return (
    <section
      className="external-evidence-panel"
      aria-labelledby="external-evidence-title"
      data-testid="external-evidence-panel"
    >
      <div className="external-evidence-heading">
        <div>
          <span>External evidence</span>
          <h4 id="external-evidence-title">外部証拠・参考情報</h4>
        </div>
        <strong>判断材料</strong>
      </div>
      <p className="external-evidence-boundary">
        外部情報は不確かな参考です。Core score と Decision は既存のTypeScriptルールが決め、ここから上書きしません。
      </p>

      <div className="external-evidence-sections">
        <EvidenceSection title="楽天候補">
          {evidence?.listings.length ? (
            <ul className="external-listing-list">
              {evidence.listings.map((listing) => (
                <li key={`${listing.productUrl}:${listing.listingName}`}>
                  <a href={listing.productUrl} rel="noreferrer" target="_blank">
                    {listing.listingName}
                  </a>
                  <span>{formatYen(listing.priceYen)} / 参考価格</span>
                  <small>{listing.warnings.join(" / ")}</small>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyEvidence>
              {result?.readiness.rakuten.detail ?? "診断後にreadinessを確認します。"}
            </EmptyEvidence>
          )}
        </EvidenceSection>

        <EvidenceSection title="画像分析結果">
          {evidence?.visual ? (
            <EvidenceSummary
              confidence={evidence.visual.confidence}
              confidenceLabel={evidence.visual.confidenceLabel}
              summary={evidence.visual.summary}
              warnings={evidence.visual.warnings}
            />
          ) : (
            <EmptyEvidence>画像がある場合に、推定された視覚特徴を表示します。</EmptyEvidence>
          )}
        </EvidenceSection>

        <EvidenceSection title="URL分析結果">
          {evidence?.url ? (
            <EvidenceSummary
              confidence={evidence.url.confidence}
              confidenceLabel={evidence.url.confidenceLabel}
              summary={`${evidence.url.domain} / ${evidence.url.summary}`}
              warnings={evidence.url.warnings}
            />
          ) : (
            <EmptyEvidence>URLがある場合に、安全なdomain要約を表示します。</EmptyEvidence>
          )}
        </EvidenceSection>

        <EvidenceSection title="過去の推薦評価からの参考">
          {feedbackPatterns.length ? (
            <ul className="external-pattern-list">
              {feedbackPatterns.map((pattern) => (
                <li key={pattern}>{pattern}</li>
              ))}
            </ul>
          ) : (
            <EmptyEvidence>匿名の参考パターンはまだありません。</EmptyEvidence>
          )}
        </EvidenceSection>
      </div>

      <div className="workspace-provider-readiness">
        <span>Readiness / fallback status</span>
        <div>
          <strong>Rakuten</strong>
          <em data-status={result?.readiness.rakuten.status ?? "not_checked"}>
            {result?.readiness.rakuten.status ?? "not_checked"}
          </em>
        </div>
        <div>
          <strong>Gemini</strong>
          <em data-status={result?.readiness.gemini.status ?? "not_checked"}>
            {result
              ? `${result.readiness.gemini.status} / ${result.explanation.source}`
              : "not_checked"}
          </em>
        </div>
      </div>
    </section>
  );
}

function EvidenceSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="external-evidence-section">
      <h5>{title}</h5>
      {children}
    </section>
  );
}

function EvidenceSummary({
  confidence,
  confidenceLabel,
  summary,
  warnings,
}: {
  confidence: number;
  confidenceLabel: "uncertain" | "moderate" | "high";
  summary: string;
  warnings: string[];
}) {
  return (
    <div className="external-evidence-summary">
      <p>{summary}</p>
      <span data-confidence={confidenceLabel}>
        confidence {Math.round(confidence * 100)}% / {confidenceLabel === "uncertain" ? "不確か" : confidenceLabel}
      </span>
      {warnings.length ? <small>{warnings.join(" / ")}</small> : null}
    </div>
  );
}

function EmptyEvidence({ children }: { children: React.ReactNode }) {
  return <p className="external-evidence-empty">{children}</p>;
}

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}
