import type { CandidateProfile } from "../_lib/core-v1/types";
import { buildRyoModeCandidateEvaluation } from "../_lib/ryo-mode-v4/integration";
import type { RyoModeScoreBreakdown, RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";

const breakdownLabels: Record<keyof RyoModeScoreBreakdown, string> = {
  historyOrigin: "歴史・競技背景",
  materialAging: "素材の育ち",
  silhouetteCutWearing: "カット・履き方",
  pantsCompatibility: "パンツ相性",
  colorTaste: "色・テイスト",
  styleSportContext: "服装・スポーツ文脈",
  affordability: "予算適合",
  playfulness: "遊び心",
};

export function RyoModeResultPanel({ candidate, vector, rerankingApplied = false }: { candidate: CandidateProfile; vector: RyoPreferenceVector; rerankingApplied?: boolean }) {
  const { score, opinion } = buildRyoModeCandidateEvaluation(vector, candidate);
  return <section className="core-v1-explanation" aria-labelledby="ryo-mode-v4-title" data-ryo-mode-v4-result><p className="diagnosis-summary-kicker">Ryo Mode v4 / {rerankingApplied ? "候補選定に適用" : "商品評価"}</p><h4 id="ryo-mode-v4-title">Ryo Modeの見立て</h4><p>{rerankingApplied ? "11問の回答から候補プールを作り、Core側のrecommendationScoreで再ランキングしています。" : "11問の回答とCore側で確認できる候補特徴から、入力商品を評価しています。"}</p><div className="core-v1-score-grid"><Score label="productScore" value={score.productScore} description="靴単体の歴史・素材・形の評価" /><Score label="recommendationScore" value={score.recommendationScore} description="今回の回答条件との適合" /><Score label="totalRyoScore" value={score.totalRyoScore} description="単体評価と推薦適合の総合" /></div><dl className="diagnosis-summary-list">{(Object.keys(breakdownLabels) as (keyof RyoModeScoreBreakdown)[]).map((axis) => <div className="diagnosis-summary-item" key={axis}><dt>{breakdownLabels[axis]}</dt><dd>{score.breakdown[axis]}</dd></div>)}</dl><div className="core-v1-explanation-columns"><SignalList title="strongestSignals" items={opinion.strongestSignals} /><SignalList title="matchedSignals" items={score.matchedSignals} /><SignalList title="cautionSignals" items={score.cautionSignals} /></div><div data-ryo-opinion><h5>RyoOpinion</h5><p>{opinion.summary}</p><p>{opinion.ryoInterpretation}</p><p>{opinion.caution}</p><p><strong>次の確認:</strong> {opinion.nextStep}</p></div></section>;
}

function Score({ label, value, description }: { label: string; value: number; description: string }) {
  return <div className="core-v1-score-card"><span>{label}</span><strong>{value}</strong><meter max="100" min="0" value={value} /><small>{description}</small></div>;
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return <div><h5>{title}</h5>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>確定的な信号なし</p>}</div>;
}
