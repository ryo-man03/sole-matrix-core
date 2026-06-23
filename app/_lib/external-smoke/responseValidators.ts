export function isGeminiGenerateContentResponse(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    return false;
  }

  return value.candidates.some((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.content)) {
      return false;
    }

    const parts = candidate.content.parts;

    return (
      Array.isArray(parts) &&
      parts.some(
        (part) =>
          isRecord(part) &&
          typeof part.text === "string" &&
          part.text.trim().length > 0
      )
    );
  });
}

export function isRakutenItemSearchResponse(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every(
    (item) =>
      isRecord(item) &&
      typeof item.itemName === "string" &&
      item.itemName.trim().length > 0 &&
      typeof item.itemPrice === "number" &&
      Number.isFinite(item.itemPrice) &&
      typeof item.itemUrl === "string" &&
      item.itemUrl.trim().length > 0
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
