import { describe, expect, it } from "vitest";
import { consentTypes, parseConsentUpdate } from "./consent";
describe("consent", () => {
  it.each(consentTypes)("accepts %s opt-in", (type) => expect(parseConsentUpdate({ type, granted: true })).toEqual({ type, granted: true }));
  it.each(consentTypes)("accepts %s opt-out", (type) => expect(parseConsentUpdate({ type, granted: false })).toEqual({ type, granted: false }));
  it.each([{}, null, [], { type: "admin", granted: true }, { type: "analytics", granted: "yes" }, { type: "analytics", granted: true, userId: "forged" }])("rejects invalid %j", (input) => expect(() => parseConsentUpdate(input)).toThrow());
});
