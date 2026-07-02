"use client";

import { useEffect, useRef, useState } from "react";
import type { DiagnosisAnswerId } from "../_data/preferenceDiagnosisQuestions";
import type { FeedbackSentiment, PreferenceVector, RecommendationResult } from "../_lib/core-v1/types";
import { resolveRecommendationProductLinks } from "../_lib/apiClient";
import type { LiveProductUrl } from "../_lib/product-links/types";
import { ProductReferenceLinks } from "./ProductReferenceLinks";
import { createLatestRequestGate } from "./productLinkResolution";

type Props = {
  disabled?: boolean;
  onRecommendationComplete?: (() => void) | undefined;
  selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined>;
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
  strong_buy: "STRONG BUY",
  consider: "CONSIDER",
  wait: "WAIT",
  avoid: "AVOID",
  unknown: "UNKNOWN",
};

export function CoreV1RecommendationPanel({ onRecommendationComplete, selectedAnswerByQuestionId }: Props) {
  const [budgetText, setBudgetText] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [productLinks, setProductLinks] = useState<LiveProductUrl[]>([]);
  const [productLinksMessage, setProductLinksMessage] = useState("推薦後に具体モデル名から参考リンクを作成します。");
  const [isResolvingProductLinks, setIsResolvingProductLinks] = useState(false);
  const gateRef = useRef(createLatestRequestGate());
  useEffect(() => () => gateRef.current.invalidate(), []);

  async function handleRecommend() {
    const budgetYen = normalizeBudget(budgetText);
    if (budgetYen === null) { setErrorMessage("予算は1円以上の整数で入力してください。"); return; }
    setIsLoading(true);
    setErrorMessage("");
    setResult(null);
    setProductLinks([]);
    setFeedbackState("idle");
    gateRef.current.invalidate();
    try {
      const response = await fetch("/api/core-v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisAnswers: selectedAnswerByQuestionId,
          preferenceTags: [],
          mode: "balanced",
          ...(budgetYen === undefined ? {} : { budgetYen }),
        }),
      });
      const payload = await response.json() as RecommendApiResponse;
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? "推薦結果を取得できませんでした。" : payload.error.message);
        return;
      }
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
        productName: recommendation.candidate.name,
        directUrls: [
          ...(recommendation.candidate.evidenceUrls ?? []).map((href) => ({ href, source: "marketplace" as const })),
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
      const response = await fetch("/api/core-v1/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recommendationId: result.recommendationId, sentiment, ...(feedbackComment.trim() ? { comment: feedbackComment.trim() } : {}) }) });
      setFeedbackState(response.ok ? "saved" : "error");
    } catch { setFeedbackState("error"); }
  }

  return (
    <section className="core-v1-panel" aria-labelledby="core-v1-recommendation-title">
      <div className="core-v1-panel-heading"><p className="diagnosis-summary-kicker">Recommendation</p><h3 id="core-v1-recommendation-title">具体的なおすすめモデルを見る</h3><p>Gemini候補はschema・抽象名・参考URLを検証し、Coreが再スコアリングします。失敗時は具体モデルのfallback catalogを使います。</p></div>
      <label className="core-v1-budget-field"><span>予算（任意・円）</span><input inputMode="numeric" min="1" onChange={(event) => setBudgetText(event.target.value)} placeholder="例: 20000" type="number" value={budgetText} /><small>価格・在庫を保証するものではなく、Core内の予算適合度の参考にだけ使います。</small></label>
      <button className="diagnosis-primary-button core-v1-submit" disabled={isLoading} onClick={handleRecommend} type="button">{isLoading ? "候補を検証・再評価しています…" : "推薦結果を見る"}</button>
      {errorMessage ? <p className="core-v1-error" role="alert">{errorMessage}</p> : null}
      {!result && !isLoading && !errorMessage ? <p className="core-v1-empty">予算は空欄でも推薦できます。</p> : null}

      {result ? <div className="core-v1-result">
        <div className="core-v1-result-heading"><div><p className="diagnosis-summary-kicker">おすすめ</p><h4>{result.candidate.name}</h4>{result.candidate.modelType ? <p>タイプ: {result.candidate.modelType}</p> : null}<p>{result.candidate.description}</p></div><strong data-decision={result.decision}>{decisionLabels[result.decision]}</strong></div>
        <p className="core-v1-decision-note">最終DecisionはBalanced / Ryo score、budgetFit、リスク、情報充足度を使ってCoreが決定します。GeminiやURLは上書きできません。</p>
        <p className="core-v1-local-notice" data-source={result.candidate.researchSource}>{result.candidateResearch.detail}</p>
        <ProductReferenceLinks isLoading={isResolvingProductLinks} links={productLinks} message={productLinksMessage} />
        <div className="core-v1-score-grid"><ScoreCard label="Balanced Score" description="汎用性・予算・情報の確かさを含む一般向け評価" value={result.balancedScore.total} /><ScoreCard label="Ryo Score" description="カルチャーやスタイルの好みを含む評価" value={result.ryoScore.total} /></div>
        <section className="core-v1-explanation" aria-labelledby="core-v1-explanation-title"><p className="diagnosis-summary-kicker">Explanation</p><h4 id="core-v1-explanation-title">判断の理由</h4><p>{result.explanation.summary}</p><p className="core-v1-provider-note">{result.readiness.geminiExplanation.detail}</p><div className="core-v1-explanation-columns"><ExplanationList title="理由" items={result.explanation.reasons} /><ExplanationList title="注意点" items={result.explanation.cautions} /></div></section>
        <section className="core-v1-vector" aria-labelledby="core-v1-vector-title"><p className="diagnosis-summary-kicker">PreferenceVector</p><h4 id="core-v1-vector-title">診断ベクトル</h4><dl>{(Object.keys(vectorLabels) as (keyof PreferenceVector)[]).map((axis) => <div key={axis}><dt>{vectorLabels[axis]}</dt><dd>{result.preferenceVector[axis]}</dd></div>)}</dl></section>
        <section className="core-v1-readiness" aria-labelledby="core-v1-readiness-title"><p className="diagnosis-summary-kicker">Readiness</p><h4 id="core-v1-readiness-title">外部APIの状態</h4><div><strong data-status={result.readiness.geminiResearch.status}>Gemini候補調査: {result.readiness.geminiResearch.status}</strong><p>{result.readiness.geminiResearch.detail}</p></div><div><strong data-status={result.readiness.geminiExplanation.status}>Gemini補助説明: {result.readiness.geminiExplanation.status}</strong><p>{result.readiness.geminiExplanation.detail}</p></div><div><strong data-status={result.readiness.rakuten.status}>Rakuten: {result.readiness.rakuten.status}</strong><p>{result.readiness.rakuten.detail}</p></div></section>
        <section className="core-v1-feedback" aria-labelledby="core-v1-feedback-title"><p className="diagnosis-summary-kicker">Feedback</p><h4 id="core-v1-feedback-title">この結果は役に立ちましたか？</h4><textarea maxLength={500} onChange={(event) => setFeedbackComment(event.target.value)} placeholder="任意のコメント" value={feedbackComment} /><div><button onClick={() => handleFeedback("helpful")} type="button">役に立った</button><button onClick={() => handleFeedback("unsure")} type="button">まだ分からない</button><button onClick={() => handleFeedback("not_helpful")} type="button">改善してほしい</button></div><p aria-live="polite">{feedbackState === "saving" ? "保存中…" : feedbackState === "saved" ? "フィードバックを保存しました。" : feedbackState === "error" ? "保存できませんでした。" : null}</p></section>
      </div> : null}
    </section>
  );
}

function ScoreCard({ label, description, value }: { label: string; description: string; value: number }) {
  return <div className="core-v1-score-card"><span>{label}</span><strong>{value}</strong><meter max="100" min="0" value={value} /><small>{description}</small></div>;
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  return <div><h5>{title}</h5><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function normalizeBudget(value: string): number | null | undefined {
  if (!value.trim()) return undefined;
  const budget = Number(value);
  return Number.isInteger(budget) && budget > 0 ? budget : null;
}
