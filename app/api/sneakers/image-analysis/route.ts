import { NextResponse } from "next/server";

import {
  analyzeSneakerImage,
  MAX_SNEAKER_IMAGE_BYTES,
  SneakerImageValidationError,
  validateSneakerImage,
} from "../../../../server/services/sneakerVisionService";
import { readBoundedBody, RequestBodyError } from "../../../../src/application/http/requestSecurity";

const MAX_IMAGE_REQUEST_BYTES = MAX_SNEAKER_IMAGE_BYTES + 64 * 1024;

export async function POST(request: Request) {
  try {
    const body = await readBoundedBody(request, MAX_IMAGE_REQUEST_BYTES);
    const formData = await new Request(request.url, { method: "POST", headers: request.headers, body: body.buffer as ArrayBuffer }).formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      throw new SneakerImageValidationError(
        "IMAGE_REQUIRED",
        "分析する画像を選択してください。",
      );
    }
    if (file.size === 0 || file.size > MAX_SNEAKER_IMAGE_BYTES) {
      throw new SneakerImageValidationError(
        "INVALID_IMAGE_SIZE",
        "画像は1byte以上5MB以下にしてください。",
      );
    }
    const image = validateSneakerImage({
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type,
      fileName: file.name,
    });
    const data = await analyzeSneakerImage(image);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof RequestBodyError && error.code === "BODY_TOO_LARGE") {
      return NextResponse.json({ ok: false, error: { code: error.code, message: "画像リクエストのサイズを確認してください。" } }, { status: 413 });
    }
    if (error instanceof SneakerImageValidationError) {
      return NextResponse.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "IMAGE_ANALYSIS_ERROR", message: "画像を分析できませんでした。" },
      },
      { status: 500 },
    );
  }
}
