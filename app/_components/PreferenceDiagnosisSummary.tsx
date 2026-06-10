import type {
  DiagnosisAnswerId,
  DiagnosisQuestion,
} from "../_data/preferenceDiagnosisQuestions";

const answerLabels: Record<DiagnosisAnswerId, string> = {
  like: "好き",
  neutral: "普通",
  dislike: "苦手",
};

type PreferenceDiagnosisSummaryProps = {
  questions: DiagnosisQuestion[];
  selectedAnswerByQuestionId: Record<string, DiagnosisAnswerId | undefined>;
};

export function PreferenceDiagnosisSummary({
  questions,
  selectedAnswerByQuestionId,
}: PreferenceDiagnosisSummaryProps) {
  return (
    <section
      className="diagnosis-summary"
      aria-labelledby="diagnosis-summary-title"
    >
      <p className="diagnosis-summary-kicker">回答サマリー</p>
      <h3 id="diagnosis-summary-title">診断内容の確認</h3>
      <p className="diagnosis-summary-lead">
        ここでは、質問ごとの回答だけを確認します。この結果はまだ購入判断には使われません。
      </p>
      <dl className="diagnosis-summary-list">
        {questions.map((question, index) => {
          const answerId = selectedAnswerByQuestionId[question.id];

          return (
            <div className="diagnosis-summary-item" key={question.id}>
              <dt>
                <span>Q{index + 1}</span>
                {question.question}
              </dt>
              <dd>{answerId ? answerLabels[answerId] : "未回答"}</dd>
            </div>
          );
        })}
      </dl>
      <p className="diagnosis-summary-note">
        個別スニーカー入力やCore推薦への接続は後続工程で行います。
      </p>
    </section>
  );
}
