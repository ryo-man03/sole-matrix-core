import { NextResponse } from "next/server";
import {
  resolveLiveProductUrls,
  resolveManualProductUrl,
} from "../../../_lib/product-links/liveProductUrlResolver";
import type { ProductUrlSource } from "../../../_lib/product-links/types";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body)) return invalidRequest();

  if (body["mode"] === "manual") {
    const url = boundedString(body["url"], 2_048);
    if (!url) return invalidRequest();
    return NextResponse.json({ ok: true, data: await resolveManualProductUrl(url) });
  }

  if (body["mode"] !== "recommendation") return invalidRequest();
  const productName = boundedString(body["productName"], 160);
  const directUrls = normalizeDirectUrls(body["directUrls"]);
  if (!productName || directUrls === null) return invalidRequest();
  return NextResponse.json({ ok: true, data: await resolveLiveProductUrls(productName, directUrls) });
}

async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

function normalizeDirectUrls(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 6) return null;
  const output: { href: string; source: Exclude<ProductUrlSource, "search_fallback"> }[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const href = boundedString(item["href"], 2_048);
    if (!href) return null;
    const source = classifyDirectUrlSource(href);
    if (source) output.push({ href, source });
  }
  return output;
}

function classifyDirectUrlSource(href: string): Exclude<ProductUrlSource, "search_fallback"> | null {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    if (
      matches(hostname, ["google.com", "google.co.jp"]) ||
      (matches(hostname, ["rakuten.co.jp"]) && url.pathname.startsWith("/search/")) ||
      (matches(hostname, ["snkrdunk.com", "stockx.com"]) && url.pathname.startsWith("/search"))
    ) return null;
    if (matches(hostname, ["rakuten.co.jp"])) return "rakuten";
    if (matches(hostname, ["nike.com", "adidas.com", "adidas.jp", "newbalance.com", "newbalance.jp", "asics.com", "puma.com", "vans.com", "vans.co.jp", "converse.com", "converse.co.jp"])) return "official";
    if (matches(hostname, ["abc-mart.net", "atmos-tokyo.com"])) return "retailer";
    if (matches(hostname, ["snkrdunk.com", "stockx.com"])) return "marketplace";
  } catch {
    return "manual";
  }
  return "manual";
}

function matches(hostname: string, domains: string[]): boolean {
  return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function invalidRequest() {
  return NextResponse.json({ ok: false, error: { code: "INVALID_PRODUCT_LINK_REQUEST", message: "参考リンクの入力内容を確認してください。" } }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
