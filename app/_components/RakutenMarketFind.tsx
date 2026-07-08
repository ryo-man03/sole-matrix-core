"use client";

import { useState } from "react";

import type { CandidateProfile } from "../_lib/core-v1/types";
import type { MarketProductCandidate } from "../_lib/market/types";
import {
  buildRakutenMarketQuery,
  parseRakutenMarketFindPayload,
} from "../_lib/market/ui";

type Props = {
  candidate: Pick<CandidateProfile, "name" | "searchKeywords">;
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; products: MarketProductCandidate[] }
  | { status: "empty" }
  | { status: "error" };

const DISCLAIMER = "価格・在庫・サイズは変動します。購入前に販売ページで確認してください。";

export function RakutenMarketFind({ candidate }: Props) {
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const query = buildRakutenMarketQuery(candidate);

  async function searchProducts() {
    if (state.status === "loading" || state.status === "success" || state.status === "empty") return;
    setState({ status: "loading" });

    try {
      const response = await fetch(`/api/market/rakuten?q=${encodeURIComponent(query)}`);
      const payload: unknown = await response.json().catch(() => null);
      const parsed = parseRakutenMarketFindPayload(payload);
      if (!response.ok || !parsed) {
        setState({ status: "error" });
        return;
      }
      setState(parsed.products.length > 0
        ? { status: "success", products: parsed.products }
        : { status: "empty" });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <section className="rakuten-market-find" aria-labelledby="rakuten-market-find-title">
      <div className="rakuten-market-find-heading">
        <div>
          <p className="diagnosis-summary-kicker">購入サポート / Rakuten market_find</p>
          <h4 id="rakuten-market-find-title">楽天で近い商品を探す</h4>
          <p>楽天市場で見つかった購入前の確認候補です。推薦結果とは別に表示しています。</p>
        </div>
        {(state.status === "idle" || state.status === "error") ? (
          <button
            className="diagnosis-secondary-button"
            onClick={searchProducts}
            type="button"
          >
            {state.status === "error" ? "もう一度探す" : "楽天で近い商品を探す"}
          </button>
        ) : null}
      </div>

      <p className="rakuten-market-find-disclaimer">{DISCLAIMER}</p>

      {state.status === "loading" ? (
        <p className="rakuten-market-find-status" aria-live="polite">楽天市場の商品を探しています…</p>
      ) : null}
      {state.status === "empty" ? (
        <p className="rakuten-market-find-status">近い商品が見つかりませんでした。推薦結果はそのまま確認できます。</p>
      ) : null}
      {state.status === "error" ? (
        <p className="rakuten-market-find-error" role="status">楽天の商品検索を取得できませんでした。推薦結果には影響ありません。</p>
      ) : null}
      {state.status === "success" ? (
        <div className="rakuten-market-find-grid">
          {state.products.map((product) => (
            <RakutenProductCard key={product.itemCode ?? product.url} product={product} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function RakutenProductCard({ product }: { product: MarketProductCandidate }) {
  return (
    <article className="rakuten-product-card">
      {product.imageUrl ? (
        <img alt="" loading="lazy" src={product.imageUrl} />
      ) : (
        <div className="rakuten-product-image-placeholder" aria-hidden="true">SOLE</div>
      )}
      <div className="rakuten-product-card-body">
        <h5>{product.title}</h5>
        <p>{product.shopName ?? "ショップ名は販売ページで確認"}</p>
        <strong>{formatPrice(product.price)}</strong>
        {product.reviewAverage !== undefined ? (
          <small>
            レビュー {product.reviewAverage.toFixed(1)}
            {product.reviewCount !== undefined ? `（${product.reviewCount.toLocaleString("ja-JP")}件）` : ""}
          </small>
        ) : null}
        <small>検索語との一致度 {Math.round(product.confidence * 100)}%</small>
        <a href={product.url} target="_blank" rel="noreferrer">楽天で見る</a>
      </div>
    </article>
  );
}

function formatPrice(price: number | undefined): string {
  return price === undefined
    ? "価格は販売ページで確認"
    : `${price.toLocaleString("ja-JP")}円`;
}
