import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const guardedPublicMutations = [
  "app/api/core-v1/recommend/route.ts",
  "app/api/core-v1/feedback/route.ts",
  "app/api/recommendation-feedback/route.ts",
  "app/api/sneakers/analyze/route.ts",
  "app/api/sneakers/image-analysis/route.ts",
] as const;

describe("public mutation route security", () => {
  it.each(guardedPublicMutations)("applies the shared mutation guard to %s", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    const postBody = source.slice(source.indexOf("export async function POST"));
    expect(postBody).toMatch(/validateMutationRequest\(request/);
  });
});
