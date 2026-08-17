import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { loadReleaseAdminData } from "../../../src/infrastructure/repositories/dataStewardRepository";
import { ManualReleaseDraftForm } from "../_components/AdminForms";
import { AdminTable } from "../_components/AdminTable";

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  await requireDataStewardPage();
  const data = await loadReleaseAdminData().catch(() => ({ releases: [], drafts: [] }));
  return <section className="admin-page"><header><h2>Release review</h2><p>Catalogは参照専用です。手入力はstaging draftにのみ保存します。</p></header>
    <ManualReleaseDraftForm />
    <AdminTable caption="Release catalog" rows={data.releases} columns={["id", "canonical_brand", "canonical_model_name", "model_family", "generation", "information_state", "release_date", "region", "source_confidence", "last_verified_at", "updated_at"]} />
    <AdminTable caption="Manual release drafts" rows={data.drafts} columns={["id", "canonical_brand", "canonical_model_name", "model_family", "style_code", "release_date", "region", "information_state", "review_state", "created_at"]} />
  </section>;
}
