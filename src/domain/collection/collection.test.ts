import { describe,expect,it } from "vitest";import { audiences,parseOwnedSneaker,parseSize,parseWishlist,sizeSystems } from "./collection";
const owned={brand:"New Balance",modelName:"991v2",modelFamily:"991",generation:"v2",colorwayName:"Grey",styleCode:"U991GL2",audience:"unisex",sizeSystem:"JP",sizeValue:27,userRating:5,wearFrequency:"weekly",notes:"favorite"};
const wish={brand:"adidas",modelName:"Samba OG",modelFamily:"Samba",generation:"OG",colorwayName:null,styleCode:null,audience:"unisex",desiredSizeSystem:null,desiredSizeValue:null,budgetMaxJpy:null,priority:3,notes:null,verificationState:"model_only"};
describe("size and collection",()=>{
 it.each(sizeSystems)("keeps size system %s distinct",(sizeSystem)=>expect(parseSize({sizeSystem,sizeValue:27,audience:"unknown",primarySize:false}).size_system).toBe(sizeSystem));
 it.each(audiences)("keeps audience %s distinct",(audience)=>expect(parseSize({sizeSystem:"JP",sizeValue:27,audience,primarySize:false}).audience).toBe(audience));
 it.each([0,-1,100,NaN,"27",null])("rejects size value %j",(sizeValue)=>expect(()=>parseSize({sizeSystem:"JP",sizeValue,audience:"unknown",primarySize:false})).toThrow());
 it.each(["US M","US_WOMEN","CM","",null])("rejects/inhibits inferred system %j",(sizeSystem)=>expect(()=>parseSize({sizeSystem,sizeValue:27,audience:"unknown",primarySize:false})).toThrow());
 it.each(["U991GL2","u991 gl2","u991-gl2"])("normalizes full style code %s",(styleCode)=>expect(parseOwnedSneaker({...owned,styleCode}).style_code).toBe("U991GL2"));
 it.each(["men","women","unisex","kids","unknown"])("preserves owned audience %s",(audience)=>expect(parseOwnedSneaker({...owned,audience}).audience).toBe(audience));
 it.each(["verified","model_only","unverified"])("accepts wishlist verification %s",(verificationState)=>expect(parseWishlist({...wish,verificationState}).verification_state).toBe(verificationState));
 it.each([{...owned,userId:"forged"},{...owned,notes:"x".repeat(1001)},{...owned,brand:"<b>x</b>"},{...owned,userRating:6},{...owned,sizeValue:0}])("rejects owned input %j",(input)=>expect(()=>parseOwnedSneaker(input)).toThrow());
 it.each([{...wish,userId:"forged"},{...wish,priority:0},{...wish,priority:6},{...wish,budgetMaxJpy:-1},{...wish,notes:"x".repeat(1001)}])("rejects wishlist input %j",(input)=>expect(()=>parseWishlist(input)).toThrow());
});
