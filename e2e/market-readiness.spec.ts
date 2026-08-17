import { expect, test } from "@playwright/test";

const resultWidths = [320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920];

test("market lookup stays manual, preserves Core output, and renders partial provider state", async ({ page }) => {
  const errors: string[] = [];
  let marketCalls = 0;
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/me/fit-confidence", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      ok: true, data: { fit: { state: "unknown", reasons: [], cautions: ["サイズ履歴は未登録です。"], referenceCount: 0 } },
    }) });
  });
  await page.route("**/api/market/search", async (route) => {
    marketCalls += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(marketResponse()) });
  });

  await page.goto("/app?session=guest&path=product");
  await page.getByLabel("スニーカー名").fill("New Balance 991v2 U991GL2");
  await page.getByRole("button", { name: "分析して購入判断を実行する" }).click();
  await expect(page.getByRole("button", { name: "現在の販売・出品情報を見る" })).toBeVisible({ timeout: 20_000 });
  expect(marketCalls).toBe(0);
  const scoreBefore = await page.locator(".workspace-score-preview").innerText();

  await page.getByRole("button", { name: "現在の販売・出品情報を見る" }).click();
  await expect(page.getByRole("heading", { name: "Yahoo!ショッピング" })).toBeVisible();
  await expect(page.getByText("比較用の関連候補 1件")).toBeVisible();
  expect(marketCalls).toBe(1);
  expect(await page.locator(".workspace-score-preview").innerText()).toBe(scoreBefore);

  for (const width of resultWidths) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `result at ${width}px`).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

function marketResponse() {
  const fetchedAt = "2026-08-17T00:00:00.000Z";
  const exact = listing("exact", "exact", 32_800);
  const related = listing("related", "related", 18_000);
  return {
    query: "New Balance 991v2 U991GL2",
    searchedAt: fetchedAt,
    recommendationRankingChanged: false,
    providers: [
      { provider: "rakuten", status: "success", listings: [exact, related], fetchedAt, audit: audit("rakuten", 2, 1, 1), message: "ok" },
      { provider: "yahoo", status: "empty", listings: [], fetchedAt: null, audit: audit("yahoo", 0, 0, 0), message: "empty" },
      { provider: "ebay", status: "temporarily_unavailable", listings: [], fetchedAt: null, audit: audit("ebay", 0, 0, 0), message: "unavailable" },
    ],
  };
}

function listing(externalId: string, matchLevel: "exact" | "related", price: number) {
  return {
    provider: "rakuten", externalId, title: `New Balance 991v2 Grey U991GL2 ${externalId}`,
    canonicalBrand: "New Balance", canonicalModelName: "991v2", modelFamily: "991", generation: "v2",
    colorwayName: "Grey", styleCode: "U991GL2", audience: "unisex", price, currency: "JPY",
    shippingPrice: null, shippingKnown: false, totalDisplayedPrice: null, priceType: "current_retail_price",
    listingFormat: "fixed_price", condition: "new", providerConditionLabel: "new", sizeSystem: "JP", size: "26",
    inStock: true, imageUrl: null, itemUrl: `https://example.com/${externalId}`, shopName: "Example",
    matchLevel, matchReasons: [], mismatchWarnings: matchLevel === "related" ? ["比較用です。"] : [],
    fetchedAt: "2026-08-17T00:00:00.000Z", cacheExpiresAt: null,
  };
}

function audit(provider: "rakuten" | "yahoo" | "ebay", normalizedCount: number, exactCount: number, relatedCount: number) {
  return {
    provider, normalizedCount, exactCount, probableCount: 0, relatedCount, rejectedCount: 0,
    missingStyleCodeCount: 0, missingColorwayCount: 0, missingSizeCount: 0, missingConditionCount: 0,
    missingShippingCount: normalizedCount, generationConflictCount: 0, audienceConflictCount: 0, sizeConflictCount: 0,
    currencyCount: normalizedCount ? { JPY: normalizedCount } : {}, schemaWarningCount: 0, unsafeUrlCount: 0, duplicateCount: 0,
  };
}
