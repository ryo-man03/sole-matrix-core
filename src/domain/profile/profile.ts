export type ExperienceLevel = "beginner" | "intermediate" | "power";

export type UserProfile = {
  userId: string;
  displayName: string;
  locale: string;
  timezone: string;
  experienceLevel: ExperienceLevel;
  createdAt: string;
  updatedAt: string;
};

const locales = new Set(["ja-JP", "en-US"]);
const levels = new Set<ExperienceLevel>(["beginner", "intermediate", "power"]);
const unsafeText = /[\u0000-\u001f\u007f<>]/u;

export type ProfileUpdate = Pick<UserProfile, "displayName" | "locale" | "timezone" | "experienceLevel">;

export function parseProfileUpdate(value: unknown): ProfileUpdate {
  if (!isRecord(value)) throw new Error("INVALID_PROFILE");
  const allowed = new Set(["displayName", "locale", "timezone", "experienceLevel"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) throw new Error("UNKNOWN_PROFILE_FIELD");
  const displayName = text(value.displayName, 1, 80);
  const locale = text(value.locale, 2, 20);
  const timezone = text(value.timezone, 1, 80);
  const experienceLevel = value.experienceLevel;
  if (!locales.has(locale) || !isTimeZone(timezone) || !levels.has(experienceLevel as ExperienceLevel)) {
    throw new Error("INVALID_PROFILE");
  }
  return { displayName, locale, timezone, experienceLevel: experienceLevel as ExperienceLevel };
}

function text(value: unknown, min: number, max: number): string {
  if (typeof value !== "string") throw new Error("INVALID_PROFILE");
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max || unsafeText.test(normalized)) throw new Error("INVALID_PROFILE");
  return normalized;
}

function isTimeZone(value: string): boolean {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
