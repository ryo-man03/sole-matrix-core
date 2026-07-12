import type { SessionStorage } from "../auth-session/types";
import {
  preferenceDiagnosisQuestions,
  type DiagnosisAnswerId,
  type PreferenceDiagnosisAnswers,
} from "../../_data/preferenceDiagnosisQuestions";

export const DIAGNOSIS_DRAFT_STORAGE_KEY = "sole-matrix:diagnosis-draft:v1";
// Increment this when question IDs/options or draft semantics become incompatible.
export const DIAGNOSIS_DRAFT_VERSION = 1 as const;

export type DiagnosisDraft = {
  version: typeof DIAGNOSIS_DRAFT_VERSION;
  answers: PreferenceDiagnosisAnswers;
  currentQuestionIndex: number;
  completed: boolean;
};

type DiagnosisDraftInput = Omit<DiagnosisDraft, "version">;

export function readDiagnosisDraft(storage?: SessionStorage): DiagnosisDraft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(DIAGNOSIS_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    if (record.version !== DIAGNOSIS_DRAFT_VERSION) return null;
    const rawAnswers = record.answers;
    if (!rawAnswers || typeof rawAnswers !== "object") return null;

    const answers: PreferenceDiagnosisAnswers = {};
    for (const question of preferenceDiagnosisQuestions) {
      const answer = (rawAnswers as Record<string, unknown>)[question.id];
      if (typeof answer === "string" && question.options.some((option) => option.id === answer)) {
        answers[question.id] = answer as DiagnosisAnswerId;
      }
    }

    const maxIndex = preferenceDiagnosisQuestions.length - 1;
    const requestedIndex = typeof record.currentQuestionIndex === "number" ? record.currentQuestionIndex : 0;
    const currentQuestionIndex = Math.min(maxIndex, Math.max(0, Math.trunc(requestedIndex)));
    const completed = record.completed === true && preferenceDiagnosisQuestions.every((question) => answers[question.id]);
    return { version: DIAGNOSIS_DRAFT_VERSION, answers, currentQuestionIndex, completed };
  } catch {
    return null;
  }
}

export function writeDiagnosisDraft(storage: SessionStorage | undefined, draft: DiagnosisDraftInput): void {
  if (!storage) return;
  try {
    storage.setItem(DIAGNOSIS_DRAFT_STORAGE_KEY, JSON.stringify({
      version: DIAGNOSIS_DRAFT_VERSION,
      ...draft,
    } satisfies DiagnosisDraft));
  } catch {
    // The diagnosis still works when browser storage is unavailable.
  }
}

export function clearDiagnosisDraft(storage?: SessionStorage): void {
  try {
    storage?.removeItem?.(DIAGNOSIS_DRAFT_STORAGE_KEY);
  } catch {
    // The in-memory reset still succeeds when browser storage is unavailable.
  }
}

export function restartDiagnosisDraft(storage: SessionStorage | undefined, onReset?: () => void): void {
  clearDiagnosisDraft(storage);
  onReset?.();
}
