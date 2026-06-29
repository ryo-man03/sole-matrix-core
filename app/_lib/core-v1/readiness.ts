import type { ProviderReadiness } from "./types";

export function createGeminiFallbackReadiness(
  configured: boolean,
): ProviderReadiness {
  return configured
    ? {
        provider: "gemini",
        status: "fallback",
        detail:
          "AI補助を利用できなかったため、ルールベースで説明しています。",
      }
    : {
        provider: "gemini",
        status: "missing_config",
        detail:
          "AI補助が未設定のため、ルールベースで説明しています。",
      };
}
