"use client";

import { useEffect, useRef, useState } from "react";

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
import {
  evaluatePurchaseConfidence,
  parseFitConfidencePayload,
  type FitConfidenceResult,
} from "../_lib/market/confidence";
import type { MarketListing, MarketProviderResult, MarketSearchResponse } from "../_lib/market/contracts";
import { toPricePresentation } from "../_lib/market/contracts";
import { summarizeMarketPrices } from "../_lib/market/price-summary";
import { PostPurchaseFitFeedback } from "./PostPurchaseFitFeedback";

type Props = {
  candidate: Pick<CandidateProfile,
    "name" | "searchKeywords" | "brand" | "modelName" | "colorwayName" | "styleCode" | "verificationStatus" | "factualVerification" | "researchSource">;
};

let authenticatedSessionPromise: Promise<boolean> | null = null;
let authenticatedSessionCheckedAt = 0;

const UNKNOWN_FIT: FitConfidenceResult = {
  state: "unknown",
  reasons: [],
  cautions: ["サイズ履歴を利用できません。メーカーサイズ表と返品条件を確認してください。"],
  referenceCount: 0,
  feedbackCount: 0,
};

export function RakutenMarketFind({ candidate }: Props) {
  const [result, setResult] = useState<MarketSearchResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [fit, setFit] = useState<FitConfidenceResult>({ ...UNKNOWN_FIT, cautions: ["サイズ履歴を確認中です。"] });
  const [fitLoading, setFitLoading] = useState(true);
  const activeRequest = useRef(0);
  const viewEventKey = useRef(eventKey("view")).current;
  const context = buildMarketSearchContext(candidate);
  const purchaseConfidence = evaluatePurchaseConfidence({
    verificationState: context.identity.verificationState,
    providers: result?.providers ?? [],
    fit,
  });

  useEffect(() => {
    let active = true;
    void fetch("/api/me/fit-confidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: context.identity.brand,
        modelName: context.identity.modelName,
        modelFamily: null,
        generation: null,
        styleCode: context.identity.styleCode,
        audience: context.gender,
      }),
    }).then(async (response) => {
      const payload: unknown = await response.json().catch(() => null);
      if (!active) return;
      setFit(response.ok ? parseFitConfidencePayload(payload) ?? UNKNOWN_FIT : UNKNOWN_FIT);
    }).catch(() => {
      if (active) setFit(UNKNOWN_FIT);
    }).finally(() => {
      if (active) setFitLoading(false);
    });
    return () => { active = false; };
  }, [context.gender, context.identity.brand, context.identity.modelName, context.identity.styleCode]);

  useEffect(() => {
    void emitProductEvent("recommendation_viewed", "recommendation", context.identity.styleCode ?? context.identity.modelName, {
      verificationState: context.identity.verificationState,
    }, viewEventKey);
  }, [context.identity.modelName, context.identity.styleCode, context.identity.verificationState, viewEventKey]);

  async function searchProducts() {
    if (status === "loading") return;
    const requestId = activeRequest.current + 1;
    activeRequest.current = requestId;
    setStatus("loading");
    setMessage("楽天市場・Yahoo!ショッピング・eBayの現在情報を確認しています…");
    void emitProductEvent("market_search_requested", "recommendation", context.identity.styleCode ?? context.identity.modelName, {});
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
      setMessage("販売・出品情報の確認が完了しました。おすすめの順位や評価には影響しません。");
    } catch {
      if (activeRequest.current !== requestId) return;
      setStatus("error");
      setMessage(result
        ? "新しい情報を取得できなかったため、前回の結果を表示しています。"
        : "販売・出品情報を取得できませんでした。おすすめ結果には影響しません。");
    }
  }

  return (
    <section className="rakuten-market-find beginner-market" aria-labelledby="market-price-title" aria-busy={status === "loading"}>
      <div className="rakuten-market-find-heading">
        <div>
          <p className="diagnosis-summary-kicker">購入参考情報</p>
          <h4 id="market-price-title">同じ商品か、サイズと価格を順に確認</h4>
          <p>購入判断を助ける参考情報です。おすすめの順位や評価には影響しません。</p>
        </div>
        <button className="diagnosis-secondary-button" disabled={status === "loading"} onClick={searchProducts} type="button">
          {status === "loading" ? "販売・出品情報を確認中…" : result ? "販売・出品情報を再確認" : "現在の販売・出品情報を見る"}
        </button>
      </div>

      <div className="market-verification-summary" data-state={context.identity.verificationState} role="status">
        <strong>{verificationLabel(context.identity.verificationState)}</strong>
        <span>{context.identity.colorwayName ?? "確認できていないカラーは表示しません"}</span>
      </div>
      <details className="market-verification-details">
        <summary>商品情報の確認内容を見る</summary>
        <dl>
          <div><dt>確認状態</dt><dd>{context.identity.verificationState}</dd></div>
          <div><dt>商品番号（Style Code）</dt><dd>{context.identity.styleCode ?? "未確認"}</dd></div>
          <div><dt>確認済みカラー</dt><dd>{context.identity.colorwayName ?? "未確認"}</dd></div>
        </dl>
      </details>

      <section className="purchase-confidence" aria-labelledby="purchase-confidence-title">
        <div className="purchase-confidence-heading">
          <div><p className="diagnosis-summary-kicker">Purchase Confidence</p><h5 id="purchase-confidence-title">購入前に確認できている範囲</h5></div>
          <span>価格の安さや「買うべき度」ではありません</span>
        </div>
        <div className="purchase-confidence-grid">
          <ConfidenceItem label="商品情報" value={confidenceLabel(purchaseConfidence.productIdentity)} />
          <ConfidenceItem label="販売商品の一致" value={marketConfidenceLabel(purchaseConfidence.marketMatch)} />
          <ConfidenceItem label="サイズの参考" value={fitLoading ? "履歴を確認中" : fitLabel(fit.state)} />
          <ConfidenceItem label="商品の状態" value={evidenceLevelLabel(purchaseConfidence.conditionClarity)} />
          <ConfidenceItem label="送料" value={evidenceLevelLabel(purchaseConfidence.shippingClarity)} />
          <ConfidenceItem label="情報の鮮度" value={evidenceLevelLabel(purchaseConfidence.listingFreshness)} />
        </div>
        {fit.reasons.length ? <ul className="fit-confidence-reasons">{fit.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
        {purchaseConfidence.evidenceWarnings.length ? <div className="purchase-confidence-warnings"><strong>注意して確認すること</strong><ul>{purchaseConfidence.evidenceWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
      </section>

      <div className="beginner-market-guide">
        <strong>購入前に最初に見る4項目</strong>
        <ol>{BEGINNER_PURCHASE_CHECKLIST.slice(0, 4).map((item) => <li key={item}>{item}</li>)}</ol>
        <details><summary>残りの購入前チェック</summary><ul>{BEGINNER_PURCHASE_CHECKLIST.slice(4).map((item) => <li key={item}>{item}</li>)}</ul></details>
      </div>

      <p className={status === "error" ? "rakuten-market-find-error" : "rakuten-market-find-status"} aria-live="polite" role="status">
        {message || "ボタンを押すまで外部の販売サービスには接続しません。"}
      </p>

      {result ? <div className="market-provider-results">
        {result.providers.map((provider) => <ProviderSection key={provider.provider} provider={provider} />)}
      </div> : null}
      <PostPurchaseFitFeedback candidate={candidate} audience={context.gender} />
    </section>
  );
}

function ProviderSection({ provider }: { provider: MarketProviderResult }) {
  const primary = provider.listings.filter((listing) => listing.matchLevel !== "related");
  const related = provider.listings.filter((listing) => listing.matchLevel === "related");
  const summaries = summarizeMarketPrices(provider.listings);
  return (
    <section className="market-provider-result" aria-labelledby={`market-provider-${provider.provider}`} data-status={provider.status}>
      <div className="market-provider-heading">
        <div><h5 id={`market-provider-${provider.provider}`}>{PROVIDER_LABELS[provider.provider]}</h5><p>{PROVIDER_PRICE_EXPLANATIONS[provider.provider]}</p></div>
        <span>{providerStatusMessage(provider.status)}</span>
      </div>
      {provider.provider === "rakuten" ? (
        <a href="https://developers.rakuten.com/" target="_blank" rel="noreferrer">Supported by Rakuten Developers</a>
      ) : null}
      {summaries.length ? <div className="market-price-summaries" aria-label={`${PROVIDER_LABELS[provider.provider]}の価格概要`}>
        {summaries.map((summary) => <div key={`${summary.condition}:${summary.currency}`}>
          <span>{conditionLabel(summary.condition)} / {summary.currency}</span>
          <strong>{formatMoney(summary.minimum ?? 0, summary.currency)}〜{formatMoney(summary.maximum ?? 0, summary.currency)}</strong>
          <small>中央値 {formatMoney(summary.median ?? 0, summary.currency)}・{summary.listingCount}件{summary.listingCount < 3 ? "（参考件数が少ない）" : ""}</small>
        </div>)}
      </div> : null}
      {primary.length ? <div className="rakuten-market-find-grid">{primary.map((listing) => <MarketListingCard key={listing.externalId ?? listing.itemUrl} listing={listing} />)}</div> : null}
      {related.length ? <details className="market-related-listings"><summary>比較用の関連候補 {related.length}件</summary><p>推薦モデルそのものとは限りません。別カラー・別世代・別サイズとして確認してください。</p><div className="rakuten-market-find-grid">{related.map((listing) => <MarketListingCard key={listing.externalId ?? listing.itemUrl} listing={listing} />)}</div></details> : null}
      <details className="market-technical-details"><summary>技術的な取得詳細</summary><dl>
        <div><dt>表示件数</dt><dd>{provider.audit.normalizedCount}件</dd></div>
        <div><dt>一致度</dt><dd>完全 {provider.audit.exactCount} / 高確度 {provider.audit.probableCount} / 関連 {provider.audit.relatedCount} / 除外 {provider.audit.rejectedCount}</dd></div>
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
        <a href={listing.itemUrl} target="_blank" rel="noreferrer" onClick={() => { void emitProductEvent("market_listing_clicked", "market_listing", listing.externalId ?? listing.itemUrl, { provider: listing.provider, matchLevel: listing.matchLevel }); }}>{PROVIDER_LABELS[listing.provider]}で商品と総額を確認</a>
      </div>
    </article>
  );
}

function ConfidenceItem({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function confidenceLabel(value: "high" | "medium" | "low"): string {
  return value === "high" ? "十分に確認済み" : value === "medium" ? "一部を確認済み" : "追加確認が必要";
}

function marketConfidenceLabel(value: "high" | "medium" | "low" | "unavailable"): string {
  return value === "high" ? "同じ商品を確認" : value === "medium" ? "一致の可能性が高い" : value === "low" ? "関連候補のみ" : "まだ検索していません";
}

function fitLabel(value: FitConfidenceResult["state"]): string {
  return value === "strong" ? "同モデルの履歴あり" : value === "medium" ? "同世代の近いモデル履歴あり" : value === "limited" ? "参考情報は少なめ" : "履歴なし";
}

function evidenceLevelLabel(value: "high" | "medium" | "low" | "unavailable"): string {
  return value === "high" ? "確認できています" : value === "medium" ? "一部を確認" : value === "low" ? "追加確認が必要" : "まだ確認していません";
}

function shippingLabel(price: ReturnType<typeof toPricePresentation>): string {
  if (!price.shippingKnown) return "未確認（無料とは限りません）";
  if (price.shippingAmount === 0) return "表示上は送料無料";
  return price.shippingAmount === null ? "未確認" : formatMoney(price.shippingAmount, price.currency);
}

function conditionLabel(condition: MarketListing["condition"]): string {
  if (condition === "new") return "新品";
  if (condition === "used") return "中古";
  return "未確認";
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 2 }).format(amount);
}

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(timestamp) : "未確認";
}

async function emitProductEvent(
  eventName: "recommendation_viewed" | "market_search_requested" | "market_listing_clicked",
  subjectType: string,
  subjectId: string,
  properties: Record<string, unknown>,
  idempotencyKey = eventKey("event"),
) {
  if (!await hasAuthenticatedSession()) return;
  await fetch("/api/me/product-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ idempotencyKey, eventName, subjectType: subjectType.slice(0, 80), subjectId: subjectId.slice(0, 200), properties }),
  }).catch(() => undefined);
}

function hasAuthenticatedSession(): Promise<boolean> {
  const now = Date.now();
  if (!authenticatedSessionPromise || now - authenticatedSessionCheckedAt > 5_000) {
    authenticatedSessionCheckedAt = now;
    authenticatedSessionPromise = fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        return response.ok && isRecord(payload) && isRecord(payload.data) && payload.data.status === "user";
      })
      .catch(() => false);
  }
  return authenticatedSessionPromise;
}

function eventKey(prefix: string): string {
  return `${prefix}:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
