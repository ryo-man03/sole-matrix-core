import { beforeEach, describe, expect, it, vi } from "vitest";
import { readBoundedJsonBody, validateMutationRequest } from "./requestSecurity";
describe("mutation security", () => {
  beforeEach(() => vi.unstubAllEnvs());
  it.each(["POST", "PUT", "PATCH", "DELETE"])("accepts same-origin %s", (method) => {
    const request = new Request("http://localhost/api/test", { method, headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json" } });
    expect(validateMutationRequest(request, { key: `ok-${method}` }).ok).toBe(true);
  });
  it.each(["https://evil.example", "null", "://bad"])("rejects bad origin %s", (origin) => {
    const request = new Request("https://app.example/api/test", { method: "POST", headers: { host: "app.example", origin, "content-type": "application/json" } });
    expect(validateMutationRequest(request, { key: `origin-${origin}` }).ok).toBe(false);
  });
  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data", ""])("rejects content type %s", (contentType) => {
    const request = new Request("http://localhost/api/test", { method: "POST", headers: { host: "localhost", origin: "http://localhost", ...(contentType ? { "content-type": contentType } : {}) } });
    expect(validateMutationRequest(request, { key: `type-${contentType}` }).ok).toBe(false);
  });
  it("requires origin in production", () => { vi.stubEnv("NODE_ENV", "production"); const request = new Request("https://app.example/api/test", { method: "POST", headers: { host: "app.example", "content-type": "application/json" } }); expect(validateMutationRequest(request, { key: "prod-origin" }).ok).toBe(false); });
  it("rate limits", () => { const make = () => new Request("http://localhost/api/test", { method: "POST", headers: { host: "localhost", origin: "http://localhost", "content-type": "application/json" } }); expect(validateMutationRequest(make(), { key: "limited", limit: 1 }).ok).toBe(true); expect(validateMutationRequest(make(), { key: "limited", limit: 1 }).ok).toBe(false); });

  it.each([2_049, 4_096, 32_769])("rejects an oversized query of %s characters", (length) => {
    const request = new Request(`https://app.example/api/test?q=${"x".repeat(length)}`, {
      method: "POST",
      headers: { host: "app.example", origin: "https://app.example", "content-type": "application/json" },
    });
    expect(validateMutationRequest(request, { key: `query-${length}` })).toMatchObject({ ok: false, status: 414, code: "QUERY_TOO_LARGE" });
  });

  it.each([32_769, 65_536, 1_000_000])("rejects a declared body size of %s bytes", (length) => {
    const request = new Request("https://app.example/api/test", {
      method: "POST",
      headers: { host: "app.example", origin: "https://app.example", "content-type": "application/json", "content-length": String(length) },
    });
    expect(validateMutationRequest(request, { key: `body-${length}` })).toMatchObject({ ok: false, status: 413, code: "BODY_TOO_LARGE" });
  });
});

describe("bounded JSON reader", () => {
  it("reads a bounded pollution-free object", async () => {
    const request = jsonRequest(JSON.stringify({ event: "saved", reasons: ["fit"] }));
    await expect(readBoundedJsonBody(request)).resolves.toEqual({ event: "saved", reasons: ["fit"] });
  });

  it.each([
    '{"__proto__":{"admin":true}}',
    '{"nested":{"prototype":{"admin":true}}}',
    '{"items":[{"constructor":{"prototype":{"admin":true}}}]}',
  ])("rejects prototype-pollution JSON %#", async (body) => {
    await expect(readBoundedJsonBody(jsonRequest(body))).rejects.toMatchObject({ code: "UNSAFE_JSON" });
  });

  it.each(["", "null trailing", "{", "[1,", "undefined"])("rejects malformed JSON %#", async (body) => {
    await expect(readBoundedJsonBody(jsonRequest(body))).rejects.toMatchObject({ code: "INVALID_JSON" });
  });

  it.each([32, 64, 128, 256])("enforces the actual streamed byte limit %s", async (maximumBytes) => {
    const body = JSON.stringify({ value: "あ".repeat(maximumBytes) });
    await expect(readBoundedJsonBody(jsonRequest(body), maximumBytes)).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
  });

  it("rejects excessive object depth", async () => {
    const body = `${'{"value":'.repeat(22)}null${"}".repeat(22)}`;
    await expect(readBoundedJsonBody(jsonRequest(body))).rejects.toMatchObject({ code: "UNSAFE_JSON" });
  });
});

function jsonRequest(body: string): Request {
  return new Request("https://app.example/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}
