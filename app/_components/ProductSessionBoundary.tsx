"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthSession, signOut } from "../_lib/apiClient";
import {
  createExperienceModeUrl,
  readExperienceModeFromUrl,
  readStoredExperienceMode,
  writeStoredExperienceMode,
  type AppExperienceMode,
} from "../_lib/app-mode/experienceModeState";
import { beginGuestSession, createUserAuthState } from "../_lib/auth-session/guestSession";
import type { AuthState, SessionStorage, UserSession } from "../_lib/auth-session/types";
import type { CompletedPreferenceDiagnosisAnswers } from "../_data/preferenceDiagnosisQuestions";
import { readTemporaryOnboardingHint } from "../_lib/onboarding/onboardingProfile";
import { readDiagnosisDraft } from "../_lib/diagnosis/diagnosisDraft";
import type { OnboardingPreferenceHint } from "../_lib/onboarding/types";
import { ExperienceModeSelector } from "./ExperienceModeSelector";
import { PreferenceDiagnosisFlow } from "./PreferenceDiagnosisFlow";
import { RecommendationWorkspace } from "./RecommendationWorkspace";

export function ProductSessionBoundary() {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });
  const [providerConfigured, setProviderConfigured] = useState(false);
  const [onboardingHint, setOnboardingHint] = useState<OnboardingPreferenceHint | null>(null);
  const [experienceMode, setExperienceModeState] = useState<AppExperienceMode | null>(null);
  const [visitedModes, setVisitedModes] = useState<Record<AppExperienceMode, boolean>>({
    diagnosis: false,
    product: false,
  });
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<CompletedPreferenceDiagnosisAnswers | null>(null);
  const [sessionMessage, setSessionMessage] = useState("");

  useEffect(() => {
    setOnboardingHint(readTemporaryOnboardingHint(getBrowserSessionStorage()));
    const diagnosisDraft = readDiagnosisDraft(getBrowserSessionStorage());
    if (diagnosisDraft) {
      setExperienceModeState("diagnosis");
      setVisitedModes((current) => ({ ...current, diagnosis: true }));
      if (diagnosisDraft.completed) {
        setDiagnosisAnswers(diagnosisDraft.answers as CompletedPreferenceDiagnosisAnswers);
      }
    }
    const query = new URLSearchParams(window.location.search);
    const requestedPath = readExperienceModeFromUrl(window.location.href)
      ?? readStoredExperienceMode(getBrowserSessionStorage());
    if (requestedPath) {
      setExperienceModeState(requestedPath);
      setVisitedModes((current) => ({ ...current, [requestedPath]: true }));
    }
    const handlePopState = () => {
      const mode = readExperienceModeFromUrl(window.location.href);
      setExperienceModeState(mode);
      writeStoredExperienceMode(getBrowserSessionStorage(), mode);
      if (mode) setVisitedModes((current) => ({ ...current, [mode]: true }));
    };
    window.addEventListener("popstate", handlePopState);
    const removePopStateListener = () => window.removeEventListener("popstate", handlePopState);

    if (query.get("session") === "guest") {
      setAuthState({ status: "guest", session: beginGuestSession(getBrowserStorage()) });
      void getAuthSession().then((result) => {
        if (result.ok) setProviderConfigured(result.data.configured);
      });
      return removePopStateListener;
    }
    void getAuthSession().then((result) => {
      if (!result.ok) { setAuthState({ status: "signed_out" }); return; }
      setProviderConfigured(result.data.configured);
      if (result.data.status === "user" && result.data.user) {
        const displayName = result.data.user.displayName ?? result.data.user.email;
        setAuthState(createUserAuthState({
          kind: "user",
          userId: result.data.user.userId,
          ...(displayName ? { displayName } : {}),
        }));
      } else {
        setAuthState({ status: "signed_out" });
      }
    });
    return removePopStateListener;
  }, []);

  const setExperienceMode = useCallback((
    mode: AppExperienceMode | null,
    historyMode: "push" | "replace" = "push",
  ) => {
    setExperienceModeState(mode);
    if (mode) setVisitedModes((current) => ({ ...current, [mode]: true }));
    writeStoredExperienceMode(getBrowserSessionStorage(), mode);
    const nextUrl = createExperienceModeUrl(window.location.href, mode);
    if (historyMode === "replace") window.history.replaceState({ path: mode }, "", nextUrl);
    else window.history.pushState({ path: mode }, "", nextUrl);
  }, []);

  function handleUserSession(session: UserSession) {
    setAuthState(createUserAuthState(session));
  }

  async function handleLogout() {
    setSessionMessage("ログアウトしています…");
    const result = await signOut();
    if (!result.ok) {
      setSessionMessage("ログアウトできませんでした。通信状態を確認して、もう一度お試しください。");
      return;
    }
    setAuthState({ status: "signed_out" });
    setExperienceModeState(null);
    setVisitedModes({ diagnosis: false, product: false });
    writeStoredExperienceMode(getBrowserSessionStorage(), null);
    setDiagnosisAnswers(null);
    setSessionMessage("ログアウトしました。");
  }

  return (
    <>
      <SessionStatus authState={authState} providerConfigured={providerConfigured} message={sessionMessage} onLogout={handleLogout} />
      {authState.status === "guest" || authState.status === "user" ? (
        <>
          {experienceMode === null ? (
            <ExperienceModeSelector hasDiagnosisResult={diagnosisAnswers !== null} onSelect={setExperienceMode} />
          ) : null}
          <div className="experience-flow" hidden={experienceMode === null}>
            <div className="experience-flow-nav">
              <button onClick={() => setExperienceMode(null)} type="button">← モード選択に戻る</button>
              <a href="/">ホームへ戻る</a>
            </div>
            {visitedModes.diagnosis ? (
              <div
                aria-hidden={experienceMode !== "diagnosis"}
                className="experience-mode-panel"
                data-experience-mode="diagnosis"
                hidden={experienceMode !== "diagnosis"}
                inert={experienceMode !== "diagnosis"}
              >
              <PreferenceDiagnosisFlow
                onComplete={setDiagnosisAnswers}
                onOpenProductJudgement={() => setExperienceMode("product")}
                onReset={() => setDiagnosisAnswers(null)}
              />
              </div>
            ) : null}
            {visitedModes.product ? (
              <div
                aria-hidden={experienceMode !== "product"}
                className="experience-mode-panel"
                data-experience-mode="product"
                hidden={experienceMode !== "product"}
                inert={experienceMode !== "product"}
              >
              <RecommendationWorkspace
                authState={authState}
                diagnosisAnswers={diagnosisAnswers}
                onUserSession={handleUserSession}
                onboardingHint={onboardingHint}
                requireSessionSelection
              />
              </div>
            ) : null}
          </div>
        </>
      ) : authState.status === "signed_out" ? (
        <section className="experience-selector">
          <h2>利用方法を選んでください。</h2>
          <p>ログインするか、ゲストモードで診断と商品判断をお試しください。</p>
          <div className="experience-flow-nav"><a href="/login">ログイン / 新規登録</a><a href="/app?session=guest">ゲストで試す</a></div>
        </section>
      ) : null}
    </>
  );
}

function SessionStatus({
  authState,
  providerConfigured,
  message,
  onLogout,
}: {
  authState: AuthState;
  providerConfigured: boolean;
  message: string;
  onLogout: () => void;
}) {
  if (authState.status === "loading") return <div className="session-status session-status--loading" role="status"><span className="loading-mark" aria-hidden="true" /><span><strong>利用状態を確認しています</strong><small>ゲストまたはログイン状態を安全に準備します。</small></span></div>;
  if (authState.status === "guest") {
    return <div className="session-status" data-session="guest"><strong>ゲストモード</strong><span>ログインなしで診断と商品判断を何回でも試せます。診断下書きはこのタブだけに一時保存します。</span>{message ? <small role="status">{message}</small> : null}</div>;
  }
  if (authState.status === "user") {
    return <div className="session-status" data-session="user"><strong>{authState.session.displayName ?? authState.session.userId}</strong><span>ログイン中です。推薦への評価をこのアカウントの履歴へ保存できます。</span><button onClick={onLogout} type="button">ログアウト</button>{message ? <small role="status">{message}</small> : null}</div>;
  }
  return <div className="session-status" data-session="signed-out"><strong>ログインしていません</strong><span>{providerConfigured ? "ログインまたはゲストモードを選んでください。" : "Supabaseは未設定です。ゲストモードは利用できます。"}</span><a href="/login">利用方法を選ぶ</a></div>;
}

function getBrowserStorage(): SessionStorage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

function getBrowserSessionStorage(): SessionStorage | undefined {
  try { return window.sessionStorage; } catch { return undefined; }
}
