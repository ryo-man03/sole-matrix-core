"use client";

import { useEffect, useState } from "react";

import { GUEST_SESSION_STORAGE_KEY, readGuestSession } from "../_lib/auth-session/guestSession";
import { getAuthSession, signOut } from "../_lib/apiClient";
import { TEMPORARY_ONBOARDING_KEY } from "../_lib/onboarding/onboardingProfile";
import { DIAGNOSIS_DRAFT_STORAGE_KEY } from "../_lib/diagnosis/diagnosisDraft";

export function SettingsPanel() {
  const [status, setStatus] = useState(
    "現在の保存状態を確認しています…",
  );
  const [sessionLabel, setSessionLabel] = useState("確認中");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void getAuthSession().then((result) => {
      if (!result.ok) {
        setSessionLabel("確認できません");
        setStatus("認証状態を取得できませんでした。ゲストデータの管理は利用できます。");
        return;
      }
      const browserStorage = getBrowserStorage();
      setSessionLabel(
        result.data.status === "user"
          ? "ログイン中"
          : browserStorage && readGuestSession(browserStorage)
            ? "ゲスト利用中"
            : "ログインしていません",
      );
      setStatus("保存範囲と外部サービスの境界を確認できます。");
    });
  }, []);

  function deleteGuestData() {
    try {
      window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(TEMPORARY_ONBOARDING_KEY);
      window.sessionStorage.removeItem(DIAGNOSIS_DRAFT_STORAGE_KEY);
      setConfirmingDelete(false);
      setStatus("このブラウザのゲスト状態、診断下書き、初回設定を削除しました。");
    } catch {
      setStatus("browser保存領域を利用できないため、削除対象はありませんでした。");
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setStatus("ログアウトしています…");
    const result = await signOut();
    if (!result.ok) {
      setLoggingOut(false);
      setStatus("ログアウトできませんでした。通信状態を確認して、もう一度お試しください。");
      return;
    }
    try { window.sessionStorage.removeItem(TEMPORARY_ONBOARDING_KEY); } catch { /* Session is already invalidated server-side. */ }
    window.location.assign("/login");
  }

  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <div className="settings-intro">
        <p className="home-kicker">Settings / Data policy</p>
        <h1 id="settings-title">保存と外部情報の境界</h1>
        <p>何が保存され、何が参考情報に留まるかを確認できます。</p>
      </div>

      <p className="settings-status" aria-live="polite">{status}</p>

      <div className="settings-grid">
        <SettingsCard title="現在の利用状態">
          <div className="settings-current-state"><span>SESSION</span><strong>{sessionLabel}</strong><a href="/app">診断・商品判断へ戻る</a></div>
        </SettingsCard>
        <SettingsCard title="保存されるデータ">
          <ul>
            <li>ゲスト: このブラウザの匿名セッションID。診断下書きと初回設定はタブ内の一時保存です。</li>
            <li>ログインユーザー: profile、診断回数、推薦へのfeedback。</li>
            <li>共通corpus: 匿名化された推薦評価。userIdやdisplayNameは含みません。</li>
            <li>推薦結果そのものの一覧・再利用用履歴は保存しません。</li>
          </ul>
        </SettingsCard>

        <SettingsCard title="Session actions">
          <div className="settings-actions">
            <button disabled={loggingOut} onClick={logout} type="button">{loggingOut ? "ログアウト中…" : "ログアウト"}</button>
            {!confirmingDelete ? <button onClick={() => setConfirmingDelete(true)} type="button">ゲストデータを削除</button> : <div className="settings-confirm" role="group" aria-label="ゲストデータ削除の確認"><strong>このブラウザの一時データを削除しますか？</strong><button onClick={deleteGuestData} type="button">削除する</button><button onClick={() => setConfirmingDelete(false)} type="button">キャンセル</button></div>}
          </div>
          <p className="feature-boundary-note"><strong>アカウント削除:</strong> 現在は未対応です。利用可能とは表示しません。</p>
        </SettingsCard>

        <SettingsCard title="外部API利用">
          <p>
            Rakuten listing、Gemini画像分析、Gemini URL Contextは外部証拠です。API key、raw response、keyを含むrequest URLは画面やログへ出しません。
          </p>
          <p>価格・画像・URLの結果はCore budgetFit、score、Decisionを直接変更しません。</p>
        </SettingsCard>

        <SettingsCard title="共通推薦フィードバックコーパス">
          <p>
            過去の推薦評価を匿名の参考事例として保存します。自由記述はemail、phone、URLを伏せ、命令文として扱いません。
          </p>
        </SettingsCard>

        <SettingsCard title="Ryo Mode curated seed">
          <p>
            未購入でも人に勧めたい候補と推薦思想です。所有スニーカーや個人memoryとは別で、seedだけでDecisionを決めません。
          </p>
        </SettingsCard>
      </div>
    </section>
  );
}

function getBrowserStorage() {
  try { return window.localStorage; } catch { return undefined; }
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
