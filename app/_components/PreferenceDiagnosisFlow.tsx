"use client";

import { useEffect, useMemo, useState } from "react";
import {
  preferenceDiagnosisQuestions,
  type CompletedPreferenceDiagnosisAnswers,
  type DiagnosisAnswerId,
  type PreferenceDiagnosisAnswers,
} from "../_data/preferenceDiagnosisQuestions";
import {
  DEFAULT_USER_SNEAKER_CONTEXT,
  normalizeUserSneakerContext,
  type UserSneakerContext,
} from "../_lib/diagnosis/sneakerContext";
import type { RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";
import { buildRyoPreferenceVector } from "../_lib/ryo-mode-v4/vector";
import { readDiagnosisDraft, restartDiagnosisDraft, writeDiagnosisDraft } from "../_lib/diagnosis/diagnosisDraft";
import { DiagnosisProgress } from "./DiagnosisProgress";
import { DiagnosisQuestionCard } from "./DiagnosisQuestionCard";
import { CoreV1RecommendationPanel } from "./CoreV1RecommendationPanel";
import { PreferenceDiagnosisSummary } from "./PreferenceDiagnosisSummary";
import { SneakerContextForm } from "./SneakerContextForm";

type Props = {
  isRecommendationDisabled?: boolean;
  onComplete?: (answers: CompletedPreferenceDiagnosisAnswers) => void;
  onOpenProductJudgement?: () => void;
  onRecommendationComplete?: () => void;
  onReset?: () => void;
};

export function PreferenceDiagnosisFlow({
  onComplete,
  onOpenProductJudgement,
  onRecommendationComplete,
  onReset,
}: Props = {}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PreferenceDiagnosisAnswers>({});
  const [context, setContext] = useState<UserSneakerContext>(DEFAULT_USER_SNEAKER_CONTEXT);
  const [contextVisible, setContextVisible] = useState(true);
  const [completedVector, setCompletedVector] = useState<RyoPreferenceVector | null>(null);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const question = preferenceDiagnosisQuestions[currentQuestionIndex]!;
  const isLast = currentQuestionIndex === preferenceDiagnosisQuestions.length - 1;
  const answeredCount = useMemo(
    () => preferenceDiagnosisQuestions.filter((item) => answers[item.id]).length,
    [answers],
  );
  const currentAnswer = answers[question.id];

  useEffect(() => {
    const draft = readDiagnosisDraft(getSessionStorage());
    if (draft) {
      setAnswers(draft.answers);
      setContext(normalizeUserSneakerContext(draft.context));
      setCurrentQuestionIndex(draft.currentQuestionIndex);
      setContextVisible(Object.keys(draft.answers).length === 0);
      if (draft.completed) {
        const completed = draft.answers as CompletedPreferenceDiagnosisAnswers;
        setCompletedVector(buildRyoPreferenceVector(completed));
        setSummaryVisible(true);
        setContextVisible(false);
        onComplete?.(completed);
      }
    }
    setDraftReady(true);
  }, [onComplete]);

  useEffect(() => {
    if (!draftReady) return;
    writeDiagnosisDraft(getSessionStorage(), {
      answers,
      currentQuestionIndex,
      completed: summaryVisible,
      context,
    });
  }, [answers, context, currentQuestionIndex, draftReady, summaryVisible]);

  function continueFromContext() {
    setContext(normalizeUserSneakerContext(context));
    setContextVisible(false);
    const completed = preferenceDiagnosisQuestions.every((item) => answers[item.id]);
    if (completed) {
      const completedAnswers = answers as CompletedPreferenceDiagnosisAnswers;
      setCompletedVector(buildRyoPreferenceVector(completedAnswers));
      setSummaryVisible(true);
    }
  }

  function next() {
    if (!currentAnswer) return;
    if (!isLast) {
      setCurrentQuestionIndex((index) => index + 1);
      return;
    }
    const completed = Object.fromEntries(
      preferenceDiagnosisQuestions.map((item) => [item.id, answers[item.id]]),
    ) as CompletedPreferenceDiagnosisAnswers;
    const vector = buildRyoPreferenceVector(completed);
    setCompletedVector(vector);
    onComplete?.(completed);
    setSummaryVisible(true);
  }

  function restart() {
    restartDiagnosisDraft(getSessionStorage(), onReset);
    setAnswers({});
    setContext(DEFAULT_USER_SNEAKER_CONTEXT);
    setContextVisible(true);
    setCompletedVector(null);
    setCurrentQuestionIndex(0);
    setSummaryVisible(false);
  }

  return (
    <section id="core-v1" className="preference-diagnosis-section" aria-labelledby="preference-diagnosis-title">
      <div className="diagnosis-intro">
        <p className="diagnosis-kicker">好み診断 / Ryo Mode v4</p>
        <h2 id="preference-diagnosis-title">11の質問で好みを整理する</h2>
        <p>購入目的を確認してから、服装、パンツ、素材、予算、Ryo Modeの強さを順に選びます。</p>
      </div>
      {contextVisible ? (
        <SneakerContextForm context={context} onChange={setContext} onContinue={continueFromContext} />
      ) : !summaryVisible ? (
        <>
          <DiagnosisProgress
            answeredCount={answeredCount}
            category={question.category}
            currentIndex={currentQuestionIndex}
            totalCount={preferenceDiagnosisQuestions.length}
          />
          <DiagnosisQuestionCard
            currentIndex={currentQuestionIndex}
            totalCount={preferenceDiagnosisQuestions.length}
            question={question}
            selectedAnswerId={currentAnswer}
            onSelectAnswer={(answer: DiagnosisAnswerId) => setAnswers((current) => ({ ...current, [question.id]: answer }))}
          />
          <p className="diagnosis-answer-hint">{currentAnswer ? "回答は前の質問へ戻って変更できます。" : "いずれか1つを選ぶと次へ進めます。"}</p>
          <div className="diagnosis-actions diagnosis-actions--sticky">
            <button
              className="diagnosis-secondary-button"
              onClick={() => {
                if (currentQuestionIndex === 0) setContextVisible(true);
                else setCurrentQuestionIndex((index) => Math.max(0, index - 1));
              }}
              type="button"
            >
              前へ
            </button>
            <button className="diagnosis-primary-button" disabled={!currentAnswer} onClick={next} type="button">
              {isLast ? "回答を確認する" : "次へ"}
            </button>
          </div>
        </>
      ) : completedVector ? (
        <>
          <PreferenceDiagnosisSummary
            context={context}
            onEditAnswer={(questionId) => {
              setSummaryVisible(false);
              setCurrentQuestionIndex(
                Math.max(0, preferenceDiagnosisQuestions.findIndex((item) => item.id === questionId)),
              );
            }}
            onEditContext={() => {
              setSummaryVisible(false);
              setContextVisible(true);
            }}
            questions={preferenceDiagnosisQuestions}
            selectedAnswerByQuestionId={answers}
            vector={completedVector}
          />
          <CoreV1RecommendationPanel
            onRecommendationComplete={onRecommendationComplete}
            ryoPreferenceVector={completedVector}
            selectedAnswerByQuestionId={answers}
            userSneakerContext={context}
          />
          <div className="diagnosis-actions">
            <button className="diagnosis-secondary-button" onClick={restart} type="button">診断を最初からやり直す</button>
            {onOpenProductJudgement ? <button className="diagnosis-primary-button" onClick={onOpenProductJudgement} type="button">この好みで商品判断へ</button> : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

function getSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
