export type FailedProductJudgementPresentation<Result, ProductLink> = {
  result: Result | null;
  productLinks: ProductLink[];
  analysisStage: "error";
  isAnalyzing: false;
  retainedPreviousResult: boolean;
  status: string;
};

export function retainPreviousProductJudgementOnFailure<Result, ProductLink>(
  current: { result: Result | null; productLinks: ProductLink[] },
  errorMessage: string,
): FailedProductJudgementPresentation<Result, ProductLink> {
  const retainedPreviousResult = current.result !== null;
  return {
    ...current,
    analysisStage: "error",
    isAnalyzing: false,
    retainedPreviousResult,
    status: retainedPreviousResult
      ? `新しい商品判断に失敗しました。前回成功した結果を表示しています。${errorMessage}`
      : errorMessage,
  };
}
