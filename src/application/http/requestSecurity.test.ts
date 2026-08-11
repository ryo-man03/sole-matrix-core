import { beforeEach, describe, expect, it, vi } from "vitest";
import { validateMutationRequest } from "./requestSecurity";
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
});
