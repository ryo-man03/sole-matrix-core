import { describe,expect,it } from "vitest";import { parsePreferences } from "./preferences";
const base={favoriteBrands:[],avoidedBrands:[],favoriteColors:[],avoidedColors:[],favoriteMaterials:[],avoidedMaterials:[],silhouettes:[],useCases:[],styleTags:[],budgetMinJpy:null,budgetMaxJpy:null,budgetIsHardLimit:false,conditionPreference:"either"};
describe("structured preferences",()=>{
 it.each([null,0,1000,50000,1000000])("accepts max budget %s",(v)=>expect(parsePreferences({...base,budgetMaxJpy:v})).toBeTruthy());
 it.each(["new","used","either"])("accepts condition %s",(v)=>expect(parsePreferences({...base,conditionPreference:v})).toBeTruthy());
 it.each(["favoriteBrands","avoidedBrands","favoriteColors","avoidedColors","favoriteMaterials","avoidedMaterials","silhouettes","useCases","styleTags"] as const)("normalizes and deduplicates %s",(key)=>expect(parsePreferences({...base,[key]:[" suede ","suede"]})[key]).toEqual(["suede"]));
 it.each([-1,1.5,100000001,"1000",[],{}])("rejects invalid budget %j",(v)=>expect(()=>parsePreferences({...base,budgetMaxJpy:v})).toThrow());
 it.each(["favoriteBrands","avoidedBrands","favoriteColors","avoidedColors","favoriteMaterials","avoidedMaterials","silhouettes","useCases","styleTags"] as const)("rejects unsafe %s",(key)=>expect(()=>parsePreferences({...base,[key]:["<script>"]})).toThrow());
 it.each([{...base,budgetMinJpy:200,budgetMaxJpy:100},{...base,userId:"forged"},{...base,conditionPreference:"all"},null,[]])("rejects invalid object %j",(v)=>expect(()=>parsePreferences(v)).toThrow());
});
