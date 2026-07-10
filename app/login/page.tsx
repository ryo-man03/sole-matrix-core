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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
    const errors: Record<string, string> = {};
    if (mode === "signup" && displayName.trim().length < 2) errors.displayName = "表示名を2文字以上で入力してください。";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "有効なメールアドレスを入力してください。";
    if (password.length < 8) errors.password = "パスワードは8文字以上で入力してください。";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setStatus("入力内容を確認してください。");
      return;
    }
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
        window.location.assign("/onboarding?from=signup");
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
            <p>プロフィールや推薦への評価を残すならアカウント、まず判断を試すならゲスト。どちらでも診断と商品判断を最後まで使えます。</p>
            <div className="product-entry-benefits" aria-label="ログインとゲストの違い">
              <div><span>ACCOUNT</span><strong>プロフィール / 評価を保存</strong><p>プロフィール、診断回数、推薦へのフィードバックが保存対象です。</p></div>
              <div><span>GUEST</span><strong>登録せずに完走</strong><p>診断下書きはこのタブに一時保存しますが、個人履歴には保存しません。</p></div>
            </div>
          </div>

          <div className="product-entry-panel" aria-label="ログインと新規登録">
            <div className="mode-toggle" role="group" aria-label="認証方法">
              <button aria-pressed={mode === "login"} data-active={mode === "login"} onClick={() => setMode("login")} type="button">ログイン</button>
              <button aria-pressed={mode === "signup"} data-active={mode === "signup"} onClick={() => setMode("signup")} type="button">新規登録</button>
            </div>
            <form className="workspace-fields" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <label><span>表示名</span><input aria-describedby={fieldErrors.displayName ? "display-name-error" : undefined} aria-invalid={Boolean(fieldErrors.displayName)} autoComplete="name" maxLength={80} onChange={(event) => { setDisplayName(event.target.value); setFieldErrors((current) => ({ ...current, displayName: "" })); }} required value={displayName} />{fieldErrors.displayName ? <small className="field-error" id="display-name-error">{fieldErrors.displayName}</small> : null}</label>
              ) : null}
              <label><span>メールアドレス</span><input aria-describedby={fieldErrors.email ? "email-error" : undefined} aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: "" })); }} required type="email" value={email} />{fieldErrors.email ? <small className="field-error" id="email-error">{fieldErrors.email}</small> : null}</label>
              <label><span>パスワード</span><span className="password-field"><input aria-describedby={fieldErrors.password ? "password-error" : "password-hint"} aria-invalid={Boolean(fieldErrors.password)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} onChange={(event) => { setPassword(event.target.value); setFieldErrors((current) => ({ ...current, password: "" })); }} required type={passwordVisible ? "text" : "password"} value={password} /><button aria-label={passwordVisible ? "パスワードを隠す" : "パスワードを表示"} onClick={() => setPasswordVisible((visible) => !visible)} type="button">{passwordVisible ? "隠す" : "表示"}</button></span>{fieldErrors.password ? <small className="field-error" id="password-error">{fieldErrors.password}</small> : <small id="password-hint">8文字以上</small>}</label>
              <button className="workspace-primary-button" disabled={submitting || configured !== true} type="submit">
                {submitting ? "送信中…" : mode === "login" ? "ログインする" : "アカウントを作成する"}
              </button>
            </form>
            <p className="product-entry-provider-note" aria-live="polite" data-status={configured === null ? "loading" : configured ? "ready" : "partial"}>{status}</p>
            <a className="product-entry-action" data-kind="guest" href="/app?session=guest">
              <span><strong>ゲストで試す</strong><small>ログインなしで何回でも利用できます。下書きはこのタブだけに一時保存します。</small></span>
              <span aria-hidden="true">→</span>
            </a>
          </div>

          <aside className="product-entry-storage" aria-labelledby="storage-title">
            <p className="product-entry-kicker">Data policy</p>
            <h2 id="storage-title">保存される情報</h2>
            <ul>
              <li>ゲストの診断下書きと初回設定は、このタブにだけ一時保存します。商品入力・画像は履歴として保存しません。</li>
              <li>ログインユーザーはprofile、診断回数、推薦へのfeedbackを既存のユーザーmemory APIへ保存できます。</li>
              <li>推薦結果そのものを一覧・再利用できる履歴保存には現在対応していません。</li>
              <li>APIキーや認証エラーの内部詳細は画面に表示しません。</li>
            </ul>
          </aside>
        </section>
      </MainContainer>
    </AppShell>
  );
}
