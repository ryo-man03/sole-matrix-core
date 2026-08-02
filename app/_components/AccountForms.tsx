"use client";
import { useState, type FormEvent } from "react";

export function ProfileForm() {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("保存中…");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    setMessage(response.ok ? "プロフィールを保存しました。" : "保存できませんでした。入力内容とログイン状態を確認してください。");
  }
  return <form className="settings-panel" onSubmit={submit} aria-describedby="profile-status">
    <label>表示名<input name="displayName" required minLength={1} maxLength={80} /></label>
    <label>経験レベル<select name="experienceLevel" defaultValue="beginner"><option value="beginner">はじめて</option><option value="intermediate">慣れている</option><option value="power">詳しい</option></select></label>
    <label>表示言語<select name="locale" defaultValue="ja-JP"><option value="ja-JP">日本語</option><option value="en-US">English</option></select></label>
    <label>タイムゾーン<input name="timezone" defaultValue="Asia/Tokyo" required /></label>
    <button type="submit">保存する</button><p id="profile-status" aria-live="polite">{message}</p>
  </form>;
}

const consentOptions = [
  ["ai_processing", "AIによる説明"], ["search_grounding", "外部検索による確認"],
  ["recommendation_history", "おすすめ履歴の保存"], ["behavior_personalization", "行動に基づくパーソナライズ"],
  ["analytics", "利用状況の分析"], ["notifications", "通知"], ["external_provider_lookup", "外部プロバイダー検索"],
] as const;

export function PrivacyForm() {
  const [message, setMessage] = useState("");
  async function consent(type: string, granted: boolean) {
    const response = await fetch("/api/me/consent", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, granted }) });
    setMessage(response.ok ? "同意設定を保存しました。" : "同意設定を保存できませんでした。");
  }
  async function exportData() { const response = await fetch("/api/me/data-export", { method: "POST" }); setMessage(response.ok ? "データ書き出しを受け付けました。" : "リクエストを受け付けられませんでした。"); }
  return <section className="settings-panel"><p>任意の処理は初期状態でオフです。オフでも基本のおすすめ機能は利用できます。</p>
    {consentOptions.map(([type, label]) => <label key={type}><input type="checkbox" onChange={(event) => void consent(type, event.currentTarget.checked)} /> {label}</label>)}
    <button type="button" onClick={() => void exportData()}>保存データの書き出しを依頼</button>
    <details><summary>アカウント削除について</summary><p>誤操作防止と本人確認のため、削除は確認済みリクエストとして受け付けます。</p></details>
    <p aria-live="polite">{message}</p></section>;
}
