import { expect, test } from "@playwright/test";

const viewportWidths = [320, 360, 390, 430, 768, 1024, 1440, 1920];

test("records the final product performance and request boundary", async ({ page }) => {
  const browserErrors: string[] = [];
  let marketRequests = 0;
  let dailyPickRequests = 0;

  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.route("**/api/me/fit-confidence", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          fit: {
            state: "unknown",
            reasons: [],
            cautions: ["サイズ履歴は未登録です。"],
            referenceCount: 0,
          },
        },
      }),
    });
  });
  await page.route("**/api/market/search", async (route) => {
    marketRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 60));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(marketResponse()),
    });
  });
  await page.route("**/api/daily-picks", async (route) => {
    dailyPickRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, data: { batch: null } }),
    });
  });

  await page.goto("/app?session=guest&path=product");
  await page.getByLabel("スニーカー名").fill("New Balance 991v2 U991GL2");
  const recommendationStartedAt = await page.evaluate(() => performance.now());
  await page.getByRole("button", { name: "分析して購入判断を実行する" }).click();
  const marketButton = page.getByRole("button", { name: "現在の販売・出品情報を見る" });
  await expect(marketButton).toBeVisible({ timeout: 20_000 });
  const recommendationFinishedAt = await page.evaluate(() => performance.now());
  expect(marketRequests).toBe(0);

  const marketStartedAt = await page.evaluate(() => performance.now());
  await marketButton.click();
  await expect(page.getByRole("heading", { name: "Yahoo!ショッピング" })).toBeVisible();
  const marketFinishedAt = await page.evaluate(() => performance.now());
  expect(marketRequests).toBe(1);

  let maximumOverflowPx = 0;
  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    maximumOverflowPx = Math.max(maximumOverflowPx, overflow);
    expect(overflow, `result at ${width}px`).toBeLessThanOrEqual(0);
  }

  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "今日のおすすめ" })).toBeVisible();
  await expect(page.getByText("今日の候補はまだありません")).toBeVisible();
  expect(dailyPickRequests).toBe(1);

  const measurements = {
    recommendationInitialRenderMs: Math.round(recommendationFinishedAt - recommendationStartedAt),
    marketManualRequestMs: Math.round(marketFinishedAt - marketStartedAt),
    providerParallelFixtureDelayMs: 60,
    todayDataRequests: dailyPickRequests,
    duplicateMarketRequests: Math.max(0, marketRequests - 1),
    maximumOverflowPx,
    browserErrorCount: browserErrors.length,
  };
  console.log(`FINAL_PERFORMANCE ${JSON.stringify(measurements)}`);
  expect(browserErrors).toEqual([]);
});

function marketResponse() {
  const fetchedAt = "2026-08-17T00:00:00.000Z";
  return {
    query: "New Balance 991v2 U991GL2",
    searchedAt: fetchedAt,
    recommendationRankingChanged: false,
    providers: [
      {
        provider: "rakuten",
        status: "success",
        listings: [listing("rakuten", "exact", "exact", "new", "JPY", 32_800)],
        fetchedAt,
        audit: audit("rakuten", 1, 1),
        message: "ok",
      },
      {
        provider: "yahoo",
        status: "success",
        listings: [listing("yahoo", "exact", "exact", "new", "JPY", 31_900)],
        fetchedAt,
        audit: audit("yahoo", 1, 1),
        message: "ok",
      },
      {
        provider: "ebay",
        status: "success",
        listings: [listing("ebay", "exact-used", "exact", "used", "USD", 189)],
        fetchedAt,
        audit: audit("ebay", 1, 1, "USD"),
        message: "ok",
      },
    ],
  };
}

function listing(
  provider: "rakuten" | "yahoo" | "ebay",
  externalId: string,
  matchLevel: "exact" | "related",
  condition: "new" | "used",
  currency: "JPY" | "USD",
  price: number,
) {
  return {
    provider,
    externalId,
    title: `New Balance 991v2 Grey U991GL2 ${externalId}`,
    canonicalBrand: "New Balance",
    canonicalModelName: "991v2",
    modelFamily: "991",
    generation: "v2",
    colorwayName: "Grey",
    styleCode: "U991GL2",
    audience: "unisex",
    price,
    currency,
    shippingPrice: null,
    shippingKnown: false,
    totalDisplayedPrice: null,
    priceType: condition === "new" ? "current_retail_price" : "current_listing_price",
    listingFormat: "fixed_price",
    condition,
    providerConditionLabel: condition,
    sizeSystem: condition === "new" ? "JP" : "US_M",
    size: condition === "new" ? "26" : "8",
    inStock: true,
    imageUrl: null,
    itemUrl: `https://example.com/${provider}/${externalId}`,
    shopName: "Example",
    matchLevel,
    matchReasons: [],
    mismatchWarnings: [],
    fetchedAt: "2026-08-17T00:00:00.000Z",
    cacheExpiresAt: null,
  };
}

function audit(
  provider: "rakuten" | "yahoo" | "ebay",
  normalizedCount: number,
  exactCount: number,
  currency: "JPY" | "USD" = "JPY",
) {
  return {
    provider,
    normalizedCount,
    exactCount,
    probableCount: 0,
    relatedCount: 0,
    rejectedCount: 0,
    missingStyleCodeCount: 0,
    missingColorwayCount: 0,
    missingSizeCount: 0,
    missingConditionCount: 0,
    missingShippingCount: normalizedCount,
    generationConflictCount: 0,
    audienceConflictCount: 0,
    sizeConflictCount: 0,
    currencyCount: normalizedCount ? { [currency]: normalizedCount } : {},
    schemaWarningCount: 0,
    unsafeUrlCount: 0,
    duplicateCount: 0,
  };
}
