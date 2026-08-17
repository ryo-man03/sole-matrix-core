import { beforeEach, describe, expect, it, vi } from "vitest";

import { listOwnedRows } from "../../../../src/infrastructure/repositories/personalizationRepository";
import { listFitFeedbackRows } from "../../../../src/infrastructure/repositories/postPurchaseRepository";
import { POST } from "./route";

vi.mock("../../../../src/infrastructure/repositories/personalizationRepository", () => ({
  listOwnedRows: vi.fn(),
}));
vi.mock("../../../../src/infrastructure/repositories/postPurchaseRepository", () => ({
  listFitFeedbackRows: vi.fn(),
}));
vi.mock("../../../../src/application/personalization/routeHelpers", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../../src/application/personalization/routeHelpers")>();
  return {
    ...original,
    privateUser: () => Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
  };
});

const validBody = {
  brand: "New Balance", modelName: "991v2", modelFamily: "991", generation: "v2",
  styleCode: "U991GL2", audience: "unisex",
};

describe("fit-confidence route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listFitFeedbackRows).mockResolvedValue([]);
  });

  it("reads only the authenticated user's owned sneakers and sizes", async () => {
    vi.mocked(listOwnedRows)
      .mockResolvedValueOnce([{ brand: "New Balance", model_name: "991v2", style_code: "U991GL2", audience: "unisex", size_system: "JP", size_value: 26 }])
      .mockResolvedValueOnce([{ size_system: "JP", size_value: 26, primary_size: true }]);
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(listOwnedRows).toHaveBeenNthCalledWith(1, "owned_sneakers", "00000000-0000-4000-8000-000000000001");
    expect(listOwnedRows).toHaveBeenNthCalledWith(2, "user_sizes", "00000000-0000-4000-8000-000000000001");
    expect(listFitFeedbackRows).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
    expect(await response.json()).toMatchObject({ ok: true, data: { fit: { state: "strong" } } });
  });

  it("returns unknown evidence when the private database is unavailable", async () => {
    vi.mocked(listOwnedRows).mockRejectedValue(new Error("DATABASE_NOT_CONFIGURED"));
    const response = await POST(request(validBody));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, data: { fit: { state: "unknown", referenceCount: 0 } } });
  });

  it.each([
    null,
    {},
    { ...validBody, modelName: "" },
    { ...validBody, audience: "adult" },
    { ...validBody, modelName: "x".repeat(161) },
  ])("rejects malformed candidate payload %#", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(listOwnedRows).not.toHaveBeenCalled();
  });
});

function request(body: unknown) {
  return new Request("https://app.example/api/me/fit-confidence", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
}
