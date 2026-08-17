"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ManualReleaseDraftForm() {
  return <JsonForm endpoint="/api/admin/manual-releases" title="Manual release draft" fields={[
    ["brand", "Brand", true], ["modelName", "Model", true], ["modelFamily", "Model family", true], ["generation", "Generation", false],
    ["colorwayName", "Colorway", false], ["styleCode", "Style Code", false], ["releaseDate", "Release date (YYYY-MM-DD)", false],
    ["region", "Region", true, "JP"], ["informationState", "Information state", true, "unknown"],
  ]} />;
}

export function ManualEvidenceDraftForm() {
  return <JsonForm endpoint="/api/admin/manual-evidence" title="Manual evidence draft" fields={[
    ["sourceUrl", "Source URL (HTTPS)", true], ["sourceKind", "Source kind", true, "manual_other"], ["brand", "Brand", true],
    ["modelName", "Model", true], ["styleCode", "Style Code", false], ["colorwayName", "Colorway", false],
    ["releaseDate", "Observed date (YYYY-MM-DD)", false], ["region", "Region", true, "JP"], ["informationState", "Information state", true, "unknown"],
  ]} />;
}

export function EvidenceReviewForm({ id }: Readonly<{ id: string }>) {
  return <ReviewForm endpoint={`/api/admin/evidence/${id}/review`} kind="evidence" />;
}

export function ConflictReviewForm({ id }: Readonly<{ id: string }>) {
  return <ReviewForm endpoint={`/api/admin/conflicts/${id}/review`} kind="conflict" />;
}

export function CsvPreviewForm() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("csv") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) { setMessage("CSVファイルを選択してください。"); return; }
    setMessage("検証中…");
    const response = await fetch("/api/admin/import/preview", { method: "POST", headers: { "Content-Type": "text/csv", "X-Request-Id": crypto.randomUUID() }, body: await file.arrayBuffer() });
    const payload: unknown = await response.json().catch(() => null);
    setResult(isRecord(payload) && isRecord(payload.data) ? payload.data : null);
    setMessage(response.ok ? "Previewを生成しました。Production writeは行っていません。" : "CSVを検証できませんでした。");
  }
  return <section className="admin-card"><h2>CSV preview / validation</h2><p>最大256 KiB・500行。ここではProductionへ書き込みません。</p><form className="admin-form" onSubmit={submit}><label>CSV file<input accept=".csv,text/csv" name="csv" type="file" /></label><button type="submit">Previewを検証</button></form><p aria-live="polite" role="status">{message}</p>{result ? <pre className="admin-preview">{JSON.stringify(result, null, 2)}</pre> : null}</section>;
}

type Field = readonly [name: string, label: string, required: boolean, initial?: string];

function JsonForm({ endpoint, title, fields }: Readonly<{ endpoint: string; title: string; fields: readonly Field[] }>) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("保存中…");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map(([name]) => [name, String(form.get(name) ?? "").trim() || null]));
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID() }, body: JSON.stringify(body) });
    setMessage(response.ok ? "Staging draftへ保存しました。Production catalogは変更していません。" : "Draftを保存できませんでした。");
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  }
  return <section className="admin-card"><h2>{title}</h2><p>Staging draftのみ。Release Catalogへ自動反映しません。</p><form className="admin-form admin-form-grid" onSubmit={submit}>{fields.map(([name, label, required, initial]) => <label key={name}>{label}<input defaultValue={initial} name={name} required={required} /></label>)}<button type="submit">Draftを保存</button></form><p aria-live="polite" role="status">{message}</p></section>;
}

function ReviewForm({ endpoint, kind }: Readonly<{ endpoint: string; kind: "evidence" | "conflict" }>) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = kind === "evidence"
      ? { reviewState: form.get("state"), reasonCode: String(form.get("note") ?? "").trim() }
      : { status: form.get("state"), resolutionNote: String(form.get("note") ?? "").trim() };
    const response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Request-Id": crypto.randomUUID() }, body: JSON.stringify(body) });
    setMessage(response.ok ? "レビューと監査記録を保存しました。" : "レビューを保存できませんでした。");
    if (response.ok) router.refresh();
  }
  return <form className="admin-inline-review" onSubmit={submit}><label><span>State</span><select name="state" defaultValue={kind === "evidence" ? "accepted" : "resolved"}>{kind === "evidence" ? <><option value="accepted">accepted</option><option value="rejected">rejected</option></> : <><option value="resolved">resolved</option><option value="dismissed">dismissed</option></>}</select></label><label><span>Reason</span><input maxLength={kind === "evidence" ? 120 : 500} name="note" required /></label><button type="submit">Review</button><small aria-live="polite">{message}</small></form>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
