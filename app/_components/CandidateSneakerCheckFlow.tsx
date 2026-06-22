"use client";

import { useState } from "react";

import {
  candidateSneakerTagOptions,
  maxCandidateTagSelection,
  type CandidateTagId,
} from "../_data/candidateSneakerOptions";

import { CandidateBasicInfoStep } from "./CandidateBasicInfoStep";
import { CandidateConfirmStep } from "./CandidateConfirmStep";
import { CandidateStepIndicator } from "./CandidateStepIndicator";
import { CandidateTagStep } from "./CandidateTagStep";
import { PrototypeReadinessPanel } from "./PrototypeReadinessPanel";

const candidateStepLabels = ["基本情報", "特徴タグ", "入力確認"];

export function CandidateSneakerCheckFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sneakerName, setSneakerName] = useState("");
  const [brand, setBrand] = useState("");
  const [seenPriceText, setSeenPriceText] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<CandidateTagId[]>([]);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [sneakerNameError, setSneakerNameError] = useState("");
  const [tagError, setTagError] = useState("");
  const selectedTagLabels = candidateSneakerTagOptions
    .filter((tag) => selectedTagIds.includes(tag.id))
    .map((tag) => tag.label);

  function handleNextFromBasicInfo() {
    if (!sneakerName.trim()) {
      setSneakerNameError("スニーカー名を入力してください。");
      return;
    }

    setSneakerNameError("");
    setCurrentStep(2);
  }

  function handleNextFromTags() {
    if (selectedTagIds.length === 0) {
      setTagError("特徴タグを1つ以上選んでください。");
      return;
    }

    setTagError("");
    setCurrentStep(3);
  }

  function handleToggleTag(tagId: CandidateTagId) {
    setTagError("");
    setSelectedTagIds((currentTagIds) => {
      if (currentTagIds.includes(tagId)) {
        return currentTagIds.filter((currentTagId) => currentTagId !== tagId);
      }

      if (currentTagIds.length >= maxCandidateTagSelection) {
        return currentTagIds;
      }

      return [...currentTagIds, tagId];
    });
  }

  function handleConfirm() {
    setIsSummaryVisible(true);
  }

  function handleBack() {
    setIsSummaryVisible(false);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  return (
    <section
      className="candidate-check-section"
      aria-labelledby="candidate-check-title"
    >
      <div className="candidate-intro">
        <p className="candidate-kicker">入力の流れ</p>
        <h2 id="candidate-check-title">気になる一足を整理する</h2>
        <p>
          気になる一足について、名前・理由・メモを順番に整理します。
        </p>
        <p className="candidate-flow-boundary">
          今は購入判断や推薦結果ではなく、入力内容の整理に集中します。
        </p>
      </div>

      <div className="candidate-progress-summary" aria-live="polite">
        <div>
          <span>Step {currentStep} / {candidateStepLabels.length}</span>
          <strong>{candidateStepLabels[currentStep - 1]}</strong>
        </div>
        <progress
          aria-label={`入力ステップ ${currentStep} / ${candidateStepLabels.length}`}
          max={candidateStepLabels.length}
          value={currentStep}
        />
      </div>

      <CandidateStepIndicator currentStep={currentStep} />

      {currentStep === 1 ? (
        <CandidateBasicInfoStep
          brand={brand}
          budgetText={budgetText}
          memo={memo}
          onBrandChange={setBrand}
          onBudgetTextChange={setBudgetText}
          onMemoChange={setMemo}
          onSeenPriceTextChange={setSeenPriceText}
          onSneakerNameChange={(value) => {
            setSneakerName(value);
            if (value.trim()) {
              setSneakerNameError("");
            }
          }}
          seenPriceText={seenPriceText}
          sneakerName={sneakerName}
          sneakerNameError={sneakerNameError}
        />
      ) : null}

      {currentStep === 2 ? (
        <CandidateTagStep
          onToggleTag={handleToggleTag}
          selectedTagIds={selectedTagIds}
          tagError={tagError}
        />
      ) : null}

      {currentStep === 3 ? (
        <>
          <CandidateConfirmStep
            brand={brand}
            budgetText={budgetText}
            isSummaryVisible={isSummaryVisible}
            memo={memo}
            onConfirm={handleConfirm}
            onEditBasicInfo={() => {
              setIsSummaryVisible(false);
              setCurrentStep(1);
            }}
            onEditTags={() => {
              setIsSummaryVisible(false);
              setCurrentStep(2);
            }}
            seenPriceText={seenPriceText}
            selectedTagIds={selectedTagIds}
            sneakerName={sneakerName}
          />
          {isSummaryVisible ? (
            <>
              <div className="candidate-preparation-bridge">
                <p className="candidate-step-kicker">Next</p>
                <h3>整理した内容から、準備状態を確認します</h3>
                <p>
                  ここから先も推薦結果ではありません。入力した内容が、次の確認へ進める状態かを見直します。
                </p>
              </div>
              <PrototypeReadinessPanel
                candidateDisplayName={sneakerName.trim()}
                hasBudgetMemo={Boolean(budgetText.trim())}
                hasPriceMemo={Boolean(seenPriceText.trim())}
                selectedTagLabels={selectedTagLabels}
              />
            </>
          ) : (
            <p className="candidate-preparation-note">
              入力内容を確認すると、推薦準備チェックで整理状態を確認できます。
            </p>
          )}
        </>
      ) : null}

      {currentStep < 3 ? (
        <div className="candidate-actions">
          <button
            className="candidate-secondary-button"
            disabled={currentStep === 1}
            onClick={handleBack}
            type="button"
          >
            戻る
          </button>
          <button
            className="candidate-primary-button"
            onClick={currentStep === 1 ? handleNextFromBasicInfo : handleNextFromTags}
            type="button"
          >
            次へ
          </button>
        </div>
      ) : (
        <div className="candidate-actions">
          <button
            className="candidate-secondary-button"
            onClick={handleBack}
            type="button"
          >
            戻る
          </button>
        </div>
      )}
    </section>
  );
}
