"use client";

import { useState } from "react";

import type { DiagnosisAnswerId } from "../_data/preferenceDiagnosisQuestions";
import type {
  FeedbackSentiment,
  PreferenceVector,
  RecommendationResult,
} from "../_lib/core-v1/types";

type CoreV1RecommendationPanelProps = {
  selectedAnswerByQuestionId: Record<
    string,
    DiagnosisAnswerId | undefined
  >;
};

type ApiError = {
  code: string;
  message: string;
  field?: string;
};

type RecommendApiResponse =
  | { ok: true; data: RecommendationResult }
  | { ok: false; error: ApiError };

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

export function CoreV1RecommendationPanel({
  selectedAnswerByQuestionId,
}: CoreV1RecommendationPanelProps) {
  const [budgetText, setBudgetText] = useState("");
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackState, setFeedbackState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  async function handleRecommend() {
    const budgetYen = normalizeBudget(budgetText);

    if (budgetYen === null) {
      setErrorMessage("予算は1円以上の整数で入力してください。");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setFeedbackState("idle");

    try {
      const response = await fetch("/api/core-v1/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosisAnswers: selectedAnswerByQuestionId,
          ...(budgetYen === undefined ? {} : { budgetYen }),
        }),
      });
      const payload = (await response.json()) as RecommendApiResponse;

      if (!response.ok || !payload.ok) {
        setResult(null);
        setErrorMessage(
          payload.ok
            ? "推薦結果を取得できませんでした。"
            : payload.error.message,
        );
        return;
      }

      setResult(payload.data);
    } catch {
      setResult(null);
      setErrorMessage(
        "推薦APIに接続できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFeedback(sentiment: FeedbackSentiment) {
    if (!result || feedbackState === "saving") {
      return;
    }

    setFeedbackState("saving");

    try {
      const response = await fetch("/api/core-v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: result.recommendationId,
          sentiment,
          ...(feedbackComment.trim()
            ? { comment: feedbackComment.trim() }
            : {}),
        }),
      });

      setFeedbackState(response.ok ? "saved" : "error");
    } catch {
      setFeedbackState("error");
    }
  }

  return (
    <section
      aria-labelledby="core-v1-recommendation-title"
      className="core-v1-panel"
    >
      <div className="core-v1-panel-heading">
        <p className="diagnosis-summary-kicker">Core v1</p>
        <h3 id="core-v1-recommendation-title">診断から推薦結果を作る</h3>
        <p>
          回答を8軸のPreferenceVectorへ変換し、候補との相性を二つの視点で比較します。
          スコアと最終判定は、外部AIではなくCore v1の決定論的なルールが確定します。
        </p>
      </div>

      <label className="core-v1-budget-field">
        <span>予算（任意・円）</span>
        <input
          inputMode="numeric"
          min="1"
          onChange={(event) => setBudgetText(event.target.value)}
          placeholder="例: 20000"
          type="number"
          value={budgetText}
        />
        <small>
          ローカル候補では価格帯との相対評価に、検証済みの商品価格がある場合は予算適合度の補助に使います。
        </small>
      </label>

      <button
        className="diagnosis-primary-button core-v1-submit"
        disabled={isLoading}
        onClick={handleRecommend}
        type="button"
      >
        {isLoading ? "候補を比較しています…" : "推薦結果を見る"}
      </button>

      {isLoading ? (
        <p className="core-v1-status" role="status">
          診断ベクトルを作成し、利用可能な候補を安全に比較しています。
        </p>
      ) : null}

      {errorMessage ? (
        <p className="core-v1-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {!result && !isLoading && !errorMessage ? (
        <p className="core-v1-empty">
          推薦結果はまだありません。予算は空欄のままでも判定できます。
        </p>
      ) : null}

      {result ? (
        <div className="core-v1-result" aria-live="polite">
          <div className="core-v1-result-header">
            <div>
              <p className="diagnosis-summary-kicker">Recommendation</p>
              <h4>{result.candidate.name}</h4>
              <p>{result.candidate.description}</p>
            </div>
            <strong data-decision={result.decision}>
              {decisionLabels[result.decision]}
            </strong>
          </div>

          <p className="core-v1-decision-note">
            Decisionは、二つのスコアに予算適合度・リスク・情報の揃い方を加えてCore v1が決定したものです。
          </p>

          <p className="core-v1-local-notice">
            外部検索結果ではなく、診断結果または入力内容をもとにした仮候補です。
          </p>

          <div className="core-v1-score-grid">
            <ScoreCard
              label="Balanced Score"
              description="合わせやすさ・予算・情報の確かさを含む、一般的な勧めやすさ"
              value={result.balancedScore.total}
            />
            <ScoreCard
              label="Ryo Score"
              description="カルチャーやスタイルの好みを含む、あなたらしい納得感"
              value={result.ryoScore.total}
            />
          </div>

          <section
            className="core-v1-explanation"
            aria-labelledby="core-v1-explanation-title"
          >
            <p className="diagnosis-summary-kicker">Explanation</p>
            <h4 id="core-v1-explanation-title">判定の理由</h4>
            <p>{result.explanation.summary}</p>
            <p className="core-v1-provider-note">
              {result.explanation.source === "gemini"
                ? "AI補助による説明を表示しています。"
                : "AI補助が利用できないため、ルールベースで説明しています。"}
            </p>
            <div className="core-v1-explanation-columns">
              <ExplanationList
                items={result.explanation.reasons}
                title="理由"
              />
              <ExplanationList
                items={result.explanation.cautions}
                title="注意点"
              />
            </div>
            <p>{result.explanation.balancedView}</p>
            <p>{result.explanation.ryoView}</p>
          </section>

          <section
            className="core-v1-vector"
            aria-labelledby="core-v1-vector-title"
          >
            <p className="diagnosis-summary-kicker">PreferenceVector</p>
            <h4 id="core-v1-vector-title">診断ベクトル</h4>
            <dl>
              {(Object.keys(vectorLabels) as (keyof PreferenceVector)[]).map(
                (axis) => (
                  <div key={axis}>
                    <dt>{vectorLabels[axis]}</dt>
                    <dd>{result.preferenceVector[axis]}</dd>
                  </div>
                ),
              )}
            </dl>
          </section>

          <section
            className="core-v1-readiness"
            aria-labelledby="core-v1-readiness-title"
          >
            <p className="diagnosis-summary-kicker">Readiness</p>
            <h4 id="core-v1-readiness-title">外部APIの状態</h4>
            <div>
              <strong>Gemini: {result.readiness.gemini.status}</strong>
              <p>{result.readiness.gemini.detail}</p>
            </div>
            <div>
              <strong>Rakuten: {result.readiness.rakuten.status}</strong>
              <p>{result.readiness.rakuten.detail}</p>
              <p>
                楽天APIは現在利用できないため、外部商品データではなく、診断結果とローカル/仮候補をもとに判定しています。
              </p>
            </div>
          </section>

          <section
            className="core-v1-feedback"
            aria-labelledby="core-v1-feedback-title"
          >
            <p className="diagnosis-summary-kicker">Feedback skeleton</p>
            <h4 id="core-v1-feedback-title">この結果は役に立ちましたか？</h4>
            <textarea
              maxLength={500}
              onChange={(event) => setFeedbackComment(event.target.value)}
              placeholder="任意のコメント"
              value={feedbackComment}
            />
            <div>
              <button onClick={() => handleFeedback("helpful")} type="button">
                役に立った
              </button>
              <button onClick={() => handleFeedback("unsure")} type="button">
                まだ分からない
              </button>
              <button
                onClick={() => handleFeedback("not_helpful")}
                type="button"
              >
                改善してほしい
              </button>
            </div>
            <p aria-live="polite">
              {feedbackState === "saving" ? "保存中…" : null}
              {feedbackState === "saved"
                ? "フィードバックをこのセッションのmock repositoryへ保存しました。"
                : null}
              {feedbackState === "error"
                ? "フィードバックを保存できませんでした。"
                : null}
            </p>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ScoreCard({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: number;
}) {
  return (
    <div className="core-v1-score-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <meter max="100" min="0" value={value} />
      <small>{description}</small>
    </div>
  );
}

function ExplanationList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5>{title}</h5>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function normalizeBudget(value: string): number | null | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const budget = Number(value);

  return Number.isInteger(budget) && budget > 0 ? budget : null;
}
