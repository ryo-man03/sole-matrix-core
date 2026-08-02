export type UserPreferencesInput = {
 favoriteBrands: string[]; avoidedBrands: string[]; favoriteColors: string[]; avoidedColors: string[];
 favoriteMaterials: string[]; avoidedMaterials: string[]; silhouettes: string[]; useCases: string[]; styleTags: string[];
 budgetMinJpy: number | null; budgetMaxJpy: number | null; budgetIsHardLimit: boolean; conditionPreference: "new" | "used" | "either";
};
const arrays = ["favoriteBrands","avoidedBrands","favoriteColors","avoidedColors","favoriteMaterials","avoidedMaterials","silhouettes","useCases","styleTags"] as const;
export function parsePreferences(value: unknown): UserPreferencesInput {
 if (!record(value) || Object.keys(value).some((key) => ![...arrays,"budgetMinJpy","budgetMaxJpy","budgetIsHardLimit","conditionPreference"].includes(key))) throw new Error("INVALID_PREFERENCES");
 const result = Object.fromEntries(arrays.map((key) => [key, stringList(value[key])])) as unknown as UserPreferencesInput;
 const min = money(value.budgetMinJpy), max = money(value.budgetMaxJpy);
 if (min !== null && max !== null && min > max) throw new Error("INVALID_BUDGET");
 if (typeof value.budgetIsHardLimit !== "boolean" || !["new","used","either"].includes(String(value.conditionPreference))) throw new Error("INVALID_PREFERENCES");
 return { ...result, budgetMinJpy: min, budgetMaxJpy: max, budgetIsHardLimit: value.budgetIsHardLimit, conditionPreference: value.conditionPreference as UserPreferencesInput["conditionPreference"] };
}
function stringList(value: unknown) { if (!Array.isArray(value) || value.length > 30) throw new Error("INVALID_LIST"); const clean = [...new Set(value.map((item) => { if (typeof item !== "string" || !/^[^<>\u0000-\u001f\u007f]{1,60}$/u.test(item.trim())) throw new Error("INVALID_LIST"); return item.trim(); }))]; return clean; }
function money(value: unknown) { if (value === null) return null; if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 100_000_000) throw new Error("INVALID_BUDGET"); return value as number; }
function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
