"use client";

import { useMemo, useState } from "react";

import type { DiagnosisAnswerId } from "../_data/preferenceDiagnosisQuestions";
import { preferenceDiagnosisQuestions } from "../_data/preferenceDiagnosisQuestions";

import { DiagnosisProgress } from "./DiagnosisProgress";
import { DiagnosisQuestionCard } from "./DiagnosisQuestionCard";
import { CoreV1RecommendationPanel } from "./CoreV1RecommendationPanel";
import { PreferenceDiagnosisSummary } from "./PreferenceDiagnosisSummary";

export function PreferenceDiagnosisFlow() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerByQuestionId, setSelectedAnswerByQuestionId] = useState<
    Record<string, DiagnosisAnswerId | undefined>
  >({});
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);

  const currentQuestion = preferenceDiagnosisQuestions[currentQuestionIndex]!;
  const selectedAnswerId = selectedAnswerByQuestionId[currentQuestion.id];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion =
    currentQuestionIndex === preferenceDiagnosisQuestions.length - 1;
  const answeredCount = useMemo(
    () =>
      preferenceDiagnosisQuestions.filter(
        (question) => selectedAnswerByQuestionId[question.id],
      ).length,
    [selectedAnswerByQuestionId],
  );

  function handleSelectAnswer(answerId: DiagnosisAnswerId) {
    setSelectedAnswerByQuestionId((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: answerId,
    }));
  }

  function handleBack() {
    if (isSummaryVisible) {
      setIsSummaryVisible(false);
      return;
    }

    setCurrentQuestionIndex((index) => Math.max(index - 1, 0));
  }

  function handleNext() {
    if (isLastQuestion) {
      setIsSummaryVisible(true);
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
  }

  return (
    <section
      id="core-v1"
      className="preference-diagnosis-section"
      aria-labelledby="preference-diagnosis-title"
    >
      <div className="diagnosis-intro">
        <p className="diagnosis-kicker">好み診断</p>
        <h2 id="preference-diagnosis-title">好みを8つの質問で整理する</h2>
        <p>
          好みの方向を確認したあと、Core v1が診断ベクトル・二つのスコア・Decisionを計算します。
        </p>
      </div>

      {!isSummaryVisible ? (
        <>
          <DiagnosisProgress
            currentIndex={currentQuestionIndex}
            totalCount={preferenceDiagnosisQuestions.length}
            answeredCount={answeredCount}
          />
          <DiagnosisQuestionCard
            currentIndex={currentQuestionIndex}
            totalCount={preferenceDiagnosisQuestions.length}
            question={currentQuestion}
            selectedAnswerId={selectedAnswerId}
            onSelectAnswer={handleSelectAnswer}
          />
          <p className="diagnosis-answer-hint" aria-live="polite">
            {selectedAnswerId
              ? "回答はいつでも変更できます。"
              : "この質問は未回答のまま進めます。迷う場合は「普通」を選んでも構いません。"}
          </p>
          <div className="diagnosis-actions">
            <button
              className="diagnosis-secondary-button"
              disabled={isFirstQuestion}
              onClick={handleBack}
              type="button"
            >
              前へ
            </button>
            <button
              className="diagnosis-primary-button"
              onClick={handleNext}
              type="button"
            >
              {isLastQuestion ? "診断内容を確認する" : "次へ"}
            </button>
          </div>
        </>
      ) : (
        <>
          <PreferenceDiagnosisSummary
            questions={preferenceDiagnosisQuestions}
            selectedAnswerByQuestionId={selectedAnswerByQuestionId}
          />
          <CoreV1RecommendationPanel
            selectedAnswerByQuestionId={selectedAnswerByQuestionId}
          />
          <div className="diagnosis-actions">
            <button
              className="diagnosis-secondary-button"
              onClick={handleBack}
              type="button"
            >
              前へ
            </button>
          </div>
        </>
      )}
    </section>
  );
}
