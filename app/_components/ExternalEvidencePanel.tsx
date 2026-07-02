import type { ReactNode } from "react";
import type { IntegratedRecommendationResult } from "../_lib/integrated-recommendation/types";
import type { LiveProductUrl } from "../_lib/product-links/types";

type ExternalEvidencePanelProps = {
  result: IntegratedRecommendationResult | null;
  productLinks?: readonly LiveProductUrl[];
  productLinksMessage?: string;
  isProductLinksLoading?: boolean;
  manualProductUrl?: string;
  isResolvingManualUrl?: boolean;
  onManualProductUrlChange?: (value: string) => void;
  onAddManualProductUrl?: () => void;
};

export function ExternalEvidencePanel({
  result,
  productLinks = [],
  productLinksMessage = "推薦後に参考リンクを表示します。",
  isProductLinksLoading = false,
  manualProductUrl = "",
  isResolvingManualUrl = false,
  onManualProductUrlChange,
  onAddManualProductUrl,
}: ExternalEvidencePanelProps) {
  const evidence = result?.externalEvidence;
  const displayableLinks = productLinks.filter((link) => link.verificationStatus === "verified_live" || link.verificationStatus === "search_fallback");

  return (
    <section className="external-evidence-panel" aria-labelledby="external-evidence-title" data-testid="external-evidence-panel">
      <div className="external-evidence-heading"><div><span>External evidence</span><h4 id="external-evidence-title">外部証拠・参考情報</h4></div><strong>Decisionとは分離</strong></div>
      <p className="external-evidence-boundary">外部情報は不確かな参考です。Core score・Decision・budgetFitを変更しません。</p>

      <div className="external-evidence-sections">
        <EvidenceSection title="Rakuten参考情報">
          {evidence?.listings.length ? <ul className="external-listing-list">{evidence.listings.map((listing) => <li key={`${listing.productUrl}:${listing.listingName}`}><strong>{listing.listingName}</strong><span>{formatYen(listing.priceYen)} / 取得時の参考価格</span><small>{listing.warnings.join(" / ") || "価格・在庫・サイズは保証しません。"}</small></li>)}</ul> : <EmptyEvidence>{result?.readiness.rakuten.status === "blocked_forbidden" ? "楽天APIは現在利用許可を確認できないため、検索リンクfallbackで表示します。" : result?.readiness.rakuten.detail ?? "判断後にreadinessを表示します。"}</EmptyEvidence>}
        </EvidenceSection>

        <EvidenceSection title="画像分析">
          {evidence?.visual ? <EvidenceSummary confidence={evidence.visual.confidence} summary={evidence.visual.summary} warnings={evidence.visual.warnings} /> : <EmptyEvidence>画像がある場合に、限定的な視覚特徴を表示します。</EmptyEvidence>}
        </EvidenceSection>

        <EvidenceSection title="URL分析">
          {evidence?.url ? <EvidenceSummary confidence={evidence.url.confidence} summary={`${evidence.url.domain} / ${evidence.url.summary}`} warnings={evidence.url.warnings} /> : <EmptyEvidence>URLがある場合に、安全に取得できたmetadataを表示します。</EmptyEvidence>}
        </EvidenceSection>

        <EvidenceSection title="商品参考リンク">
          <p className="product-links-boundary">具体モデル名から生成した検索入口です。直接商品URLとは限らず、価格・在庫・サイズ・購入可能性を保証しません。</p>
          {isProductLinksLoading ? <p className="product-links-status">参考リンクを準備しています…</p> : displayableLinks.length ? <ul className="product-link-list">{displayableLinks.map((link) => <li key={`${link.source}:${link.href}`}><div><strong>{link.label}</strong><span>{link.displayDomain}</span></div><small>{link.verificationStatus === "search_fallback" ? "未検証の検索入口" : "URL応答を確認した参考ページ"}</small><small>{link.note}</small><a href={link.href} rel="noopener noreferrer" target="_blank">外部サイトで確認する</a></li>)}</ul> : <EmptyEvidence>{productLinksMessage}</EmptyEvidence>}
          {result ? <div className="manual-product-link"><label htmlFor="manual-product-url">任意の公開商品URL（保存しません）</label><input id="manual-product-url" inputMode="url" onChange={(event) => onManualProductUrlChange?.(event.target.value)} placeholder="https://example.com/item" type="url" value={manualProductUrl} /><button disabled={isResolvingManualUrl} onClick={onAddManualProductUrl} type="button">{isResolvingManualUrl ? "確認中…" : "安全性を確認して追加"}</button><small aria-live="polite">{productLinksMessage}</small></div> : null}
        </EvidenceSection>
      </div>

      <div className="workspace-provider-readiness">
        <span>Readiness / fallback status</span>
        <div><strong>Rakuten</strong><em data-status={result?.readiness.rakuten.status ?? "not_checked"}>{result?.readiness.rakuten.status ?? "not_checked"}</em></div>
        <div><strong>Gemini</strong><em data-status={result?.readiness.gemini.status ?? "not_checked"}>{result ? `${result.readiness.gemini.status} / ${result.explanation.source}` : "not_checked"}</em></div>
      </div>
    </section>
  );
}

function EvidenceSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="external-evidence-section"><h5>{title}</h5>{children}</section>;
}

function EvidenceSummary({ confidence, summary, warnings }: { confidence: number; summary: string; warnings: string[] }) {
  return <div className="external-evidence-summary"><p>{summary}</p><span>confidence {Math.round(confidence * 100)}%</span>{warnings.length ? <small>{warnings.join(" / ")}</small> : null}</div>;
}

function EmptyEvidence({ children }: { children: ReactNode }) {
  return <p className="external-evidence-empty">{children}</p>;
}

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}
