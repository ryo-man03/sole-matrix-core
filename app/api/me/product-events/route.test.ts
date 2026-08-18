import { beforeEach, describe, expect, it, vi } from "vitest";

import { recordProductEvent } from "../../../../src/infrastructure/repositories/postPurchaseRepository";
import { POST } from "./route";

vi.mock("../../../../src/infrastructure/repositories/postPurchaseRepository", () => ({ recordProductEvent: vi.fn() }));
vi.mock("../../../../src/application/personalization/routeHelpers", () => ({
  guard: () => ({ ok: true }),
  privateUser: () => Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
  unauthenticated: () => new Response(null, { status: 401 }),
}));

describe("product event route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports analytics-consent-off without persisting the view", async () => {
    vi.mocked(recordProductEvent).mockResolvedValue({ recorded: false, duplicate: false, reason: "analytics_consent_required" });
    const response = await POST(request("recommendation_viewed"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { recorded: false, reason: "analytics_consent_required" } });
  });

  it("treats a duplicate event as a successful idempotent replay", async () => {
    vi.mocked(recordProductEvent).mockResolvedValue({ recorded: true, duplicate: true, reason: null });
    const response = await POST(request("market_listing_clicked"));
    expect(response.status).toBe(200);
  });

  it("allows the user-requested market search as an explicit product action", async () => {
    vi.mocked(recordProductEvent).mockResolvedValue({ recorded: true, duplicate: false, reason: null });
    const response = await POST(request("market_search_requested"));
    expect(response.status).toBe(201);
    expect(recordProductEvent).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", expect.objectContaining({ event_class: "explicit_product_action" }));
  });
});

function request(eventName: string) {
  return new Request("https://app.example/api/me/product-events", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ idempotencyKey: `event-${eventName}`, eventName, subjectType: "test", subjectId: "subject" }),
  });
}
