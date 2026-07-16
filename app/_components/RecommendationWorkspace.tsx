"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CompletedPreferenceDiagnosisAnswers, PreferenceDiagnosisAnswers } from "../_data/preferenceDiagnosisQuestions";
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
import { retainPreviousProductJudgementOnFailure } from "../_lib/product-judgement/resultRetention";
import { buildRyoModeContextForRecommendation } from "../_lib/ryo-mode-v4/integration";
import { buildRyoPreferenceVector } from "../_lib/ryo-mode-v4/vector";
import type { SatisfactionEvaluation } from "../_lib/satisfaction-feedback/types";
import type { UserMemorySummary } from "../_lib/user-memory/types";
import { ExternalEvidencePanel } from "./ExternalEvidencePanel";
import { createLatestRequestGate, resolveRecommendationProductName } from "./productLinkResolution";
import { RyoModeResultPanel } from "./RyoModeResultPanel";
import { RakutenMarketFind } from "./RakutenMarketFind";

const workspaceModes = [
  { id: "ryo", label: "Ryo Mode", description: "文化的背景とコレクションとの関係を深く見る" },
  { id: "balanced", label: "Balanced Mode", description: "価格・汎用性・購入リスクを均等に見る" },
] as const;

const decisionLabels: Record<IntegratedRecommendationResult["modeRecommendation"]["decision"], string> = {
  strong_buy: "STRONG BUY",
  buy: "BUY",
  wait: "WAIT",
  skip: "SKIP",
};

type RecommendationWorkspaceProps = {
  authState?: AuthState;
  diagnosisAnswers?: CompletedPreferenceDiagnosisAnswers | null;
  onGuestDiagnosisCompleted?: () => void;
  onUserSession?: (session: UserSession) => void;
  onboardingHint?: OnboardingPreferenceHint | null;
  requireSessionSelection?: boolean;
};

export function RecommendationWorkspace({
  authState = { status: "signed_out" },
  diagnosisAnswers = null,
  onboardingHint = null,
  requireSessionSelection = false,
}: RecommendationWorkspaceProps = {}) {
  const [mode, setMode] = useState<(typeof workspaceModes)[number]["id"]>("ryo");
  const [sneakerName, setSneakerName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [answers, setAnswers] = useState<PreferenceDiagnosisAnswers>(() => diagnosisAnswers ?? {});
  const [result, setResult] = useState<IntegratedRecommendationResult | null>(null);
  const [currentUser, setCurrentUser] = useState<UserMemorySummary | null>(null);
  const [productLinks, setProductLinks] = useState<LiveProductUrl[]>([]);
  const [isResolvingProductLinks, setIsResolvingProductLinks] = useState(false);
  const [productLinksMessage, setProductLinksMessage] = useState("推薦後に具体モデル名を使った参考リンクを表示します。");
  const [manualProductUrl, setManualProductUrl] = useState("");
  const [isResolvingManualUrl, setIsResolvingManualUrl] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackEvaluation, setFeedbackEvaluation] = useState<SatisfactionEvaluation>("good");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState("商品名・URL・画像のいずれかを入力してください。予算は任意です。");
  const [analysisStage, setAnalysisStage] = useState<"idle" | "analyzing" | "recommending" | "complete" | "error">("idle");
  const [isShowingRetainedResult, setIsShowingRetainedResult] = useState(false);
  const requestGateRef = useRef(createLatestRequestGate());
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedMode = workspaceModes.find((item) => item.id === mode)!;
  const ryoPreferenceVector = useMemo(() => buildRyoPreferenceVector(answers), [answers]);
  const allCautions = useMemo(() => result ? [...new Set([
    ...(result.candidate.researchCautions ?? []),
    ...result.explanation.cautions,
  ])] : [], [result]);

  useEffect(() => { setAnswers(diagnosisAnswers ?? {}); }, [diagnosisAnswers]);
  useEffect(() => {
    if (onboardingHint?.preferredBudgetYen) setBudgetText((current) => current || String(onboardingHint.preferredBudgetYen));
  }, [onboardingHint]);
  useEffect(() => () => requestGateRef.current.invalidate(), []);
  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(""); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  useEffect(() => {
    if (authState.status !== "user") { setCurrentUser(null); return; }
    let active = true;
    void getUserProfile(authState.session.userId).then(async (profile) => {
      if (!active) return;
      if (profile.ok) { setCurrentUser(profile.data); return; }
      const registered = await registerUserApi({
        userId: authState.session.userId,
        displayName: authState.session.displayName ?? "SOLE//MATRIX user",
      });
      if (active && registered.ok) setCurrentUser(registered.data);
    });
    return () => { active = false; };
  }, [authState]);

  function showRequestFailure(message: string) {
    const presentation = retainPreviousProductJudgementOnFailure({ result, productLinks }, message);
    setWorkspaceStatus(presentation.status);
    setAnalysisStage(presentation.analysisStage);
    setIsAnalyzing(presentation.isAnalyzing);
    setIsShowingRetainedResult(presentation.retainedPreviousResult);
  }

  async function handleRecommend() {
    if (requireSessionSelection && (authState.status === "loading" || authState.status === "signed_out")) {
      showRequestFailure("ログインまたはゲストモードを選んでください。");
      return;
    }
    if (!sneakerName.trim() && !productUrl.trim() && !imageFile) {
      showRequestFailure("商品名・URL・画像のいずれかを入力してください。");
      return;
    }
    const budgetYen = budgetText.trim() ? Number(budgetText) : undefined;
    if (budgetYen !== undefined && (!Number.isInteger(budgetYen) || budgetYen <= 0)) {
      showRequestFailure("予算は1円以上の整数で入力してください。");
      return;
    }

    setIsAnalyzing(true);
    setIsShowingRetainedResult(result !== null);
    setFeedbackSaved(false);
    setAnalysisStage("analyzing");
    requestGateRef.current.invalidate();
    setIsResolvingProductLinks(false);
    setIsResolvingManualUrl(false);
    setWorkspaceStatus("商品情報を安全に分析しています…");
    try {
      const ryoContext = buildRyoModeContextForRecommendation(answers);
      const analysisResponse = await analyzeSneakerApi({
        ...(sneakerName.trim() ? { sneakerName: sneakerName.trim() } : {}),
        ...(productUrl.trim() ? { url: productUrl.trim() } : {}),
        ...(imageFile ? { image: imageFile } : {}),
      });
      if (!analysisResponse.ok) { showRequestFailure(analysisResponse.error.message); return; }

      setWorkspaceStatus("CoreでスコアとDecisionを計算しています…");
      setAnalysisStage("recommending");
      const recommendationResponse = await searchRecommendations({
        diagnosisAnswers: ryoContext.diagnosisAnswers,
        preferenceTags: [...new Set([...ryoContext.preferenceTags, ...(onboardingHint?.preferenceTags ?? [])])].slice(0, 5),
        ryoModeAnswers: ryoContext.answers,
        mode,
        ...(budgetYen === undefined && ryoContext.budgetYen === undefined ? {} : { budgetYen: budgetYen ?? ryoContext.budgetYen }),
        ...(currentUser ? { userId: currentUser.profile.userId } : {}),
        analysis: analysisResponse.data,
      });
      if (!recommendationResponse.ok) { showRequestFailure(recommendationResponse.error.message); return; }

      setProductLinks([]);
      setResult(recommendationResponse.data);
      setIsShowingRetainedResult(false);
      void loadProductLinks(recommendationResponse.data);
      setWorkspaceStatus(`${selectedMode.label}の判断が完了しました。最終DecisionはTypeScript Coreが決定しています。`);
      setAnalysisStage("complete");
      if (currentUser) {
        const profile = await getUserProfile(currentUser.profile.userId);
        if (profile.ok) setCurrentUser(profile.data);
      }
    } catch {
      showRequestFailure("分析サービスに接続できませんでした。時間をおいて、もう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function loadProductLinks(recommendation: IntegratedRecommendationResult) {
    const requestId = requestGateRef.current.beginRequest();
    const productName = resolveRecommendationProductName(recommendation);
    if (!productName) {
      setProductLinksMessage("具体的なモデル名を確認できないため、検索リンクを作成できませんでした。");
      return;
    }
    setIsResolvingProductLinks(true);
    try {
      const response = await resolveRecommendationProductLinks({
        productName,
        directUrls: [
          ...(recommendation.candidate.evidenceUrls ?? []).map((href) => ({ href, source: "marketplace" as const })),
          ...recommendation.externalEvidence.listings.map((listing) => ({ href: listing.productUrl, source: "rakuten" as const })),
        ].slice(0, 6),
      });
      if (!requestGateRef.current.isCurrent(requestId)) return;
      if (!response.ok) { setProductLinksMessage(response.error.message); return; }
      setProductLinks(response.data.links);
      setProductLinksMessage(response.data.message);
    } finally {
      if (requestGateRef.current.isCurrent(requestId)) setIsResolvingProductLinks(false);
    }
  }

  async function handleAddManualProductUrl() {
    if (!manualProductUrl.trim()) { setProductLinksMessage("確認するURLを入力してください。"); return; }
    const requestId = requestGateRef.current.beginRequest();
    setIsResolvingManualUrl(true);
    try {
      const response = await resolveManualProductLink(manualProductUrl.trim());
      if (!requestGateRef.current.isCurrent(requestId)) return;
      if (!response.ok || !response.data.links.length) {
        setProductLinksMessage(response.ok ? response.data.message : response.error.message);
        return;
      }
      setProductLinks((current) => [...current.filter((link) => link.href !== response.data.links[0]!.href), response.data.links[0]!]);
      setManualProductUrl("");
      setProductLinksMessage(response.data.message);
    } finally {
      if (requestGateRef.current.isCurrent(requestId)) setIsResolvingManualUrl(false);
    }
  }

  async function handleUseDemoImage() {
    try {
      setImageFile(await createDemoSneakerFile());
      if (imageInputRef.current) imageInputRef.current.value = "";
      setWorkspaceStatus("デモ画像を設定しました。画像判断を何回でも試せます。");
    } catch {
      setWorkspaceStatus("デモ画像を作成できませんでした。");
    }
  }

  function handleImageChange(file: File | null) {
    if (!file) { setImageFile(null); return; }
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setWorkspaceStatus("JPEG・PNG・WebP形式の画像を選んでください。");
      setAnalysisStage("error");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setWorkspaceStatus("画像は5MB以下にしてください。");
      setAnalysisStage("error");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    setAnalysisStage("idle");
    setWorkspaceStatus("画像を選択しました。商品名やURLを追加すると候補を絞りやすくなります。");
  }

  function removeImage() {
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setWorkspaceStatus("画像を取り除きました。");
    setAnalysisStage("idle");
  }

  async function handleSaveFeedback() {
    if (!result) return;
    if (!currentUser) {
      setFeedbackSaved(true);
      setFeedbackComment("");
      setWorkspaceStatus("ゲストの評価はこの画面だけに反映し、履歴には保存しません。");
      return;
    }
    setIsSavingFeedback(true);
    try {
      const globalResult = await saveGlobalRecommendationFeedback({
        sessionType: "user",
        recommendationMode: result.modeRecommendation.mode,
        // Preserve the existing feedback storage contract until that schema is versioned.
        eightQuestionAnswers: buildRyoModeContextForRecommendation(answers).diagnosisAnswers.map((answer) => answer.value),
        userContextSummary: "authenticated user",
        inputSneakerName: result.candidate.name,
        importantTags: result.candidate.tags,
        generatedRecommendation: [result.candidate.name],
        decision: result.modeRecommendation.decision,
        balancedScore: result.modeRecommendation.balancedScore,
        ryoScore: result.modeRecommendation.ryoScore,
        reasonSummary: result.modeRecommendation.modeReason,
        evidenceUsed: ["preference answers", "Core score", "Gemini supplemental explanation"],
        userEvaluation: feedbackEvaluation,
        userReason: feedbackComment,
      });
      if (!globalResult.ok) { setWorkspaceStatus(globalResult.error.message); return; }
      const saved = await saveUserFeedback(currentUser.profile.userId, {
        sneakerName: result.candidate.name,
        mode: result.modeRecommendation.mode,
        decision: result.modeRecommendation.decision,
        balancedScore: result.modeRecommendation.balancedScore,
        ryoScore: result.modeRecommendation.ryoScore,
        userRating: feedbackEvaluation === "good" ? 5 : feedbackEvaluation === "neutral" ? 3 : 1,
        userComment: feedbackComment,
      });
      if (!saved.ok) { setWorkspaceStatus(saved.error.message); return; }
      setCurrentUser(saved.data);
      setFeedbackComment("");
      setFeedbackSaved(true);
      setWorkspaceStatus("評価をユーザーmemoryに保存しました。");
    } finally {
      setIsSavingFeedback(false);
    }
  }

  return (
    <section aria-labelledby="recommendation-workspace-title" className="recommendation-workspace" id="recommendation-workspace">
      <div className="workspace-heading">
        <div><p className="workspace-kicker">Product judgement</p><h2 id="recommendation-workspace-title">気になる一足の購入判断を整理する</h2></div>
        <div className="mode-toggle" aria-label="推薦モード" role="group">
          {workspaceModes.map((item) => <button aria-pressed={mode === item.id} data-active={mode === item.id} key={item.id} onClick={() => { setMode(item.id); setResult(null); setProductLinks([]); setIsShowingRetainedResult(false); }} type="button"><strong>{item.label}</strong><span>{item.description}</span></button>)}
        </div>
      </div>
      <p className="workspace-status" aria-live="polite">{workspaceStatus}</p>
      <ol className="workspace-progress" aria-label="購入判断の処理状況" data-stage={analysisStage}>
        <li data-state={analysisStage === "idle" || analysisStage === "error" ? "current" : "complete"}><span>01</span>入力を確認</li>
        <li data-state={analysisStage === "analyzing" ? "current" : analysisStage === "recommending" || analysisStage === "complete" ? "complete" : "pending"}><span>02</span>候補を比較</li>
        <li data-state={analysisStage === "recommending" ? "current" : analysisStage === "complete" ? "complete" : "pending"}><span>03</span>Coreで判断</li>
        <li data-state={analysisStage === "complete" ? "complete" : "pending"}><span>04</span>結果と次の行動</li>
      </ol>

      <nav className="mobile-workspace-steps" aria-label="商品判断ステップ"><a href="#mobile-step-1"><span>1</span>入力</a><a href="#mobile-step-2"><span>2</span>画像 / URL</a><a href="#mobile-step-3"><span>3</span>判断結果</a><a href="#mobile-step-4"><span>4</span>証拠 / リンク</a><a href="#mobile-step-5"><span>5</span>保存 / 評価</a></nav>

      <div className="workspace-grid desktop-workspace-layout" data-has-result={result ? "true" : "false"}>
        <section className="workspace-panel workspace-input-panel" aria-labelledby="workspace-input-title" data-mobile-step="1" id="mobile-step-1">
          <div className="workspace-panel-heading"><span>01 / INPUT</span><h3 id="workspace-input-title">商品情報</h3><p>商品名・URL・画像のいずれかを入力してください。</p></div>
          <div className="workspace-fields workspace-basic-fields">
            <label><span>スニーカー名</span><input onChange={(event) => setSneakerName(event.target.value)} placeholder="例: adidas SAMBA OG" value={sneakerName} /></label>
            <label><span>予算（円・任意）</span><input inputMode="numeric" min="1" onChange={(event) => setBudgetText(event.target.value)} placeholder="例: 20000" type="number" value={budgetText} /></label>
            <div data-mobile-step="2" id="mobile-step-2"><label><span>商品URL</span><input inputMode="url" onChange={(event) => setProductUrl(event.target.value)} placeholder="https://example.com/item" type="url" value={productUrl} /><small>URLは外部参考情報として扱い、Core scoreには混ぜません。</small></label><div className="workspace-image-field"><label><span>画像</span><input accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)} ref={imageInputRef} type="file" /><small>{imageFile ? `${imageFile.name} / ${formatFileSize(imageFile.size)}` : "JPEG / PNG / WebP・5MBまで"}</small></label><div className="workspace-image-actions"><button onClick={handleUseDemoImage} type="button">デモ画像を使う</button>{imageFile ? <button onClick={removeImage} type="button">画像を取り除く</button> : null}</div>{imagePreviewUrl ? <img alt="選択したスニーカー画像のプレビュー" className="workspace-image-preview" src={imagePreviewUrl} /> : null}</div></div>
          </div>
          <p className="workspace-preference-context">{diagnosisAnswers ? "このセッションの11問診断結果を好みの参考に使います。" : "11問診断結果がないため、Ryo Mode v4は未指定の軸を中立として扱います。"}</p>
          <button className="workspace-primary-button" disabled={isAnalyzing || (requireSessionSelection && (authState.status === "loading" || authState.status === "signed_out"))} onClick={handleRecommend} type="button">{isAnalyzing ? "分析・推薦中…" : "分析して購入判断を実行する"}</button>
        </section>

        <section className="workspace-panel workspace-result-panel" aria-labelledby="workspace-result-title" data-mobile-step="3" id="mobile-step-3">
          <div className="workspace-panel-heading"><span>02 / RESULT</span><h3 id="workspace-result-title">購入判断</h3><p>{selectedMode.description}</p></div>
          {result && isShowingRetainedResult ? <p className="workspace-retained-result-note" role="status">以下の判断・参考リンク・評価欄は前回成功時の内容です。今回失敗した入力の結果ではありません。</p> : null}
          <div className="workspace-decision-placeholder" data-decision={result?.modeRecommendation.decision ?? "pending"}><span>Decision</span><strong>{result ? decisionLabels[result.modeRecommendation.decision] : isAnalyzing ? "分析中…" : "入力待ち"}</strong><p>{result ? result.explanation.summary : "最終DecisionはAIではなくTypeScript Coreが決定します。"}</p></div>
          {result ? <div className="workspace-candidate-summary"><span>{result.candidate.researchSource === "product_input" ? "入力商品" : result.candidate.researchSource === "gemini" ? "Gemini調査候補 / Core再評価済み" : result.candidate.researchSource === "ryo_anchor" ? "Ryo candidate anchor / Core再ランキング済み" : "fallback catalog"}</span><h4>{result.candidate.name}</h4>{result.candidate.modelType ? <small>タイプ: {result.candidate.modelType}</small> : null}<p>{result.candidate.description}</p></div> : null}
          <div className="workspace-score-preview"><div><span>Balanced Score</span><strong>{result ? result.modeRecommendation.balancedScore : "--"}</strong></div><div><span>Ryo Score</span><strong>{result ? result.modeRecommendation.ryoScore : "--"}</strong></div></div>
          {result ? <><p className="core-v1-provider-note" data-ryo-reranking={result.ryoReranking.applied ? "applied" : "not-applied"}>Ryo再ランキング: {result.ryoReranking.applied ? `適用済み（候補${result.ryoReranking.candidatePoolSize}足 / recommendationScore ${result.ryoReranking.selectedRecommendationScore}）` : "商品単体判断のため未適用"}</p><details className="result-detail-accordion"><summary>Ryoらしい評価を詳しく見る</summary><RyoModeResultPanel candidate={result.candidate} rerankingApplied={result.ryoReranking.applied} vector={ryoPreferenceVector} /></details></> : null}
          <dl className="workspace-result-list"><div><dt>Core判断理由</dt><dd>{result ? `${selectedMode.description}。Coreが候補特徴・予算適合度・リスクから判定しました。` : selectedMode.description}</dd></div><div><dt>Gemini補助</dt><dd>{result ? `${result.candidateResearch.detail} 説明: ${result.explanation.source}` : "結果生成後に表示します。"}</dd></div><div><dt>注意点</dt><dd>{allCautions.length ? allCautions.join(" / ") : "価格・在庫・サイズ・購入可能性は保証しません。"}</dd></div></dl>
          <div data-mobile-step="4" id="mobile-step-4">{result ? <><ExternalEvidencePanel result={result} productLinks={productLinks} productLinksMessage={productLinksMessage} isProductLinksLoading={isResolvingProductLinks} manualProductUrl={manualProductUrl} isResolvingManualUrl={isResolvingManualUrl} onManualProductUrlChange={setManualProductUrl} onAddManualProductUrl={handleAddManualProductUrl} /><RakutenMarketFind candidate={result.candidate} key={result.candidate.name} /></> : <p className="workspace-evidence-pending">判断後に、参考リンク・画像・URL・外部サービスの状態を確認できます。</p>}</div>
        </section>

        <aside className="workspace-panel workspace-user-panel" aria-labelledby="workspace-user-title" data-mobile-step="5" id="mobile-step-5">
          <div className="workspace-panel-heading"><span>03 / FEEDBACK</span><h3 id="workspace-user-title">保存と評価</h3><p>{authState.status === "guest" ? "診断下書きはこのタブに一時保存しますが、個人履歴には保存しません。" : "ログインユーザーはプロフィール、診断回数、推薦への評価を保存できます。"}</p></div>
          <div className="workspace-user-summary"><span>現在のユーザー</span><strong>{currentUser ? currentUser.profile.displayName : authState.status === "guest" ? "ゲスト" : "未登録"}</strong></div>
          {result ? <div className="workspace-feedback-form"><span>この判断は役に立ちましたか？</span><div className="workspace-feedback-evaluation" role="group" aria-label="推薦への評価">{([['good','役に立った'],['neutral','どちらとも言えない'],['bad','改善してほしい']] as const).map(([value,label]) => <button aria-pressed={feedbackEvaluation === value} data-selected={feedbackEvaluation === value} key={value} onClick={() => setFeedbackEvaluation(value)} type="button">{label}</button>)}</div><label>理由メモ<textarea maxLength={500} onChange={(event) => setFeedbackComment(event.target.value)} value={feedbackComment} /></label><button disabled={isSavingFeedback} onClick={handleSaveFeedback} type="button">{isSavingFeedback ? "保存中…" : authState.status === "guest" ? "この画面で評価する" : "評価を保存する"}</button>{feedbackSaved ? <small>反映しました。</small> : null}</div> : null}
          {authState.status === "guest" ? <div className="guest-upgrade-callout"><strong>ゲストは何回でも利用できます</strong><p>プロフィールや推薦への評価を残す場合はログインしてください。推薦結果そのものの保存には現在対応していません。</p><a href="/login">ログインへ</a></div> : null}
          {currentUser ? <section className="workspace-history" aria-labelledby="workspace-history-title"><div><span>Saved feedback</span><h4 id="workspace-history-title">保存済み評価履歴</h4></div>{currentUser.feedbackHistory.length ? <ul>{[...currentUser.feedbackHistory].reverse().slice(0, 4).map((item) => <li key={`${item.createdAt}:${item.sneakerName}`}><strong>{item.sneakerName}</strong><span>{decisionLabels[item.decision as keyof typeof decisionLabels] ?? item.decision} / {item.mode === "ryo" ? "Ryo" : "Balanced"}</span><small>{new Date(item.createdAt).toLocaleDateString("ja-JP")}・評価 {item.userRating}/5</small></li>)}</ul> : <p className="workspace-history-empty">まだ保存された評価はありません。結果への評価を送信すると、ここに表示されます。</p>}</section> : null}
        </aside>
      </div>
    </section>
  );
}

function formatFileSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

async function createDemoSneakerFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  context.fillStyle = "#f5f1e9"; context.fillRect(0, 0, 640, 400);
  context.beginPath(); context.moveTo(105, 275); context.lineTo(172, 245); context.lineTo(238, 145); context.lineTo(350, 165); context.lineTo(410, 235); context.lineTo(535, 270); context.lineTo(555, 305); context.lineTo(110, 305); context.closePath();
  context.fillStyle = "#5b2b2b"; context.fill(); context.lineWidth = 7; context.strokeStyle = "#1f242b"; context.stroke();
  context.fillStyle = "#f3e4ca"; context.fillRect(112, 286, 438, 31); context.strokeRect(112, 286, 438, 31);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("PNG_ENCODE_FAILED")), "image/png"));
  return new File([blob], "sole-matrix-demo-sneaker.png", { type: "image/png" });
}
