import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { CsvPreviewForm } from "../_components/AdminForms";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireDataStewardPage();
  return <section className="admin-page"><header><h2>Import</h2><p>CSV formula、unsafe URL、日付、enum、duplicate、unexpected columnを検証します。</p></header><CsvPreviewForm /></section>;
}
