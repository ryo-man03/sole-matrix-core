export const consentTypes = [
  "ai_processing", "search_grounding", "recommendation_history",
  "behavior_personalization", "analytics", "notifications", "external_provider_lookup",
] as const;
export type ConsentType = (typeof consentTypes)[number];
export const CONSENT_POLICY_VERSION = "2026-08-01";

export function parseConsentUpdate(value: unknown): { type: ConsentType; granted: boolean } {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "type" && key !== "granted")) throw new Error("INVALID_CONSENT");
  if (!consentTypes.includes(value.type as ConsentType) || typeof value.granted !== "boolean") throw new Error("INVALID_CONSENT");
  return { type: value.type as ConsentType, granted: value.granted };
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
