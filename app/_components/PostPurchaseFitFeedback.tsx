"use client";

import { type FormEvent, useRef, useState } from "react";

type Props = Readonly<{
  candidate: Readonly<{
    brand?: string | null;
    modelName?: string | null;
    name: string;
    colorwayName?: string | null;
    styleCode?: string | null;
  }>;
  audience: "men" | "women" | "unisex" | "kids" | "unknown";
}>;

export function PostPurchaseFitFeedback({ candidate, audience }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const purchaseKey = useRef<string | null>(null);
  const feedbackKey = useRef<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setMessage("購入情報を保存しています…");
    const form = new FormData(event.currentTarget);
    const sizeValue = optionalNumber(form.get("sizeValue"));
    purchaseKey.current ??= eventKey("purchase");
    feedbackKey.current ??= eventKey("fit");
    try {
      const purchaseResponse = await fetch("/api/me/purchase-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: purchaseKey.current,
          recommendationSnapshotId: null,
          wishlistItemId: null,
          brand: candidate.brand ?? "Unknown",
          modelName: candidate.modelName ?? candidate.name,
          modelFamily: candidate.modelName ?? candidate.name,
          generation: null,
          colorwayName: candidate.colorwayName,
          styleCode: candidate.styleCode,
          audience,
          sizeSystem: form.get("sizeSystem") || null,
          sizeValue,
          condition: "unknown",
          purchasedAt: new Date().toISOString().slice(0, 10),
          satisfactionRating: optionalInteger(form.get("satisfactionRating")),
        }),
      });
      const purchasePayload: unknown = await purchaseResponse.json().catch(() => null);
      if (purchaseResponse.status === 401) throw new Error("購入履歴を保存するにはログインしてください。");
      const purchaseId = responseItemId(purchasePayload);
      if (!purchaseResponse.ok || !purchaseId) throw new Error("購入情報を保存できませんでした。時間をおいて再度お試しください。");

      const feedback = {
        idempotencyKey: feedbackKey.current,
        sizeSystem: form.get("sizeSystem") || null,
        sizeValue,
        overallFit: form.get("overallFit") || null,
        toeRoom: form.get("toeRoom") || null,
        widthFeel: form.get("widthFeel") || null,
        heelHold: form.get("heelHold") || null,
        instepFeel: form.get("instepFeel") || null,
        sameSizeAgain: form.get("sameSizeAgain") === "yes" ? true : form.get("sameSizeAgain") === "no" ? false : null,
        note: String(form.get("note") ?? "").trim() || null,
      };
      if (hasFitObservation(feedback)) {
        setMessage("フィット感を保存しています…");
        const fitResponse = await fetch(`/api/me/purchase-reports/${purchaseId}/fit-feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        });
        const fitPayload: unknown = await fitResponse.json().catch(() => null);
        if (!fitResponse.ok) throw new Error("購入情報は保存しましたが、フィット感を保存できませんでした。再送できます。");
        setMessage(responseMessage(fitPayload) ?? "フィット感を保存しました");
      } else {
        setMessage("購入情報とOwned sneakerを保存しました");
      }
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "保存できませんでした。");
    }
  }

  return (
    <section className="post-purchase-feedback" aria-labelledby="post-purchase-feedback-title">
      <div>
        <p className="diagnosis-summary-kicker">購入後フィードバック</p>
        <h5 id="post-purchase-feedback-title">この靴を購入しましたか？</h5>
        <p>任意の短い記録です。おすすめ順位やCore判定を自動で変更しません。</p>
      </div>
      {!open ? <button className="diagnosis-secondary-button" type="button" onClick={() => setOpen(true)}>購入・フィット感を記録</button> : null}
      {open ? <form className="post-purchase-feedback-form" onSubmit={submit}>
        <label>サイズ表記<select name="sizeSystem" defaultValue=""><option value="">未選択</option><option value="JP">JP</option><option value="US_M">US Men</option><option value="US_W">US Women</option><option value="UK">UK</option><option value="EU">EU</option></select></label>
        <label>購入サイズ<input name="sizeValue" min="1" max="99.5" step="0.5" inputMode="decimal" type="number" /></label>
        <label>全体のフィット<select name="overallFit" defaultValue=""><option value="">未選択</option><option value="too_small">小さすぎる</option><option value="slightly_small">やや小さい</option><option value="true_to_size">標準的</option><option value="slightly_large">やや大きい</option><option value="too_large">大きすぎる</option></select></label>
        <label>横幅<select name="widthFeel" defaultValue=""><option value="">未選択</option><option value="tight">きつい</option><option value="slightly_tight">ややきつい</option><option value="comfortable">ちょうどよい</option><option value="slightly_roomy">ややゆとり</option><option value="roomy">ゆとりあり</option></select></label>
        <label>つま先<select name="toeRoom" defaultValue=""><option value="">未選択</option><option value="tight">きつい</option><option value="good">ちょうどよい</option><option value="roomy">ゆとりあり</option></select></label>
        <label>かかと<select name="heelHold" defaultValue=""><option value="">未選択</option><option value="slipping">抜ける</option><option value="secure">安定</option><option value="tight">きつい</option></select></label>
        <label>甲<select name="instepFeel" defaultValue=""><option value="">未選択</option><option value="tight">きつい</option><option value="comfortable">ちょうどよい</option><option value="roomy">ゆとりあり</option></select></label>
        <label>次回も同じサイズ？<select name="sameSizeAgain" defaultValue=""><option value="">未選択</option><option value="yes">はい</option><option value="no">いいえ</option></select></label>
        <label>購入満足度<select name="satisfactionRating" defaultValue=""><option value="">未選択</option><option value="5">5 とても満足</option><option value="4">4 満足</option><option value="3">3 ふつう</option><option value="2">2 やや不満</option><option value="1">1 不満</option></select></label>
        <label className="post-purchase-feedback-note">メモ（任意）<textarea name="note" maxLength={500} rows={2} /></label>
        <div className="post-purchase-feedback-actions"><button className="diagnosis-primary-button" disabled={status === "saving"} type="submit">{status === "saving" ? "保存中…" : "記録する"}</button><button className="diagnosis-secondary-button" disabled={status === "saving"} type="button" onClick={() => setOpen(false)}>閉じる</button></div>
      </form> : null}
      {message ? <p className={status === "error" ? "rakuten-market-find-error" : "rakuten-market-find-status"} aria-live="polite" role="status">{message}</p> : null}
    </section>
  );
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalInteger(value: FormDataEntryValue | null): number | null {
  const parsed = optionalNumber(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
}

function hasFitObservation(value: Record<string, unknown>): boolean {
  return Object.entries(value).some(([key, item]) => key !== "idempotencyKey" && item !== null && item !== "");
}

function responseItemId(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.item) || typeof value.data.item.id !== "string") return null;
  return value.data.item.id;
}

function responseMessage(value: unknown): string | null {
  return isRecord(value) && isRecord(value.data) && typeof value.data.message === "string" ? value.data.message : null;
}

function eventKey(prefix: string): string {
  return `${prefix}:${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
