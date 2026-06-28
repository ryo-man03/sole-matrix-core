"use client";

import { useState } from "react";

const workspaceModes = [
  {
    id: "ryo",
    label: "Ryo Mode",
    description: "文化的背景とコレクションとの関係を深く見る",
  },
  {
    id: "balanced",
    label: "Balanced Mode",
    description: "価格・汎用性・購入リスクを冷静に見る",
  },
] as const;

export function RecommendationWorkspace() {
  const [mode, setMode] = useState<(typeof workspaceModes)[number]["id"]>(
    "ryo",
  );
  const [sneakerName, setSneakerName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [imageName, setImageName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState(
    "入力を整えて、8問診断へ進んでください。",
  );

  const selectedMode = workspaceModes.find((item) => item.id === mode)!;

  function handleStartDiagnosis() {
    setWorkspaceStatus(
      sneakerName.trim()
        ? `${sneakerName.trim()}を候補として8問診断を開始します。`
        : "8問診断を開始します。スニーカー名は後から追加できます。",
    );
    document.getElementById("core-v1")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handlePreviewUser() {
    const normalizedUserId = userId.trim();
    const normalizedDisplayName = displayName.trim();

    if (!normalizedUserId || !normalizedDisplayName) {
      setWorkspaceStatus("ユーザーIDと表示名を入力してください。");
      return;
    }

    setCurrentUser(`${normalizedDisplayName} / ${normalizedUserId}`);
    setWorkspaceStatus(
      "ユーザー情報をこの画面に反映しました。永続保存は次の実装段階で接続します。",
    );
  }

  return (
    <section
      aria-labelledby="recommendation-workspace-title"
      className="recommendation-workspace"
      id="recommendation-workspace"
    >
      <div className="workspace-heading">
        <div>
          <p className="workspace-kicker">All-in-one workspace</p>
          <h2 id="recommendation-workspace-title">
            一足の情報を、ひとつの画面で判断材料へ。
          </h2>
        </div>
        <div className="mode-toggle" aria-label="推薦モード" role="group">
          {workspaceModes.map((item) => (
            <button
              aria-pressed={mode === item.id}
              data-active={mode === item.id}
              key={item.id}
              onClick={() => {
                setMode(item.id);
                setWorkspaceStatus(`${item.label}へ切り替えました。`);
              }}
              type="button"
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="workspace-status" aria-live="polite">
        {workspaceStatus}
      </p>

      <div className="workspace-grid">
        <section
          aria-labelledby="workspace-input-title"
          className="workspace-panel workspace-input-panel"
        >
          <div className="workspace-panel-heading">
            <span>01 / INPUT</span>
            <h3 id="workspace-input-title">入力エリア</h3>
            <p>診断と候補情報を、無理のない順番で集めます。</p>
          </div>

          <div className="diagnosis-entry-row">
            <div>
              <strong>8問診断</strong>
              <span>好みをPreferenceVectorへ変換</span>
            </div>
            <span className="workspace-chip">0 / 8</span>
          </div>

          <div className="workspace-fields">
            <label>
              <span>スニーカー名</span>
              <input
                onChange={(event) => setSneakerName(event.target.value)}
                placeholder="例: adidas Samba OG"
                type="text"
                value={sneakerName}
              />
            </label>
            <label>
              <span>商品URL</span>
              <input
                inputMode="url"
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://example.com/item"
                type="url"
                value={productUrl}
              />
              <small>安全なserver-side解析は後続フェーズで接続します。</small>
            </label>
            <label>
              <span>画像アップロード</span>
              <input
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setImageName(event.target.files?.[0]?.name ?? "")
                }
                type="file"
              />
              <small>{imageName || "JPEG / PNG / WebP"}</small>
            </label>
            <label>
              <span>予算</span>
              <input
                inputMode="numeric"
                min="1"
                onChange={(event) => setBudgetText(event.target.value)}
                placeholder="例: 20000"
                type="number"
                value={budgetText}
              />
            </label>
          </div>

          <button
            className="workspace-primary-button"
            onClick={handleStartDiagnosis}
            type="button"
          >
            8問診断を開始する
          </button>
        </section>

        <section
          aria-labelledby="workspace-result-title"
          className="workspace-panel workspace-result-panel"
        >
          <div className="workspace-panel-heading">
            <span>02 / RESULT</span>
            <h3 id="workspace-result-title">解析・推薦結果</h3>
            <p>{selectedMode.label}の観点を選択中です。</p>
          </div>

          <div className="workspace-decision-placeholder">
            <span>Decision</span>
            <strong>診断待ち</strong>
            <p>
              scoreとDecisionは、AIではなくCore v1のTypeScriptルールが決定します。
            </p>
          </div>

          <div className="workspace-score-preview">
            <div>
              <span>Balanced Score</span>
              <strong>--</strong>
            </div>
            <div>
              <span>Ryo Score</span>
              <strong>--</strong>
            </div>
          </div>

          <dl className="workspace-result-list">
            <div>
              <dt>Mode reason</dt>
              <dd>{selectedMode.description}</dd>
            </div>
            <div>
              <dt>Cautions</dt>
              <dd>URL・画像・価格の確認後に表示します。</dd>
            </div>
          </dl>
        </section>

        <aside
          aria-labelledby="workspace-user-title"
          className="workspace-panel workspace-user-panel"
        >
          <div className="workspace-panel-heading">
            <span>03 / USER</span>
            <h3 id="workspace-user-title">ユーザー情報</h3>
            <p>好みと判断履歴を、ユーザーごとに育てます。</p>
          </div>

          <div className="workspace-fields workspace-user-fields">
            <label>
              <span>ユーザーID</span>
              <input
                autoComplete="username"
                onChange={(event) => setUserId(event.target.value)}
                placeholder="ryo_01"
                type="text"
                value={userId}
              />
            </label>
            <label>
              <span>表示名</span>
              <input
                autoComplete="name"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Ryo"
                type="text"
                value={displayName}
              />
            </label>
          </div>

          <button
            className="workspace-secondary-button"
            onClick={handlePreviewUser}
            type="button"
          >
            この画面に反映する
          </button>

          <div className="workspace-user-summary">
            <span>現在のユーザー</span>
            <strong>{currentUser || "未登録"}</strong>
          </div>

          <div className="workspace-memory-preview">
            <div>
              <span>Memory summary</span>
              <strong>0 notes</strong>
            </div>
            <div>
              <span>Feedback history</span>
              <strong>0 items</strong>
            </div>
          </div>

          <div className="workspace-mode-note" data-mode={mode}>
            <span>{selectedMode.label}</span>
            <p>{selectedMode.description}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
