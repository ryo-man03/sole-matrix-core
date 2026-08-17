import { describe, expect, it } from "vitest";

import { parseClientProductEvent, parseFitFeedback, parsePurchaseReport } from "./postPurchase";

describe("post-purchase input contracts", () => {
  it("normalizes a purchase without trusting a client canonical key", () => {
    const value = parsePurchaseReport({
      idempotencyKey: "purchase-001", recommendationSnapshotId: null, wishlistItemId: null,
      brand: " New Balance ", modelName: "991 v2", modelFamily: "991", generation: "v2", colorwayName: "Grey",
      styleCode: "u991-gl2", audience: "unisex", sizeSystem: "JP", sizeValue: 26.5, condition: "new", purchasedAt: "2026-08-18",
    });
    expect(value.canonical_key).toEqual({ brand: "newbalance", modelFamily: "991", generation: "v2", styleCode: "U991GL2" });
  });

  it.each([0, -1, 100, Number.NaN])("rejects invalid sizes: %s", (sizeValue) => {
    expect(() => parseFitFeedback({ idempotencyKey: "feedback-001", sizeSystem: "JP", sizeValue })).toThrow("INVALID_SIZE");
  });

  it("requires a short explicit fit observation", () => {
    expect(() => parseFitFeedback({ idempotencyKey: "feedback-001" })).toThrow("EMPTY_FIT_FEEDBACK");
    expect(parseFitFeedback({ idempotencyKey: "feedback-001", overallFit: "true_to_size", sameSizeAgain: true })).toMatchObject({ overall_fit: "true_to_size", same_size_again: true });
  });

  it("accepts only consent-gated behavior event names at the public event boundary", () => {
    expect(parseClientProductEvent({ idempotencyKey: "event-0001", eventName: "recommendation_viewed" }).event_class).toBe("behavior_analytics");
    expect(parseClientProductEvent({ idempotencyKey: "event-0002", eventName: "market_search_requested" }).event_class).toBe("explicit_product_action");
    expect(() => parseClientProductEvent({ idempotencyKey: "event-0003", eventName: "purchase_reported" })).toThrow("INVALID_EVENT");
  });
});
