import { describe,expect,it } from "vitest";import { loadReleaseFixtures } from "./fixtures";
describe("release fixtures",()=>{
 it("never loads in production",()=>expect(loadReleaseFixtures({NODE_ENV:"production"} as NodeJS.ProcessEnv)).toEqual([]));
 it.each(Array.from({length:12},(_,i)=>i))("marks fixture %i explicitly",(i)=>{const item=loadReleaseFixtures({NODE_ENV:"test"} as NodeJS.ProcessEnv)[i]!;expect(item.id).toBe(`fixture-${i}`);expect(item.brand).toMatch(/^TEST Brand/);expect(item.tags).toContain("fixture")});
});
