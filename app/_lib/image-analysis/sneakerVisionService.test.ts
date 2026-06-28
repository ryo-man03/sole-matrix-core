import {
  analyzeSneakerImage,
  SneakerImageValidationError,
  validateSneakerImage,
} from "./sneakerVisionService";

const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

describe("sneaker image validation", () => {
  it("accepts a supported image with matching magic bytes", () => {
    const image = validateSneakerImage({
      bytes: jpegBytes,
      mimeType: "image/jpeg",
      fileName: "../../shoe photo.jpg",
    });

    expect(image.mimeType).toBe("image/jpeg");
    expect(image.fileName).toBe("shoe_photo.jpg");
    expect(image.bytes).not.toBe(jpegBytes);
  });

  it("rejects unsupported, oversized, and mismatched uploads", () => {
    expect(() =>
      validateSneakerImage({ bytes: jpegBytes, mimeType: "image/svg+xml" }),
    ).toThrow(SneakerImageValidationError);
    expect(() =>
      validateSneakerImage({
        bytes: new Uint8Array(5 * 1024 * 1024 + 1),
        mimeType: "image/jpeg",
      }),
    ).toThrowError(expect.objectContaining({ code: "INVALID_IMAGE_SIZE" }));
    expect(() =>
      validateSneakerImage({
        bytes: new Uint8Array([0x00, 0x01, 0x02]),
        mimeType: "image/jpeg",
      }),
    ).toThrowError(expect.objectContaining({ code: "IMAGE_SIGNATURE_MISMATCH" }));
  });
});

describe("Gemini sneaker visual analysis", () => {
  const image = validateSneakerImage({
    bytes: jpegBytes,
    mimeType: "image/jpeg",
    fileName: "shoe.jpg",
  });

  it("returns structured fallback without a key", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await analyzeSneakerImage(image, { apiKey: "", fetcher });

    expect(result).toMatchObject({
      silhouette: "unknown",
      category: "unknown",
      confidence: 0,
      vintageScore: 0,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes qualitative Gemini signals into TypeScript visual scores", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      geminiResponse({
        detectedBrand: "Puma",
        detectedModelName: "Clyde MIJ",
        detectedColorway: "Navy / White",
        mainColors: ["navy", "white"],
        silhouette: "low",
        category: "basketball",
        materialHints: ["suede", "leather"],
        vintageSignal: "high",
        streetSignal: "medium",
        cleanSignal: "high",
        uniquenessSignal: "medium",
        culturalContext: ["basketball heritage", "Japanese production"],
        confidence: 0.86,
        cautions: ["モデル名は画像からの推定です。"],
      }),
    );

    const result = await analyzeSneakerImage(image, {
      apiKey: "configured",
      fetcher,
    });

    expect(result).toMatchObject({
      detectedBrand: "Puma",
      detectedModelName: "Clyde MIJ",
      silhouette: "low",
      category: "basketball",
      vintageScore: 90,
      streetScore: 60,
      cleanScore: 90,
      uniquenessScore: 60,
      confidence: 0.86,
    });
    const [, init] = fetcher.mock.calls[0]!;
    const requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(JSON.stringify(requestBody)).toContain("inlineData");
    expect(JSON.stringify(requestBody)).not.toContain('"decision"');
  });

  it("rejects forbidden decision output and never exposes raw text", async () => {
    const raw = {
      detectedBrand: "Unknown",
      mainColors: [],
      silhouette: "unknown",
      category: "unknown",
      materialHints: [],
      vintageSignal: "none",
      streetSignal: "none",
      cleanSignal: "none",
      uniquenessSignal: "none",
      culturalContext: [],
      confidence: 0.1,
      cautions: [],
      decision: "strong_buy",
      secretRawDetail: "must not escape",
    };
    const result = await analyzeSneakerImage(image, {
      apiKey: "configured",
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(geminiResponse(raw)),
    });

    expect(result.confidence).toBe(0);
    expect(JSON.stringify(result)).not.toContain("must not escape");
    expect(JSON.stringify(result)).not.toContain("strong_buy");
  });

  it("falls back when Gemini returns invalid JSON", async () => {
    const result = await analyzeSneakerImage(image, {
      apiKey: "configured",
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "not-json raw detail" }] } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    });

    expect(result.confidence).toBe(0);
    expect(JSON.stringify(result)).not.toContain("raw detail");
  });
});

function geminiResponse(analysis: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(analysis) }] } },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}
