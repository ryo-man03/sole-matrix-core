import { analyzeSneakerRequest } from "./analyzeSneaker";

describe("analyze sneaker backend boundary", () => {
  it("requires at least one analysis input", async () => {
    const response = await analyzeSneakerRequest(formRequest(new FormData()));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "ANALYSIS_INPUT_REQUIRED" },
    });
  });

  it("combines optional URL and image analysis without exposing raw inputs", async () => {
    const formData = new FormData();
    formData.set("sneakerName", "Puma Clyde MIJ");
    formData.set("url", "https://shop.example/clyde");
    formData.set(
      "image",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], {
        type: "image/jpeg",
      }),
      "clyde.jpg",
    );
    const response = await analyzeSneakerRequest(formRequest(formData), {
      analyzeUrl: async (inputUrl) => ({
        inputUrl,
        title: "Puma Clyde MIJ",
        confidence: 0.8,
        cautions: [],
      }),
      analyzeImage: async () => ({
        detectedBrand: "Puma",
        mainColors: ["navy"],
        silhouette: "low",
        category: "basketball",
        materialHints: ["suede"],
        vintageScore: 90,
        streetScore: 60,
        cleanScore: 60,
        uniquenessScore: 60,
        culturalContext: ["basketball heritage"],
        confidence: 0.8,
        cautions: [],
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      data: {
        sneakerName: "Puma Clyde MIJ",
        urlAnalysis: { title: "Puma Clyde MIJ" },
        visualAnalysis: { detectedBrand: "Puma" },
      },
    });
    expect(JSON.stringify(payload)).not.toContain("/9j/");
  });
});

function formRequest(body: FormData) {
  return new Request("http://localhost/api/sneakers/analyze", {
    method: "POST",
    body,
  });
}
