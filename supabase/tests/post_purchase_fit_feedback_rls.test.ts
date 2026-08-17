import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/202608180002_post_purchase_fit_feedback.sql", "utf8").toLowerCase();

describe("post-purchase and fit feedback migration", () => {
  it.each(["purchase_reports", "fit_feedback", "fit_preference_profiles", "product_events"])("creates owner-protected table %s", (table) => {
    expect(sql).toContain(`create table public.${table}`);
    expect(sql).toContain(`alter table public.${table} enable row level security`);
  });

  it.each([
    "recommendation_viewed", "recommendation_feedback_submitted", "market_search_requested", "market_listing_clicked",
    "wishlist_added", "wishlist_removed", "purchase_reported", "owned_sneaker_added", "fit_feedback_submitted",
    "purchase_satisfaction_submitted",
  ])("defines event %s", (name) => expect(sql).toContain(`'${name}'`));

  it("binds every foreign entity to the authenticated owner", () => {
    expect(sql).toContain("foreign key (recommendation_snapshot_id, user_id)");
    expect(sql).toContain("foreign key (wishlist_item_id, user_id)");
    expect(sql).toContain("foreign key (owned_sneaker_id, user_id)");
    expect(sql).toContain("foreign key (purchase_report_id, user_id)");
  });

  it("makes purchase, fit, and event replays idempotent per owner", () => {
    expect(sql).toContain("purchase_reports_user_idempotency_key unique (user_id, idempotency_key)");
    expect(sql).toContain("fit_feedback_user_idempotency_key unique (user_id, idempotency_key)");
    expect(sql).toContain("product_events_user_idempotency_key unique (user_id, idempotency_key)");
  });

  it("requires the latest analytics consent before behavior analytics are inserted", () => {
    expect(sql).toContain("event_class = 'behavior_analytics'");
    expect(sql).toContain("consent.consent_type = 'analytics'");
    expect(sql).toContain("consent.granted = true");
    expect(sql).toContain("not exists");
  });

  it.each(["drop table", "truncate ", "disable row level security", "service_role"])("does not contain %s", (value) => {
    expect(sql).not.toContain(value);
  });
});
