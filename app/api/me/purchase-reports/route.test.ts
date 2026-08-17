import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPurchaseReport } from "../../../../src/infrastructure/repositories/postPurchaseRepository";
import { POST } from "./route";

vi.mock("../../../../src/infrastructure/repositories/postPurchaseRepository", () => ({
  createPurchaseReport: vi.fn(),
  listPurchaseReports: vi.fn(),
}));
vi.mock("../../../../src/application/personalization/routeHelpers", () => ({
  guard: () => ({ ok: true }),
  privateUser: () => Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
  unauthenticated: () => new Response(null, { status: 401 }),
  failure: (error: unknown) => Response.json({ ok: false, error: error instanceof Error ? error.message : "REQUEST_FAILED" }, { status: 400 }),
}));

const valid = {
  idempotencyKey: "purchase-test-001", recommendationSnapshotId: null, wishlistItemId: null,
  brand: "New Balance", modelName: "991v2", modelFamily: "991", generation: "v2", colorwayName: "Grey",
  styleCode: "U991GL2", audience: "unisex", sizeSystem: "JP", sizeValue: 26, condition: "new", purchasedAt: "2026-08-18",
  satisfactionRating: 5,
};

describe("purchase report route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("binds the purchase to the authenticated owner and returns created", async () => {
    vi.mocked(createPurchaseReport).mockResolvedValue({ item: { id: "purchase-1" }, created: true });
    const response = await POST(request(valid));
    expect(response.status).toBe(201);
    expect(createPurchaseReport).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", expect.objectContaining({ style_code: "U991GL2", satisfaction_rating: 5 }));
  });

  it("returns an idempotent replay without creating another purchase", async () => {
    vi.mocked(createPurchaseReport).mockResolvedValue({ item: { id: "purchase-1" }, created: false });
    expect((await POST(request(valid))).status).toBe(200);
  });

  it("rejects an invalid size before repository access", async () => {
    const response = await POST(request({ ...valid, sizeValue: 0 }));
    expect(response.status).toBe(400);
    expect(createPurchaseReport).not.toHaveBeenCalled();
  });
});

function request(body: unknown) {
  return new Request("https://app.example/api/me/purchase-reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
