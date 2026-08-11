import { readFileSync } from "node:fs";import { describe,expect,it } from "vitest";const sql=readFileSync("supabase/migrations/202608020002_preferences_collection.sql","utf8").toLowerCase();
describe("preferences collection migration",()=>{
 it.each(["user_preferences","user_sizes","owned_sneakers","wishlist_items","notification_settings"])("creates and enables RLS for %s",(table)=>{expect(sql).toContain(`create table public.${table}`);expect(sql).toContain(`alter table public.${table} enable row level security`)});
 it.each(["user_preferences_own","user_sizes_own","owned_sneakers_own","wishlist_items_own","notification_settings_own"])("has %s policy",(policy)=>expect(sql).toContain(policy));
 it.each(["size_system","sneaker_audience","user_sizes_one_primary_idx","owned_sneakers_user_idx","wishlist_items_user_idx","auth.uid()","on delete cascade","set_updated_at","from anon","to authenticated","budget_min_jpy <= budget_max_jpy"])("contains %s",(clause)=>expect(sql).toContain(clause));
 it.each(["service_role","drop table","truncate ","disable row level security","using (true)","with check (true)"])("excludes %s",(clause)=>expect(sql).not.toContain(clause));
});
