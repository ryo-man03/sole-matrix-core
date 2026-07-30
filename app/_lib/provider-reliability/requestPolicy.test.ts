import { describe, expect, it, vi } from "vitest";

import {
  isTemporaryProviderFailure,
  requestProviderJson,
} from "./requestPolicy";

type Payload = { ok: true; data: { id: string } };

const validPayload: Payload = { ok: true, data: { id: "candidate-1" } };
const validatePayload = (value: unknown): value is Payload => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (record.ok !== true || !record.data || typeof record.data !== "object") return false;
  return typeof (record.data as Record<string, unknown>).id === "string";
};

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("provider request reliability policy", () => {
  it.each([
    [400, false],
    [401, false],
    [403, false],
    [404, false],
    [409, false],
    [429, true],
    [500, true],
    [502, true],
    [503, true],
  ])("classifies HTTP %i retry policy", (status, retryable) => {
    expect(isTemporaryProviderFailure(`http_${status}`, status)).toBe(retryable);
  });

  it.each([400, 401, 403, 404, 409])(
    "does not retry permanent HTTP %i responses",
    async (status) => {
      const fetcher = vi.fn(async () => jsonResponse({ error: "fixture" }, status));
      const result = await requestProviderJson({
        input: "https://example.com",
        fetcher,
        validate: validatePayload,
      });
      expect(result).toMatchObject({
        ok: false,
        code: `http_${status}`,
        attempts: 1,
        retryable: false,
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it.each([429, 500, 502, 503])(
    "retries temporary HTTP %i responses once and recovers",
    async (status) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(jsonResponse({ error: "fixture" }, status))
        .mockResolvedValueOnce(jsonResponse(validPayload));
      const result = await requestProviderJson({
        input: "https://example.com",
        fetcher,
        validate: validatePayload,
      });
      expect(result).toEqual({ ok: true, data: validPayload, attempts: 2 });
      expect(fetcher).toHaveBeenCalledTimes(2);
    },
  );

  it("caps retries at one even when a caller requests more", async () => {
    const fetcher = vi.fn(async () => jsonResponse({}, 503));
    const result = await requestProviderJson({
      input: "https://example.com",
      fetcher,
      validate: validatePayload,
      maxRetries: 99,
    });
    expect(result).toMatchObject({ ok: false, code: "http_503", attempts: 2 });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["invalid JSON", new Response("{", { status: 200 }), "invalid_json"],
    ["empty response", new Response("  ", { status: 200 }), "empty_response"],
    ["schema mismatch", jsonResponse({ nope: true }), "schema_mismatch"],
    ["partial payload", jsonResponse({ ok: true, data: {} }), "schema_mismatch"],
    [
      "duplicate/ambiguous payload",
      jsonResponse({ ok: true, data: [{ id: "a" }, { id: "a" }] }),
      "schema_mismatch",
    ],
  ])("returns a stable non-retryable result for %s", async (_label, response, code) => {
    const fetcher = vi.fn(async () => response);
    const result = await requestProviderJson({
      input: "https://example.com",
      fetcher,
      validate: validatePayload,
    });
    expect(result).toMatchObject({ ok: false, code, attempts: 1, retryable: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["connection reset", new TypeError("ECONNRESET"), "connection_reset", 2],
    ["offline", new TypeError("network is unreachable: offline"), "offline", 2],
    ["generic host failure", new TypeError("failed to fetch"), "transport_error", 1],
  ])(
    "handles %s without leaking the transport exception",
    async (_label, error, code, expectedAttempts) => {
      const fetcher = vi.fn(async () => {
        throw error;
      });
      const result = await requestProviderJson({
        input: "https://example.com",
        fetcher,
        validate: validatePayload,
      });
      expect(result).toMatchObject({ ok: false, code, attempts: expectedAttempts });
      expect(fetcher).toHaveBeenCalledTimes(expectedAttempts);
    },
  );

  it("ends a timed-out request and retries at most once", async () => {
    const fetcher = vi.fn(() => new Promise<Response>(() => undefined));
    const result = await requestProviderJson({
      input: "https://example.com",
      fetcher,
      validate: validatePayload,
      timeoutMs: 5,
    });
    expect(result).toMatchObject({
      ok: false,
      code: "timeout",
      attempts: 2,
      retryable: true,
    });
  });

  it("does not retry a caller-aborted request", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetcher = vi.fn(async () => jsonResponse(validPayload));
    const result = await requestProviderJson({
      input: "https://example.com",
      init: { signal: controller.signal },
      fetcher,
      validate: validatePayload,
    });
    expect(result).toMatchObject({
      ok: false,
      code: "aborted",
      attempts: 1,
      retryable: false,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("allows a slow response that remains within the deadline", async () => {
    const fetcher = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return jsonResponse(validPayload);
    });
    const result = await requestProviderJson({
      input: "https://example.com",
      fetcher,
      validate: validatePayload,
      timeoutMs: 50,
    });
    expect(result).toEqual({ ok: true, data: validPayload, attempts: 1 });
  });
});

