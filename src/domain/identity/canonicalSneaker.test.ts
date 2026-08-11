import { describe,expect,it } from "vitest";import { canonicalSneakerKey,canonicalSneakerKeyFromName,compareCanonicalSneakers,isCanonicalExactName } from "./canonicalSneaker";
const exactPairs=[
 ["New Balance 991","New Balance 991 Grey"],["New Balance 991v2","New Balance 991v2 Navy"],["New Balance 990v3","New Balance 990v3 Grey"],["New Balance 990v4","New Balance 990v4 Navy"],
 ["adidas Samba OG","adidas Samba OG White"],["adidas Samba ADV","adidas Samba ADV Black"],["Vans Authentic","Vans Authentic Black White"],["Vans Authentic 44 DX","Vans Authentic 44 DX Anaheim"],
 ["Nike Air Jordan 1 Low","Nike Air Jordan 1 Low Black"],["Nike Air Jordan 1 Low Golf","Nike Air Jordan 1 Low Golf White"],
] as const;
const relatedPairs=[["New Balance 991","New Balance 991v2"],["New Balance 990v3","New Balance 990v4"],["adidas Samba OG","adidas Samba ADV"],["Vans Authentic","Vans Authentic 44 DX"],["Nike Air Jordan 1 Low","Nike Air Jordan 1 Low Golf"]] as const;
const nonePairs=[["New Balance 991","New Balance 990v3"],["adidas Samba OG","adidas Tobacco"],["Vans Authentic","Vans Era"],["Nike Air Jordan 1 Low","Nike Air Force 1 Low"],["New Balance 991","adidas Samba OG"]] as const;
describe("canonical sneaker identity",()=>{
 it.each(exactPairs)("matches %s and %s exactly",(a,b)=>expect(isCanonicalExactName(a,b)).toBe(true));
 it.each(exactPairs)("is symmetric for %s and %s",(a,b)=>expect(isCanonicalExactName(b,a)).toBe(true));
 it.each(relatedPairs)("keeps %s and %s family-related",(a,b)=>expect(compareCanonicalSneakers(canonicalSneakerKeyFromName(a),canonicalSneakerKeyFromName(b))).toBe("family_related"));
 it.each(relatedPairs)("does not exact-match %s and %s",(a,b)=>expect(isCanonicalExactName(a,b)).toBe(false));
 it.each(nonePairs)("does not match %s and %s",(a,b)=>expect(compareCanonicalSneakers(canonicalSneakerKeyFromName(a),canonicalSneakerKeyFromName(b))).toBe("none"));
 it.each([["DD1391-100","dd 1391 100"],["U991GL2","u991-gl2"],["IF6514","if 6514"]])("normalizes full style %s",(a,b)=>{const one=canonicalSneakerKey({brand:"Nike",modelName:"Model A",styleCode:a});const two=canonicalSneakerKey({brand:"Other",modelName:"Other",styleCode:b});expect(compareCanonicalSneakers(one,two)).toBe("exact_style_code")});
 it.each([["DD1391-100","DD1391"],["U991GL2","991GL2"],["IF6514","IF65"]])("rejects partial style match %s / %s",(a,b)=>{const one=canonicalSneakerKey({brand:"Nike",modelName:"A",styleCode:a});const two=canonicalSneakerKey({brand:"Nike",modelName:"A",styleCode:b});expect(compareCanonicalSneakers(one,two)).toBe("none")});
 it.each([["men","women"],["men","kids"],["women","kids"],["unisex","men"]] as const)("keeps audience %s / %s distinct",(a,b)=>{const one=canonicalSneakerKey({brand:"Nike",modelName:"Cortez",audience:a});const two=canonicalSneakerKey({brand:"Nike",modelName:"Cortez",audience:b});expect(compareCanonicalSneakers(one,two)).toBe("family_related")});
 it.each(["DD","1234","","---"])("does not accept partial style code %s",(styleCode)=>expect(canonicalSneakerKey({brand:"Nike",modelName:"Cortez",styleCode}).styleCode).toBeNull());
});
