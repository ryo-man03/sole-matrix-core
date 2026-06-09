import { describe, expect, test } from "vitest";

import { decideFromScore } from "../decision";

describe("decideFromScore", () => {
  test("uses Core v0.1 decision thresholds", () => {
    expect(decideFromScore(85)).toBe("STRONG_BUY");
    expect(decideFromScore(75)).toBe("BUY");
    expect(decideFromScore(60)).toBe("WAIT");
    expect(decideFromScore(45)).toBe("WATCH");
    expect(decideFromScore(44.99)).toBe("SKIP");
  });
});
