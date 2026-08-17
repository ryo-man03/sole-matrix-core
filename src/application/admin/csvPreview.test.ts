import { describe, expect, it } from "vitest";

import { CSV_IMPORT_MAX_BYTES, CSV_IMPORT_MAX_ROWS, previewStewardCsv } from "./csvPreview";

const header = "entry_type,source_url,source_kind,brand,model,model_family,style_code,colorway,release_date,region,information_state";

describe("data steward CSV preview", () => {
  it("previews valid release and evidence rows without a production write", () => {
    const result = preview(`${header}\nrelease,,,New Balance,991 v2,991,U991GL2,Grey,2026-08-18,JP,official_announced\nevidence,https://example.com/release,manual_official_reference,New Balance,991 v2,,U991GL2,Grey,2026-08-18,JP,official_announced`);
    expect(result).toMatchObject({ valid: true, rowCount: 2, productionWritePerformed: false });
  });

  it.each([
    [`${header},extra\nrelease,,,Nike,AJ1,AJ1,,,,JP,unknown,x`, "unexpected_column"],
    [`${header}\nrelease,,,=CMD(),AJ1,AJ1,,,,JP,unknown`, "formula_injection"],
    [`${header}\nevidence,http://example.com,manual_other,Nike,AJ1,,,,,JP,unknown`, "unsafe_url"],
    [`${header}\nrelease,,,Nike,AJ1,AJ1,,,2026-02-30,JP,unknown`, "invalid_date"],
    [`${header}\nrelease,,,Nike,AJ1,AJ1,,,,JP,nope`, "invalid_enum"],
  ])("reports guarded CSV issue %#", (csv, code) => expect(preview(csv).issues.map((item) => item.code)).toContain(code));

  it("detects duplicates independent of CSV row ordering", () => {
    const row = "release,,,Nike,AJ1,AJ1,,,,JP,unknown";
    expect(preview(`${header}\n${row}\n${row}`).issues.map((item) => item.code)).toContain("duplicate");
  });

  it("enforces byte and row bounds", () => {
    expect(() => previewStewardCsv(new Uint8Array(CSV_IMPORT_MAX_BYTES + 1))).toThrow("CSV_TOO_LARGE");
    const rows = Array.from({ length: CSV_IMPORT_MAX_ROWS + 1 }, (_, index) => `release,,,Nike,AJ${index},AJ1,,,,JP,unknown`).join("\n");
    expect(() => preview(`${header}\n${rows}`)).toThrow("CSV_TOO_MANY_ROWS");
  });
});

function preview(value: string) {
  return previewStewardCsv(new TextEncoder().encode(value));
}
