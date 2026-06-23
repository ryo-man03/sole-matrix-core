import { classifyExternalSmokeReadiness } from "./readiness";
import { isGeminiGenerateContentResponse } from "./responseValidators";
import type {
  ExternalSmokeEnvironment,
  ExternalSmokeResult,
} from "./types";

const geminiEndpointContractAvailable = true;
const geminiModel = "gemini-2.5-flash";

export async function runGeminiIsolatedSmoke(
  options: {
    env?: ExternalSmokeEnvironment;
    fetcher?: typeof fetch;
    endpointContractAvailable?: boolean;
  } = {}
): Promise<ExternalSmokeResult> {
  const env = options.env ?? process.env;
  const readiness = classifyExternalSmokeReadiness({
    provider: "gemini",
    env,
    requiredEnvVars: ["GEMINI_API_KEY"],
    endpointContractAvailable:
      options.endpointContractAvailable ?? geminiEndpointContractAvailable,
  });

  if (readiness !== null) {
    return readiness;
  }

  const apiKey = env.GEMINI_API_KEY?.trim();
  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!apiKey || typeof fetcher !== "function") {
    return { provider: "gemini", status: "network_error" };
  }

  try {
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: "Reply with smoke-ok only." }],
            },
          ],
          generationConfig: { maxOutputTokens: 8, temperature: 0 },
        }),
      }
    );

    if (!response.ok) {
      return { provider: "gemini", status: "network_error" };
    }

    const responseBody = (await response.json()) as unknown;

    return {
      provider: "gemini",
      status: isGeminiGenerateContentResponse(responseBody)
        ? "ok"
        : "invalid_response_shape",
    };
  } catch {
    return { provider: "gemini", status: "network_error" };
  }
}
