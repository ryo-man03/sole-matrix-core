import { beforeEach, describe, expect, it, vi } from "vitest";

import { authorizeDataSteward } from "../../../../src/application/admin/authorization";
import { createManualReleaseDraft } from "../../../../src/infrastructure/repositories/dataStewardRepository";
import { POST } from "./route";

vi.mock("../../../../src/application/admin/authorization", () => ({ authorizeDataSteward: vi.fn() }));
vi.mock("../../../../src/infrastructure/repositories/dataStewardRepository", () => ({ createManualReleaseDraft: vi.fn() }));

const actorId = "00000000-0000-4000-8000-000000000001";
const requestId = "10000000-0000-4000-8000-000000000001";
const body = { brand: "New Balance", modelName: "991v2", modelFamily: "991", generation: "v2", colorwayName: "Grey", styleCode: "U991GL2", releaseDate: "2026-08-18", region: "JP", informationState: "official_announced" };

describe("manual release admin route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies normal users before repository access", async () => {
    vi.mocked(authorizeDataSteward).mockResolvedValue({ authorized: false, reason: "forbidden" });
    expect((await POST(request(body))).status).toBe(403);
    expect(createManualReleaseDraft).not.toHaveBeenCalled();
  });

  it("uses the server-authorized actor and writes only a staging draft", async () => {
    vi.mocked(authorizeDataSteward).mockResolvedValue({ authorized: true, actorId });
    vi.mocked(createManualReleaseDraft).mockResolvedValue({ id: "draft-1" } as never);
    const response = await POST(request({ ...body, actorId: "forged" }));
    expect(response.status).toBe(400);
    expect(createManualReleaseDraft).not.toHaveBeenCalled();

    const valid = await POST(request(body));
    expect(valid.status).toBe(201);
    expect(createManualReleaseDraft).toHaveBeenCalledWith(actorId, expect.not.objectContaining({ actorId: expect.anything() }), requestId);
    expect(await valid.json()).toMatchObject({ data: { productionWritePerformed: false } });
  });
});

function request(value: unknown) {
  return new Request("https://app.example/api/admin/manual-releases", { method: "POST", headers: { "content-type": "application/json", "x-request-id": requestId }, body: JSON.stringify(value) });
}
