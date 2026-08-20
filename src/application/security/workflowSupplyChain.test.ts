import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("GitHub Actions supply-chain policy", () => {
  it("pins every external action to a full commit SHA", () => {
    const directory = path.join(process.cwd(), ".github", "workflows");
    const uses = readdirSync(directory)
      .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"))
      .flatMap((name) =>
        readFileSync(path.join(directory, name), "utf8")
          .split(/\r?\n/u)
          .map((line) => line.match(/^\s*(?:-\s*)?uses:\s*([^\s#]+)@([^\s#]+)/u))
          .filter((match): match is RegExpMatchArray => match !== null)
          .map((match) => ({ file: name, action: match[1]!, ref: match[2]! })),
      );

    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter(({ ref }) => !/^[0-9a-f]{40}$/u.test(ref))).toEqual([]);
  });
});
