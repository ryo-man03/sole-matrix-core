"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  type DiagnosisAnswerId,
  preferenceDiagnosisQuestions,
} from "../_data/preferenceDiagnosisQuestions";
import {
  analyzeSneaker as analyzeSneakerApi,
  getUserProfile,
  registerUser as registerUserApi,
  resolveManualProductLink,
  resolveRecommendationProductLinks,
  saveGlobalRecommendationFeedback,
  saveUserFeedback,
  searchRecommendations,
} from "../_lib/apiClient";
import type { AuthState, UserSession } from "../_lib/auth-session/types";
import type { IntegratedRecommendationResult } from "../_lib/integrated-recommendation/types";
import type { OnboardingPreferenceHint } from "../_lib/onboarding/types";
import type { LiveProductUrl } from "../_lib/product-links/types";
import type { SatisfactionEvaluation } from "../_lib/satisfaction-feedback/types";
import type { UserMemorySummary } from "../_lib/user-memory/types";
import { ExternalEvidencePanel } from "./ExternalEvidencePanel";
import {
  createLatestRequestGate,
  resolveRecommendationProductName,
} from "./productLinkResolution";

const workspaceModes = [
  {
    id: "ryo",
    label: "Ryo Mode",
    description: "文化的背景とコレクションとの関係を深く見る",
  },
  {
    id: "balanced",
    label: "Balanced Mode",
    description: "価格・汎用性・購入リスクを冷静に見る",
  },
] as const;

const modeDecisionLabels: Record<
  IntegratedRecommendationResult["modeRecommendation"]["decision"],
  string
> = {
  strong_buy: "STRONG BUY",
  buy: "BUY",
  wait: "WAIT",
  skip: "SKIP",
};

type RecommendationWorkspaceProps = {
  authState?: AuthState;
  diagnosisAnswers?: Record<string, DiagnosisAnswerId> | null;
  onGuestDiagnosisCompleted?: () => void;
  onUserSession?: (session: UserSession) => void;
  onboardingHint?: OnboardingPreferenceHint | null;
  requireSessionSelection?: boolean;
};

export function RecommendationWorkspace({
  authState = { status: "signed_out" },
  diagnosisAnswers = null,
  onGuestDiagnosisCompleted,
  onUserSession,
  onboardingHint = null,
  requireSessionSelection = false,
}: RecommendationWorkspaceProps = {}) {
  const [mode, setMode] = useState<(typeof workspaceModes)[number]["id"]>("ryo");
  const [sneakerName, setSneakerName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [currentUser, setCurrentUser] = useState<UserMemorySummary | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, DiagnosisAnswerId>>(() =>
    diagnosisAnswers ?? createNeutralDiagnosisAnswers(),
  );
  const [result, setResult] = useState<IntegratedRecommendationResult | null>(null);
  const [productLinks, setProductLinks] = useState<LiveProductUrl[]>([]);
  const [isResolvingProductLinks, setIsResolvingProductLinks] = useState(false);
  const [productLinksMessage, setProductLinksMessage] = useState(
    "推薦後に、その時点で存在を確認できたリンクだけ表示します。",
  );
  const [manualProductUrl, setManualProductUrl] = useState("");
  const [isResolvingManualUrl, setIsResolvingManualUrl] = useState(false);
  const [feedbackEvaluation, setFeedbackEvaluation] =
    useState<SatisfactionEvaluation>("good");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [guestFeedbackSaved, setGuestFeedbackSaved] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState(
    "商品名・URL・画像のいずれかを入力してください。予算は任意です。",
  );
  const productLinkRequestGateRef = useRef(createLatestRequestGate());

  const selectedMode = workspaceModes.find((item) => item.id === mode)!;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === preferenceDiagnosisQuestions.length;
  const allCautions = useMemo(
    () =>
      result
        ? [...new Set([
            ...result.modeRecommendation.cautions,
            ...result.contextCautions,
          ])]
        : [],
    [result],
  );

  useEffect(() => {
    if (onboardingHint?.preferredBudgetYen) {
      setBudgetText((current) =>
        current.trim() ? current : String(onboardingHint.preferredBudgetYen),
      );
    }
  }, [onboardingHint]);

  useEffect(() => {
    setAnswers(diagnosisAnswers ?? createNeutralDiagnosisAnswers());
  }, [diagnosisAnswers]);

  useEffect(() => {
    return () => {
      productLinkRequestGateRef.current.invalidate();
    };
  }, []);

  async function handleRecommend() {
    if (
      requireSessionSelection &&
      (authState.status === "loading" || authState.status === "signed_out")
    ) {
      setWorkspaceStatus(
        "ログインまたはゲストモードを選んでから診断を開始してください。",
      );
      return;
    }
    if (
      authState.status === "guest" &&
      authState.session.hasCompletedDiagnosis
    ) {
      setWorkspaceStatus(
        "ゲスト診断は1回までです。ログインすると次の診断と履歴保存を利用できます。",
      );
      return;
    }
    if (!allQuestionsAnswered) {
      setWorkspaceStatus(`8問すべてに回答してください。残り${preferenceDiagnosisQuestions.length - answeredCount}問です。`);
      return;
    }
    if (!sneakerName.trim() && !productUrl.trim() && !imageFile) {
      setWorkspaceStatus("スニーカー名、商品URL、画像のいずれかを入力してください。");
      return;
    }
    const budgetYen = budgetText.trim() ? Number(budgetText) : undefined;
    if (budgetYen !== undefined && (!Number.isInteger(budgetYen) || budgetYen <= 0)) {
      setWorkspaceStatus("予算は1円以上の整数で入力してください。");
      return;
    }

    setIsAnalyzing(true);
    productLinkRequestGateRef.current.invalidate();
    setResult(null);
    setProductLinks([]);
    setManualProductUrl("");
    setProductLinksMessage("推薦結果の確定後に参考リンクを確認します。");
    setGuestFeedbackSaved(false);
    setWorkspaceStatus("URLと画像を安全に分析しています…");
    const requestedProductUrl = productUrl.trim();
    if (requestedProductUrl) setProductUrl("");
    try {
      const analysisResponse = await analyzeSneakerApi({
        ...(sneakerName.trim() ? { sneakerName: sneakerName.trim() } : {}),
        ...(requestedProductUrl ? { url: requestedProductUrl } : {}),
        ...(imageFile ? { image: imageFile } : {}),
      });
      if (!analysisResponse.ok) {
        setWorkspaceStatus(analysisResponse.error.message);
        return;
      }

      setWorkspaceStatus("Core v1と選択モードで推薦を計算しています…");
      const recommendationResponse = await searchRecommendations({
        diagnosisAnswers: preferenceDiagnosisQuestions.map((question) => ({
          questionId: question.id,
          value: answers[question.id]!,
        })),
        preferenceTags: onboardingHint?.preferenceTags ?? [],
        mode,
        ...(budgetYen === undefined ? {} : { budgetYen }),
        ...(currentUser ? { userId: currentUser.profile.userId } : {}),
        analysis: analysisResponse.data,
      });
      if (!recommendationResponse.ok) {
        setWorkspaceStatus(recommendationResponse.error.message);
        return;
      }

      setResult(recommendationResponse.data);
      void loadRecommendationProductLinks(recommendationResponse.data);
      if (authState.status === "guest") {
        onGuestDiagnosisCompleted?.();
      }
      setWorkspaceStatus(
        `${selectedMode.label}の推薦が完了しました。scoreとDecisionはTypeScriptが確定しています。`,
      );
      if (currentUser) {
        const profile = await getUserProfile(currentUser.profile.userId);
        if (profile.ok) setCurrentUser(profile.data);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function loadRecommendationProductLinks(
    recommendation: IntegratedRecommendationResult,
  ) {
    const requestId = productLinkRequestGateRef.current.beginRequest();
    setIsResolvingProductLinks(true);
    setProductLinksMessage("現在の参考リンクを安全に確認しています…");
    const productName = resolveRecommendationProductName(recommendation);
    if (!productName) {
      if (productLinkRequestGateRef.current.isCurrent(requestId)) {
        setProductLinks([]);
        setProductLinksMessage("現在確認できる商品URLはありません。");
        setIsResolvingProductLinks(false);
      }
      return;
    }
    try {
      const response = await resolveRecommendationProductLinks({
        productName,
        directUrls: recommendation.externalEvidence.listings
          .slice(0, 3)
          .map((listing) => ({
            href: listing.productUrl,
            source: "rakuten" as const,
          })),
      });
      if (!productLinkRequestGateRef.current.isCurrent(requestId)) return;
      if (!response.ok) {
        setProductLinks([]);
        setProductLinksMessage(response.error.message);
        return;
      }
      setProductLinks(response.data.links);
      setProductLinksMessage(response.data.message);
    } finally {
      if (productLinkRequestGateRef.current.isCurrent(requestId)) {
        setIsResolvingProductLinks(false);
      }
    }
  }

  async function handleAddManualProductUrl() {
    const input = manualProductUrl.trim();
    if (!input) {
      setProductLinksMessage("確認するURLを入力してください。");
      return;
    }
    const requestId = productLinkRequestGateRef.current.beginRequest();
    setIsResolvingManualUrl(true);
    setManualProductUrl("");
    setProductLinksMessage("手動URLの安全性と存在を確認しています…");
    try {
      const response = await resolveManualProductLink(input);
      if (!productLinkRequestGateRef.current.isCurrent(requestId)) return;
      if (!response.ok) {
        setProductLinksMessage(response.error.message);
        return;
      }
      if (!response.data.links.length) {
        setProductLinksMessage(response.data.message);
        return;
      }
      setProductLinks((current) => [
        ...current.filter((link) => link.href !== response.data.links[0]!.href),
        response.data.links[0]!,
      ]);
      setProductLinksMessage(response.data.message);
    } finally {
      if (productLinkRequestGateRef.current.isCurrent(requestId)) {
        setIsResolvingManualUrl(false);
      }
    }
  }

  async function handleRegisterUser() {
    const normalizedUserId = userId.trim();
    const normalizedDisplayName = displayName.trim();
    if (!normalizedUserId || !normalizedDisplayName) {
      setWorkspaceStatus("ユーザーIDと表示名を入力してください。");
      return;
    }
    setIsRegistering(true);
    try {
      const payload = await registerUserApi({
        userId: normalizedUserId,
        displayName: normalizedDisplayName,
      });
      if (!payload.ok) {
        setWorkspaceStatus(payload.error.message);
        return;
      }
      setCurrentUser(payload.data);
      onUserSession?.({
        kind: "user",
        userId: payload.data.profile.userId,
        displayName: payload.data.profile.displayName,
      });
      setWorkspaceStatus("ユーザーを登録し、memory.mdを読み込みました。");
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleUseDemoImage() {
    try {
      const demoImage = await createDemoSneakerFile();
      setImageFile(demoImage);
      setWorkspaceStatus(
        "サンプル画像をセットしました。実画像と同じupload・Gemini分析経路で確認できます。",
      );
    } catch {
      setWorkspaceStatus("サンプル画像を作成できませんでした。");
    }
  }

  async function handleSaveFeedback() {
    if (!result) {
      setWorkspaceStatus("feedbackを保存するには推薦実行が必要です。");
      return;
    }
    setIsSavingFeedback(true);
    try {
      const sessionType = currentUser
        ? "user"
        : authState.status === "guest"
          ? "guest"
          : "unknown";
      const evidenceUsed = [
        "preference answers",
        ...(mode === "ryo" ? ["owned / wishlist / curated hints"] : []),
        ...(result.analysis.visualAnalysis ? ["image analysis"] : []),
        ...(result.analysis.urlAnalysis ? ["URL analysis"] : []),
        ...(result.candidate.source === "rakuten" ? ["Rakuten evidence"] : []),
        "user feedback",
      ];
      const globalFeedback = await saveGlobalRecommendationFeedback({
        sessionType,
        recommendationMode: result.modeRecommendation.mode,
        eightQuestionAnswers: preferenceDiagnosisQuestions.map(
          (question) => answers[question.id] ?? "unanswered",
        ),
        userContextSummary: [
          sessionType === "user" ? "logged-in user" : sessionType,
          onboardingHint?.purpose,
          onboardingHint?.experience,
        ].filter(Boolean).join(" / "),
        inputSneakerName:
          result.analysis.sneakerName ??
          result.analysis.urlAnalysis?.extractedNameHint ??
          result.candidate.name,
        ...(budgetText.trim()
          ? { budgetRange: `up to ${budgetText.trim()} JPY` }
          : {}),
        importantTags: [
          ...new Set([
            ...result.candidate.tags,
            ...(onboardingHint?.preferenceTags ?? []),
          ]),
        ],
        generatedRecommendation: [result.candidate.name],
        decision: result.modeRecommendation.decision,
        balancedScore: result.modeRecommendation.balancedScore,
        ryoScore: result.modeRecommendation.ryoScore,
        reasonSummary: result.modeRecommendation.modeReason,
        evidenceUsed,
        userEvaluation: feedbackEvaluation,
        userReason: feedbackComment,
      });
      if (!globalFeedback.ok) {
        setWorkspaceStatus(globalFeedback.error.message);
        return;
      }

      if (!currentUser) {
        setGuestFeedbackSaved(true);
        setFeedbackComment("");
        setWorkspaceStatus(
          authState.status === "guest"
            ? "ゲストの評価を匿名の共通corpusへ保存しました。個人memoryには保存していません。"
            : "評価を匿名の共通corpusへ保存しました。ログインすると個人memoryにも保存できます。",
        );
        return;
      }

      const payload = await saveUserFeedback(currentUser.profile.userId, {
        sneakerName:
          result.analysis.sneakerName ??
          result.analysis.urlAnalysis?.extractedNameHint ??
          result.candidate.name,
        mode: result.modeRecommendation.mode,
        decision: result.modeRecommendation.decision,
        balancedScore: result.modeRecommendation.balancedScore,
        ryoScore: result.modeRecommendation.ryoScore,
        userRating:
          feedbackEvaluation === "good"
            ? 5
            : feedbackEvaluation === "neutral"
              ? 3
              : 1,
        userComment: feedbackComment,
      });
      if (!payload.ok) {
        setWorkspaceStatus(payload.error.message);
        return;
      }
      setCurrentUser(payload.data);
      setFeedbackComment("");
      setWorkspaceStatus(
        "feedbackを個人memory.mdと匿名の共通corpusへ保存しました。",
      );
    } finally {
      setIsSavingFeedback(false);
    }
  }

  return (
    <section
      aria-labelledby="recommendation-workspace-title"
      className="recommendation-workspace"
      id="recommendation-workspace"
    >
      <div className="workspace-heading">
        <div>
          <p className="workspace-kicker">All-in-one workspace</p>
          <h2 id="recommendation-workspace-title">一足の情報を、ひとつの画面で判断材料へ。</h2>
        </div>
        <div className="mode-toggle" aria-label="推薦モード" role="group">
          {workspaceModes.map((item) => (
            <button
              aria-pressed={mode === item.id}
              data-active={mode === item.id}
              key={item.id}
              onClick={() => {
                setMode(item.id);
                productLinkRequestGateRef.current.invalidate();
                setResult(null);
                setProductLinks([]);
                setProductLinksMessage("推薦後に、その時点で存在を確認できたリンクだけ表示します。");
                setWorkspaceStatus(`${item.label}へ切り替えました。推薦を再実行してください。`);
              }}
              type="button"
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="workspace-status" aria-live="polite">{workspaceStatus}</p>

      <nav className="mobile-workspace-steps" aria-label="スマホ商品判断ステップ">
        <a href="#mobile-step-1"><span>1</span>入力</a>
        <a href="#mobile-step-2"><span>2</span>画像 / URL</a>
        <a href="#mobile-step-3"><span>3</span>推薦結果</a>
        <a href="#mobile-step-4"><span>4</span>理由 / 証拠</a>
        <a href="#mobile-step-5"><span>5</span>保存 / 評価</a>
      </nav>

      <div className="workspace-grid desktop-workspace-layout">
        <section aria-labelledby="workspace-input-title" className="workspace-panel workspace-input-panel">
          <div className="workspace-panel-heading">
            <span>01 / INPUT</span>
            <h3 id="workspace-input-title">入力エリア</h3>
            <p>気になる一足の情報を、無理のない順番で集めます。</p>
          </div>

          <div className="mobile-step-section" data-mobile-step="1" id="mobile-step-1">
            <p className="mobile-step-label">Step 1 / 入力</p>
            <div className="workspace-fields workspace-basic-fields">
              <label><span>スニーカー名</span><input onChange={(event) => setSneakerName(event.target.value)} placeholder="例: adidas Samba OG" type="text" value={sneakerName} /></label>
              <label><span>予算</span><input inputMode="numeric" min="1" onChange={(event) => setBudgetText(event.target.value)} placeholder="例: 20000" type="number" value={budgetText} /></label>
            </div>
            <p className="workspace-preference-context">
              <strong>好みの参照:</strong>{" "}
              {diagnosisAnswers
                ? "このセッションの8問診断結果を使用します。"
                : "診断結果がないため、中立回答をCore入力として使用します。"}
              外部URLはこの好みやCore scoreを上書きしません。
            </p>
          </div>

          <div className="mobile-step-section" data-mobile-step="2" id="mobile-step-2">
            <p className="mobile-step-label">Step 2 / 画像・URL</p>
            <div className="workspace-fields workspace-evidence-fields">
              <label><span>商品URL</span><input inputMode="url" onChange={(event) => setProductUrl(event.target.value)} placeholder="https://example.com/item" type="url" value={productUrl} /><small>外部参考情報として確認し、private IP・危険scheme・credential入りURLをserver-sideで拒否します。raw URLは保存しません。</small></label>
              <div className="workspace-image-field">
                <label><span>画像アップロード</span><input accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /><small>{imageFile ? `${imageFile.name} / ${formatFileSize(imageFile.size)}` : "JPEG / PNG / WebP・5MBまで"}</small></label>
                <button onClick={handleUseDemoImage} type="button">サンプル画像を使う</button>
              </div>
            </div>
          </div>

          <button
            className="workspace-primary-button"
            disabled={
              isAnalyzing ||
              (requireSessionSelection &&
                (authState.status === "loading" ||
                  authState.status === "signed_out")) ||
              (authState.status === "guest" &&
                authState.session.hasCompletedDiagnosis)
            }
            onClick={handleRecommend}
            type="button"
          >
            {isAnalyzing
              ? "分析・推薦中…"
              : authState.status === "guest" &&
                  authState.session.hasCompletedDiagnosis
                ? "ゲスト診断は利用済み"
                : "分析して推薦を実行する"}
          </button>
        </section>

        <section aria-labelledby="workspace-result-title" className="workspace-panel workspace-result-panel" data-mobile-step="3" id="mobile-step-3">
          <p className="mobile-step-label">Step 3 / 推薦結果</p>
          <div className="workspace-panel-heading">
            <span>02 / RESULT</span><h3 id="workspace-result-title">解析・推薦結果</h3><p>{selectedMode.label}の観点を選択中です。</p>
          </div>

          <div className="workspace-decision-placeholder" data-decision={result?.modeRecommendation.decision ?? "pending"}>
            <span>Decision</span>
            <strong>{result ? modeDecisionLabels[result.modeRecommendation.decision] : isAnalyzing ? "分析中…" : "診断待ち"}</strong>
            <p>{result ? result.explanation.summary : "scoreとDecisionは、AIではなくCore v1とmode evaluatorのTypeScriptルールが決定します。"}</p>
          </div>

          {result ? (
            <div className="workspace-candidate-summary">
              <span>{result.candidate.source === "rakuten" ? "Rakuten candidate" : "Local fallback candidate"}</span>
              <h4>{result.candidate.name}</h4>
              <p>{result.candidate.description}</p>
              {result.candidate.priceYen !== undefined ? <strong>{formatYen(result.candidate.priceYen)}</strong> : null}
            </div>
          ) : null}

          <div className="workspace-score-preview">
            <div><span>Balanced Score</span><strong>{result ? result.modeRecommendation.balancedScore : "--"}</strong></div>
            <div><span>Ryo Score</span><strong>{result ? result.modeRecommendation.ryoScore : "--"}</strong></div>
          </div>

          <dl className="workspace-result-list">
            <div><dt>Mode reason</dt><dd>{result ? result.modeRecommendation.modeReason : selectedMode.description}</dd></div>
            <div><dt>Cautions</dt><dd>{allCautions.length > 0 ? allCautions.join(" / ") : "URL・画像・価格の確認後に表示します。"}</dd></div>
            {result?.analysis.urlAnalysis ? <div><dt>URL analysis</dt><dd>{result.analysis.urlAnalysis.title ?? "title未取得"}（confidence {Math.round(result.analysis.urlAnalysis.confidence * 100)}%）</dd></div> : null}
            {result?.analysis.visualAnalysis ? <div><dt>Image analysis</dt><dd>{[result.analysis.visualAnalysis.detectedBrand, result.analysis.visualAnalysis.detectedModelName, ...result.analysis.visualAnalysis.mainColors].filter(Boolean).join(" / ") || "特徴を特定できませんでした"}</dd></div> : null}
          </dl>

          <div className="workspace-external-evidence-step" data-mobile-step="4" id="mobile-step-4">
            <p className="mobile-step-label">Step 4 / 理由・外部証拠</p>
            <ExternalEvidencePanel
              isProductLinksLoading={isResolvingProductLinks}
              isResolvingManualUrl={isResolvingManualUrl}
              manualProductUrl={manualProductUrl}
              onAddManualProductUrl={handleAddManualProductUrl}
              onManualProductUrlChange={setManualProductUrl}
              productLinks={productLinks}
              productLinksMessage={productLinksMessage}
              result={result}
            />
          </div>
        </section>

        <aside aria-labelledby="workspace-user-title" className="workspace-panel workspace-user-panel" data-mobile-step="5" id="mobile-step-5">
          <p className="mobile-step-label">Step 5 / 保存・フィードバック</p>
          <div className="workspace-panel-heading"><span>03 / FEEDBACK</span><h3 id="workspace-user-title">保存と評価</h3><p>ゲスト入力は個人履歴として保存しません。</p></div>
          {authState.status !== "guest" ? (
            <>
              <div className="workspace-fields workspace-user-fields">
                <label><span>ユーザーID</span><input autoComplete="username" onChange={(event) => setUserId(event.target.value)} placeholder="ryo_01" type="text" value={userId} /></label>
                <label><span>表示名</span><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="Ryo" type="text" value={displayName} /></label>
              </div>
              <button className="workspace-secondary-button" disabled={isRegistering} onClick={handleRegisterUser} type="button">{isRegistering ? "登録中…" : "プロトタイプユーザーを登録する"}</button>
            </>
          ) : (
            <p className="workspace-preference-context">
              ゲストの入力商品URL・画像・診断履歴は個人memoryへ保存しません。
            </p>
          )}

          <div className="workspace-user-summary"><span>現在のユーザー</span><strong>{currentUser ? `${currentUser.profile.displayName} / ${currentUser.profile.userId}` : "未登録"}</strong></div>
          <div className="workspace-memory-preview">
            <div><span>Diagnosis history</span><strong>{currentUser ? currentUser.diagnosisHistoryCount : 0} notes</strong></div>
            <div><span>Feedback history</span><strong>{currentUser ? currentUser.feedbackHistory.length : 0} items</strong></div>
          </div>

          {result ? (
            <div className="workspace-feedback-form">
              <span>この推薦はどうでしたか？</span>
              <div className="workspace-feedback-evaluation" role="group" aria-label="推薦への評価">
                {([
                  ["good", "納得できた"],
                  ["neutral", "微妙"],
                  ["bad", "違う"],
                ] as const).map(([value, label]) => (
                  <button
                    aria-pressed={feedbackEvaluation === value}
                    data-selected={feedbackEvaluation === value}
                    key={value}
                    onClick={() => setFeedbackEvaluation(value)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>理由メモ<textarea maxLength={500} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="なぜそう思いましたか？" value={feedbackComment} /></label>
              <button disabled={isSavingFeedback} onClick={handleSaveFeedback} type="button">{isSavingFeedback ? "保存中…" : "次回に反映するために保存"}</button>
              {!currentUser ? <small>ゲスト評価は匿名の共通corpusに保存し、個人memoryには保存しません。</small> : null}
              {guestFeedbackSaved ? <small>匿名化して保存済みです。</small> : null}
            </div>
          ) : null}

          {authState.status === "guest" &&
          authState.session.hasCompletedDiagnosis ? (
            <div className="guest-upgrade-callout">
              <strong>結果を保存して、次の一足も診断する</strong>
              <p>
                ログインすると診断履歴と推薦への評価を自分のmemoryへ保存できます。
              </p>
              <a href="/login?intent=login&next=/app">ログインへ</a>
            </div>
          ) : null}

          <div className="workspace-mode-note" data-mode={mode}><span>{selectedMode.label}</span><p>{selectedMode.description}</p>{mode === "ryo" ? <small>実所有41足 / wishlist 40候補のseed v2を参照</small> : null}</div>
          {onboardingHint ? (
            <p className="workspace-onboarding-hint">
              初回設定の補助タグ: {onboardingHint.preferenceTags.join(" / ") || "なし"}
            </p>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value);
}

function createNeutralDiagnosisAnswers(): Record<string, DiagnosisAnswerId> {
  return Object.fromEntries(
    preferenceDiagnosisQuestions.map((question) => [question.id, "neutral"]),
  ) as Record<string, DiagnosisAnswerId>;
}

async function createDemoSneakerFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("CANVAS_UNAVAILABLE");
  }

  context.fillStyle = "#f5f1e9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#d8d0c4";
  context.fillRect(70, 315, 500, 18);

  context.beginPath();
  context.moveTo(105, 275);
  context.lineTo(172, 245);
  context.lineTo(238, 145);
  context.lineTo(350, 165);
  context.lineTo(410, 235);
  context.lineTo(535, 270);
  context.lineTo(555, 305);
  context.lineTo(110, 305);
  context.closePath();
  context.fillStyle = "#5b2b2b";
  context.fill();
  context.lineWidth = 7;
  context.strokeStyle = "#1f242b";
  context.stroke();

  context.fillStyle = "#f3e4ca";
  context.fillRect(112, 286, 438, 31);
  context.strokeRect(112, 286, 438, 31);
  context.fillStyle = "#1f242b";
  context.fillRect(132, 317, 390, 10);

  context.strokeStyle = "#f3e4ca";
  context.lineWidth = 9;
  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.moveTo(255 + index * 33, 185 + index * 9);
    context.lineTo(225 + index * 30, 245 + index * 4);
    context.stroke();
  }

  context.strokeStyle = "#f8f6f1";
  context.lineWidth = 5;
  for (let index = 0; index < 4; index += 1) {
    context.beginPath();
    context.moveTo(268, 205 + index * 17);
    context.lineTo(365, 216 + index * 12);
    context.stroke();
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("PNG_ENCODE_FAILED"));
    }, "image/png");
  });
  return new File([blob], "sole-matrix-demo-sneaker.png", {
    type: "image/png",
  });
}
