export type AppExperienceMode = "diagnosis" | "product";

export const EXPERIENCE_MODE_STORAGE_KEY = "sole-matrix:experience-mode:v1";

export function parseExperienceMode(value: string | null | undefined): AppExperienceMode | null {
  return value === "diagnosis" || value === "product" ? value : null;
}

export function readExperienceModeFromUrl(url: string): AppExperienceMode | null {
  try {
    return parseExperienceMode(new URL(url, "http://localhost").searchParams.get("path"));
  } catch {
    return null;
  }
}

export function createExperienceModeUrl(currentUrl: string, mode: AppExperienceMode | null): string {
  const url = new URL(currentUrl, "http://localhost");
  if (mode) url.searchParams.set("path", mode);
  else url.searchParams.delete("path");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function readStoredExperienceMode(storage?: Pick<Storage, "getItem">): AppExperienceMode | null {
  if (!storage) return null;
  try {
    return parseExperienceMode(storage.getItem(EXPERIENCE_MODE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredExperienceMode(
  storage: Pick<Storage, "setItem" | "removeItem"> | undefined,
  mode: AppExperienceMode | null,
): boolean {
  if (!storage) return false;
  try {
    if (mode) storage.setItem(EXPERIENCE_MODE_STORAGE_KEY, mode);
    else storage.removeItem(EXPERIENCE_MODE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
