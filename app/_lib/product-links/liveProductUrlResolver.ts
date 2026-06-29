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
const maxDisplayedLinks = 3;

type DirectProductUrl = {
  href: string;
  source: Exclude<ProductUrlSource, "manual" | "search_fallback">;
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
    {
      label: "Googleで探す（検索リンク）",
      href: `https://www.google.com/search?q=${query}`,
      source: "search_fallback",
      kind: "search",
    },
    {
      label: "楽天で探す（検索リンク）",
      href: `https://search.rakuten.co.jp/search/mall/${query}/`,
      source: "search_fallback",
      kind: "search",
    },
    {
      label: "SNKRDUNKで探す（検索リンク）",
      href: `https://snkrdunk.com/search?keyword=${query}`,
      source: "search_fallback",
      kind: "search",
    },
    {
      label: "StockXで探す（検索リンク）",
      href: `https://stockx.com/search?s=${query}`,
      source: "search_fallback",
      kind: "search",
    },
    {
      label: "メルカリで探す（検索リンク）",
      href: `https://jp.mercari.com/search?keyword=${query}`,
      source: "search_fallback",
      kind: "search",
    },
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
    return {
      links: [],
      checkedAt,
      status: "not_found",
      message: "商品名がないため参考リンクを確認できませんでした。",
    };
  }

  const results = await Promise.all(
    candidates.map(async (candidate) => ({
      candidate,
      verification: await verifyProductUrl(candidate.href, dependencies),
    })),
  );
  const verifiedDirect = results.filter(
    (item) =>
      item.candidate.kind === "direct" &&
      item.verification.status === "verified_live",
  );
  const verifiedSearch = results.filter(
    (item) =>
      item.candidate.kind === "search" &&
      item.verification.status === "verified_live",
  );
  const selected = [...verifiedDirect, ...verifiedSearch].slice(0, maxDisplayedLinks);
  const links = selected.flatMap(({ candidate, verification }) => {
    if (verification.status !== "verified_live") return [];
    return [toLiveProductUrl(candidate, verification)];
  });

  return {
    links,
    checkedAt,
    status: links.length ? "resolved" : "not_found",
    message: links.length
      ? "診断時点で存在を確認できた参考リンクです。"
      : "現在確認できる商品URLはありません。",
  };
}

export async function resolveManualProductUrl(
  input: string,
  dependencies: ProductUrlVerificationDependencies = {},
): Promise<ProductUrlResolution> {
  const checkedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const verification = await verifyProductUrl(input, dependencies);
  if (verification.status !== "verified_live") {
    return {
      links: [],
      checkedAt,
      status: verification.status,
      message: verification.reason,
    };
  }
  return {
    links: [
      {
        label: "手動で追加した参考リンク",
        href: verification.href,
        displayDomain: verification.displayDomain,
        source: "manual",
        verificationStatus: "verified_live",
        verifiedAt: verification.verifiedAt,
        coreDecisionImpact: "none",
        scoreImpact: "none",
        note: "画面内だけで利用し、保存しません。",
      },
    ],
    checkedAt,
    status: "resolved",
    message: "安全性と存在を確認した参考リンクを追加しました。",
  };
}

function toLiveProductUrl(
  candidate: ProductUrlCandidate,
  verification: Extract<
    Awaited<ReturnType<typeof verifyProductUrl>>,
    { status: "verified_live" }
  >,
): LiveProductUrl {
  const isSearch = candidate.kind === "search";
  return {
    label: candidate.label,
    href: verification.href,
    displayDomain: verification.displayDomain,
    source: candidate.source,
    verificationStatus: isSearch ? "search_fallback" : "verified_live",
    verifiedAt: verification.verifiedAt,
    coreDecisionImpact: "none",
    scoreImpact: "none",
    note: isSearch
      ? "直接商品URLではなく、確認済みの検索リンクです。"
      : "商品ページの存在のみ確認済みです。価格・在庫・サイズは保証しません。",
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
  if (source === "official") return "公式の商品ページを見る";
  if (source === "retailer") return "販売店の商品ページを見る";
  return "マーケットプレイスの商品ページを見る";
}
