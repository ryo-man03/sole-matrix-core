import type { SneakerVisualAnalysis } from "../../app/_lib/image-analysis/types";
import type { SneakerUrlAnalysis } from "../../app/_lib/url-analysis/types";
import {
  analyzeSneakerImage,
  MAX_SNEAKER_IMAGE_BYTES,
  SneakerImageValidationError,
  validateSneakerImage,
} from "../services/sneakerVisionService";
import { analyzeSneakerUrlSafely } from "../services/sneakerUrlService";

export type AnalyzeSneakerDependencies = {
  analyzeUrl?: (url: string) => Promise<SneakerUrlAnalysis>;
  analyzeImage?: (
    image: ReturnType<typeof validateSneakerImage>,
  ) => Promise<SneakerVisualAnalysis>;
};

export async function analyzeSneakerRequest(
  request: Request,
  dependencies: AnalyzeSneakerDependencies = {},
): Promise<Response> {
  try {
    const formData = await request.formData();
    const sneakerName = normalizeText(formData.get("sneakerName"), 160);
    const url = normalizeText(formData.get("url"), 2_048);
    const fileValue = formData.get("image");
    const imageFile = isFileLike(fileValue) ? fileValue : undefined;

    if (!sneakerName && !url && !imageFile) {
      return Response.json(
        {
          ok: false,
          error: {
            code: "ANALYSIS_INPUT_REQUIRED",
            message: "スニーカー名、商品URL、画像のいずれかを入力してください。",
          },
        },
        { status: 400 },
      );
    }

    const urlTask = url
      ? (dependencies.analyzeUrl ?? analyzeSneakerUrlSafely)(url)
      : Promise.resolve(undefined);
    const imageTask = imageFile
      ? analyzeImageFile(imageFile, dependencies.analyzeImage)
      : Promise.resolve(undefined);
    const [urlAnalysis, visualAnalysis] = await Promise.all([urlTask, imageTask]);

    return Response.json({
      ok: true,
      data: {
        ...(sneakerName ? { sneakerName } : {}),
        ...(urlAnalysis ? { urlAnalysis } : {}),
        ...(visualAnalysis ? { visualAnalysis } : {}),
      },
    });
  } catch (error) {
    if (error instanceof SneakerImageValidationError) {
      return Response.json(
        { ok: false, error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    return Response.json(
      {
        ok: false,
        error: { code: "SNEAKER_ANALYSIS_ERROR", message: "スニーカー情報を分析できませんでした。" },
      },
      { status: 500 },
    );
  }
}

async function analyzeImageFile(
  file: FileLike,
  analyzer: AnalyzeSneakerDependencies["analyzeImage"],
) {
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
  return (analyzer ?? analyzeSneakerImage)(image);
}

type FileLike = {
  name: string;
  type: string;
  size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "type" in value &&
    "size" in value &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function"
  );
}

function normalizeText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
