import type {
  DiagnosisAnswer,
  DiagnosisAnswerValue,
} from "./types";

export const coreV1DiagnosisQuestionIds = [
  "trusted-classic",
  "simple-daily",
  "street-presence",
  "soft-volume",
  "walking-comfort",
  "long-use",
  "sporty-mood",
  "premium-detail",
] as const;

const supportedQuestionIds = new Set<string>(coreV1DiagnosisQuestionIds);
const supportedAnswerValues = new Set<DiagnosisAnswerValue>([
  "like",
  "neutral",
  "dislike",
]);

export function normalizeDiagnosisAnswers(input: unknown): DiagnosisAnswer[] {
  if (Array.isArray(input)) {
    return normalizeAnswerArray(input);
  }

  if (!isRecord(input)) {
    return [];
  }

  return normalizeAnswerArray(
    Object.entries(input).map(([questionId, value]) => ({ questionId, value })),
  );
}

function normalizeAnswerArray(input: readonly unknown[]): DiagnosisAnswer[] {
  const answers: DiagnosisAnswer[] = [];
  const seenQuestionIds = new Set<string>();

  for (const rawAnswer of input) {
    if (!isRecord(rawAnswer)) {
      continue;
    }

    const questionId = rawAnswer["questionId"];
    const value = rawAnswer["value"];

    if (
      typeof questionId !== "string" ||
      !supportedQuestionIds.has(questionId) ||
      !isDiagnosisAnswerValue(value) ||
      seenQuestionIds.has(questionId)
    ) {
      continue;
    }

    seenQuestionIds.add(questionId);
    answers.push({ questionId, value });
  }

  return answers;
}

function isDiagnosisAnswerValue(value: unknown): value is DiagnosisAnswerValue {
  return (
    typeof value === "string" &&
    supportedAnswerValues.has(value as DiagnosisAnswerValue)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
