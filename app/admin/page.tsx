import { redirect } from "next/navigation";

import { requireDataStewardPage } from "../../src/application/admin/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireDataStewardPage();
  redirect("/admin/providers");
}
