"use client";

import { useMemo, useState } from "react";

import {
  type DiagnosisAnswerId,
  preferenceDiagnosisQuestions,
} from "../_data/preferenceDiagnosisQuestions";
import {
  analyzeSneaker as analyzeSneakerApi,
  getUserProfile,
  registerUser as registerUserApi,
  saveUserFeedback,
  searchRecommendations,
} from "../_lib/apiClient";
import type { IntegratedRecommendationResult } from "../_lib/integrated-recommendation/types";
import type { UserMemorySummary } from "../_lib/user-memory/types";

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

export function RecommendationWorkspace() {
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DiagnosisAnswerId>>({});
  const [result, setResult] = useState<IntegratedRecommendationResult | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState(
    "候補情報と8問診断を入力してください。画像とURLは任意です。",
  );

  const selectedMode = workspaceModes.find((item) => item.id === mode)!;
  const currentQuestion = preferenceDiagnosisQuestions[currentQuestionIndex]!;
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

  async function handleRecommend() {
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
    setResult(null);
    setWorkspaceStatus("URLと画像を安全に分析しています…");
    try {
      const analysisResponse = await analyzeSneakerApi({
        ...(sneakerName.trim() ? { sneakerName: sneakerName.trim() } : {}),
        ...(productUrl.trim() ? { url: productUrl.trim() } : {}),
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
        preferenceTags: [],
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
    if (!currentUser || !result) {
      setWorkspaceStatus("feedbackを保存するにはユーザー登録と推薦実行が必要です。");
      return;
    }
    setIsSavingFeedback(true);
    try {
      const payload = await saveUserFeedback(currentUser.profile.userId, {
        sneakerName:
          result.analysis.sneakerName ??
          result.analysis.urlAnalysis?.extractedNameHint ??
          result.candidate.name,
        mode: result.modeRecommendation.mode,
        decision: result.modeRecommendation.decision,
        balancedScore: result.modeRecommendation.balancedScore,
        ryoScore: result.modeRecommendation.ryoScore,
        userRating: feedbackRating,
        userComment: feedbackComment,
      });
      if (!payload.ok) {
        setWorkspaceStatus(payload.error.message);
        return;
      }
      setCurrentUser(payload.data);
      setFeedbackComment("");
      setWorkspaceStatus("feedbackをmemory.mdへ保存しました。");
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
                setResult(null);
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

      <div className="workspace-grid">
        <section aria-labelledby="workspace-input-title" className="workspace-panel workspace-input-panel">
          <div className="workspace-panel-heading">
            <span>01 / INPUT</span>
            <h3 id="workspace-input-title">入力エリア</h3>
            <p>診断と候補情報を、無理のない順番で集めます。</p>
          </div>

          <div className="diagnosis-entry-row">
            <div><strong>8問診断</strong><span>好みをPreferenceVectorへ変換</span></div>
            <span className="workspace-chip">{answeredCount} / 8</span>
          </div>

          <div className="workspace-diagnosis-card">
            <div className="workspace-question-meta">
              <span>Q{currentQuestionIndex + 1}</span>
              <strong>{currentQuestionIndex + 1} / 8</strong>
            </div>
            <p>{currentQuestion.question}</p>
            <small>{currentQuestion.helperText}</small>
            <div className="workspace-answer-buttons" role="group" aria-label={`${currentQuestion.question}への回答`}>
              {currentQuestion.options.map((option) => (
                <button
                  aria-pressed={answers[currentQuestion.id] === option.id}
                  data-selected={answers[currentQuestion.id] === option.id}
                  key={option.id}
                  onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: option.id }))}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="workspace-question-nav">
              <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))} type="button">前へ</button>
              <button disabled={currentQuestionIndex === 7} onClick={() => setCurrentQuestionIndex((index) => Math.min(7, index + 1))} type="button">次へ</button>
            </div>
          </div>

          <div className="workspace-fields">
            <label><span>スニーカー名</span><input onChange={(event) => setSneakerName(event.target.value)} placeholder="例: adidas Samba OG" type="text" value={sneakerName} /></label>
            <label><span>商品URL</span><input inputMode="url" onChange={(event) => setProductUrl(event.target.value)} placeholder="https://example.com/item" type="url" value={productUrl} /><small>server-sideでprivate IPと危険schemeを遮断します。</small></label>
            <div className="workspace-image-field">
              <label><span>画像アップロード</span><input accept="image/jpeg,image/png,image/webp" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /><small>{imageFile ? `${imageFile.name} / ${formatFileSize(imageFile.size)}` : "JPEG / PNG / WebP・5MBまで"}</small></label>
              <button onClick={handleUseDemoImage} type="button">サンプル画像を使う</button>
            </div>
            <label><span>予算</span><input inputMode="numeric" min="1" onChange={(event) => setBudgetText(event.target.value)} placeholder="例: 20000" type="number" value={budgetText} /></label>
          </div>

          <button className="workspace-primary-button" disabled={isAnalyzing} onClick={handleRecommend} type="button">
            {isAnalyzing ? "分析・推薦中…" : "分析して推薦を実行する"}
          </button>
        </section>

        <section aria-labelledby="workspace-result-title" className="workspace-panel workspace-result-panel">
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

          <div className="workspace-provider-readiness">
            <span>Provider readiness</span>
            <div><strong>Rakuten</strong><em data-status={result?.readiness.rakuten.status ?? "not_checked"}>{result?.readiness.rakuten.status ?? "診断実行後に確認"}</em></div>
            <div><strong>Gemini</strong><em data-status={result?.readiness.gemini.status ?? "not_checked"}>{result ? `${result.readiness.gemini.status} / ${result.explanation.source}` : "補助分析のみ"}</em></div>
          </div>
        </section>

        <aside aria-labelledby="workspace-user-title" className="workspace-panel workspace-user-panel">
          <div className="workspace-panel-heading"><span>03 / USER</span><h3 id="workspace-user-title">ユーザー情報</h3><p>好みと判断履歴を、ユーザーごとに育てます。</p></div>
          <div className="workspace-fields workspace-user-fields">
            <label><span>ユーザーID</span><input autoComplete="username" onChange={(event) => setUserId(event.target.value)} placeholder="ryo_01" type="text" value={userId} /></label>
            <label><span>表示名</span><input autoComplete="name" onChange={(event) => setDisplayName(event.target.value)} placeholder="Ryo" type="text" value={displayName} /></label>
          </div>
          <button className="workspace-secondary-button" disabled={isRegistering} onClick={handleRegisterUser} type="button">{isRegistering ? "登録中…" : "ユーザーを登録する"}</button>

          <div className="workspace-user-summary"><span>現在のユーザー</span><strong>{currentUser ? `${currentUser.profile.displayName} / ${currentUser.profile.userId}` : "未登録"}</strong></div>
          <div className="workspace-memory-preview">
            <div><span>Diagnosis history</span><strong>{currentUser ? currentUser.diagnosisHistoryCount : 0} notes</strong></div>
            <div><span>Feedback history</span><strong>{currentUser ? currentUser.feedbackHistory.length : 0} items</strong></div>
          </div>

          {result ? (
            <div className="workspace-feedback-form">
              <span>この推薦をmemory.mdへ記録</span>
              <label>評価（1〜5）<input max="5" min="1" onChange={(event) => setFeedbackRating(Number(event.target.value))} type="number" value={feedbackRating} /></label>
              <label>コメント<textarea maxLength={500} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="履いた場面や迷った理由" value={feedbackComment} /></label>
              <button disabled={isSavingFeedback || !currentUser} onClick={handleSaveFeedback} type="button">{isSavingFeedback ? "保存中…" : "feedbackを保存する"}</button>
              {!currentUser ? <small>先にユーザー登録してください。</small> : null}
            </div>
          ) : null}

          <div className="workspace-mode-note" data-mode={mode}><span>{selectedMode.label}</span><p>{selectedMode.description}</p>{mode === "ryo" ? <small>実所有41足 / wishlist 40候補のseed v2を参照</small> : null}</div>
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
