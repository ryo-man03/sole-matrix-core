import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import type { SneakerUrlAnalysis } from "./types";

const redirectStatuses = new Set([301, 302, 303, 307, 308]);
const blockedHostnames = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "ip6-loopback",
]);
const defaultTimeoutMs = 5_000;
const defaultMaxRedirects = 3;
const defaultMaxResponseBytes = 512 * 1024;

export class SneakerUrlError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SneakerUrlError";
  }
}

export type ResolveHostname = (
  hostname: string,
) => Promise<readonly { address: string; family: number }[]>;

export type SneakerUrlServiceDependencies = {
  fetcher?: typeof fetch;
  resolveHostname?: ResolveHostname;
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseBytes?: number;
};

export async function analyzeSneakerUrl(
  inputUrl: string,
  dependencies: SneakerUrlServiceDependencies = {},
): Promise<SneakerUrlAnalysis> {
  const fetcher = dependencies.fetcher ?? fetch;
  const resolveHostname = dependencies.resolveHostname ?? resolvePublicAddresses;
  const timeoutMs = dependencies.timeoutMs ?? defaultTimeoutMs;
  const maxRedirects = dependencies.maxRedirects ?? defaultMaxRedirects;
  const maxResponseBytes =
    dependencies.maxResponseBytes ?? defaultMaxResponseBytes;
  const input = normalizeInputUrl(inputUrl);
  let currentUrl = await validatePublicUrl(input, resolveHostname);

  for (let redirectCount = 0; ; redirectCount += 1) {
    const response = await fetchWithTimeout(fetcher, currentUrl, timeoutMs);

    if (redirectStatuses.has(response.status)) {
      if (redirectCount >= maxRedirects) {
        throw new SneakerUrlError(
          "TOO_MANY_REDIRECTS",
          "商品URLのredirect回数が上限を超えました。",
        );
      }
      const location = response.headers.get("location");
      if (!location) {
        throw new SneakerUrlError(
          "INVALID_REDIRECT",
          "商品URLのredirect先を確認できませんでした。",
        );
      }
      const nextUrl = new URL(location, currentUrl);
      if (currentUrl.protocol === "https:" && nextUrl.protocol === "http:") {
        throw new SneakerUrlError(
          "INSECURE_REDIRECT",
          "HTTPSからHTTPへのredirectは許可されていません。",
        );
      }
      currentUrl = await validatePublicUrl(nextUrl, resolveHostname);
      continue;
    }

    if (!response.ok) {
      throw new SneakerUrlError(
        "URL_FETCH_FAILED",
        "商品ページを取得できませんでした。",
      );
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html")) {
      throw new SneakerUrlError(
        "UNSUPPORTED_CONTENT_TYPE",
        "商品URLはHTMLページを指定してください。",
      );
    }

    const html = await readLimitedHtml(response, maxResponseBytes);
    const metadata = extractAllowedMetadata(html);
    const cautions: string[] = [];
    const canonicalUrl = await validateReferencedUrl(
      metadata.canonicalUrl,
      currentUrl,
      resolveHostname,
      cautions,
      "canonical URL",
    );
    const imageUrl = await validateReferencedUrl(
      metadata.imageUrl,
      currentUrl,
      resolveHostname,
      cautions,
      "og:image",
    );
    const title = cleanMetadataText(metadata.ogTitle || metadata.title, 240);
    const description = cleanMetadataText(
      metadata.ogDescription || metadata.description,
      500,
    );

    if (!title) {
      cautions.push("商品名に使えるtitleを取得できませんでした。");
    }
    if (!description) {
      cautions.push("商品説明metaを取得できませんでした。");
    }

    return {
      inputUrl: input.toString(),
      finalUrl: currentUrl.toString(),
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(canonicalUrl ? { canonicalUrl } : {}),
      ...(title ? { extractedNameHint: extractNameHint(title) } : {}),
      confidence: calculateConfidence({
        title,
        description,
        ...(imageUrl ? { imageUrl } : {}),
      }),
      cautions,
    };
  }
}

export async function analyzeSneakerUrlSafely(
  inputUrl: string,
  dependencies: SneakerUrlServiceDependencies = {},
): Promise<SneakerUrlAnalysis> {
  try {
    return await analyzeSneakerUrl(inputUrl, dependencies);
  } catch (error) {
    return {
      inputUrl: String(inputUrl ?? "").trim(),
      confidence: 0,
      cautions: [
        error instanceof SneakerUrlError
          ? error.message
          : "商品URLの解析に失敗しました。名前や画像から診断を続けます。",
      ],
    };
  }
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  url: URL,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(url, {
      method: "GET",
      redirect: "manual",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "SOLE-MATRIX-Metadata/1.0",
      },
    });
  } catch {
    throw new SneakerUrlError(
      "URL_FETCH_FAILED",
      "商品ページへ安全に接続できませんでした。",
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function readLimitedHtml(
  response: Response,
  maxResponseBytes: number,
): Promise<string> {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
    throw new SneakerUrlError(
      "RESPONSE_TOO_LARGE",
      "商品ページのサイズが上限を超えています。",
    );
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > maxResponseBytes) {
      await reader.cancel();
      throw new SneakerUrlError(
        "RESPONSE_TOO_LARGE",
        "商品ページのサイズが上限を超えています。",
      );
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function normalizeInputUrl(inputUrl: string): URL {
  const raw = String(inputUrl ?? "").trim();
  if (!raw || raw.length > 2_048) {
    throw new SneakerUrlError(
      "INVALID_URL",
      "商品URLを2,048文字以内で入力してください。",
    );
  }
  try {
    return new URL(raw);
  } catch {
    throw new SneakerUrlError("INVALID_URL", "有効な商品URLを入力してください。");
  }
}

async function validatePublicUrl(
  url: URL,
  resolveHostname: ResolveHostname,
): Promise<URL> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SneakerUrlError(
      "BLOCKED_PROTOCOL",
      "HTTPまたはHTTPSのURLだけを利用できます。",
    );
  }
  if (url.username || url.password) {
    throw new SneakerUrlError(
      "URL_CREDENTIALS_NOT_ALLOWED",
      "認証情報を含むURLは利用できません。",
    );
  }
  if (
    (url.protocol === "http:" && url.port && url.port !== "80") ||
    (url.protocol === "https:" && url.port && url.port !== "443")
  ) {
    throw new SneakerUrlError(
      "BLOCKED_PORT",
      "標準ポート以外の商品URLは利用できません。",
    );
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  if (!hostname || blockedHostnames.has(hostname) || hostname.endsWith(".localhost")) {
    throw new SneakerUrlError(
      "BLOCKED_HOST",
      "localhostや内部ホストへは接続できません。",
    );
  }

  const literalFamily = isIP(hostname);
  const addresses = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await resolveHostnameSafely(hostname, resolveHostname);
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new SneakerUrlError(
      "BLOCKED_ADDRESS",
      "privateまたは予約済みIPアドレスへは接続できません。",
    );
  }

  const normalized = new URL(url.toString());
  normalized.hash = "";
  return normalized;
}

async function resolveHostnameSafely(
  hostname: string,
  resolveHostname: ResolveHostname,
) {
  try {
    return await resolveHostname(hostname);
  } catch {
    throw new SneakerUrlError(
      "DNS_LOOKUP_FAILED",
      "商品URLのホストを確認できませんでした。",
    );
  }
}

async function resolvePublicAddresses(hostname: string) {
  return lookup(hostname, { all: true, verbatim: true });
}

function isPublicIp(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    return isPublicIpv4(address);
  }
  if (family === 6) {
    return isPublicIpv6(address);
  }
  return false;
}

function isPublicIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  const [a, b] = octets as [number, number, number, number];
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 0 && octets[2] === 2) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && octets[2] === 100) ||
    (a === 203 && b === 0 && octets[2] === 113) ||
    a >= 224
  );
}

function isPublicIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0]!;
  const mappedIpv4 = normalized.match(/^(?:0*:)*ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) {
    return isPublicIpv4(mappedIpv4);
  }
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    /^fe[89ab]/.test(normalized) ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

function extractAllowedMetadata(html: string) {
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? "";
  const metadata = {
    title,
    description: "",
    ogTitle: "",
    ogDescription: "",
    imageUrl: "",
    canonicalUrl: "",
  };

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = parseHtmlAttributes(tag);
    const key = (attributes["property"] || attributes["name"] || "").toLowerCase();
    const content = attributes["content"] ?? "";
    if (key === "description") metadata.description = content;
    if (key === "og:title") metadata.ogTitle = content;
    if (key === "og:description") metadata.ogDescription = content;
    if (key === "og:image") metadata.imageUrl = content;
  }

  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = parseHtmlAttributes(tag);
    if ((attributes["rel"] ?? "").toLowerCase().split(/\s+/).includes("canonical")) {
      metadata.canonicalUrl = attributes["href"] ?? "";
      break;
    }
  }

  return metadata;
}

function parseHtmlAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1]!.toLowerCase()] = decodeHtmlEntities(
      match[2] ?? match[3] ?? match[4] ?? "",
    );
  }
  return attributes;
}

async function validateReferencedUrl(
  rawUrl: string,
  baseUrl: URL,
  resolveHostname: ResolveHostname,
  cautions: string[],
  label: string,
): Promise<string | undefined> {
  if (!rawUrl.trim()) {
    return undefined;
  }
  try {
    return (await validatePublicUrl(new URL(rawUrl, baseUrl), resolveHostname)).toString();
  } catch {
    cautions.push(`${label}は安全性を確認できないため除外しました。`);
    return undefined;
  }
}

function cleanMetadataText(value: string, maxLength: number): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
  };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function extractNameHint(title: string): string {
  return title
    .split(/\s+[|｜–—]\s+|\s+-\s+/)[0]!
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function calculateConfidence(input: {
  title: string;
  description: string;
  imageUrl?: string;
}): number {
  const score =
    (input.title ? 50 : 0) +
    (input.description ? 30 : 0) +
    (input.imageUrl ? 20 : 0);
  return score / 100;
}
