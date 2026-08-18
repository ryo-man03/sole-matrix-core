import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { loadProviderAdminData } from "../../../src/infrastructure/repositories/dataStewardRepository";
import { AdminTable } from "../_components/AdminTable";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  await requireDataStewardPage();
  const data = await loadProviderAdminData().catch(() => ({ observations: [], ingestionRuns: [] }));
  return <section className="admin-page"><header><h2>Provider health</h2><p>秘密情報やraw responseを含まない、構造化された運用観測です。</p></header>
    <AdminTable caption="Provider observations" rows={data.observations} columns={["provider_id", "operation", "status", "duration_ms", "retry_count", "cache_status", "normalized_count", "exact_count", "probable_count", "rejected_count", "safe_error_code", "observed_at"]} />
    <AdminTable caption="Release ingestion runs" rows={data.ingestionRuns} columns={["id", "provider_id", "access_mode", "status", "dry_run", "observed_count", "accepted_count", "rejected_count", "conflict_count", "safe_error_code", "started_at", "completed_at"]} />
  </section>;
}
