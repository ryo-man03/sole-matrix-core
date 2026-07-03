export type GeminiSneakerResearchInput = {
  answersSummary: string;
  preferenceVector: unknown;
  budget: string | null;
  mode: "ryo" | "balanced";
};

export function buildGeminiSneakerResearchPrompt(input: GeminiSneakerResearchInput): string {
  return `
あなたはスニーカー購入判断アプリ SOLE//MATRIX の候補調査担当です。
Google検索を必ず使い、8問診断に合う実在スニーカーを3件だけ調査してください。

要件:
- ブランド名だけ、カテゴリ名だけではなく、販売・紹介ページで実在確認できる具体モデル名を書く
- 各モデル名を、そのモデルを裏付ける検索結果の引用が付く文章中に明記する
- 診断回答に結びつく理由と、購入前に確認すべき一般的な注意点を書く
- 価格、在庫、サイズ、真贋、購入可能性を保証しない
- URLを推測して本文へ書かない。出典はGoogle Search Groundingの引用機能に任せる
- JSON化は後段で行うため、この回答では読みやすい短い調査メモにする

mode: ${input.mode}
budget: ${input.budget ?? "未入力"}

8問診断の回答要約:
${input.answersSummary}

PreferenceVector:
${JSON.stringify(input.preferenceVector, null, 2)}
`.trim();
}

export function buildGeminiSneakerNormalizationPrompt(groundedResearch: string): string {
  return `
次のGoogle Search Grounding済み調査メモだけを、指定されたJSON schemaへ整形してください。
意味、候補、事実を追加しないでください。URLは出力しないでください。
modelNameは調査メモに明記された具体的なスニーカーモデル名に限定してください。
ブランド名だけ、抽象カテゴリ、一般名称は候補にしないでください。
候補は最大3件です。JSON以外を出力しないでください。

調査メモ:
${groundedResearch}
`.trim();
}

export function buildGeminiSneakerRepairPrompt(malformedJson: string): string {
  return `
次の出力について、意味やfieldや候補を追加・削除せず、JSON構文だけを修復してください。
修復不能、または必須fieldが不足している場合は元の構造を保ってください。
JSON以外を出力しないでください。

修復対象:
${malformedJson}
`.trim();
}
