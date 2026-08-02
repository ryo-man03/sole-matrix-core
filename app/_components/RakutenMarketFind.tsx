"use client";

import { useRef, useState } from "react";

import type { CandidateProfile } from "../_lib/core-v1/types";
import {
  BEGINNER_PURCHASE_CHECKLIST,
  PROVIDER_LABELS,
  PROVIDER_PRICE_EXPLANATIONS,
  buildMarketSearchContext,
  matchLabel,
  parseMarketSearchResponse,
  priceSemanticLabel,
  providerStatusMessage,
  verificationLabel,
} from "../_lib/market/beginner";
import type { MarketListing, MarketProviderResult, MarketSearchResponse } from "../_lib/market/contracts";
import { toPricePresentation } from "../_lib/market/contracts";

type Props = {
  candidate: Pick<CandidateProfile,
    "name" | "searchKeywords" | "brand" | "modelName" | "colorwayName" | "styleCode" | "verificationStatus" | "factualVerification" | "researchSource">;
};

export function RakutenMarketFind({ candidate }: Props) {
  const [result, setResult] = useState<MarketSearchResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const activeRequest = useRef(0);
  const context = buildMarketSearchContext(candidate);

  async function searchProducts() {
    if (status === "loading") return;
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;
    setStatus("loading");
    setMessage("楽天市場・Yahoo!ショッピング・eBayの現在価格を確認しています…");
    try {
      const response = await fetch("/api/market/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(context),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (activeRequest.current !== requestId) return;
      const parsed = parseMarketSearchResponse(payload);
      if (!response.ok || !parsed) throw new Error("invalid_market_response");
      setResult(parsed);
      setStatus("success");
      setMessage("価格検索が完了しました。推薦順位やスコアは変更していません。");
    } catch {
      if (activeRequest.current !== requestId) return;
      setStatus("error");
      setMessage(result
        ? "新しい価格情報を取得できなかったため、前回取得した情報を表示しています。"
        : "価格情報を取得できませんでした。推薦結果には影響しません。");
    }
  }

  return (
    <section className="rakuten-market-find beginner-market" aria-labelledby="market-price-title" aria-busy={status === "loading"}>
      <div className="rakuten-market-find-heading">
        <div>
          <p className="diagnosis-summary-kicker">購入前の価格確認</p>
          <h4 id="market-price-title">販売先の現在価格を比べる</h4>
          <p>価格は購入判断の参考情報です。安い順に推薦を入れ替えたり、Core ScoreやRyo Scoreを変更したりしません。</p>
        </div>
        <button className="diagnosis-secondary-button" disabled={status === "loading"} onClick={searchProducts} type="button">
          {status === "loading" ? "価格を確認中…" : result ? "価格を再確認" : "現在価格を確認"}
        </button>
      </div>

      <div className="market-verification-summary" data-state={context.identity.verificationState} role="status">
        <strong>{verificationLabel(context.identity.verificationState)}</strong>
        <span>{context.identity.colorwayName ?? "カラーは表示しません"}{context.identity.styleCode ? ` / ${context.identity.styleCode}` : ""}</span>
      </div>

      <div className="beginner-market-guide">
        <strong>最初に見る4項目</strong>
        <ol>{BEGINNER_PURCHASE_CHECKLIST.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ol>
        <details><summary>残りの購入前チェック</summary><ul>{BEGINNER_PURCHASE_CHECKLIST.slice(4).map((item) => <li key={item}>{item}</li>)}</ul></details>
      </div>

      <p className={status === "error" ? "rakuten-market-find-error" : "rakuten-market-find-status"} aria-live="polite" role="status">
        {message || "ボタンを押すまで外部の価格サービスには接続しません。"}
      </p>

      {result ? <div className="market-provider-results">
        {result.providers.map((provider) => <ProviderSection key={provider.provider} provider={provider} />)}
      </div> : null}
    </section>
  );
}

function ProviderSection({ provider }: { provider: MarketProviderResult }) {
  const primary = provider.listings.filter((listing) => listing.matchLevel !== "related");
  const related = provider.listings.filter((listing) => listing.matchLevel === "related");
  return (
    <section className="market-provider-result" aria-labelledby={`market-provider-${provider.provider}`} data-status={provider.status}>
      <div className="market-provider-heading">
        <div><h5 id={`market-provider-${provider.provider}`}>{PROVIDER_LABELS[provider.provider]}</h5><p>{PROVIDER_PRICE_EXPLANATIONS[provider.provider]}</p></div>
        <span>{providerStatusMessage(provider.status)}</span>
      </div>
      {primary.length ? <div className="rakuten-market-find-grid">{primary.map((listing) => <MarketListingCard key={listing.providerItemId ?? listing.itemUrl} listing={listing} />)}</div> : null}
      {related.length ? <details className="market-related-listings"><summary>比較用の関連候補 {related.length}件</summary><p>推薦モデルそのものとは限りません。別カラー・別世代・別サイズとして確認してください。</p><div className="rakuten-market-find-grid">{related.map((listing) => <MarketListingCard key={listing.providerItemId ?? listing.itemUrl} listing={listing} />)}</div></details> : null}
      <details className="market-technical-details"><summary>技術的な取得詳細</summary><dl>
        <div><dt>正規化</dt><dd>{provider.audit.normalizedCount}件</dd></div>
        <div><dt>一致度</dt><dd>完全 {provider.audit.exactCount} / 高 {provider.audit.highCount} / 関連 {provider.audit.relatedCount} / 除外 {provider.audit.rejectedCount}</dd></div>
        <div><dt>不足情報</dt><dd>サイズ {provider.audit.missingSizeCount} / 状態 {provider.audit.missingConditionCount} / 送料 {provider.audit.missingShippingCount}</dd></div>
        <div><dt>通貨</dt><dd>{Object.entries(provider.audit.currencyCount).map(([currency, count]) => `${currency} ${count}`).join(" / ") || "なし"}</dd></div>
      </dl></details>
    </section>
  );
}

function MarketListingCard({ listing }: { listing: MarketListing }) {
  const price = toPricePresentation(listing);
  return (
    <article className="rakuten-product-card" data-match={listing.matchLevel}>
      {listing.imageUrl ? <img alt={`${listing.title}の商品画像`} loading="lazy" src={listing.imageUrl} /> : <div className="rakuten-product-image-placeholder" aria-hidden="true">SOLE</div>}
      <div className="rakuten-product-card-body">
        <span className="market-match-badge">{matchLabel(listing.matchLevel)}</span>
        <h5>{listing.title}</h5>
        <p>{listing.shopName ?? "販売先名は商品ページで確認"}</p>
        <div className="market-price-primary"><span>{priceSemanticLabel(listing)}</span><strong>{formatMoney(price.amount, price.currency)}</strong></div>
        <dl className="market-listing-facts">
          <div><dt>送料</dt><dd>{shippingLabel(price)}</dd></div>
          <div><dt>支払総額</dt><dd>{price.totalKnown && price.totalAmount !== null ? formatMoney(price.totalAmount, price.currency) : "税・関税込み総額は未確認"}</dd></div>
          <div><dt>状態</dt><dd>{conditionLabel(listing.condition)}</dd></div>
          <div><dt>サイズ</dt><dd>{listing.size ? `${listing.sizeSystem} ${listing.size}` : "未確認"}</dd></div>
          <div><dt>販売形式</dt><dd>{listing.listingFormat === "auction" ? "オークション" : listing.listingFormat === "fixed_price" ? "固定価格" : "未確認"}</dd></div>
          <div><dt>取得時刻</dt><dd>{formatDate(listing.fetchedAt)}</dd></div>
        </dl>
        {listing.mismatchWarnings.length ? <p className="market-listing-warning">{listing.mismatchWarnings.join(" ")}</p> : null}
        <a href={listing.itemUrl} target="_blank" rel="noreferrer">{PROVIDER_LABELS[listing.provider]}で商品と総額を確認</a>
      </div>
    </article>
  );
}

function shippingLabel(price: ReturnType<typeof toPricePresentation>): string {
  if (!price.shippingKnown) return "未確認（無料ではありません）";
  if (price.shippingAmount === 0) return "表示上は送料無料";
  return price.shippingAmount === null ? "未確認" : formatMoney(price.shippingAmount, price.currency);
}

function conditionLabel(condition: MarketListing["condition"]): string {
  if (condition === "new") return "新品";
  if (condition === "used") return "中古";
  if (condition === "refurbished") return "再生品";
  return "未確認";
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(amount);
}

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(timestamp) : "未確認";
}
