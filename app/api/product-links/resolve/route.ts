import { NextResponse } from "next/server";

import {
  resolveLiveProductUrls,
  resolveManualProductUrl,
} from "../../../_lib/product-links/liveProductUrlResolver";
import type { ProductUrlSource } from "../../../_lib/product-links/types";

const directSources = new Set<ProductUrlSource>([
  "rakuten",
  "official",
  "retailer",
  "marketplace",
  "manual",
]);

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body)) return invalidRequest();

  if (body["mode"] === "manual") {
    const url = boundedString(body["url"], 2_048);
    if (!url) return invalidRequest();
    const data = await resolveManualProductUrl(url);
    return NextResponse.json({ ok: true, data });
  }

  if (body["mode"] !== "recommendation") return invalidRequest();
  const productName = boundedString(body["productName"], 160);
  if (!productName) return invalidRequest();
  const directUrls = normalizeDirectUrls(body["directUrls"]);
  if (directUrls === null) return invalidRequest();

  const data = await resolveLiveProductUrls(productName, directUrls);
  return NextResponse.json({ ok: true, data });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function normalizeDirectUrls(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3) return null;
  const output: { href: string; source: Exclude<ProductUrlSource, "search_fallback"> }[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    const href = boundedString(item["href"], 2_048);
    const source = item["source"];
    if (!href || typeof source !== "string" || !directSources.has(source as ProductUrlSource)) {
      return null;
    }
    output.push({
      href,
      source: classifyDirectUrlSource(href),
    });
  }
  return output;
}

function classifyDirectUrlSource(href: string): Exclude<ProductUrlSource, "search_fallback"> {
  try {
    const hostname = new URL(href).hostname.toLowerCase();
    if (hostname === "rakuten.co.jp") return "rakuten";
    if (hostname.endsWith(".rakuten.co.jp")) return "rakuten";
  } catch {
    return "manual";
  }

  return "manual";
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function invalidRequest() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INVALID_PRODUCT_LINK_REQUEST",
        message: "参考リンクの入力を確認してください。",
      },
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
