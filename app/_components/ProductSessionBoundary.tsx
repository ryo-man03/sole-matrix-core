"use client";

import { useEffect, useState } from "react";

import {
  beginGuestSession,
  completeGuestDiagnosis,
  createUserAuthState,
  isSupabaseBrowserConfigured,
} from "../_lib/auth-session/guestSession";
import type { AuthState, SessionStorage, UserSession } from "../_lib/auth-session/types";
import { RecommendationWorkspace } from "./RecommendationWorkspace";

export function ProductSessionBoundary() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("session") === "guest") {
      setAuthState({
        status: "guest",
        session: beginGuestSession(getBrowserStorage()),
      });
      return;
    }
    setAuthState({ status: "signed_out" });
  }, []);

  function handleGuestDiagnosisCompleted() {
    setAuthState((current) => {
      if (current.status !== "guest") return current;
      return {
        status: "guest",
        session: completeGuestDiagnosis(current.session, getBrowserStorage()),
      };
    });
  }

  function handleUserSession(session: UserSession) {
    setAuthState(createUserAuthState(session));
  }

  const providerConfigured = isSupabaseBrowserConfigured({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  return (
    <>
      <SessionStatus authState={authState} providerConfigured={providerConfigured} />
      <RecommendationWorkspace
        authState={authState}
        onGuestDiagnosisCompleted={handleGuestDiagnosisCompleted}
        onUserSession={handleUserSession}
        requireSessionSelection
      />
    </>
  );
}

function SessionStatus({
  authState,
  providerConfigured,
}: {
  authState: AuthState;
  providerConfigured: boolean;
}) {
  if (authState.status === "loading") {
    return <p className="session-status">セッションを確認しています…</p>;
  }

  if (authState.status === "guest") {
    return (
      <div className="session-status" data-session="guest">
        <strong>ゲストモード</strong>
        <span>
          {authState.session.hasCompletedDiagnosis
            ? "1回のゲスト診断を利用済みです。ログインすると次の診断と保存を利用できます。"
            : "1回だけ診断できます。診断履歴や個人情報は保存しません。"}
        </span>
      </div>
    );
  }

  if (authState.status === "user") {
    return (
      <div className="session-status" data-session="user">
        <strong>{authState.session.displayName ?? authState.session.userId}</strong>
        <span>ユーザーmemoryへ診断と評価を保存できます。</span>
      </div>
    );
  }

  return (
    <div className="session-status" data-session="signed-out">
      <strong>ログインなしで閲覧中</strong>
      <span>
        {providerConfigured
          ? "ログインまたはゲストモードを選んで開始してください。"
          : "認証providerは未設定です。ゲストモードは引き続き利用できます。"}
      </span>
      <a href="/login">利用方法を選ぶ</a>
    </div>
  );
}

function getBrowserStorage(): SessionStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
