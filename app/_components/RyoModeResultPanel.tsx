import type { CandidateProfile } from "../_lib/core-v1/types";
import { buildRyoModeCandidateEvaluation } from "../_lib/ryo-mode-v4/integration";
import type { RyoAffinityBreakdown, RyoModeScoreBreakdown, RyoPreferenceVector } from "../_lib/ryo-mode-v4/types";

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

const affinityLabels: Record<keyof RyoAffinityBreakdown, string> = {
  parentModelAffinity: "親モデル相性",
  templateAffinity: "スタイルテンプレート相性",
  retroRunningAffinity: "レトロランニング相性",
  cultureAffinity: "文化背景相性",
  materialAgingAffinity: "素材の育ち相性",
  pantsAffinity: "パンツ相性",
  cautionPenalty: "注意ペナルティ",
};

export function RyoModeResultPanel({ candidate, vector, rerankingApplied = false }: { candidate: CandidateProfile; vector: RyoPreferenceVector; rerankingApplied?: boolean }) {
  const { score, opinion, culture } = buildRyoModeCandidateEvaluation(vector, candidate);
  const metadata = culture.metadata;
  return <section className="core-v1-explanation" aria-labelledby="ryo-mode-v4-title" data-ryo-mode-v4-result><p className="diagnosis-summary-kicker">Ryo Mode v4 / {rerankingApplied ? "候補選定に適用" : "商品評価"}</p><h4 id="ryo-mode-v4-title">Ryo Modeの見立て</h4><p>{rerankingApplied ? "11問の回答から候補プールを作り、Core側のrecommendationScoreで再ランキングしています。" : "11問の回答とCore側で確認できる候補特徴から、入力商品を評価しています。"}</p><div className="core-v1-score-grid"><Score label="productScore" value={score.productScore} description="靴単体の歴史・素材・形の評価" /><Score label="recommendationScore" value={score.recommendationScore} description="今回の回答条件との適合" /><Score label="totalRyoScore" value={score.totalRyoScore} description="単体評価と推薦適合の総合" /></div><dl className="diagnosis-summary-list">{(Object.keys(breakdownLabels) as (keyof RyoModeScoreBreakdown)[]).map((axis) => <div className="diagnosis-summary-item" key={axis}><dt>{breakdownLabels[axis]}</dt><dd>{score.breakdown[axis]}</dd></div>)}</dl>{score.affinities ? <dl className="diagnosis-summary-list" data-ryo-affinities>{(Object.keys(affinityLabels) as (keyof RyoAffinityBreakdown)[]).map((axis) => <div className="diagnosis-summary-item" key={axis}><dt>{affinityLabels[axis]}</dt><dd>{score.affinities?.[axis]}</dd></div>)}</dl> : null}<dl className="diagnosis-summary-list" data-ryo-culture-metadata>{culture.parentProfile ? <Metadata label="Ryo親モデル" value={culture.parentProfile.label} /> : null}{metadata.genre ? <Metadata label="ジャンル" value={metadata.genre} /> : null}{metadata.subgenre ? <Metadata label="サブジャンル" value={metadata.subgenre} /> : null}{metadata.pantsSignals?.length ? <Metadata label="パンツ相性" value={metadata.pantsSignals.join(" / ")} /> : null}{metadata.materialSignals?.length ? <Metadata label="素材の育ち" value={metadata.materialSignals.join(" / ")} /> : null}{metadata.cultureSignals?.length ? <Metadata label="文化的背景" value={metadata.cultureSignals.join(" / ")} /> : null}{metadata.musicSignals?.length ? <Metadata label="音楽・カルチャー" value={metadata.musicSignals.join(" / ")} /> : null}{candidate.priceYen !== undefined ? <Metadata label="価格帯" value={`参考価格 約${candidate.priceYen.toLocaleString("ja-JP")}円（販売元で要確認）`} /> : null}{culture.reasons[0] ? <Metadata label="Ryo理由" value={culture.reasons[0]} /> : null}{culture.cautions[0] ? <Metadata label="注意" value={culture.cautions[0]} /> : null}</dl><div className="core-v1-explanation-columns"><SignalList title="strongestSignals" items={opinion.strongestSignals} /><SignalList title="matchedSignals" items={score.matchedSignals} /><SignalList title="cautionSignals" items={score.cautionSignals} /></div><div data-ryo-opinion><h5>RyoOpinion</h5><p>{opinion.summary}</p><p>{opinion.ryoInterpretation}</p><p>{opinion.caution}</p><p><strong>次の確認:</strong> {opinion.nextStep}</p></div></section>;
}

function Metadata({ label, value }: { label: string; value: string }) {
  return <div className="diagnosis-summary-item"><dt>{label}</dt><dd>{value}</dd></div>;
}

function Score({ label, value, description }: { label: string; value: number; description: string }) {
  return <div className="core-v1-score-card"><span>{label}</span><strong>{value}</strong><meter max="100" min="0" value={value} /><small>{description}</small></div>;
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return <div><h5>{title}</h5>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>確定的な信号なし</p>}</div>;
}
