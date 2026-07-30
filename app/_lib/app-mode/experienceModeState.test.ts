import {
  createExperienceModeUrl,
  EXPERIENCE_MODE_STORAGE_KEY,
  parseExperienceMode,
  readExperienceModeFromUrl,
  readStoredExperienceMode,
  writeStoredExperienceMode,
} from "./experienceModeState";

describe("experience mode state", () => {
  it("accepts only the two application modes", () => {
    expect(parseExperienceMode("diagnosis")).toBe("diagnosis");
    expect(parseExperienceMode("product")).toBe("product");
    expect(parseExperienceMode("ryo")).toBeNull();
    expect(parseExperienceMode(null)).toBeNull();
  });

  it("keeps unrelated query state when changing the mode URL", () => {
    expect(createExperienceModeUrl("/app?session=guest&path=product#result", "diagnosis"))
      .toBe("/app?session=guest&path=diagnosis#result");
    expect(createExperienceModeUrl("/app?session=guest&path=product", null))
      .toBe("/app?session=guest");
  });

  it("reads mode from absolute and relative URLs without throwing", () => {
    expect(readExperienceModeFromUrl("https://example.com/app?path=product")).toBe("product");
    expect(readExperienceModeFromUrl("/app?path=diagnosis")).toBe("diagnosis");
    expect(readExperienceModeFromUrl("not a url")).toBeNull();
  });

  it("handles unavailable and quota-limited session storage", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    expect(writeStoredExperienceMode(storage, "product")).toBe(true);
    expect(values.get(EXPERIENCE_MODE_STORAGE_KEY)).toBe("product");
    expect(readStoredExperienceMode(storage)).toBe("product");
    expect(writeStoredExperienceMode(storage, null)).toBe(true);
    expect(readStoredExperienceMode(storage)).toBeNull();

    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("quota"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(readStoredExperienceMode(blocked)).toBeNull();
    expect(writeStoredExperienceMode(blocked, "diagnosis")).toBe(false);
  });
});
