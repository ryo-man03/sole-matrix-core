export type SneakerAudience = "men"|"women"|"unisex"|"kids"|"unknown";
export type CanonicalSneakerKey={brandSlug:string;modelFamily:string;generation:string|null;styleCode:string|null;audience:SneakerAudience};
export type CanonicalMatch="exact_style_code"|"exact_model"|"family_related"|"none";

export function canonicalSneakerKey(input:{brand:string;modelName:string;modelFamily?:string|null;generation?:string|null;styleCode?:string|null;audience?:SneakerAudience}):CanonicalSneakerKey{
 const parsed=parseKnownModel(input.modelName);return {brandSlug:slug(input.brand),modelFamily:slug(input.modelFamily||parsed.family),generation:normalizeGeneration(input.generation??parsed.generation),styleCode:normalizeStyleCode(input.styleCode),audience:input.audience??inferAudience(input.modelName)};
}
export function canonicalSneakerKeyFromName(name:string):CanonicalSneakerKey{const brand=detectBrand(name);return canonicalSneakerKey({brand,modelName:name.slice(brand.length).trim(),audience:inferAudience(name)});}
export function compareCanonicalSneakers(a:CanonicalSneakerKey,b:CanonicalSneakerKey):CanonicalMatch{
 if(a.styleCode||b.styleCode)return a.styleCode!==null&&b.styleCode!==null&&a.styleCode===b.styleCode?"exact_style_code":"none";
 if(a.brandSlug!==b.brandSlug||a.modelFamily!==b.modelFamily)return "none";
 if(a.generation!==b.generation||a.audience!==b.audience)return "family_related";
 return "exact_model";
}
export function isCanonicalExactName(candidate:string,context:string){const match=compareCanonicalSneakers(canonicalSneakerKeyFromName(candidate),canonicalSneakerKeyFromName(context));return match==="exact_style_code"||match==="exact_model";}
export function matchesCanonicalContextName(candidate:string,context:string){const contextKey=canonicalSneakerKeyFromName(context);const normalized=context.normalize("NFKC").trim();if(!normalized.includes(" ")&&contextKey.modelFamily==="")return canonicalSneakerKeyFromName(candidate).brandSlug===contextKey.brandSlug;return isCanonicalExactName(candidate,context);}
function detectBrand(v:string){const n=v.normalize("NFKC");for(const brand of ["New Balance","Air Jordan","Converse","adidas","Nike","Vans","PUMA","Reebok","ASICS"]){if(n.toLowerCase().startsWith(brand.toLowerCase()))return brand;}return n.split(/\s+/u)[0]??"unknown";}
function parseKnownModel(value:string){const n=slug(value);const rules:[RegExp,string,(m:RegExpMatchArray)=>string|null][]=[
 [/\b991v2\b/u,"991",()=>"v2"],[/\b991\b/u,"991",()=>"v1"],[/\b990v([1-6])\b/u,"990",m=>`v${m[1]}`],
 [/\bsamba-og\b/u,"samba",()=>"og"],[/\bsamba-adv\b/u,"samba",()=>"adv"],
 [/\bauthentic-44-dx\b/u,"authentic",()=>"44-dx"],[/\bauthentic\b/u,"authentic",()=>"original"],
 [/\bair-jordan-1-low-golf\b/u,"air-jordan-1-low",()=>"golf"],[/\bair-jordan-1-low\b/u,"air-jordan-1-low",()=>"original"],
 ];for(const [pattern,family,generation] of rules){const m=n.match(pattern);if(m)return {family,generation:generation(m)}}return {family:removeColorTokens(n),generation:null};}
function removeColorTokens(v:string){return v.replace(/\b(?:black|white|grey|gray|navy|red|blue|green|brown|cream|gum|suede|leather|canvas|men|women|kids|unisex)\b/gu,"").replace(/-+/g,"-").replace(/^-|-$/g,"")||v;}
function normalizeStyleCode(v:string|null|undefined){if(!v)return null;const n=v.normalize("NFKC").toUpperCase().replace(/[^A-Z0-9]/g,"");return n.length>=5&&n.length<=24?n:null;}
function normalizeGeneration(v:string|null|undefined){return v?slug(v):null;}
function inferAudience(v:string):SneakerAudience{const n=slug(v);if(/\b(?:women|womens|wmns)\b/u.test(n))return"women";if(/\b(?:kids|grade-school|gs|td|ps)\b/u.test(n))return"kids";if(/\b(?:men|mens)\b/u.test(n))return"men";return"unknown";}
function slug(v:string){return v.normalize("NFKC").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");}
