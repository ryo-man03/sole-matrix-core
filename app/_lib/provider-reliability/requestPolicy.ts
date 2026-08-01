export type ProviderFailureCode =
  | "timeout"
  | "aborted"
  | "offline"
  | "connection_reset"
  | "transport_error"
  | "invalid_json"
  | "empty_response"
  | "schema_mismatch"
  | `http_${number}`;

export type ProviderRequestFailure = {
  ok: false;
  code: ProviderFailureCode;
  attempts: number;
  retryable: boolean;
  status?: number;
};

export type ProviderRequestSuccess<T> = {
  ok: true;
  data: T;
  attempts: number;
};

export type ProviderRequestResult<T> =
  | ProviderRequestSuccess<T>
  | ProviderRequestFailure;

type ProviderRequestAttempt<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ProviderFailureCode;
      retryable: boolean;
      status?: number;
    };

type ProviderJsonRequest<T> = {
  input: RequestInfo | URL;
  init?: RequestInit;
  validate: (value: unknown) => value is T;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  /**
   * The application policy intentionally caps this at one retry even if a
   * caller supplies a larger number.
   */
  maxRetries?: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRYABLE_HTTP_STATUSES = new Set([408, 500, 502, 503, 504]);

export async function requestProviderJson<T>(
  request: ProviderJsonRequest<T>,
): Promise<ProviderRequestResult<T>> {
  const maxRetries = Math.min(1, Math.max(0, request.maxRetries ?? 1));
  let attempts = 0;

  while (attempts <= maxRetries) {
    attempts += 1;
    const result = await requestOnce(request);
    if (result.ok) {
      return { ...result, attempts };
    }
    const failure = { ...result, attempts };
    if (!failure.retryable || attempts > maxRetries) {
      return failure;
    }
  }

  return {
    ok: false,
    code: "transport_error",
    attempts,
    retryable: false,
  };
}

export function isTemporaryProviderFailure(
  code: ProviderFailureCode,
  status?: number,
): boolean {
  if (typeof status === "number") return RETRYABLE_HTTP_STATUSES.has(status);
  return code === "timeout"
    || code === "offline"
    || code === "connection_reset";
}

async function requestOnce<T>(
  request: ProviderJsonRequest<T>,
): Promise<ProviderRequestAttempt<T>> {
  const controller = new AbortController();
  const timeoutMs = Math.max(1, request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const externalSignal = request.init?.signal;
  let timedOut = false;

  if (externalSignal?.aborted) {
    return { ok: false, code: "aborted", retryable: false };
  }

  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error("SOLE_MATRIX_PROVIDER_TIMEOUT"));
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      (request.fetcher ?? fetch)(request.input, {
        ...request.init,
        signal: controller.signal,
      }),
      timeoutPromise,
    ]);

    if (!response.ok) {
      const code = `http_${response.status}` as const;
      return {
        ok: false,
        code,
        status: response.status,
        retryable: isTemporaryProviderFailure(code, response.status),
      };
    }

    const text = await Promise.race([response.text(), timeoutPromise]);
    if (!text.trim()) {
      return {
        ok: false,
        code: "empty_response",
        retryable: false,
      };
    }

    let value: unknown;
    try {
      value = JSON.parse(text) as unknown;
    } catch {
      return {
        ok: false,
        code: "invalid_json",
        retryable: false,
      };
    }

    if (!request.validate(value)) {
      return {
        ok: false,
        code: "schema_mismatch",
        retryable: false,
      };
    }

    return { ok: true, data: value };
  } catch (error) {
    const code = classifyTransportError(error, timedOut, externalSignal?.aborted === true);
    return {
      ok: false,
      code,
      retryable: isTemporaryProviderFailure(code),
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

function classifyTransportError(
  error: unknown,
  timedOut: boolean,
  externallyAborted: boolean,
): ProviderFailureCode {
  if (timedOut) return "timeout";
  if (externallyAborted) return "aborted";
  const name = error instanceof Error ? error.name.toLowerCase() : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (name === "aborterror") return "aborted";
  if (message.includes("offline") || message.includes("network is unreachable")) {
    return "offline";
  }
  if (
    message.includes("econnreset")
    || message.includes("connection reset")
    || message.includes("socket hang up")
  ) {
    return "connection_reset";
  }
  return "transport_error";
}
