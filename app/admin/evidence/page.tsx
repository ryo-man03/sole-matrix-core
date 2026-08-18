import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { loadEvidenceAdminData } from "../../../src/infrastructure/repositories/dataStewardRepository";
import { EvidenceReviewForm, ManualEvidenceDraftForm } from "../_components/AdminForms";
import { AdminTable } from "../_components/AdminTable";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  await requireDataStewardPage();
  const data = await loadEvidenceAdminData().catch(() => ({ evidence: [], drafts: [] }));
  const pending = data.evidence.filter((row) => row.review_state === "pending").slice(0, 50);
  return <section className="admin-page"><header><h2>Release evidence</h2><p>根拠の確認状態だけをレビューします。Core/Ryoや推薦順位は変更しません。</p></header>
    <ManualEvidenceDraftForm />
    {pending.length ? <section className="admin-review-list"><h3>Pending review</h3>{pending.map((row) => <article className="admin-card" key={String(row.id)}><strong>{String(row.source_title ?? row.id)}</strong><p>{String(row.source_kind)} / {String(row.verification_state)} / {String(row.source_domain ?? "domain unknown")}</p><EvidenceReviewForm id={String(row.id)} /></article>)}</section> : <p>Pending evidenceはありません。</p>}
    <AdminTable caption="Evidence inventory" rows={data.evidence} columns={["id", "release_item_id", "provider_id", "source_kind", "source_url", "source_domain", "verification_state", "review_state", "source_quality", "first_seen_at", "last_seen_at", "last_verified_at"]} />
    <AdminTable caption="Manual evidence drafts" rows={data.drafts} columns={["id", "source_url", "source_kind", "canonical_brand", "canonical_model_name", "style_code", "observed_release_date", "region", "information_state", "review_state", "created_at"]} />
  </section>;
}
