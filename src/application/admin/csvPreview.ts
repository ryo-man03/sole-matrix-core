export const CSV_IMPORT_MAX_BYTES = 256 * 1024;
export const CSV_IMPORT_MAX_ROWS = 500;
export const CSV_IMPORT_PREVIEW_ROWS = 20;

const columns = [
  "entry_type", "source_url", "source_kind", "brand", "model", "model_family", "style_code", "colorway",
  "release_date", "region", "information_state",
] as const;
const requiredColumns = ["entry_type", "brand", "model", "region", "information_state"] as const;
const informationStates = new Set(["official_announced", "retailer_confirmed", "editorial_reported", "rumor", "released", "restocked", "cancelled", "date_changed", "conflicting_evidence", "unknown"]);
const sourceKinds = new Set(["manual_official_reference", "manual_retailer_reference", "manual_other"]);

export type CsvPreviewIssue = Readonly<{ row: number; column: string | null; code: string; message: string }>;
export type CsvPreviewResult = Readonly<{
  valid: boolean;
  rowCount: number;
  headers: string[];
  preview: ReadonlyArray<Record<string, string>>;
  issues: CsvPreviewIssue[];
  productionWritePerformed: false;
}>;

export function previewStewardCsv(bytes: Uint8Array): CsvPreviewResult {
  if (bytes.byteLength > CSV_IMPORT_MAX_BYTES) throw new Error("CSV_TOO_LARGE");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/u, "");
  const records = parseCsv(text);
  if (!records.length) throw new Error("CSV_EMPTY");
  const headers = records[0]!.map((value) => value.trim());
  const issues: CsvPreviewIssue[] = [];
  const unexpected = headers.filter((header) => !(columns as readonly string[]).includes(header));
  for (const header of unexpected) issues.push(issue(1, header || null, "unexpected_column", `Unexpected column: ${header || "(empty)"}`));
  for (const required of requiredColumns) if (!headers.includes(required)) issues.push(issue(1, required, "missing_column", `Missing required column: ${required}`));
  if (new Set(headers).size !== headers.length) issues.push(issue(1, null, "duplicate_column", "Duplicate CSV columns are not allowed."));

  const rows = records.slice(1).filter((row) => row.some((value) => value.trim()));
  if (rows.length > CSV_IMPORT_MAX_ROWS) throw new Error("CSV_TOO_MANY_ROWS");
  const preview: Array<Record<string, string>> = [];
  const identities = new Set<string>();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== headers.length) issues.push(issue(rowNumber, null, "column_count", "Column count does not match the header."));
    const mapped: Record<string, string> = {};
    headers.forEach((header, columnIndex) => { mapped[header] = (row[columnIndex] ?? "").trim().slice(0, 2048); });
    validateRow(mapped, rowNumber, issues);
    const identity = [mapped.entry_type, mapped.brand, mapped.model, mapped.style_code, mapped.region, mapped.source_url].map(normalize).join("|");
    if (identities.has(identity)) issues.push(issue(rowNumber, null, "duplicate", "Duplicate row identity in this file."));
    identities.add(identity);
    if (preview.length < CSV_IMPORT_PREVIEW_ROWS) preview.push(mapped);
  });
  return { valid: issues.length === 0, rowCount: rows.length, headers, preview, issues: issues.slice(0, 200), productionWritePerformed: false };
}

function validateRow(row: Record<string, string>, rowNumber: number, issues: CsvPreviewIssue[]) {
  for (const [column, value] of Object.entries(row)) {
    if (/^[=+\-@]/u.test(value.trimStart())) issues.push(issue(rowNumber, column, "formula_injection", "Spreadsheet formula prefixes are not allowed."));
  }
  if (!new Set(["release", "evidence"]).has(row.entry_type ?? "")) issues.push(issue(rowNumber, "entry_type", "invalid_enum", "entry_type must be release or evidence."));
  for (const field of ["brand", "model", "region", "information_state"] as const) if (!row[field]) issues.push(issue(rowNumber, field, "required", `${field} is required.`));
  if (row.information_state && !informationStates.has(row.information_state)) issues.push(issue(rowNumber, "information_state", "invalid_enum", "Unknown information_state."));
  if (row.release_date && !validDate(row.release_date)) issues.push(issue(rowNumber, "release_date", "invalid_date", "release_date must be a real YYYY-MM-DD date."));
  if (row.entry_type === "release" && !row.model_family) issues.push(issue(rowNumber, "model_family", "required", "model_family is required for release drafts."));
  if (row.entry_type === "evidence") {
    if (!safeHttpsUrl(row.source_url ?? "")) issues.push(issue(rowNumber, "source_url", "unsafe_url", "Evidence source_url must be a public HTTPS URL."));
    if (!sourceKinds.has(row.source_kind ?? "")) issues.push(issue(rowNumber, "source_kind", "invalid_enum", "Unknown manual source_kind."));
  }
}

function parseCsv(value: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (quoted) {
      if (character === '"' && value[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/u, "")); records.push(row); row = []; field = ""; }
    else field += character;
  }
  if (quoted) throw new Error("CSV_UNCLOSED_QUOTE");
  if (field || row.length) { row.push(field.replace(/\r$/u, "")); records.push(row); }
  return records;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function safeHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLocaleLowerCase("en-US");
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port
      && host !== "localhost" && !host.endsWith(".local") && !/^\d+(?:\.\d+){3}$/u.test(host) && !host.includes(":");
  } catch { return false; }
}

function normalize(value: string | undefined): string {
  return (value ?? "").normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]/gu, "");
}

function issue(row: number, column: string | null, code: string, message: string): CsvPreviewIssue {
  return { row, column, code, message };
}
