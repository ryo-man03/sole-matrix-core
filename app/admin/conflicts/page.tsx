import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { loadConflictAdminData } from "../../../src/infrastructure/repositories/dataStewardRepository";
import { ConflictReviewForm } from "../_components/AdminForms";
import { AdminTable } from "../_components/AdminTable";

export const dynamic = "force-dynamic";

export default async function ConflictsPage() {
  await requireDataStewardPage();
  const conflicts = await loadConflictAdminData().catch(() => []);
  const open = conflicts.filter((row) => row.status === "open");
  return <section className="admin-page"><header><h2>Conflict review</h2><p>競合根拠を解決／dismissし、理由とfingerprintを監査ログへ残します。</p></header>
    {open.length ? <section className="admin-review-list"><h3>Open conflicts</h3>{open.map((row) => <article className="admin-card" key={String(row.id)}><strong>{String(row.conflict_field)}</strong><p>{JSON.stringify(row.observed_values)} / independent sources: {String(row.independent_source_count)}</p><ConflictReviewForm id={String(row.id)} /></article>)}</section> : <p>Open conflictはありません。</p>}
    <AdminTable caption="Conflict history" rows={conflicts} columns={["id", "release_item_id", "conflict_field", "observed_values", "independent_source_count", "status", "resolution_note", "detected_at", "resolved_at"]} />
  </section>;
}
