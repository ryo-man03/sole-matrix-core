export const sizeSystems = ["JP","US_M","US_W","UK","EU","UNKNOWN"] as const;
export const audiences = ["men","women","unisex","kids","unknown"] as const;
export function parseSize(value: unknown) {
 const v = exactRecord(value, ["sizeSystem","sizeValue","audience","primarySize"]);
 if (!sizeSystems.includes(v.sizeSystem as never) || typeof v.sizeValue !== "number" || !Number.isFinite(v.sizeValue) || v.sizeValue <= 0 || v.sizeValue >= 100 || !audiences.includes(v.audience as never) || typeof v.primarySize !== "boolean") throw new Error("INVALID_SIZE");
 return { size_system: v.sizeSystem, size_value: v.sizeValue, audience: v.audience, primary_size: v.primarySize };
}
export function parseOwnedSneaker(value: unknown) {
 const v = exactRecord(value, ["brand","modelName","modelFamily","generation","colorwayName","styleCode","audience","sizeSystem","sizeValue","userRating","wearFrequency","notes"]);
 return { brand: text(v.brand,80,true), model_name: text(v.modelName,160,true), model_family: text(v.modelFamily,120,true), generation: text(v.generation,80), colorway_name: text(v.colorwayName,160), style_code: style(v.styleCode), audience: enumValue(v.audience,audiences,"unknown"), size_system: nullableEnum(v.sizeSystem,sizeSystems), size_value: nullableNumber(v.sizeValue,0,100), user_rating: nullableInteger(v.userRating,1,5), wear_frequency: nullableEnum(v.wearFrequency,["rarely","monthly","weekly","daily"] as const), notes: text(v.notes,1000) };
}
export function parseWishlist(value: unknown) {
 const v = exactRecord(value, ["brand","modelName","modelFamily","generation","colorwayName","styleCode","audience","desiredSizeSystem","desiredSizeValue","budgetMaxJpy","priority","notes","verificationState"]);
 return { brand: text(v.brand,80,true), model_name: text(v.modelName,160,true), model_family: text(v.modelFamily,120,true), generation: text(v.generation,80), colorway_name: text(v.colorwayName,160), style_code: style(v.styleCode), audience: enumValue(v.audience,audiences,"unknown"), desired_size_system: nullableEnum(v.desiredSizeSystem,sizeSystems), desired_size_value: nullableNumber(v.desiredSizeValue,0,100), budget_max_jpy: nullableInteger(v.budgetMaxJpy,0,100_000_000), priority: nullableInteger(v.priority,1,5) ?? 3, notes: text(v.notes,1000), verification_state: enumValue(v.verificationState,["verified","model_only","unverified"] as const,"unverified") };
}
function exactRecord(value: unknown, allowed: string[]) { if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("INVALID_INPUT"); return value as Record<string,unknown>; }
function text(value: unknown,max:number,required=false) { if (value==null || value==="") { if(required) throw new Error("REQUIRED"); return null; } if(typeof value!=="string" || value.trim().length>max || /[\u0000-\u001f\u007f<>]/u.test(value)) throw new Error("INVALID_TEXT"); return value.trim(); }
function style(value:unknown) { const v=text(value,40); return v ? v.toUpperCase().replace(/[^A-Z0-9]/g,"") : null; }
function enumValue<T extends readonly string[]>(value:unknown, values:T, fallback:T[number]) { return values.includes(value as T[number]) ? value as T[number] : fallback; }
function nullableEnum<T extends readonly string[]>(value:unknown, values:T) { return value==null || value==="" ? null : enumValue(value,values,null as never); }
function nullableNumber(value:unknown,min:number,max:number) { if(value==null || value==="") return null; if(typeof value!=="number" || value<=min || value>=max) throw new Error("INVALID_NUMBER"); return value; }
function nullableInteger(value:unknown,min:number,max:number) { if(value==null || value==="") return null; if(!Number.isInteger(value) || (value as number)<min || (value as number)>max) throw new Error("INVALID_INTEGER"); return value as number; }
