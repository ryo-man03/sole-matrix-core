import type { RyoPreferenceVector, RyoSneakerFeatures, RyoStyleTemplate } from "./types";

const templates: RyoStyleTemplate[] = [
  template("amekaji_denim_canvas", "アメカジ × デニム × キャンバス", "アメカジ・ヴィンテージ", ["amekaji", "denim", "canvas"], ["canvas fading"], ["denim"], ["退色するキャンバスとデニムを一緒に育てる組み合わせです"]),
  template("amekaji_denim_leather", "アメカジ × デニム × レザー", "アメカジ・ヘリテージ", ["amekaji", "denim", "leather"], ["leather creasing"], ["denim"], ["革の沈みとデニムの色落ちを長期で馴染ませる組み合わせです"]),
  template("amekaji_work_suede", "アメカジ × ワークパンツ × スエード", "アメカジ・ワーク・スケート", ["amekaji", "work pants", "suede"], ["suede fading and nap"], ["work pants"], ["毛並みの変化がワークパンツの粗さに馴染む組み合わせです"]),
  template("clean_slim_leather", "クリーンカジュアル × 細身パンツ × レザー", "クリーンカジュアル", ["clean casual", "slim pants", "leather"], ["leather creasing"], ["slim pants"], ["薄い形と静かな革をクリーンに見せる組み合わせです"]),
  template("normcore_straight_value", "ノームコア × ストレート × 現実的予算", "ノームコア・デイリー", ["normcore", "straight pants", "under 15000"], ["leather or nylon"], ["straight pants"], ["買いやすさと日常の合わせやすさを優先します"]),
  template("premium_runner", "プレミアム・レトロランナー", "高級レトロランニング", ["premium", "running"], ["suede and mesh"], ["wide slacks", "cargo", "denim"], ["靴単体の質と今回の予算適合を分けて評価します"]),
  template("street_high_tech", "ストリート × ワイド × ハイテク許容", "ハイテクランニング", ["street", "wide pants", "high tech"], ["mesh and synthetic"], ["wide pants"], ["現代的なボリュームを許容する別軸で、Ryo classicとは呼びません"]),
  template("amekaji_avoid_tech", "アメカジ × ローテク × 現実的予算", "ヘリテージ・レトロスポーツ", ["amekaji", "avoid tech", "under 20000"], ["canvas, suede, or leather"], ["denim", "chino"], ["高機能感を避け、古いスポーツ由来の形を優先します"]),
];

const candidatePatterns: Record<RyoStyleTemplate["id"], RegExp> = {
  amekaji_denim_canvas: /all star|authentic|vans era|jack purcell cl/i,
  amekaji_denim_leather: /jack purcell leather|one star leather|classic leather|superstar vintage|pro leather/i,
  amekaji_work_suede: /puma suede|puma clyde|one star.*suede|half cab|jack purcell leather/i,
  clean_slim_leather: /cortez|adidas japan|sl 72|classic leather|country og|jack purcell|club c/i,
  normcore_straight_value: /classic leather|classic nylon|cortez|sl 72|authentic|jack purcell|club c/i,
  premium_runner: /new balance (990v[34]|991|993|998|1500)|astro grabber|sl 72/i,
  street_high_tech: /air max 95|new balance (2002r|2010|1906)|air force 1|knu skool/i,
  amekaji_avoid_tech: /cortez|ld-?1000|sl 72|country og|classic leather|authentic|all star j/i,
};

export function getRyoStyleTemplates(): RyoStyleTemplate[] {
  return templates.map((item) => ({ ...item, answerSignals: [...item.answerSignals], materialSignals: [...item.materialSignals], pantsSignals: [...item.pantsSignals], reasons: [...item.reasons] }));
}

export function rankRyoStyleTemplates(candidateName: string, vector: RyoPreferenceVector, features?: RyoSneakerFeatures): Array<{ template: RyoStyleTemplate; score: number }> {
  return templates.map((item) => ({ template: item, score: calculate(item.id, candidateName, vector, features) }))
    .filter((item) => item.score >= 35)
    .sort((left, right) => right.score - left.score);
}

export function scoreRyoTemplateAffinity(candidateName: string, vector: RyoPreferenceVector, features?: RyoSneakerFeatures): number {
  return rankRyoStyleTemplates(candidateName, vector, features)[0]?.score ?? 0;
}

export function buildRyoTemplateExplanation(candidateName: string, selectedTemplates: readonly RyoStyleTemplate[]): string {
  const top = selectedTemplates[0];
  return top ? `${top.label}: ${top.reasons[0] ?? `${candidateName}の素材と服装条件が一致します`}` : "一致するスタイルテンプレートは未確定です。";
}

function calculate(id: RyoStyleTemplate["id"], name: string, v: RyoPreferenceVector, f?: RyoSneakerFeatures): number {
  const candidateFit = candidatePatterns[id].test(name) ? 34 : 0;
  const leather = Boolean(f?.traits.leather) || /leather|club c|cortez|japan|country|superstar|pro leather/i.test(name);
  const suede = Boolean(f?.traits.suede) || /suede|clyde|half cab|one star/i.test(name);
  const canvas = Boolean(f?.traits.canvas) || /all star|authentic|vans era|jack purcell cl/i.test(name);
  let answerFit = 0;
  switch (id) {
    case "amekaji_denim_canvas": answerFit = active(v.style.amekaji, v.pantsFit.denim, v.materialAging.canvasFading) + (canvas ? 20 : 0); break;
    case "amekaji_denim_leather": answerFit = active(v.style.amekaji, v.pantsFit.denim, v.materialAging.leatherSinking, v.materialAging.leatherCreasing) + (leather ? 20 : 0); break;
    case "amekaji_work_suede": answerFit = active(v.style.amekaji, v.pantsFit.workPants, v.materialAging.suedeFadingNap) + (suede ? 20 : 0); break;
    case "clean_slim_leather": answerFit = active(v.style.cleanCasual, v.pantsFit.slimPants, v.materialAging.leatherSinking, v.materialAging.leatherCreasing) + (leather ? 20 : 0); break;
    case "normcore_straight_value": answerFit = active(v.style.normcore, v.pantsFit.straightPants, v.budget.under15000) + (/classic leather|classic nylon|cortez|sl 72|authentic|jack purcell|club c/i.test(name) ? 15 : 0); break;
    case "premium_runner": answerFit = active(v.budget.premiumOk, v.sportOrigin.running) + (/new balance|astro grabber|sl 72/i.test(name) ? 20 : 0); break;
    case "street_high_tech": answerFit = active(v.style.street, v.pantsFit.widePants, v.techTolerance.airMaxNbOk, v.techTolerance.pureCoolOk) + (/air max|2002r|2010|1906|air force|knu skool/i.test(name) ? 20 : 0); break;
    case "amekaji_avoid_tech": answerFit = active(v.style.amekaji, v.techTolerance.avoidTech, v.budget.under20000) + (/cortez|ld-?1000|sl 72|country|classic leather|authentic|all star/i.test(name) ? 20 : 0); break;
  }
  return Math.min(100, Math.round(candidateFit + answerFit));
}

function active(...values: number[]): number { return Math.min(46, values.filter((value) => value > 0).length * 14); }
function template(id: RyoStyleTemplate["id"], label: string, genre: string, answerSignals: string[], materialSignals: string[], pantsSignals: string[], reasons: string[]): RyoStyleTemplate {
  return { id, label, genre, answerSignals, materialSignals, pantsSignals, reasons };
}
