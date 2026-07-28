import type { PurchasePurpose } from "../diagnosis/sneakerContext";

export type GeminiSneakerResearchInputV2 = {
  answersSummary: string;
  preferenceVector: unknown;
  purchasePurpose: PurchasePurpose;
  ownedModels: string[];
  dislikedModels: string[];
  dislikedSignals: string[];
  budget: string | null;
  mode: "ryo" | "balanced";
};

export type GeminiSneakerResearchInput = GeminiSneakerResearchInputV2;

export function buildGeminiSneakerResearchPrompt(input: GeminiSneakerResearchInputV2): string {
  return `
あなたはスニーカー購入判断アプリ SOLE//MATRIX の候補調査担当です。
Google検索を必ず使い、11問診断と今回の購入目的に合う実在スニーカーを最大3件調査してください。

要件:
- ブランド名だけ、カテゴリ名だけではなく、販売・紹介ページで実在確認できる具体モデル名を書く
- 各モデル名を、そのモデルを裏付ける検索結果の引用が付く文章中に明記する
- カラーを提案する場合は、公式・正規販売店・信頼できる販売または紹介ページで確認できる正式カラー名を書く
- カラーの根拠が確認できない場合は「カラー未確認」と明記する
- Style Code / SKUを確認できない場合は「未確認」と明記する
- 色やStyle Codeを記憶だけで補完しない。「Black/Whiteっぽい」などの推測色を作らない
- unreleased rumor、custom、fake、inspired、type、style、風商品を通常候補にしない
- 診断回答に結びつく理由と、購入前に確認すべき一般的な注意点を書く
- 価格、在庫、サイズ、真贋、購入可能性を保証しない
- URLを推測して本文へ書かない。出典はGoogle Search Groundingの引用機能に任せる
- Ryo Modeでも明示回答と矛盾する候補を出さない
- JSON化は後段で行うため、この回答では読みやすい短い調査メモにする
- 各候補にブランド、モデル名、カラー名または「カラー未確認」、Style Codeまたは「未確認」、適合理由、購入前の注意を明記する

mode: ${input.mode}
budget: ${input.budget ?? "未入力"}
purchasePurpose: ${input.purchasePurpose}
ownedModels: ${input.ownedModels.join(" / ") || "未入力"}
dislikedModels: ${input.dislikedModels.join(" / ") || "未入力"}
dislikedSignals: ${input.dislikedSignals.join(" / ") || "未入力"}

11問診断の回答要約:
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
modelNameへカラー名を混ぜず、colorwayNameへ分離してください。
colorwayNameは調査メモで実在根拠が確認できる場合だけ設定し、確認できない場合はnullにしてください。
styleCodeは調査メモで確認できる場合だけ設定し、確認できない場合はnullにしてください。
ブランド名だけ、抽象カテゴリ、一般名称は候補にしないでください。
custom、inspired、type、style、風商品は候補にしないでください。
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
