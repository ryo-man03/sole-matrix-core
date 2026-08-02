import { readFileSync } from "node:fs";import { describe,expect,it } from "vitest";const sql=readFileSync("supabase/migrations/202608020003_recommendation_history.sql","utf8").toLowerCase();
describe("recommendation history migration",()=>{
 it.each(["recommendation_snapshots","recommendation_feedback"])("creates %s",(table)=>{expect(sql).toContain(`create table public.${table}`);expect(sql).toContain(`alter table public.${table} enable row level security`)});
 it.each(["recommendation_snapshots_own","recommendation_feedback_own","recommendation_snapshots_user_created_idx","recommendation_feedback_user_created_idx","auth.uid()","canonical_key","algorithm_version","input_snapshot","result_snapshot","on delete cascade","from anon","to authenticated"])("contains %s",(clause)=>expect(sql).toContain(clause));
 it.each(["service_role","raw_provider","gemini","credential","token","drop table","truncate ","using(true)"])("does not persist or grant %s",(clause)=>expect(sql).not.toContain(clause));
});
