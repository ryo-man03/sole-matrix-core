"use client";
import { useEffect, useState } from "react";

type JsonRecord = Record<string, unknown>;
type Batch = JsonRecord & { daily_picks?: JsonRecord[]; stale?: boolean };

const stateLabels: Record<string, string> = {
  official_announced: "公式発表",
  retailer_confirmed: "正規販売店で確認",
  editorial_reported: "許可済み編集情報",
  rumor: "未確認情報",
  released: "発売済み",
  restocked: "再入荷",
  cancelled: "発売中止",
  date_changed: "発売日変更",
  unknown: "確認中",
  conflicting_evidence: "情報源で不一致",
};

export function TodayPanel() {
  const [batch, setBatch] = useState<Batch | null | undefined>(undefined);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void fetch("/api/daily-picks", { cache: "no-store" }).then(async (response) => {
      if (response.ok) { const json = await response.json() as { data: { batch: Batch | null } }; setBatch(json.data.batch); }
      else setBatch(null);
    });
  }, []);
  if (batch === undefined) return <p aria-live="polite">今日の候補を読み込んでいます…</p>;
  if (batch === null) return <section className="settings-panel"><h2>今日の候補はまだありません</h2><p>今日の候補は内部更新後に表示されます。この画面から外部サイトへ問い合わせることはありません。</p></section>;
  const picks = [...(batch.daily_picks ?? [])].sort((a, b) => Number(a.rank) - Number(b.rank));
  return <>
    <header><p>{String(batch.target_date)} / 生成: {formatDateTime(batch.generated_at)}</p>{batch.stale ? <p role="status">前回生成分です。最新情報とは限りません。</p> : null}</header>
    {picks.length === 0 ? <p>条件に合う候補を無理に表示していません。</p> : <ol className="today-grid">{picks.map((pick) => <li key={String(pick.id)} className="settings-panel"><Pick pick={pick} onMessage={setMessage} /></li>)}</ol>}
    <p aria-live="polite">{message}</p>
  </>;
}

function Pick({ pick, onMessage }: { pick: JsonRecord; onMessage: (message: string) => void }) {
  const release = pick.release_items as JsonRecord | undefined;
  const explanation = pick.explanation as { reasons?: string[]; cautions?: string[] } | undefined;
  const evidence = Array.isArray(release?.release_evidence) ? release.release_evidence as JsonRecord[] : [];
  const accepted = evidence.filter((item) => item.review_state === "accepted" && item.verification_state !== "unverified");
  const independentSources = new Set(accepted.map((item) => String(item.source_independence_key))).size;
  const state = String(release?.information_state ?? "unknown");
  const conflict = state === "conflicting_evidence";
  const variants = Array.isArray(release?.release_variants) ? release.release_variants as JsonRecord[] : [];
  const verification = String(variants[0]?.verification_state ?? pick.verification_state ?? "unverified");
  const stale = isStale(release?.last_verified_at);
  async function feedback(action: string) {
    const response = await fetch(`/api/daily-picks/${String(pick.id)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reasonCodes: [], comment: null }) });
    onMessage(response.ok ? "反応を保存しました。" : "保存できませんでした。");
  }
  return <article>
    <h2>{String(release?.canonical_brand ?? "")} {String(release?.canonical_model_name ?? "")}</h2>
    <dl>
      <dt>発売状況</dt><dd>{stateLabels[state] ?? stateLabels.unknown}</dd>
      <dt>発売日</dt><dd>{conflict ? "未確定" : formatDate(release?.release_date)}</dd>
      <dt>地域</dt><dd>{String(release?.region ?? "未確認")}</dd>
      <dt>情報の確度</dt><dd>{Math.round(Number(release?.source_confidence ?? 0))}% / {verification}</dd>
    </dl>
    {stale ? <p role="status">最終確認から時間が経っています。</p> : null}
    {conflict ? <p role="alert">発売日は情報源によって異なります</p> : null}
    <h3>おすすめの理由</h3>
    <ul>{(explanation?.reasons ?? []).map((value) => <li key={value}>{value}</li>)}</ul>
    {explanation?.cautions?.length ? <><h3>注意点</h3><ul>{explanation.cautions.map((value) => <li key={value}>{value}</li>)}</ul></> : null}
    <div><button onClick={() => void feedback("saved")}>保存</button><button onClick={() => void feedback("not_interested")}>興味なし</button><button onClick={() => void feedback("wishlist")}>Wishlistへ</button><button onClick={() => void feedback("owned")}>所有済み</button></div>
    <details><summary>技術的な根拠</summary><dl><dt>独立した情報源</dt><dd>{independentSources}</dd><dt>採用 evidence</dt><dd>{accepted.length}</dd><dt>最終確認</dt><dd>{formatDateTime(release?.last_verified_at)}</dd><dt>score</dt><dd>{String(pick.total_score)}</dd><dt>breakdown</dt><dd><code>{JSON.stringify(pick.score_breakdown)}</code></dd>{conflict ? <><dt>報告された日付</dt><dd>{[...new Set(accepted.map((item) => String(item.observed_release_date ?? "")).filter(Boolean))].sort().join(" / ")}</dd></> : null}</dl></details>
  </article>;
}

function isStale(value: unknown): boolean {
  return typeof value !== "string" || !Number.isFinite(Date.parse(value)) || Date.now() - Date.parse(value) > 14 * 86_400_000;
}
function formatDate(value: unknown): string { return typeof value === "string" && value ? value : "未確認"; }
function formatDateTime(value: unknown): string { return typeof value === "string" && value ? new Date(value).toLocaleString("ja-JP") : "未確認"; }
