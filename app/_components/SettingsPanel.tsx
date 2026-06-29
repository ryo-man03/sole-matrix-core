"use client";

import { useState } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "../_lib/auth-session/guestSession";
import { TEMPORARY_ONBOARDING_KEY } from "../_lib/onboarding/onboardingProfile";

export function SettingsPanel() {
  const [status, setStatus] = useState(
    "設定内容を確認できます。削除操作はこのbrowserのゲスト状態だけに作用します。",
  );

  function deleteGuestData() {
    try {
      window.localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
      window.sessionStorage.removeItem(TEMPORARY_ONBOARDING_KEY);
      setStatus("このbrowserのゲスト診断状態と一時onboardingを削除しました。");
    } catch {
      setStatus("browser保存領域を利用できないため、削除対象はありませんでした。");
    }
  }

  function logout() {
    try {
      window.sessionStorage.removeItem(TEMPORARY_ONBOARDING_KEY);
    } catch {
      // Continue to the signed-out entry even when storage is restricted.
    }
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
        <SettingsCard title="保存されるデータ">
          <ul>
            <li>ゲスト: 匿名IDと1回診断済みフラグ。個人memoryは保存しません。</li>
            <li>ログイン相当のローカルユーザー: profile、診断履歴、feedback。</li>
            <li>共通corpus: 匿名化された推薦評価。userIdやdisplayNameは含みません。</li>
          </ul>
        </SettingsCard>

        <SettingsCard title="Session actions">
          <div className="settings-actions">
            <button onClick={logout} type="button">ログアウト</button>
            <button onClick={deleteGuestData} type="button">ゲストデータ削除</button>
            <button disabled type="button">将来のアカウント削除（準備中）</button>
          </div>
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
