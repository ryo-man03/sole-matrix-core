import type { RetroRunningProfile, RyoPreferenceVector } from "./types";

const profiles: RetroRunningProfile[] = [
  retro("seventies_thin_runner", "70s薄型ランナー", ["Nike Cortez", "Nike Cortez Leather", "Nike LD-1000", "Nike Astro Grabber", "Nike Moon Shoe", "Nike Waffle Trainer", "Nike Daybreak", "Nike Field General"], "レトロランニング", "70s薄型ランナー", ["denim", "chino", "straight pants", "slim pants"], ["nylon", "suede", "leather"], ["1970s running", "waffle sole"], ["薄い形と古いスポーツの背景がデニムやチノに馴染みます"], ["細すぎるパンツでは靴だけが軽く見える場合があります"], true),
  retro("seventies_nylon_suede_runner", "70sナイロン・スエードランナー", ["adidas SL 72", "adidas SL 72 OG", "adidas Dragon"], "レトロランニング", "70sナイロン・スエードランナー", ["denim", "chino", "shorts"], ["nylon", "suede"], ["1970s track", "archive sportswear"], ["ナイロンとスエードの退色が古着へ馴染みます"], ["薄いシルエットなので裾幅とのバランスを確認してください"], true),
  retro("eighties_leather_runner", "80sレザーランナー", ["Reebok Classic Leather", "Reebok Classic Leather 1983 Vintage"], "レトロランニング", "80sレザーランナー", ["straight pants", "denim", "chino"], ["leather"], ["1980s fitness", "heritage leather"], ["革のシワを楽しめ、初心者にも合わせやすい現実的なレトロランナーです"], ["価格と在庫は販売元で確認してください"], true),
  retro("premium_retro_runner", "プレミアム・レトロランナー", ["New Balance 990v3", "New Balance 990v4", "New Balance 991", "New Balance 993", "New Balance 998", "New Balance 1500", "New Balance 1300", "New Balance 1400", "New Balance 576"], "高級レトロランニング", "90sプレミアムランナー", ["wide slacks", "cargo", "denim"], ["suede", "mesh"], ["Made in USA", "Made in UK", "premium running"], ["靴単体のproductScoreと、価格を含むrecommendationScoreを分けて評価します"], ["価格が高いため予算適合を別に確認してください"], true),
  retro("modern_retro_budget_runner", "現代レトロ・コンフォートランナー", ["New Balance 2002R", "New Balance 2010", "New Balance 574", "New Balance 327", "New Balance 237"], "現代レトロランニング", "現代復刻・予算現実枠", ["wide pants", "straight pants"], ["suede", "mesh", "synthetic"], ["modern comfort", "retro reference"], ["快適性とレトロな見た目を両立する条件付き候補です"], ["Ryo classicの中心ではなく、予算・快適性を優先する別枠です"], false),
  retro("high_tech_running", "ハイテクランニング", ["Nike Air Max 95", "New Balance 1906", "New Balance 9060", "New Balance 1000"], "ハイテクランニング", "現代ボリューム・テック", ["wide pants", "cargo"], ["mesh", "synthetic"], ["technical running", "street"], ["ハイテク許容とstreet文脈が明示された場合に限る別軸です"], ["Ryo classic tasteとは別枠で、Ryoらしいとは説明しません"], false),
];

export function getRetroRunningProfiles(): RetroRunningProfile[] {
  return profiles.map((item) => ({ ...item, models: [...item.models], pantsSignals: [...item.pantsSignals], materialSignals: [...item.materialSignals], cultureSignals: [...item.cultureSignals], reasons: [...item.reasons], cautions: [...item.cautions] }));
}

export function findRetroRunningProfile(candidateName: string): RetroRunningProfile | undefined {
  if (/reebok club c/i.test(candidateName)) return undefined;
  const normalized = normalize(candidateName);
  return profiles.find((item) => item.models.some((model) => normalized.includes(normalize(model))));
}

export function scoreRyoRetroRunningAffinity(candidateName: string, vector: RyoPreferenceVector): number {
  const profile = findRetroRunningProfile(candidateName);
  if (!profile) return 0;
  let score = profile.ryoCenter ? 68 : 38;
  if (vector.sportOrigin.running > 0) score += 10;
  if (vector.style.amekaji > 0 && profile.id.startsWith("seventies")) score += 12;
  if ((vector.style.cleanCasual > 0 || vector.style.normcore > 0) && profile.id === "eighties_leather_runner") score += 12;
  if (vector.budget.premiumOk > 0 && profile.id === "premium_retro_runner") score += 15;
  if ((vector.techTolerance.airMaxNbOk > 0 || vector.techTolerance.pureCoolOk > 0) && (profile.id === "high_tech_running" || profile.id === "modern_retro_budget_runner")) score += 20;
  if (vector.techTolerance.avoidTech > 0 && !profile.ryoCenter) score -= 30;
  return Math.max(0, Math.min(100, score));
}

export function buildRetroRunningExplanation(candidateName: string, profile: RetroRunningProfile): string {
  const base = profile.reasons[0] ?? `${candidateName}を${profile.label}として評価します。`;
  return profile.id === "high_tech_running" ? `${base} Ryo classic tasteとは別枠です。` : base;
}

function normalize(value: string): string { return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, " ").trim(); }
function retro(id: RetroRunningProfile["id"], label: string, models: string[], genre: string, subgenre: string, pantsSignals: string[], materialSignals: string[], cultureSignals: string[], reasons: string[], cautions: string[], ryoCenter: boolean): RetroRunningProfile {
  return { id, label, models, genre, subgenre, pantsSignals, materialSignals, cultureSignals, reasons, cautions, ryoCenter };
}
