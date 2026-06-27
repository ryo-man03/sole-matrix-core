import type {
  CandidateProfile,
  FeedbackInput,
} from "./types";

export type CandidateRepository = {
  listCandidates(input: { budgetYen?: number }): Promise<CandidateProfile[]>;
};

export type FeedbackRepository = {
  saveFeedback(
    input: FeedbackInput,
  ): Promise<{ ok: true } | { ok: false; error: string }>;
};

type CandidateTemplate = Omit<CandidateProfile, "budgetFit">;

const localCandidateTemplates: CandidateTemplate[] = [
  {
    id: "local-classic-daily",
    name: "クラシック・デイリー型",
    source: "local",
    description: "定番感と合わせやすさを軸にしたローカルの仮候補です。",
    tags: ["classic", "minimal", "low_tech", "heritage"],
    vector: {
      culture: 88,
      styleFit: 84,
      simplicity: 92,
      street: 48,
      volume: 34,
      comfort: 74,
      durability: 82,
      priceLevel: 44,
    },
    risk: "low",
    informationCompleteness: 84,
    readiness: "ready_local",
  },
  {
    id: "local-street-volume",
    name: "ストリート・ボリューム型",
    source: "local",
    description: "存在感とストリート文脈を軸にしたローカルの仮候補です。",
    tags: ["street", "chunky", "basketball", "retro"],
    vector: {
      culture: 76,
      styleFit: 78,
      simplicity: 42,
      street: 94,
      volume: 92,
      comfort: 70,
      durability: 76,
      priceLevel: 68,
    },
    risk: "medium",
    informationCompleteness: 78,
    readiness: "ready_local",
  },
  {
    id: "local-comfort-runner",
    name: "コンフォート・ランナー型",
    source: "local",
    description: "歩きやすさと日常性を軸にしたローカルの仮候補です。",
    tags: ["running", "comfortable", "durable", "minimal"],
    vector: {
      culture: 52,
      styleFit: 78,
      simplicity: 76,
      street: 58,
      volume: 55,
      comfort: 94,
      durability: 86,
      priceLevel: 52,
    },
    risk: "low",
    informationCompleteness: 82,
    readiness: "ready_local",
  },
];

export const mockCandidateRepository: CandidateRepository = {
  async listCandidates(input) {
    return localCandidateTemplates.map((candidate) => ({
      ...candidate,
      tags: [...candidate.tags],
      vector: { ...candidate.vector },
      budgetFit: calculateLocalBudgetFit(
        input.budgetYen,
        candidate.vector.priceLevel,
      ),
    }));
  },
};

export function createMockFeedbackRepository(): FeedbackRepository & {
  getSavedFeedback(): FeedbackInput[];
} {
  const savedFeedback: FeedbackInput[] = [];

  return {
    async saveFeedback(input) {
      savedFeedback.push({ ...input });
      return { ok: true };
    },
    getSavedFeedback() {
      return savedFeedback.map((input) => ({ ...input }));
    },
  };
}

function calculateLocalBudgetFit(
  budgetYen: number | undefined,
  candidatePriceLevel: number,
): number {
  if (budgetYen === undefined) {
    return 65;
  }

  const budgetLevel = clampScore(((budgetYen - 5_000) / 30_000) * 100);

  if (budgetLevel >= candidatePriceLevel) {
    return 100;
  }

  return Math.round((budgetLevel / Math.max(candidatePriceLevel, 1)) * 100);
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
