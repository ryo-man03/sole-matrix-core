import type {
  LiveProductUrl,
  ProductUrlCandidate,
  ProductUrlResolution,
  ProductUrlSource,
} from "./types";
import {
  verifyProductUrl,
  type ProductUrlVerificationDependencies,
} from "./urlVerification";

const maxProductNameLength = 160;
const maxDirectCandidates = 3;
const maxDisplayedLinks = 5;

type DirectProductUrl = {
  href: string;
  source: Exclude<ProductUrlSource, "search_fallback">;
};

export function createProductUrlCandidates(
  productName: string,
  directUrls: readonly DirectProductUrl[] = [],
): ProductUrlCandidate[] {
  const normalizedName = normalizeProductName(productName);
  if (!normalizedName) return [];

  const directCandidates = directUrls.slice(0, maxDirectCandidates).map((item) => ({
    label: directLabel(item.source),
    href: item.href,
    source: item.source,
    kind: "direct" as const,
  }));
  const query = encodeURIComponent(normalizedName);
  const searchCandidates: ProductUrlCandidate[] = [
    { label: "Googleで探す（検索リンク）", href: `https://www.google.com/search?q=${query}`, source: "search_fallback", kind: "search" },
    { label: "楽天で探す（検索リンク）", href: `https://search.rakuten.co.jp/search/mall/${query}/`, source: "search_fallback", kind: "search" },
    { label: "SNKRDUNKで探す（検索リンク）", href: `https://snkrdunk.com/search?keyword=${query}`, source: "search_fallback", kind: "search" },
    { label: "StockXで探す（検索リンク）", href: `https://stockx.com/search?s=${query}`, source: "search_fallback", kind: "search" },
    { label: "メルカリで探す（検索リンク）", href: `https://jp.mercari.com/search?keyword=${query}`, source: "search_fallback", kind: "search" },
  ];
  return [...directCandidates, ...searchCandidates];
}

export async function resolveLiveProductUrls(
  productName: string,
  directUrls: readonly DirectProductUrl[] = [],
  dependencies: ProductUrlVerificationDependencies = {},
): Promise<ProductUrlResolution> {
  const candidates = createProductUrlCandidates(productName, directUrls);
  const checkedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  if (!candidates.length) {
    return { links: [], checkedAt, status: "not_found", message: "具体的なモデル名を確認できないため、参考リンクを作成できませんでした。" };
  }

  const directCandidates = candidates.filter((candidate) => candidate.kind === "direct");
  const searchCandidates = candidates.filter((candidate) => candidate.kind === "search");
  const verifiedDirect = await Promise.all(
    directCandidates.map(async (candidate) => ({
      candidate,
      verification: await verifyProductUrl(candidate.href, dependencies),
    })),
  );
  const directLinks = verifiedDirect.flatMap(({ candidate, verification }) =>
    verification.status === "verified_live"
      ? [toLiveProductUrl(candidate, verification)]
      : [],
  );
  const fallbackLinks = searchCandidates.slice(0, 3).map((candidate) =>
    toSearchFallbackUrl(candidate, checkedAt),
  );
  const links = [...directLinks, ...fallbackLinks].slice(0, maxDisplayedLinks);

  return {
    links,
    checkedAt,
    status: links.length ? "resolved" : "not_found",
    message: links.length
      ? "具体モデル名を使った参考リンクです。検索リンクは直接商品URLではありません。"
      : "参考リンクを作成できませんでした。",
  };
}

export async function resolveManualProductUrl(
  input: string,
  dependencies: ProductUrlVerificationDependencies = {},
): Promise<ProductUrlResolution> {
  const checkedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const verification = await verifyProductUrl(input, dependencies);
  if (verification.status !== "verified_live") {
    return { links: [], checkedAt, status: verification.status, message: verification.reason };
  }
  return {
    links: [{
      label: "手動で追加した参考リンク",
      href: verification.href,
      displayDomain: verification.displayDomain,
      source: "manual",
      verificationStatus: "verified_live",
      verifiedAt: verification.verifiedAt,
      coreDecisionImpact: "none",
      scoreImpact: "none",
      note: "この画面内だけで利用し、保存しません。",
    }],
    checkedAt,
    status: "resolved",
    message: "公開URLとして応答を確認し、参考リンクに追加しました。",
  };
}

function toLiveProductUrl(
  candidate: ProductUrlCandidate,
  verification: Extract<Awaited<ReturnType<typeof verifyProductUrl>>, { status: "verified_live" }>,
): LiveProductUrl {
  return {
    label: candidate.label,
    href: verification.href,
    displayDomain: verification.displayDomain,
    source: candidate.source,
    verificationStatus: "verified_live",
    verifiedAt: verification.verifiedAt,
    coreDecisionImpact: "none",
    scoreImpact: "none",
    note: "URLの応答だけを確認済みです。価格・在庫・サイズは保証しません。",
  };
}

function toSearchFallbackUrl(candidate: ProductUrlCandidate, checkedAt: string): LiveProductUrl {
  const parsed = new URL(candidate.href);
  return {
    label: candidate.label,
    href: candidate.href,
    displayDomain: parsed.hostname.toLowerCase(),
    source: "search_fallback",
    verificationStatus: "search_fallback",
    verifiedAt: checkedAt,
    coreDecisionImpact: "none",
    scoreImpact: "none",
    note: "未検証の検索入口です。直接商品URL、価格、在庫、サイズ、購入可能性を保証しません。",
  };
}

function normalizeProductName(value: string): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxProductNameLength);
}

function directLabel(source: DirectProductUrl["source"]): string {
  if (source === "rakuten") return "楽天の商品ページを見る";
  if (source === "official") return "公式の参考ページを見る";
  if (source === "retailer") return "販売店の参考ページを見る";
  if (source === "manual") return "参考ページを見る";
  return "マーケットプレイスの参考ページを見る";
}
