export type RyoModeQuestionId =
  | "style"
  | "pantsFit"
  | "taste"
  | "sportOrigin"
  | "cut"
  | "wearingStyle"
  | "materialAging"
  | "color"
  | "budget"
  | "techTolerance"
  | "ryoStrength";

export type RyoModeQuestionOption = {
  id: string;
  label: string;
};

export type RyoModeQuestion = {
  id: RyoModeQuestionId;
  title: string;
  options: readonly RyoModeQuestionOption[];
};

export type RyoModeAnswer = {
  questionId: RyoModeQuestionId;
  optionId: string;
};

export type RyoModeAnswers =
  | Readonly<Partial<Record<RyoModeQuestionId, string>>>
  | readonly RyoModeAnswer[];

export type RyoParentModelId =
  | "converse_one_star"
  | "converse_all_star_j"
  | "converse_jack_purcell"
  | "adidas_archive"
  | "puma_suede_clyde"
  | "nike_jordan_heritage"
  | "nike_retro_running_archive"
  | "vans_skate"
  | "new_balance_premium_runner"
  | "reebok_prokeds_lastresort";

export type RyoParentModelProfile = {
  id: RyoParentModelId;
  label: string;
  priority: "S_PLUS" | "S" | "A" | "B";
  coreModels: string[];
  preferredVariants: string[];
  conditionalVariants: string[];
  downrankVariants: string[];
  originSignals: string[];
  cultureSignals: string[];
  musicSignals: string[];
  styleSignals: string[];
  materialAgingSignals: string[];
  pantsSignals: string[];
  ryoReasons: string[];
  cautions: string[];
};

export type RyoTemplateId =
  | "amekaji_denim_canvas"
  | "amekaji_denim_leather"
  | "amekaji_work_suede"
  | "clean_slim_leather"
  | "normcore_straight_value"
  | "premium_runner"
  | "street_high_tech"
  | "amekaji_avoid_tech";

export type RyoStyleTemplate = {
  id: RyoTemplateId;
  label: string;
  genre: string;
  answerSignals: string[];
  materialSignals: string[];
  pantsSignals: string[];
  reasons: string[];
};

export type RetroRunningSubgenre =
  | "seventies_thin_runner"
  | "seventies_nylon_suede_runner"
  | "eighties_leather_runner"
  | "premium_retro_runner"
  | "modern_retro_budget_runner"
  | "high_tech_running";

export type RetroRunningProfile = {
  id: RetroRunningSubgenre;
  label: string;
  models: string[];
  genre: string;
  subgenre: string;
  pantsSignals: string[];
  materialSignals: string[];
  cultureSignals: string[];
  reasons: string[];
  cautions: string[];
  ryoCenter: boolean;
};

export type RyoCandidateMetadata = {
  parentModelIds?: RyoParentModelId[];
  templateIds?: RyoTemplateId[];
  retroRunningProfiles?: RetroRunningSubgenre[];
  genre?: string;
  subgenre?: string;
  cultureSignals?: string[];
  musicSignals?: string[];
  materialSignals?: string[];
  pantsSignals?: string[];
  cautionSignals?: string[];
  verificationStatus: "verified" | "needs_check" | "unverified";
};

export type RyoAffinityBreakdown = {
  parentModelAffinity: number;
  templateAffinity: number;
  retroRunningAffinity: number;
  cultureAffinity: number;
  materialAgingAffinity: number;
  pantsAffinity: number;
  cautionPenalty: number;
};

export type RyoCulturalEvaluation = {
  affinities: RyoAffinityBreakdown;
  metadata: RyoCandidateMetadata;
  parentProfile?: RyoParentModelProfile;
  templates: RyoStyleTemplate[];
  retroRunningProfile?: RetroRunningProfile;
  reasons: string[];
  cautions: string[];
};

export type RyoPreferenceVector = {
  style: {
    amekaji: number;
    normcore: number;
    street: number;
    cleanCasual: number;
    undecided: number;
  };
  pantsFit: {
    widePants: number;
    straightPants: number;
    denim: number;
    workPants: number;
    slimPants: number;
    undecided: number;
  };
  taste: {
    classic: number;
    simple: number;
    mutedColor: number;
    rareColor: number;
    limitedCollab: number;
  };
  sportOrigin: {
    basketball: number;
    tennis: number;
    football: number;
    skate: number;
    running: number;
    noSportPreference: number;
  };
  cut: {
    high: number;
    low: number;
    ox: number;
    mid: number;
    dependsOnModel: number;
  };
  wearingStyle: {
    tiedSilhouette: number;
    looseFit: number;
    slimLook: number;
    volumeLook: number;
    noPreference: number;
  };
  materialAging: {
    leatherSinking: number;
    leatherCreasing: number;
    suedeFadingNap: number;
    canvasFading: number;
    goreTexUtility: number;
    overallAgingPotential: number;
  };
  color: {
    blackWhite: number;
    earthTone: number;
    warmAccent: number;
    oddColor: number;
    creamGum: number;
    rareColor: number;
  };
  budget: {
    under15000: number;
    under20000: number;
    under25000: number;
    under35000: number;
    premiumOk: number;
  };
  techTolerance: {
    avoidTech: number;
    heritageTechOk: number;
    oldTechLookOk: number;
    pureCoolOk: number;
    airMaxNbOk: number;
  };
  ryoStrength: {
    balanced: number;
    ryoLight: number;
    ryoMode: number;
    ryoStrong: number;
    beginnerRyo: number;
  };
};

export type RyoPreferenceSummary = {
  dominantSignals: string[];
  budgetCeilingYen?: number;
  allowsTechnicalModels: boolean;
  ryoInfluence: "balanced" | "light" | "standard" | "strong" | "beginner";
};

export type RyoSneakerFeatures = {
  displayNameOfficial: string;
  brandOfficial: string;
  modelOfficial: string;
  verified: boolean;
  isAbstractName: boolean;
  hasLocalizedMainName: boolean;
  estimatedPriceYen?: number;
  traits: {
    oldShape?: boolean;
    vintage?: boolean;
    timeLine?: boolean;
    madeInJapan?: boolean;
    madeInGermany?: boolean;
    madeInUsa?: boolean;
    leather?: boolean;
    suede?: boolean;
    canvas?: boolean;
    goreTex?: boolean;
    highCut?: boolean;
    lowCut?: boolean;
    oxCut?: boolean;
    midCut?: boolean;
    tiedSilhouetteGood?: boolean;
    widePantsGood?: boolean;
    straightPantsGood?: boolean;
    denimGood?: boolean;
    workPantsGood?: boolean;
    slimPantsGood?: boolean;
    rareWearableColor?: boolean;
    blackWhite?: boolean;
    blackBased?: boolean;
    whiteWhite?: boolean;
    tooCommon?: boolean;
    tooTechnical?: boolean;
    overlyFuturistic?: boolean;
    trendOnly?: boolean;
    largeNLogo?: boolean;
    airForce1WhiteWhite?: boolean;
    resaleTooExpensiveForBeginner?: boolean;
    poorAgingPotential?: boolean;
    poorPantsCompatibility?: boolean;
    betterRyoAlternativeExists?: boolean;
    flashyColorWithoutWearability?: boolean;
    popularityOnlyReason?: boolean;
    ryoDiscouragedModel?: boolean;
    techAllowedModel?: boolean;
    sportOrigin?: "basketball" | "tennis" | "football" | "skate" | "running" | "none";
  };
};

export type RyoModeScoreBreakdown = {
  historyOrigin: number;
  materialAging: number;
  silhouetteCutWearing: number;
  pantsCompatibility: number;
  colorTaste: number;
  styleSportContext: number;
  affordability: number;
  playfulness: number;
};

export type RyoModeScoreResult = {
  productScore: number;
  recommendationScore: number;
  totalRyoScore: number;
  breakdown: RyoModeScoreBreakdown;
  bonuses: string[];
  penalties: string[];
  matchedSignals: string[];
  cautionSignals: string[];
  affinities?: RyoAffinityBreakdown;
};

export type RyoOpinion = {
  summary: string;
  strongestSignals: string[];
  ryoInterpretation: string;
  caution: string;
  nextStep: string;
};
