import { beforeEach, describe, expect, it, vi } from "vitest";

import { createFitFeedback } from "../../../../../../src/infrastructure/repositories/postPurchaseRepository";
import { POST } from "./route";

vi.mock("../../../../../../src/infrastructure/repositories/postPurchaseRepository", () => ({ createFitFeedback: vi.fn() }));
vi.mock("../../../../../../src/application/personalization/routeHelpers", () => ({
  guard: () => ({ ok: true }),
  privateUser: () => Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
  unauthenticated: () => new Response(null, { status: 401 }),
  validUuid: (value: string) => /^[0-9a-f-]{36}$/u.test(value),
  failure: (error: unknown) => Response.json({ ok: false, error: error instanceof Error ? error.message : "REQUEST_FAILED" }, { status: 400 }),
}));

const purchaseId = "10000000-0000-4000-8000-000000000001";

describe("fit feedback route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes only the authenticated owner and URL purchase to the repository", async () => {
    vi.mocked(createFitFeedback).mockResolvedValue({ item: { id: "fit-1" }, created: true, preferenceProfileUpdated: true });
    const response = await POST(request({ idempotencyKey: "fit-test-001", sizeSystem: "JP", sizeValue: 26, overallFit: "true_to_size", sameSizeAgain: true }), { params: Promise.resolve({ id: purchaseId }) });
    expect(response.status).toBe(201);
    expect(createFitFeedback).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", purchaseId, expect.objectContaining({ overall_fit: "true_to_size" }));
    expect(await response.json()).toMatchObject({ data: { message: "Preference Profileを更新しました" } });
  });

  it("rejects a foreign or malformed purchase identifier at the route boundary", async () => {
    const response = await POST(request({ idempotencyKey: "fit-test-001", overallFit: "true_to_size" }), { params: Promise.resolve({ id: "foreign" }) });
    expect(response.status).toBe(400);
    expect(createFitFeedback).not.toHaveBeenCalled();
  });
});

function request(body: unknown) {
  return new Request(`https://app.example/api/me/purchase-reports/${purchaseId}/fit-feedback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}
