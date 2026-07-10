"use client";

import { useEffect, useState } from "react";

import type { SessionStorage } from "../_lib/auth-session/types";
import {
  createOnboardingPreferenceHint,
  writeTemporaryOnboardingHint,
} from "../_lib/onboarding/onboardingProfile";
import type {
  OnboardingAnswers,
  OnboardingBudget,
  OnboardingPreferenceHint,
  OnboardingPriority,
  OnboardingPurpose,
  SneakerExperience,
} from "../_lib/onboarding/types";
import { getAuthSession } from "../_lib/apiClient";

const purposeOptions: Array<{ id: OnboardingPurpose; label: string }> = [
  { id: "purchase_decision", label: "買うか迷っている" },
  { id: "market_price", label: "相場を見たい" },
  { id: "collection_overlap", label: "手持ちと被るか知りたい" },
  { id: "outfit_fit", label: "コーデに合うか見たい" },
];

const experienceOptions: Array<{ id: SneakerExperience; label: string }> = [
  { id: "beginner", label: "初心者" },
  { id: "enthusiast", label: "そこそこ好き" },
  { id: "collector", label: "コレクター寄り" },
];

const budgetOptions: Array<{ id: OnboardingBudget; label: string }> = [
  { id: "under_10000", label: "1万円以下" },
  { id: "10000_20000", label: "1〜2万円" },
  { id: "20000_40000", label: "2〜4万円" },
  { id: "over_40000", label: "4万円以上" },
];

const priorityOptions: Array<{ id: OnboardingPriority; label: string }> = [
  { id: "versatility", label: "合わせやすさ" },
  { id: "culture", label: "文化的背景" },
  { id: "rarity", label: "希少性" },
  { id: "price", label: "価格" },
  { id: "comfort", label: "履き心地" },
  { id: "longevity", label: "長く履けるか" },
];

export function OnboardingFlow() {
  const [purpose, setPurpose] = useState<OnboardingPurpose | null>(null);
  const [experience, setExperience] = useState<SneakerExperience | null>(null);
  const [budget, setBudget] = useState<OnboardingBudget | null>(null);
  const [priorities, setPriorities] = useState<OnboardingPriority[]>([]);
  const [hint, setHint] = useState<OnboardingPreferenceHint | null>(null);
  const [message, setMessage] = useState("重視する項目は3つまで選べます。");
  const [nextHref, setNextHref] = useState("/app?session=guest");

  useEffect(() => {
    void getAuthSession().then((result) => {
      if (result.ok && result.data.status === "user") setNextHref("/app");
    });
  }, []);

  function togglePriority(priority: OnboardingPriority) {
    setPriorities((current) => {
      if (current.includes(priority)) {
        return current.filter((item) => item !== priority);
      }
      if (current.length >= 3) {
        setMessage("重視する項目は3つまでです。");
        return current;
      }
      return [...current, priority];
    });
  }

  function handleComplete() {
    if (!purpose || !experience || !budget || priorities.length === 0) {
      setMessage("目的・経験・予算・重視する項目を選んでください。");
      return;
    }
    const answers: OnboardingAnswers = {
      purpose,
      experience,
      budget,
      priorities,
    };
    const nextHint = createOnboardingPreferenceHint(answers);
    writeTemporaryOnboardingHint(getSessionStorage(), nextHint);
    setHint(nextHint);
    setMessage(
      "初回設定を一時保存しました。これは好みの補助情報で、Core Decisionを直接変更しません。",
    );
  }

  return (
    <section className="onboarding-flow" aria-labelledby="onboarding-title">
      <div className="onboarding-intro">
        <p className="home-kicker">First setup</p>
        <h1 id="onboarding-title">あなたの迷い方を、先に教えてください。</h1>
        <p>
          回答は候補の並べ方と入力補助にだけ使います。買う・待つの最終判断は既存Coreが決めます。
        </p>
        <div className="onboarding-skip-row">
          <span>4項目・約1分</span>
          <a href={nextHref}>今回はスキップして診断へ</a>
        </div>
      </div>

      <OnboardingQuestion title="目的" description="今回、いちばん知りたいこと">
        <OptionButtons options={purposeOptions} selected={[purpose]} onSelect={(id) => setPurpose(id as OnboardingPurpose)} />
      </OnboardingQuestion>

      <OnboardingQuestion title="スニーカー経験" description="説明の深さを調整する参考">
        <OptionButtons options={experienceOptions} selected={[experience]} onSelect={(id) => setExperience(id as SneakerExperience)} />
      </OnboardingQuestion>

      <OnboardingQuestion title="予算感" description="価格帯の入力補助">
        <OptionButtons options={budgetOptions} selected={[budget]} onSelect={(id) => setBudget(id as OnboardingBudget)} />
      </OnboardingQuestion>

      <OnboardingQuestion title="重視" description="1〜3個選択">
        <OptionButtons options={priorityOptions} selected={priorities} onSelect={(id) => togglePriority(id as OnboardingPriority)} multiple />
      </OnboardingQuestion>

      <p className="onboarding-message" aria-live="polite">{message}</p>
      <button className="onboarding-complete" onClick={handleComplete} type="button">
        初回設定を完了する
      </button>

      {hint ? (
        <div className="onboarding-complete-panel">
          <strong>Preference profile ready</strong>
          <p>補助タグ: {hint.preferenceTags.join(" / ") || "なし"}</p>
          <p>ゲストではこのタブの一時状態だけに保存されます。</p>
          <a href={nextHref}>この設定で診断へ</a>
        </div>
      ) : null}
    </section>
  );
}

function OnboardingQuestion({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="onboarding-question" aria-labelledby={`onboarding-${title}`}>
      <div>
        <h2 id={`onboarding-${title}`}>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function OptionButtons({
  options,
  selected,
  onSelect,
  multiple = false,
}: {
  options: Array<{ id: string; label: string }>;
  selected: Array<string | null>;
  onSelect: (id: string) => void;
  multiple?: boolean;
}) {
  return (
    <div className="onboarding-options" role="group">
      {options.map((option) => (
        <button
          aria-pressed={selected.includes(option.id)}
          data-selected={selected.includes(option.id)}
          key={option.id}
          onClick={() => onSelect(option.id)}
          type="button"
        >
          {option.label}
          {multiple && selected.includes(option.id) ? <span>選択中</span> : null}
        </button>
      ))}
    </div>
  );
}

function getSessionStorage(): SessionStorage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
