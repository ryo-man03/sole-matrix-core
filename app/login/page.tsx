"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../_components/AppShell";
import { MainContainer } from "../_components/MainContainer";
import { getAuthSession, signIn, signUp } from "../_lib/apiClient";

export const productEntryActions = [
  { label: "ログイン", kind: "primary", status: "available" },
  { label: "新規登録", kind: "secondary", status: "available" },
  { href: "/app?session=guest", label: "ゲストで試す", kind: "guest", status: "available" },
] as const;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("認証設定を確認しています…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getAuthSession().then((result) => {
      if (!result.ok) {
        setConfigured(false);
        setStatus("認証は現在準備中です。ゲストモードは利用できます。");
        return;
      }
      setConfigured(result.data.configured);
      if (result.data.status === "user") {
        setStatus("ログイン済みです。ワークスペースへ移動できます。");
      } else {
        setStatus(result.data.configured ? "ログインまたは新規登録を選んでください。" : "Supabase未設定のため、認証は準備中です。ゲストモードは利用できます。");
      }
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) {
      setStatus("Supabase未設定のため認証できません。ゲストモードをお試しください。");
      return;
    }
    setSubmitting(true);
    setStatus(mode === "login" ? "ログインしています…" : "アカウントを作成しています…");
    try {
      if (mode === "login") {
        const result = await signIn({ email, password });
        if (!result.ok) { setStatus(result.error.message); return; }
        window.location.assign("/app");
        return;
      }
      const result = await signUp({ displayName, email, password });
      if (!result.ok) { setStatus(result.error.message); return; }
      if (result.data.sessionCreated) {
        window.location.assign("/app");
      } else {
        setMode("login");
        setStatus("登録を受け付けました。確認メールの案内に従ってからログインしてください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <MainContainer labelledBy="product-entry-title">
        <a className="back-home-link" href="/">← ホームに戻る</a>
        <section className="product-entry" data-provider-optional="true">
          <div className="product-entry-copy">
            <p className="product-entry-kicker">SOLE//MATRIX / ENTRY</p>
            <h1 id="product-entry-title">利用方法を選ぶ</h1>
            <p>Supabaseが設定済みならログイン・新規登録を利用できます。設定がなくても、ゲストで診断と商品判断を何回でも試せます。</p>
          </div>

          <div className="product-entry-panel" aria-label="ログインと新規登録">
            <div className="mode-toggle" role="group" aria-label="認証方法">
              <button aria-pressed={mode === "login"} data-active={mode === "login"} onClick={() => setMode("login")} type="button">ログイン</button>
              <button aria-pressed={mode === "signup"} data-active={mode === "signup"} onClick={() => setMode("signup")} type="button">新規登録</button>
            </div>
            <form className="workspace-fields" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label><span>表示名</span><input autoComplete="name" maxLength={80} onChange={(event) => setDisplayName(event.target.value)} required value={displayName} /></label>
              ) : null}
              <label><span>メールアドレス</span><input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
              <label><span>パスワード</span><input autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
              <button className="workspace-primary-button" disabled={submitting || configured !== true} type="submit">
                {submitting ? "送信中…" : mode === "login" ? "ログインする" : "アカウントを作成する"}
              </button>
            </form>
            <p className="product-entry-provider-note" aria-live="polite">{status}</p>
            <a className="product-entry-action" data-kind="guest" href="/app?session=guest">
              <span><strong>ゲストで試す</strong><small>ログインなしで何回でも利用できます。履歴は保存しません。</small></span>
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <aside className="product-entry-storage" aria-labelledby="storage-title">
            <p className="product-entry-kicker">Data policy</p>
            <h2 id="storage-title">保存される情報</h2>
            <ul>
              <li>ゲストの診断・商品入力・画像は履歴として保存しません。</li>
              <li>ログインユーザーは既存のユーザーmemory APIを保存入口として利用します。</li>
              <li>APIキーや認証エラーの内部詳細は画面に表示しません。</li>
            </ul>
          </aside>
        </section>
      </MainContainer>
    </AppShell>
  );
}
