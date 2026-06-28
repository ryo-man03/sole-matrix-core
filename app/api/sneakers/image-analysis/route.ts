import { NextResponse } from "next/server";

import {
  analyzeSneakerImage,
  MAX_SNEAKER_IMAGE_BYTES,
  SneakerImageValidationError,
  validateSneakerImage,
} from "../../../_lib/image-analysis/sneakerVisionService";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
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
