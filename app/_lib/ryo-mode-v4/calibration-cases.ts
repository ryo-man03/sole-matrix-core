import type { CompletedPreferenceDiagnosisAnswers } from "../../_data/preferenceDiagnosisQuestions";
import type { UserSneakerContext } from "../diagnosis/sneakerContext";
import type { RyoRecommendationBucket } from "./types";

export type RyoCalibrationCase = {
  id: string;
  description: string;
  answers: CompletedPreferenceDiagnosisAnswers;
  context: UserSneakerContext;
  expectedTopFamilies: string[];
  acceptableTopModels: string[];
  mustNotRankFirst: string[];
  expectedBuckets?: RyoRecommendationBucket[];
  explanationMustInclude: string[];
  explanationMustNotInclude: string[];
};

const defaults: CompletedPreferenceDiagnosisAnswers = {
  style: "normcore",
  pantsFit: "straight_pants",
  taste: "classic",
  sportOrigin: "no_sport",
  cut: "low",
  wearingStyle: "tied_silhouette",
  materialAging: "leather_sinking",
  color: "black_white",
  budget: "under_25000",
  techTolerance: "avoid_tech",
  ryoStrength: "balanced",
};

const defaultContext: UserSneakerContext = {
  purchasePurpose: "daily_rotation",
  ownedModels: [],
  dislikedModels: [],
  dislikedSignals: [],
};

export const RYO_CALIBRATION_CASES: readonly RyoCalibrationCase[] = [
  calibration("amekaji-denim-suede-strong", "アメカジ・デニム・スエード・Ryo Strong", {
    style: "amekaji", pantsFit: "denim", sportOrigin: "basketball", materialAging: "suede_fading_nap", ryoStrength: "ryo_strong",
  }, ["Converse One Star", "PUMA Clyde", "PUMA Suede", "PRO-Keds"], ["AF1", "Air Force 1", "Samba OG", "Club C"], ["スエード", "デニム", "素材"]),
  calibration("amekaji-denim-canvas-high", "アメカジ・デニム・キャンバス・High", {
    style: "amekaji", pantsFit: "denim", cut: "high", materialAging: "canvas_fading", ryoStrength: "ryo_mode",
  }, ["All Star J", "TimeLine", "Addict"], ["Converse All Star Hi Black"], ["キャンバス", "デニム"]),
  calibration("normcore-first-pair", "ノームコア・予算1万円台・最初の一足", {
    style: "normcore", pantsFit: "straight_pants", taste: "simple", budget: "under_15000", ryoStrength: "beginner_ryo",
  }, ["Jack Purcell", "Reebok Club C", "Reebok Classic", "Vans Authentic"], ["TimeLine", "Addict"], ["予算"]),
  calibration("street-wide-black-basketball", "ストリート・太め・白黒・バスケット", {
    style: "street", pantsFit: "wide_pants", sportOrigin: "basketball", cut: "high", color: "black_white", ryoStrength: "ryo_mode",
  }, ["Air Jordan 1 High", "Terminator High", "Superstar Vintage", "PUMA Suede"], ['Air Force 1 Low "White/White"'], ["バスケット"]),
  calibration("running-suede-premium", "ランニング・スエード・プレミアム", {
    sportOrigin: "running", pantsFit: "wide_pants", materialAging: "suede_fading_nap", budget: "premium_ok", techTolerance: "heritage_tech_ok", ryoStrength: "ryo_mode",
  }, ["New Balance 998", "New Balance 991", "New Balance 1500", "New Balance 990"], ["New Balance 1906", "New Balance 9060", "New Balance 2002R"], ["スエード"], ["Made in USA", "Made in UK"]),
  calibration("football-cream-gum", "フットボール・ストレート・Cream/Gum", {
    sportOrigin: "football", pantsFit: "straight_pants", color: "cream_gum", materialAging: "suede_fading_nap", ryoStrength: "ryo_mode",
  }, ["adidas Tobacco", "adidas London", "adidas Hamburg", "adidas Handball Spezial", "adidas Country", "adidas Japan"], ["adidas Samba OG"], ["スエード"]),
  calibration("skate-work-canvas", "スケート・ワークパンツ・キャンバス", {
    style: "street", pantsFit: "work_pants", sportOrigin: "skate", materialAging: "canvas_fading", taste: "simple", budget: "under_15000",
  }, ["Vans Authentic", "Vans Era", "Vans Half Cab", "Converse One Star", "Last Resort AB"], [], ["キャンバス"]),
  calibration("archive-canvas-high", "アーカイブ収集・キャンバス・High", {
    style: "amekaji", pantsFit: "denim", cut: "high", materialAging: "canvas_fading", budget: "premium_ok", ryoStrength: "ryo_strong",
  }, ["TimeLine", "Addict", "All Star J VTG", "Jack Purcell 1935"], ["Converse All Star Hi Black"], ["復刻", "キャンバス"], [], { purchasePurpose: "archive_collection" }),
  calibration("owned-puma-second-pair", "PUMA Suede所有・スエード・二足目", {
    style: "amekaji", pantsFit: "denim", sportOrigin: "basketball", materialAging: "suede_fading_nap", taste: "classic", ryoStrength: "ryo_strong",
  }, ["PUMA Clyde", "Converse One Star", "PRO-Keds"], ["PUMA Suede"], ["スエード"], [], { purchasePurpose: "second_pair", ownedModels: ["PUMA Suede"] }),
  calibration("avoid-tech-classic", "ハイテク回避のクラシック軸", {
    style: "amekaji", pantsFit: "straight_pants", techTolerance: "avoid_tech", ryoStrength: "ryo_strong",
  }, ["Converse", "PUMA", "adidas", "Vans", "Reebok", "Nike Cortez"], ["Air Max 95", "New Balance 1906", "New Balance 9060"], ["クラシック"], ["Ryo classic"]),
  calibration("first-pair-tennis", "テニス由来の最初の一足", {
    style: "clean_casual", sportOrigin: "tennis", taste: "simple", budget: "under_15000", ryoStrength: "beginner_ryo",
  }, ["Reebok Club C", "Converse Jack Purcell", "Reebok Classic Leather"], ["TimeLine", "Addict"], ["合わせ"]),
  calibration("daily-black-white", "普段使いの白黒ローテーション", {
    style: "normcore", color: "black_white", taste: "simple", budget: "under_20000",
  }, ["Jack Purcell", "Reebok", "Vans Authentic", "PUMA"], [], ["白黒"]),
  calibration("owned-one-star-second", "One Star所有からの隣接二足目", {
    style: "amekaji", pantsFit: "denim", materialAging: "suede_fading_nap", ryoStrength: "ryo_mode",
  }, ["PUMA Clyde", "PUMA Suede", "PRO-Keds", "adidas Tobacco"], ["Converse One Star"], ["近い"], [], { purchasePurpose: "second_pair", ownedModels: ["Converse One Star J"] }),
  calibration("archive-terrace", "テラス系アーカイブ収集", {
    style: "clean_casual", sportOrigin: "football", materialAging: "suede_fading_nap", color: "cream_gum", budget: "premium_ok", ryoStrength: "ryo_strong",
  }, ["adidas London", "adidas Hamburg", "adidas Tobacco", "adidas Handball Spezial"], ["adidas Samba OG"], ["アーカイブ"], [], { purchasePurpose: "archive_collection" }),
  calibration("clean-slim-leather", "きれいめ・細身・レザー", {
    style: "clean_casual", pantsFit: "slim_pants", wearingStyle: "slim_look", materialAging: "leather_sinking",
  }, ["Nike Cortez Leather", "adidas Japan", "adidas Superstar Vintage", "Converse Jack Purcell Leather", "Reebok Classic Leather"], [], ["レザー"]),
  calibration("street-tech-allowed", "ストリートでハイテク許容", {
    style: "street", pantsFit: "wide_pants", taste: "rare_color", sportOrigin: "running", techTolerance: "airmax_nb_ok", wearingStyle: "volume_look", materialAging: "gore_tex", color: "odd_color",
  }, ["New Balance", "Nike Air Max 95", "adidas Superstar Vintage"], [], ["ランニング"]),
  calibration("beginner-canvas", "初心者向けキャンバス", {
    style: "normcore", taste: "simple", materialAging: "canvas_fading", budget: "under_15000", ryoStrength: "beginner_ryo",
  }, ["Vans Authentic", "Converse Jack Purcell CL", "Converse All Star J"], ["TimeLine", "Addict"], ["キャンバス"]),
  calibration("rare-suede-second", "珍色スエードの二足目", {
    style: "amekaji", taste: "rare_color", materialAging: "suede_fading_nap", color: "rare_color", ryoStrength: "ryo_strong",
  }, ["Converse One Star", "PUMA Suede", "PUMA Clyde", "adidas Tobacco"], [], ["色", "スエード"], [], { purchasePurpose: "second_pair" }),
  calibration("work-leather-high", "ワークパンツ・レザー・High", {
    style: "amekaji", pantsFit: "work_pants", sportOrigin: "basketball", cut: "high", materialAging: "leather_sinking", ryoStrength: "ryo_mode",
  }, ["Nike Terminator High", "Nike Blazer Mid", "Converse Weapon", "Converse Pro Leather", "Air Jordan 1 High"], ["Vans Authentic"], ["レザー"]),
  calibration("straight-football-suede", "ストレート・フットボール・スエード", {
    pantsFit: "straight_pants", sportOrigin: "football", materialAging: "suede_fading_nap", color: "earth_tone",
  }, ["adidas Tobacco", "adidas London", "adidas Hamburg", "adidas Handball Spezial"], [], ["スエード"]),
  calibration("wide-running-balanced", "太めパンツ・ランニング・Balanced", {
    style: "street", pantsFit: "wide_pants", sportOrigin: "running", techTolerance: "heritage_tech_ok", ryoStrength: "balanced",
  }, ["New Balance", "Nike"], [], ["ランニング"]),
  calibration("avoid-high-cut", "ハイカット回避", {
    style: "clean_casual", pantsFit: "straight_pants", cut: "low", ryoStrength: "balanced",
  }, ["Jack Purcell", "Reebok", "PUMA", "adidas", "Nike Cortez"], ["Terminator High", "Air Jordan 1 High", "All Star J Hi"], ["Low"], [], { dislikedSignals: ["ハイカット"] }),
  calibration("avoid-white", "真っ白を避ける白黒軸", {
    style: "normcore", color: "black_white", taste: "simple", ryoStrength: "balanced",
  }, ["Vans Authentic Black/White", "PUMA Suede Black/White", "Jack Purcell Leather Black"], ['Air Force 1 Low "White/White"'], ["Black"], [], { dislikedSignals: ["真っ白"] }),
  calibration("avoid-tech-signal", "明示的なハイテク回避傾向", {
    style: "amekaji", pantsFit: "work_pants", techTolerance: "avoid_tech", ryoStrength: "ryo_mode",
  }, ["Converse", "PUMA", "adidas Superstar Vintage", "Vans", "Reebok", "Nike Blazer", "Nike Terminator"], ["Air Max 95", "New Balance 1906"], ["ローテク"], [], { dislikedSignals: ["ハイテク"] }),
] as const;

function calibration(
  id: string,
  description: string,
  answerOverrides: Partial<CompletedPreferenceDiagnosisAnswers>,
  expectedTopFamilies: string[],
  mustNotRankFirst: string[],
  explanationMustInclude: string[],
  explanationMustNotInclude: string[] = [],
  contextOverrides: Partial<UserSneakerContext> = {},
): RyoCalibrationCase {
  return {
    id,
    description,
    answers: { ...defaults, ...answerOverrides },
    context: { ...defaultContext, ...contextOverrides },
    expectedTopFamilies,
    acceptableTopModels: [...expectedTopFamilies],
    mustNotRankFirst,
    expectedBuckets: ["anchor_classic", "ryo_signature", "adjacent_discovery", "practical_buy", "wildcard"],
    explanationMustInclude,
    explanationMustNotInclude,
  };
}
