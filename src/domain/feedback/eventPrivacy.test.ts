import { describe, expect, it } from "vitest";

import { canPersistProductEvent, canUpdateFitPreferenceProfile } from "./eventPrivacy";

describe("feedback privacy split", () => {
  it("allows an explicit purchase or fit action when analytics is disabled", () => {
    expect(canPersistProductEvent("explicit_product_action", false)).toBe(true);
  });

  it("does not persist views or clicks when analytics consent is off", () => {
    expect(canPersistProductEvent("behavior_analytics", false)).toBe(false);
    expect(canPersistProductEvent("behavior_analytics", true)).toBe(true);
  });

  it("does not update the Preference Profile when behavior personalization consent is off", () => {
    expect(canUpdateFitPreferenceProfile(false)).toBe(false);
    expect(canUpdateFitPreferenceProfile(true)).toBe(true);
  });
});
