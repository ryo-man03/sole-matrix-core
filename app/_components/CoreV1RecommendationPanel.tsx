"use client";

import { useEffect, useRef, useState } from "react";
import type { DiagnosisAnswerId } from "../_data/preferenceDiagnosisQuestions";
import type { CandidateResearchSource, FeedbackSentiment, PreferenceVector, RecommendationResult } from "../_lib/core-v1/types";
import type { UserSneakerContext } from "../_lib/diagnosis/sneakerContext";
import { buildRyoModeCandidateEvaluation, buildRyoModeContextForRecommendation } from "../_lib/ryo-mode-v4/integration";
import { createRecommendationFeedbackId, saveRecommendationFeedback, type RecommendationFeedbackUsefulness } from "../_lib/recommendation-feedback/localStorage";
import type { RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";
import { resolveRecommendationProductLinks } from "../_lib/apiClient";
import type { LiveProductUrl } from "../_lib/product-links/types";
import { ProductReferenceLinks } from "./ProductReferenceLinks";
import { RakutenMarketFind } from "./RakutenMarketFind";
import { RyoModeResultPanel } from "./RyoModeResultPanel";
import { RyoScoreBreakdown, VerifiedCandidateResult } from "./VerifiedCandidateResult";
import { createLatestRequestGate } from "./productLinkResolution";

type Props = {
  disabled?: boolean;
  onRecommendationComplete?: (() => void) | undefined;
  selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined>;
  ryoPreferenceVector: RyoPreferenceVector;
  userSneakerContext: UserSneakerContext;
};

type RecommendApiResponse =
  | { ok: true; data: RecommendationResult }
  | { ok: false; error: { code: string; message: string; field?: string } };

const vectorLabels: Record<keyof PreferenceVector, string> = {
  culture: "カルチャー",
  styleFit: "スタイル適合",
  simplicity: "シンプルさ",
  street: "ストリート",
  volume: "ボリューム",
  comfort: "快適性",
  durability: "耐久性",
  priceLevel: "価格帯の志向",
};

const decisionLabels: Record<RecommendationResult["decision"], string> = {
  strong_buy: "強くおすすめ",
  consider: "おすすめ候補",
  wait: "いったん待つ",
  avoid: "今回は見送る",
  unknown: "判断保留",
};

const recommendationSourceLabels: Record<RecommendationResult["candidateResearch"]["source"], string> = {
  gemini: "Gemini調査",
  fallback_catalog: "Core候補",
  product_input: "入力商品",
};

const candidateSourceLabels: Record<CandidateResearchSource, string> = {
  gemini: "Gemini確認候補",
  fallback_catalog: "Core候補",
  product_input: "入力商品",
  ryo_anchor: "Core候補（Ryo anchor）",
};

export function CoreV1RecommendationPanel({ onRecommendationComplete, ryoPreferenceVector, selectedAnswerByQuestionId, userSneakerContext }: Props) {
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "saving" | "saved" | "needs_usefulness" | "error">("idle");
  const [feedbackSummary, setFeedbackSummary] = useState("");
  const [feedbackSavedAt, setFeedbackSavedAt] = useState("");
  const [productLinks, setProductLinks] = useState<LiveProductUrl[]>([]);
  const [productLinksMessage, setProductLinksMessage] = useState("推薦後に具体モデル名から参考リンクを作成します。");
  const [isResolvingProductLinks, setIsResolvingProductLinks] = useState(false);
  const gateRef = useRef(createLatestRequestGate());
  useEffect(() => () => gateRef.current.invalidate(), []);

  async function handleRecommend() {
    const ryoContext = buildRyoModeContextForRecommendation(selectedAnswerByQuestionId);
    setIsLoading(true);
    setErrorMessage("");
    setFeedbackState("idle");
    gateRef.current.invalidate();
    try {
      const response = await fetch("/api/core-v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisAnswers: ryoContext.diagnosisAnswers,
          preferenceTags: ryoContext.preferenceTags,
          ryoModeAnswers: ryoContext.answers,
          purchasePurpose: userSneakerContext.purchasePurpose,
          ownedModels: userSneakerContext.ownedModels,
          dislikedModels: userSneakerContext.dislikedModels,
          dislikedSignals: userSneakerContext.dislikedSignals,
          mode: ryoContext.mode,
          ...(ryoContext.budgetYen === undefined ? {} : { budgetYen: ryoContext.budgetYen }),
        }),
      });
      const payload = await response.json() as RecommendApiResponse;
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? "推薦結果を取得できませんでした。" : payload.error.message);
        return;
      }
      setProductLinks([]);
      setResult(payload.data);
      onRecommendationComplete?.();
      void loadProductLinks(payload.data);
    } catch {
      setErrorMessage("推薦APIに接続できませんでした。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProductLinks(recommendation: RecommendationResult) {
    const requestId = gateRef.current.beginRequest();
    setIsResolvingProductLinks(true);
    try {
      const response = await resolveRecommendationProductLinks({
        productName: recommendation.candidate.modelName ?? recommendation.candidate.name,
        directUrls: [
          ...(recommendation.candidate.evidenceLinks ?? [])
            .filter((link) => link.type !== "search_entry_url")
            .map((link) => ({ href: link.url, source: link.type === "gemini_citation_url" ? "marketplace" as const : "retailer" as const })),
          ...(recommendation.candidate.url ? [{ href: recommendation.candidate.url, source: recommendation.candidate.source === "rakuten" ? "rakuten" as const : "retailer" as const }] : []),
        ].slice(0, 6),
      });
      if (!gateRef.current.isCurrent(requestId)) return;
      if (!response.ok) { setProductLinksMessage(response.error.message); return; }
      setProductLinks(response.data.links);
      setProductLinksMessage(response.data.message);
    } finally {
      if (gateRef.current.isCurrent(requestId)) setIsResolvingProductLinks(false);
    }
  }

  async function handleFeedback(sentiment: FeedbackSentiment) {
    if (!result || feedbackState === "saving") return;
    setFeedbackState("saving");
    try {
      const now = new Date();
      const evaluation = buildRyoModeCandidateEvaluation(ryoPreferenceVector, result.candidate);
      const usefulness: RecommendationFeedbackUsefulness = sentiment === "not_helpful" ? "needs_improvement" : sentiment;
      saveRecommendationFeedback(window.localStorage, {
        id: createRecommendationFeedbackId(now),
        createdAt: now.toISOString(),
        resultModelName: result.candidate.modelName ?? result.candidate.name,
        decision: result.decision,
        usefulness,
        comment: feedbackComment.trim(),
        ryoMode: {
          ...(evaluation.culture.metadata.templateIds ? { templates: evaluation.culture.metadata.templateIds } : {}),
          ...(evaluation.culture.metadata.parentModelIds ? { parentModels: evaluation.culture.metadata.parentModelIds } : {}),
          ...(evaluation.culture.metadata.retroRunningProfiles ? { retroRunningProfiles: evaluation.culture.metadata.retroRunningProfiles } : {}),
          productScore: evaluation.score.productScore,
          recommendationScore: evaluation.score.recommendationScore,
          totalRyoScore: evaluation.score.totalRyoScore,
          topSignals: evaluation.score.matchedSignals.slice(0, 5),
        },
        readiness: {
          candidateResearch: result.readiness.geminiResearch.status,
          grounding: result.candidateResearch.stages.grounding.status,
          jsonSchema: result.candidateResearch.stages.normalization.status,
          explanation: result.readiness.geminiExplanation.status,
          source: result.candidate.researchSource ?? result.candidateResearch.source,
        },
      });
      setFeedbackSummary(`${sentimentLabel(sentiment)} / ${feedbackComment.trim() ? "コメントあり" : "コメントなし"}`);
      setFeedbackSavedAt(now.toLocaleString("ja-JP"));
      setFeedbackState("saved");
      void fetch("/api/core-v1/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recommendationId: result.recommendationId, sentiment, ...(feedbackComment.trim() ? { comment: feedbackComment.trim() } : {}) }) }).catch(() => undefined);
    } catch { setFeedbackState("error"); }
  }

  function handleCommentOnlySave() {
    setFeedbackState("needs_usefulness");
  }

  return (
    <section className="core-v1-panel" aria-labelledby="core-v1-recommendation-title">
      <div className="core-v1-panel-heading"><p className="diagnosis-summary-kicker">Recommendation</p><h3 id="core-v1-recommendation-title">具体的なおすすめモデルを見る</h3><p>Gemini候補はモデル名・カラー名・根拠URLを分けて確認し、Coreが再スコアリングします。外部調査に失敗してもCore候補で結果を返します。</p></div>
      <p className="core-v1-provider-note">Q9で選んだ予算をCoreの候補選定とRyo Mode補助評価へ反映します。価格・在庫・購入可能性は保証しません。</p>
      <button className="diagnosis-primary-button core-v1-submit" disabled={isLoading} onClick={handleRecommend} type="button">{isLoading ? "候補を検証・再評価しています…" : "推薦結果を見る"}</button>
      {isLoading ? <div className="core-v1-loading-state" role="status" aria-live="polite"><strong>推薦記録を組み立てています</strong><span>候補を比較</span><span>Coreで再評価</span><span>理由と注意点を整理</span></div> : null}
      {errorMessage ? <p className="core-v1-error" role="alert">{errorMessage}</p> : null}
      {result && errorMessage ? <p className="core-v1-retained-result" data-retained-result>前回の成功結果を表示中です。再取得に失敗しても、評価とフィードバックの対象はこの結果のままです。</p> : null}
      {!result && !isLoading && !errorMessage ? <p className="core-v1-empty">11問の回答を使って推薦候補を検証します。</p> : null}

      {result ? <div className="core-v1-result">
        <VerifiedCandidateResult candidate={result.candidate} decisionLabel={decisionLabels[result.decision]} />
        <section className="core-v1-explanation" aria-labelledby="core-v1-explanation-title">
          <p className="diagnosis-summary-kicker">Why this pair</p>
          <h4 id="core-v1-explanation-title">この一足を選んだ理由</h4>
          <p>{result.explanation.summary}</p>
          <div className="core-v1-explanation-columns">
            <ExplanationList title="回答との主な一致" items={result.explanation.reasons.slice(0, 3)} />
            {result.explanation.cautions.length ? <ExplanationList caution title="注意点" items={result.explanation.cautions.slice(0, 3)} /> : null}
          </div>
          {result.explanation.reasons.length > 3 ? <details className="result-detail-accordion"><summary>補足理由を見る</summary><ExplanationList title="補足理由" items={result.explanation.reasons.slice(3)} /></details> : null}
        </section>
        <p className="core-v1-decision-note">最終DecisionはBalanced / Ryo score、budgetFit、リスク、情報充足度を使ってCoreが決定します。GeminiやURLは上書きできません。</p>
        <RyoScoreBreakdown result={result} />
        <details className="result-detail-accordion"><summary>候補の出所と参考リンクを見る</summary><div className="core-v1-supporting-details"><p className="core-v1-local-notice" data-source={result.candidate.researchSource}>{result.candidateResearch.detail}</p><p className="core-v1-provider-note" data-recommendation-source={result.candidateResearch.source}>候補調査: {recommendationSourceLabels[result.candidateResearch.source]} / 選択候補元: {candidateSourceLabels[result.candidate.researchSource ?? "fallback_catalog"]}</p><p className="core-v1-provider-note" data-ryo-reranking={result.ryoReranking.applied ? "applied" : "not-applied"}>Ryo再ランキング: {result.ryoReranking.applied ? `適用済み（候補${result.ryoReranking.candidatePoolSize}足 / Core ${Math.round(result.ryoReranking.existingCoreWeight * 100)}% + recommendationScore ${Math.round(result.ryoReranking.recommendationWeight * 100)}% / 明示回答ガード ${result.ryoReranking.selectedExplicitPreferencePenalty > 0 ? `-${result.ryoReranking.selectedExplicitPreferencePenalty}` : "適合"}）` : "未適用"}</p><p className="core-v1-provider-note">参考リンク: {formatEvidenceKinds(result.candidate.evidenceLinks)}</p><ProductReferenceLinks isLoading={isResolvingProductLinks} links={productLinks} message={productLinksMessage} /></div></details>
        <details className="result-detail-accordion"><summary>Ryoらしい評価を詳しく見る</summary><RyoModeResultPanel candidate={result.candidate} rerankingApplied={result.ryoReranking.applied} vector={ryoPreferenceVector} /></details>
        <RakutenMarketFind candidate={result.candidate} key={result.recommendationId} />
        <details className="result-detail-accordion"><summary>診断ベクトルと外部API状態を見る</summary><section className="core-v1-vector" aria-labelledby="core-v1-vector-title"><p className="diagnosis-summary-kicker">PreferenceVector</p><h4 id="core-v1-vector-title">診断ベクトル</h4><dl>{(Object.keys(vectorLabels) as (keyof PreferenceVector)[]).map((axis) => <div key={axis}><dt>{vectorLabels[axis]}</dt><dd>{result.preferenceVector[axis]}</dd></div>)}</dl></section><section className="core-v1-readiness" aria-labelledby="core-v1-readiness-title"><p className="diagnosis-summary-kicker">Readiness</p><h4 id="core-v1-readiness-title">外部APIの状態</h4><div><strong data-status={result.readiness.geminiResearch.status}>Gemini候補調査: {result.readiness.geminiResearch.status}</strong><p>{result.readiness.geminiResearch.detail}</p></div><div><strong data-research-stage="grounding" data-status={result.candidateResearch.stages.grounding.status}>Google Search Grounding: {result.candidateResearch.stages.grounding.status}</strong><p>Grounding由来の引用URL: {result.candidateResearch.stages.grounding.evidenceUrlCount}件</p></div><div><strong data-research-stage="normalization" data-status={result.candidateResearch.stages.normalization.status}>JSON整形・schema検証: {result.candidateResearch.stages.normalization.status}</strong><p>検証済み候補: {result.candidateResearch.stages.normalization.candidateCount}件 / JSON repair: {result.candidateResearch.stages.normalization.repairAttempted ? "実行" : "未実行"}</p></div><div><strong data-status={result.readiness.geminiExplanation.status}>Gemini補助説明: {result.readiness.geminiExplanation.status}</strong><p>{result.readiness.geminiExplanation.detail}</p></div><div><strong data-status={result.readiness.rakuten.status}>Rakuten: {result.readiness.rakuten.status}</strong><p>{result.readiness.rakuten.detail}</p></div></section></details>
        <section className="core-v1-feedback" aria-labelledby="core-v1-feedback-title"><p className="diagnosis-summary-kicker">Feedback</p><h4 id="core-v1-feedback-title">この結果は役に立ちましたか？</h4><textarea maxLength={500} onChange={(event) => { setFeedbackComment(event.target.value); if (feedbackState !== "saving") setFeedbackState("idle"); }} placeholder="任意のコメント" value={feedbackComment} /><div><button onClick={() => handleFeedback("helpful")} type="button">役に立った</button><button onClick={() => handleFeedback("unsure")} type="button">まだ分からない</button><button onClick={() => handleFeedback("not_helpful")} type="button">改善してほしい</button><button onClick={handleCommentOnlySave} type="button">コメントを保存</button></div><p aria-live="polite">{feedbackState === "saving" ? "保存中…" : feedbackState === "saved" ? "フィードバックをこの端末に保存しました。" : feedbackState === "needs_usefulness" ? "評価ボタンを選んでください。" : feedbackState === "error" ? "フィードバックを保存できませんでした。もう一度試してください。" : null}</p>{feedbackState === "saved" && feedbackSummary ? <div data-feedback-saved-summary><p>保存した内容: {feedbackSummary}</p><p>保存日時: {feedbackSavedAt}</p></div> : null}</section>
      </div> : null}
    </section>
  );
}

function ExplanationList({ caution = false, title, items }: { caution?: boolean; title: string; items: string[] }) {
  return <div className={caution ? "core-v1-caution" : undefined}><h5>{title}</h5><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function formatEvidenceKinds(evidenceLinks: RecommendationResult["candidate"]["evidenceLinks"]): string {
  const types = new Set((evidenceLinks ?? []).map((link) => link.type));
  const labels = [
    types.has("gemini_citation_url") ? "引用URL" : null,
    types.has("direct_product_url") ? "直接商品URL" : null,
    types.has("search_entry_url") ? "検索入口" : null,
  ].filter((label): label is string => Boolean(label));
  return labels.length ? labels.join(" / ") : "検索入口";
}

function sentimentLabel(sentiment: FeedbackSentiment): string {
  return sentiment === "helpful" ? "役に立った" : sentiment === "unsure" ? "まだ分からない" : "改善してほしい";
}
