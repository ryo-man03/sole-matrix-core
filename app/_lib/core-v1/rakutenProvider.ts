import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { SneakerVector } from "../../../src/domain/sneaker/sneakerVector";
import {
  normalizeRakutenItemSearchResponse,
  type ExternalCandidate,
} from "./rakutenNormalizer";
import {
  createRakutenProviderReadiness,
  type RakutenProviderStatus,
} from "./rakutenReadiness";
import type { CandidateProfile, ProviderReadiness } from "./types";

type SafeEnvironment = Record<string, string | undefined>;

export type RakutenCandidateProviderInput = {
  budgetYen?: number;
  preferenceTags?: readonly SneakerTag[];
};

export type RakutenCandidateProviderResult = {
  status: RakutenProviderStatus;
  candidates: CandidateProfile[];
  readiness: ProviderReadiness;
  networkAttempted: boolean;
  responseOk: boolean;
  shapeValid: boolean;
  httpStatus?: number;
};

export type RakutenCandidateProvider = (
  input: RakutenCandidateProviderInput,
) => Promise<RakutenCandidateProviderResult>;

const itemSearchEndpoint =
  "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401";

export async function fetchRakutenCandidates(
  input: RakutenCandidateProviderInput,
  options: {
    env?: SafeEnvironment;
    fetcher?: typeof fetch;
    endpoint?: string;
  } = {},
): Promise<RakutenCandidateProviderResult> {
  const env = options.env ?? process.env;
  const applicationId = env["RAKUTEN_APPLICATION_ID"]?.trim();
  const accessKey = env["RAKUTEN_ACCESS_KEY"]?.trim();

  if (!applicationId || !accessKey) {
    return failure("missing_config", false, false, false);
  }

  const fetcher = options.fetcher ?? globalThis.fetch;

  if (typeof fetcher !== "function") {
    return failure("network_or_http_error", false, false, false);
  }

  let url: URL;

  try {
    url = new URL(options.endpoint ?? itemSearchEndpoint);
    url.searchParams.set("applicationId", applicationId);
    url.searchParams.set("keyword", createSearchKeyword(input.preferenceTags));
    url.searchParams.set("hits", "3");
    url.searchParams.set("format", "json");
    url.searchParams.set("formatVersion", "2");
    url.searchParams.set(
      "elements",
      "itemName,itemPrice,itemUrl,mediumImageUrls,shopName,itemCaption",
    );
  } catch {
    return failure("network_or_http_error", false, false, false);
  }

  let response: Response;

  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { accessKey },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return failure("network_or_http_error", true, false, false);
  }

  if (!response.ok) {
    const status =
      response.status === 403
        ? "blocked_forbidden"
        : response.status === 429
          ? "blocked_rate_limit"
          : "network_or_http_error";

    return failure(status, true, false, false, response.status);
  }

  let responseBody: unknown;

  try {
    responseBody = (await response.json()) as unknown;
  } catch {
    return failure("invalid_response", true, true, false, response.status);
  }

  const normalized = normalizeRakutenItemSearchResponse(responseBody);

  if (!normalized.ok) {
    return failure("invalid_response", true, true, false, response.status);
  }

  return {
    status: "ready",
    candidates: normalized.candidates.map((candidate) =>
      toCandidateProfile(candidate, input.budgetYen),
    ),
    readiness: createRakutenProviderReadiness("ready"),
    networkAttempted: true,
    responseOk: true,
    shapeValid: true,
    httpStatus: response.status,
  };
}

function toCandidateProfile(
  candidate: ExternalCandidate,
  budgetYen: number | undefined,
): CandidateProfile {
  const budgetFit = calculateBudgetFit(budgetYen, candidate.priceYen);

  return {
    id: candidate.id,
    name: candidate.name,
    source: "rakuten",
    description:
      "楽天市場で取得し、安全な項目だけを正規化した商品候補です。価格や在庫は購入前に商品ページで確認してください。",
    tags: [...candidate.tags],
    vector: createCandidateVector(candidate.tags, candidate.priceYen),
    budgetFit,
    risk: calculateBudgetRisk(budgetYen, candidate.priceYen),
    informationCompleteness: 88,
    readiness: "ready_external",
    priceYen: candidate.priceYen,
    url: candidate.url,
    ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {}),
    ...(candidate.shopName ? { shopName: candidate.shopName } : {}),
    ...(candidate.note ? { note: candidate.note } : {}),
  };
}

function createSearchKeyword(tags: readonly SneakerTag[] | undefined): string {
  const tagKeywords: Partial<Record<SneakerTag, string>> = {
    classic: "クラシック",
    minimal: "シンプル",
    street: "ストリート",
    basketball: "バスケット",
    running: "ランニング",
    comfortable: "クッション",
    retro: "レトロ",
    trail: "トレイル",
    outdoor: "アウトドア",
  };
  const firstKeyword = tags
    ?.map((tag) => tagKeywords[tag])
    .find((value): value is string => Boolean(value));

  return firstKeyword ? `スニーカー ${firstKeyword}` : "スニーカー";
}

function createCandidateVector(
  tags: readonly SneakerTag[],
  priceYen: number,
): SneakerVector {
  const tagSet = new Set(tags);

  return {
    culture: tagScore(tagSet, ["classic", "retro", "heritage"], 56),
    styleFit: 68,
    simplicity: tagScore(tagSet, ["minimal", "low_tech", "classic"], 58),
    street: tagScore(tagSet, ["street", "basketball", "chunky"], 52),
    volume: tagScore(tagSet, ["chunky", "basketball", "trail"], 48),
    comfort: tagScore(tagSet, ["comfortable", "running"], 62),
    durability: tagScore(tagSet, ["durable", "trail", "outdoor"], 60),
    priceLevel: Math.round(Math.min(100, Math.max(0, priceYen / 500))),
  };
}

function tagScore(
  tags: ReadonlySet<SneakerTag>,
  targets: readonly SneakerTag[],
  fallback: number,
): number {
  const matches = targets.filter((tag) => tags.has(tag)).length;

  return matches === 0 ? fallback : Math.min(92, 70 + matches * 8);
}

function calculateBudgetFit(
  budgetYen: number | undefined,
  priceYen: number,
): number {
  if (budgetYen === undefined) {
    return 65;
  }

  return budgetYen >= priceYen
    ? 100
    : Math.round(Math.max(0, (budgetYen / priceYen) * 100));
}

function calculateBudgetRisk(
  budgetYen: number | undefined,
  priceYen: number,
): CandidateProfile["risk"] {
  if (budgetYen === undefined) {
    return "medium";
  }

  if (priceYen <= budgetYen) {
    return "low";
  }

  return priceYen <= budgetYen * 1.25 ? "medium" : "high";
}

function failure(
  status: Exclude<RakutenProviderStatus, "ready">,
  networkAttempted: boolean,
  responseOk: boolean,
  shapeValid: boolean,
  httpStatus?: number,
): RakutenCandidateProviderResult {
  return {
    status,
    candidates: [],
    readiness: createRakutenProviderReadiness(status),
    networkAttempted,
    responseOk,
    shapeValid,
    ...(httpStatus === undefined ? {} : { httpStatus }),
  };
}
