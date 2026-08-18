export type ProductEventClass = "explicit_product_action" | "behavior_analytics";

export function canPersistProductEvent(eventClass: ProductEventClass, analyticsConsent: boolean): boolean {
  return eventClass === "explicit_product_action" || analyticsConsent;
}

export function canUpdateFitPreferenceProfile(behaviorPersonalizationConsent: boolean): boolean {
  return behaviorPersonalizationConsent;
}
