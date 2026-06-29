import { createModeAwareRecommendation } from "../core-v1/modeRecommendation";
import {
  recommendCoreV1,
  type RecommendCoreV1Dependencies,
} from "../core-v1/service";
import { createUserMemoryService } from "../user-memory/userMemoryService";
import type { UserMemorySummary } from "../user-memory/types";
import type {
  IntegratedRecommendationRequest,
  IntegratedRecommendationResult,
} from "./types";
import { createExternalVisualEvidence } from "../external-evidence/visualEvidence";
import { createExternalUrlEvidence } from "../external-evidence/urlEvidence";
import { createExternalFeedbackPatternEvidence } from "../external-evidence/feedbackPatternEvidence";
import {
  readGlobalFeedbackCorpus,
  type GlobalFeedbackCorpusReference,
} from "../recommendation-feedback/globalFeedbackCorpus";

type UserMemoryService = ReturnType<typeof createUserMemoryService>;

export type IntegratedRecommendationDependencies = {
  core?: RecommendCoreV1Dependencies;
  userMemoryService?: UserMemoryService;
  feedbackCorpusReader?: () => Promise<GlobalFeedbackCorpusReference>;
};

export async function recommendIntegratedSneaker(
  input: IntegratedRecommendationRequest,
  dependencies: IntegratedRecommendationDependencies = {},
): Promise<IntegratedRecommendationResult> {
  const memoryService = dependencies.userMemoryService ?? createUserMemoryService();
  const feedbackCorpusReader =
    dependencies.feedbackCorpusReader ?? readGlobalFeedbackCorpus;
  const contextCautions = [
    ...(input.analysis?.urlAnalysis?.cautions ?? []),
    ...(input.analysis?.visualAnalysis?.cautions ?? []),
  ];
  let memory: UserMemorySummary | undefined;
  let userMemoryContext: Awaited<ReturnType<UserMemoryService["createUntrustedContext"]>> | undefined;

  if (input.userId) {
    try {
      [memory, userMemoryContext] = await Promise.all([
        memoryService.getUserMemory(input.userId),
        memoryService.createUntrustedContext(input.userId),
      ]);
    } catch {
      contextCautions.push("ユーザーmemoryを読み込めなかったため、今回の入力だけで評価しました。");
    }
  }

  const [coreResult, feedbackReference] = await Promise.all([
    recommendCoreV1(input, {
    ...(dependencies.core ?? {}),
    ...(userMemoryContext ? { userMemoryContext } : {}),
    }),
    loadFeedbackReferenceSafely(feedbackCorpusReader),
  ]);
  const baseModeRecommendation = createModeAwareRecommendation({
    mode: input.mode,
    candidate: coreResult.candidate,
    balancedScore: coreResult.balancedScore,
    ryoScore: coreResult.ryoScore,
  });
  const currentSneakerName = normalize(
    input.analysis?.sneakerName ?? coreResult.candidate.name,
  );
  const matchingFeedback = memory?.feedbackHistory.filter((feedback) => {
    const feedbackSneakerName = normalize(feedback.sneakerName);
    return (
      feedbackSneakerName.includes(currentSneakerName) ||
      currentSneakerName.includes(feedbackSneakerName)
    );
  }) ?? [];
  const latestMatchingFeedback = matchingFeedback.at(-1);
  const modeRecommendation = {
    ...baseModeRecommendation,
    modeReason:
      matchingFeedback.length > 0
        ? `${baseModeRecommendation.modeReason} memory.mdの関連feedback ${matchingFeedback.length}件も文脈として参照しました。`
        : baseModeRecommendation.modeReason,
    cautions: [
      ...baseModeRecommendation.cautions,
      ...(latestMatchingFeedback && latestMatchingFeedback.userRating <= 2
        ? ["過去のfeedback評価が低いため、以前の不満点を購入前に再確認してください。"]
        : []),
    ],
  };

  if (input.userId && memory) {
    try {
      await memoryService.appendDiagnosisNote(
        input.userId,
        JSON.stringify({
          candidate: coreResult.candidate.name,
          mode: input.mode,
          decision: modeRecommendation.decision,
          balancedScore: modeRecommendation.balancedScore,
          ryoScore: modeRecommendation.ryoScore,
        }),
      );
    } catch {
      contextCautions.push("診断履歴をmemory.mdへ追記できませんでした。");
    }
  }

  return {
    ...coreResult,
    externalEvidence: {
      ...coreResult.externalEvidence,
      feedbackPatterns: feedbackReference
        ? createExternalFeedbackPatternEvidence(feedbackReference)
        : [],
      ...(input.analysis?.visualAnalysis
        ? {
            visual: createExternalVisualEvidence(
              input.analysis.visualAnalysis,
            ),
          }
        : {}),
      ...(input.analysis?.urlAnalysis
        ? { url: createExternalUrlEvidence(input.analysis.urlAnalysis) }
        : {}),
    },
    modeRecommendation,
    analysis: input.analysis ?? {},
    ...(memory
      ? {
          userContext: {
            userId: memory.profile.userId,
            displayName: memory.profile.displayName,
            feedbackCount: memory.feedbackHistory.length,
          },
        }
      : {}),
    contextCautions,
  };
}

async function loadFeedbackReferenceSafely(
  reader: () => Promise<GlobalFeedbackCorpusReference>,
): Promise<GlobalFeedbackCorpusReference | null> {
  try {
    return await reader();
  } catch {
    return null;
  }
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP").replace(/\s+/g, " ").trim();
}
