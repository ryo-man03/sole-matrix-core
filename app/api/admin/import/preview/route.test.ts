import { beforeEach, describe, expect, it, vi } from "vitest";

import { authorizeDataSteward } from "../../../../../src/application/admin/authorization";
import { POST } from "./route";

vi.mock("../../../../../src/application/admin/authorization", () => ({ authorizeDataSteward: vi.fn() }));

const csv = "entry_type,source_url,source_kind,brand,model,model_family,style_code,colorway,release_date,region,information_state\nrelease,,,Nike,AJ1,AJ1,,,,JP,unknown";

describe("admin CSV preview route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("denies before reading the CSV body", async () => {
    vi.mocked(authorizeDataSteward).mockResolvedValue({ authorized: false, reason: "forbidden" });
    expect((await POST(request(csv))).status).toBe(403);
  });

  it("returns a no-write preview to a server-authorized data steward", async () => {
    vi.mocked(authorizeDataSteward).mockResolvedValue({ authorized: true, actorId: "00000000-0000-4000-8000-000000000001" });
    const response = await POST(request(csv));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { valid: true, rowCount: 1, productionWritePerformed: false } });
  });
});

function request(value: string) {
  return new Request("https://app.example/api/admin/import/preview", { method: "POST", headers: { "content-type": "text/csv" }, body: value });
}
