import type { Metadata } from "next";
import Link from "next/link";

import { requireDataStewardPage } from "../../src/application/admin/pageAuthorization";

export const metadata: Metadata = { title: "Data Steward | SOLE//MATRIX", robots: { index: false, follow: false } };

const links = [
  ["/admin/providers", "Providers"], ["/admin/releases", "Releases"], ["/admin/evidence", "Evidence"],
  ["/admin/conflicts", "Conflicts"], ["/admin/data-quality", "Data Quality"], ["/admin/import", "Import preview"],
] as const;

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireDataStewardPage();
  return <main className="admin-shell">
    <header className="admin-header"><div><p className="diagnosis-summary-kicker">SOLE//MATRIX operations</p><h1>Data Steward</h1><p>推薦を操作せず、データ品質・根拠・競合だけを管理します。</p></div><Link href="/app">アプリへ戻る</Link></header>
    <nav className="admin-nav" aria-label="Data Steward navigation">{links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</nav>
    {children}
  </main>;
}
