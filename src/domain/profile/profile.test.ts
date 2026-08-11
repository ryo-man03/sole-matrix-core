import { describe, expect, it } from "vitest";
import { parseProfileUpdate } from "./profile";

const valid = { displayName: "Ryo", locale: "ja-JP", timezone: "Asia/Tokyo", experienceLevel: "beginner" };
describe("profile validation", () => {
  it.each([
    ["basic", valid], ["english", { ...valid, locale: "en-US" }], ["intermediate", { ...valid, experienceLevel: "intermediate" }],
    ["power", { ...valid, experienceLevel: "power" }], ["utc", { ...valid, timezone: "UTC" }], ["trim", { ...valid, displayName: " Ryo " }],
  ])("accepts %s", (_name, input) => expect(parseProfileUpdate(input)).toBeTruthy());
  it.each([
    ["empty", { ...valid, displayName: "" }], ["html", { ...valid, displayName: "<b>Ryo</b>" }], ["control", { ...valid, displayName: "Ryo\nX" }],
    ["long", { ...valid, displayName: "x".repeat(81) }], ["locale", { ...valid, locale: "ja" }], ["timezone", { ...valid, timezone: "Moon/Base" }],
    ["level", { ...valid, experienceLevel: "admin" }], ["unknown", { ...valid, userId: "forged" }], ["null", null], ["array", []],
    ["missing name", { ...valid, displayName: undefined }], ["missing locale", { ...valid, locale: undefined }], ["missing zone", { ...valid, timezone: undefined }], ["missing level", { ...valid, experienceLevel: undefined }],
  ])("rejects %s", (_name, input) => expect(() => parseProfileUpdate(input)).toThrow());
});
