import type { ResolveHostname } from "../url-analysis/sneakerUrlService";
import { validatePublicHttpUrl } from "../url-analysis/sneakerUrlService";
import type { ProductUrlVerificationStatus } from "./types";

const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const sensitiveParameterPattern =
  /^(?:utm_.+|ref|referrer|affiliate|aff(?:_?id)?|tracking|tracking_?id|token|access_?token|id_?token|refresh_?token|client_?secret|secret|password|pass|auth|authorization|credential|api_?key|access_?key|key|signature|sig|session)$/i;
const defaultTimeoutMs = 5_000;
const defaultMaxRedirects = 3;

export type ProductUrlVerificationDependencies = {
  fetcher?: typeof fetch;
  resolveHostname?: ResolveHostname;
  timeoutMs?: number;
  maxRedirects?: number;
  now?: () => Date;
};

export type ProductUrlVerificationResult =
  | {
      status: "verified_live";
      href: string;
      displayDomain: string;
      verifiedAt: string;
    }
  | {
      status: Exclude<ProductUrlVerificationStatus, "verified_live" | "search_fallback">;
      verifiedAt: string;
      reason: string;
    };

export async function verifyProductUrl(
  input: string,
  dependencies: ProductUrlVerificationDependencies = {},
): Promise<ProductUrlVerificationResult> {
  const verifiedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  const fetcher = dependencies.fetcher ?? fetch;
  const timeoutMs = dependencies.timeoutMs ?? defaultTimeoutMs;
  const maxRedirects = dependencies.maxRedirects ?? defaultMaxRedirects;
  const resolveHostname = dependencies.resolveHostname;

  let currentUrl: URL;
  try {
    currentUrl = sanitizeUrlForDisplay(
      await validatePublicHttpUrl(input, resolveHostname),
    );
  } catch {
    return {
      status: "blocked",
      verifiedAt,
      reason: "安全な公開HTTP/HTTPS URLではありません。",
    };
  }

  for (let redirectCount = 0; ; redirectCount += 1) {
    const response = await fetchStatus(fetcher, currentUrl, timeoutMs);
    if (!response) {
      return {
        status: "not_found",
        verifiedAt,
        reason: "現在このURLの存在を確認できませんでした。",
      };
    }

    if (redirectStatuses.has(response.status)) {
      if (redirectCount >= maxRedirects) {
        return {
          status: "blocked",
          verifiedAt,
          reason: "redirect回数が上限を超えました。",
        };
      }
      const location = response.headers.get("location");
      if (!location) {
        return {
          status: "not_found",
          verifiedAt,
          reason: "redirect先を確認できませんでした。",
        };
      }
      try {
        const nextUrl = new URL(location, currentUrl);
        if (currentUrl.protocol === "https:" && nextUrl.protocol === "http:") {
          return {
            status: "blocked",
            verifiedAt,
            reason: "安全でないHTTP redirectは利用できません。",
          };
        }
        currentUrl = sanitizeUrlForDisplay(
          await validatePublicHttpUrl(nextUrl, resolveHostname),
        );
      } catch {
        return {
          status: "blocked",
          verifiedAt,
          reason: "redirect先が安全な公開URLではありません。",
        };
      }
      continue;
    }

    if (response.status >= 200 && response.status < 300) {
      return {
        status: "verified_live",
        href: currentUrl.toString(),
        displayDomain: currentUrl.hostname.toLowerCase(),
        verifiedAt,
      };
    }

    return {
      status: response.status === 401 || response.status === 403
        ? "blocked"
        : "not_found",
      verifiedAt,
      reason: "現在このURLの存在を確認できませんでした。",
    };
  }
}

export function sanitizeUrlForDisplay(url: URL): URL {
  const sanitized = new URL(url.toString());
  sanitized.username = "";
  sanitized.password = "";
  sanitized.hash = "";
  for (const key of [...sanitized.searchParams.keys()]) {
    if (sensitiveParameterPattern.test(key.toLowerCase())) {
      sanitized.searchParams.delete(key);
    }
  }
  return sanitized;
}

async function fetchStatus(
  fetcher: typeof fetch,
  url: URL,
  timeoutMs: number,
): Promise<Response | null> {
  const request = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetcher(url, {
        method,
        redirect: "manual",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "SOLE-MATRIX-LinkVerifier/1.1",
          ...(method === "GET" ? { Range: "bytes=0-0" } : {}),
        },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const head = await request("HEAD");
  if (head && head.status !== 405 && head.status !== 501) return head;
  return request("GET");
}
