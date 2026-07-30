import { GET } from "./route";

const STOCKX_ENV_KEYS = [
  "STOCKX_API_KEY",
  "STOCKX_CLIENT_ID",
  "STOCKX_CLIENT_SECRET",
  "STOCKX_ACCESS_TOKEN",
  "STOCKX_TOKEN_EXPIRES_AT",
] as const;

describe("market intelligence status route", () => {
  const original = Object.fromEntries(
    STOCKX_ENV_KEYS.map((key) => [key, process.env[key]]),
  );

  afterEach(() => {
    for (const key of STOCKX_ENV_KEYS) {
      const value = original[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("reports StockX not configured without making a provider request", async () => {
    for (const key of STOCKX_ENV_KEYS) delete process.env[key];
    const response = await GET();
    expect(await response.json()).toEqual({
      stockx: "not_configured",
      snkrdunk: "not_authorized",
      mercari: "not_authorized",
      automaticRequestMade: false,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports configured only when the complete server-side set exists", async () => {
    for (const key of STOCKX_ENV_KEYS) process.env[key] = `test-${key}`;
    const response = await GET();
    expect(await response.json()).toMatchObject({ stockx: "configured" });
  });
});

