"use client";

import { useMemo, useState } from "react";
import { type DiagnosisAnswerId, preferenceDiagnosisQuestions } from "../_data/preferenceDiagnosisQuestions";
import { DiagnosisProgress } from "./DiagnosisProgress";
import { DiagnosisQuestionCard } from "./DiagnosisQuestionCard";
import { CoreV1RecommendationPanel } from "./CoreV1RecommendationPanel";
import { PreferenceDiagnosisSummary } from "./PreferenceDiagnosisSummary";

type Props = { isRecommendationDisabled?: boolean; onComplete?: (answers: Record<string, DiagnosisAnswerId>) => void; onOpenProductJudgement?: () => void; onRecommendationComplete?: () => void };

export function PreferenceDiagnosisFlow({ onComplete, onOpenProductJudgement, onRecommendationComplete }: Props = {}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DiagnosisAnswerId | undefined>>({});
  const [summaryVisible, setSummaryVisible] = useState(false);
  const question = preferenceDiagnosisQuestions[currentQuestionIndex]!;
  const isLast = currentQuestionIndex === preferenceDiagnosisQuestions.length - 1;
  const answeredCount = useMemo(() => preferenceDiagnosisQuestions.filter((item) => answers[item.id]).length, [answers]);
  function next() { if (!isLast) { setCurrentQuestionIndex((index) => index + 1); return; } const completed = Object.fromEntries(preferenceDiagnosisQuestions.map((item) => [item.id, answers[item.id] ?? "neutral"])) as Record<string, DiagnosisAnswerId>; onComplete?.(completed); setSummaryVisible(true); }
  function restart() { setAnswers({}); setCurrentQuestionIndex(0); setSummaryVisible(false); }
  return <section id="core-v1" className="preference-diagnosis-section" aria-labelledby="preference-diagnosis-title"><div className="diagnosis-intro"><p className="diagnosis-kicker">好み診断</p><h2 id="preference-diagnosis-title">8つの質問で好みを整理する</h2><p>正解を当てるテストではありません。直感に近い回答から、具体的なスニーカーモデルを提案します。</p></div>{!summaryVisible ? <><DiagnosisProgress currentIndex={currentQuestionIndex} totalCount={preferenceDiagnosisQuestions.length} answeredCount={answeredCount} /><DiagnosisQuestionCard currentIndex={currentQuestionIndex} totalCount={preferenceDiagnosisQuestions.length} question={question} selectedAnswerId={answers[question.id]} onSelectAnswer={(answer) => setAnswers((current) => ({ ...current, [question.id]: answer }))} /><p className="diagnosis-answer-hint">{answers[question.id] ? "回答はいつでも変更できます。" : "迷う場合は「普通」を選べます。"}</p><div className="diagnosis-actions"><button className="diagnosis-secondary-button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))} type="button">前へ</button><button className="diagnosis-primary-button" onClick={next} type="button">{isLast ? "回答を確認する" : "次へ"}</button></div></> : <><PreferenceDiagnosisSummary questions={preferenceDiagnosisQuestions} selectedAnswerByQuestionId={answers} /><CoreV1RecommendationPanel onRecommendationComplete={onRecommendationComplete} selectedAnswerByQuestionId={answers} /><div className="diagnosis-actions"><button className="diagnosis-secondary-button" onClick={restart} type="button">もう一度8問診断する</button>{onOpenProductJudgement ? <button className="diagnosis-primary-button" onClick={onOpenProductJudgement} type="button">この好みで商品判断へ</button> : null}</div></>}</section>;
}
