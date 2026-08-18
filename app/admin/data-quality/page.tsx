import { requireDataStewardPage } from "../../../src/application/admin/pageAuthorization";
import { loadAuditLog, loadDataQuality } from "../../../src/infrastructure/repositories/dataStewardRepository";
import { AdminTable } from "../_components/AdminTable";

export const dynamic = "force-dynamic";

export default async function DataQualityPage() {
  await requireDataStewardPage();
  const [quality, audit] = await Promise.all([loadDataQuality().catch(() => null), loadAuditLog().catch(() => [])]);
  const metrics = quality?.metrics.map((metric) => ({
    id: metric.id, state: metric.state, value: metric.value, unit: metric.unit, sample_size: metric.observation.sampleSize,
    threshold: metric.threshold, reason: metric.reasons.join(" "),
  })) ?? [];
  return <section className="admin-page"><header><h2>Data Quality</h2><p>Observation → Metric → Threshold → State。通知は送らず、評価だけを行います。</p></header>
    <section className="admin-quality-summary" data-state={quality?.state ?? "unknown"}><strong>{quality?.state ?? "unknown"}</strong><span>{quality?.window ?? "quality source unavailable"}</span><span>generated: {quality?.generatedAt ?? "—"}</span></section>
    {quality?.alerts.length ? <section className="admin-card"><h3>Evaluated alerts</h3><ul>{quality.alerts.map((alert) => <li key={alert.code}><strong>{alert.state}</strong> {alert.reason}</li>)}</ul><p>notificationsSent: false</p></section> : <p>評価対象のalertはありません。</p>}
    <AdminTable caption="Quality metrics" rows={metrics} columns={["id", "state", "value", "unit", "sample_size", "threshold", "reason"]} />
    <AdminTable caption="Data steward audit log" rows={audit} columns={["id", "actor_id", "action", "entity_type", "entity_id", "request_id", "before_fingerprint", "after_fingerprint", "created_at"]} />
  </section>;
}
