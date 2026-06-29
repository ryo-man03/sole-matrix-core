"use client";

import { useEffect, useState } from "react";

import {
  beginGuestSession,
  completeGuestDiagnosis,
  createUserAuthState,
  isSupabaseBrowserConfigured,
} from "../_lib/auth-session/guestSession";
import type { AuthState, SessionStorage, UserSession } from "../_lib/auth-session/types";
import type { DiagnosisAnswerId } from "../_data/preferenceDiagnosisQuestions";
import { readTemporaryOnboardingHint } from "../_lib/onboarding/onboardingProfile";
import type { OnboardingPreferenceHint } from "../_lib/onboarding/types";
import {
  ExperienceModeSelector,
  type ExperienceMode,
} from "./ExperienceModeSelector";
import { PreferenceDiagnosisFlow } from "./PreferenceDiagnosisFlow";
import { RecommendationWorkspace } from "./RecommendationWorkspace";

export function ProductSessionBoundary() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [onboardingHint, setOnboardingHint] =
    useState<OnboardingPreferenceHint | null>(null);
  const [experienceMode, setExperienceMode] = useState<ExperienceMode | null>(null);
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<
    string,
    DiagnosisAnswerId
  > | null>(null);

  useEffect(() => {
    setOnboardingHint(readTemporaryOnboardingHint(getBrowserSessionStorage()));
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
      {authState.status === "guest" || authState.status === "user" ? (
        experienceMode === null ? (
          authState.status === "guest" && authState.session.hasCompletedDiagnosis ? (
            <GuestCompletedPanel />
          ) : (
            <ExperienceModeSelector
              hasDiagnosisResult={diagnosisAnswers !== null}
              onSelect={setExperienceMode}
            />
          )
        ) : (
          <div className="experience-flow">
            <div className="experience-flow-nav">
              <button onClick={() => setExperienceMode(null)} type="button">
                ← モード選択に戻る
              </button>
              <a href="/">ホームへ戻る</a>
            </div>

            {experienceMode === "diagnosis" ? (
              <PreferenceDiagnosisFlow
                isRecommendationDisabled={
                  authState.status === "guest" &&
                  authState.session.hasCompletedDiagnosis
                }
                onComplete={setDiagnosisAnswers}
                onOpenProductJudgement={
                  authState.status === "guest" &&
                  authState.session.hasCompletedDiagnosis
                    ? undefined
                    : () => setExperienceMode("product")
                }
                onRecommendationComplete={handleGuestDiagnosisCompleted}
              />
            ) : (
              <RecommendationWorkspace
                authState={authState}
                diagnosisAnswers={diagnosisAnswers}
                onGuestDiagnosisCompleted={handleGuestDiagnosisCompleted}
                onUserSession={handleUserSession}
                onboardingHint={onboardingHint}
                requireSessionSelection
              />
            )}
          </div>
        )
      ) : null}
    </>
  );
}

function GuestCompletedPanel() {
  return (
    <section className="experience-selector" aria-labelledby="guest-complete-title">
      <div className="experience-selector-heading">
        <p className="workspace-kicker">Guest session complete</p>
        <h2 id="guest-complete-title">ゲスト体験は完了しました。</h2>
        <p>
          ゲストで実行できる診断は1回です。結果を保存して次の一足を判断する機能は、本番認証の実装後に利用できます。
        </p>
      </div>
      <div className="experience-flow-nav">
        <a href="/">ホームへ戻る</a>
        <a href="/login">利用方法を確認する</a>
      </div>
    </section>
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
      <a href="/onboarding">初回設定</a>
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

function getBrowserSessionStorage(): SessionStorage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
