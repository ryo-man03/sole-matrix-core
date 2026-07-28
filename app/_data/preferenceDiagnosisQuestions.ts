import { RYO_MODE_V4_QUESTIONS } from "../_lib/ryo-mode-v4/questions";
import type { RyoModeQuestionId } from "../_lib/ryo-mode-v4/types";

export type DiagnosisAnswerId = string;

export type DiagnosisQuestion = {
  id: RyoModeQuestionId;
  question: string;
  helperText: string;
  options: { id: DiagnosisAnswerId; label: string; description: string }[];
};

export type PreferenceDiagnosisAnswers = Partial<Record<RyoModeQuestionId, DiagnosisAnswerId>>;
export type CompletedPreferenceDiagnosisAnswers = Record<RyoModeQuestionId, DiagnosisAnswerId>;

const helperTextByQuestionId: Record<RyoModeQuestionId, string> = {
  style: "今日の服装や気分に最も近い方向を選びます。",
  pantsFit: "実際に合わせるパンツとのバランスを確認します。",
  taste: "定番感、色、限定感のどこに惹かれるかを確認します。",
  sportOrigin: "競技の背景やカルチャーとの接点を確認します。",
  cut: "足首まわりを含むシルエットの好みを確認します。",
  wearingStyle: "紐の締め方や足元の見え方を確認します。",
  materialAging: "履き込んだ素材の変化をどの程度楽しみたいか確認します。",
  color: "普段の服に合わせたい配色を選びます。",
  budget: "候補を絞るための現実的な予算上限を選びます。",
  techTolerance: "機能的な見た目をどこまで許容するか確認します。",
  ryoStrength: "ユーザーの好みとRyo Modeの判断軸の配分を選びます。",
};

export const preferenceDiagnosisQuestions: DiagnosisQuestion[] = RYO_MODE_V4_QUESTIONS.map((question) => ({
  id: question.id,
  question: question.title,
  helperText: helperTextByQuestionId[question.id],
  options: question.options.map((option) => ({
    ...option,
  })),
}));
