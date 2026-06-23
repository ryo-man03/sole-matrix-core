import type { PreferenceProfile } from "../../../src/domain/profile/preferenceTypes";
import type {
  SneakerCandidate,
  SneakerVector,
} from "../../../src/domain/sneaker/sneakerVector";
import type { SneakerTag } from "../../../src/domain/sneaker/sneakerTag";
import type { RecommendSneakersInput } from "../../../src/core/types";

const MAX_PREFERENCE_TAGS = 5;

const supportedPreferenceTagIds = [
  "classic",
  "low_tech",
  "street",
  "minimal",
  "chunky",
  "running",
  "basketball",
  "comfortable",
  "durable",
  "retro",
  "heritage",
  "premium",
] as const;

type SupportedPreferenceTagId = (typeof supportedPreferenceTagIds)[number];

const preferenceAxisTags = {
  // Existing IDs are used only where their current labels/docs clearly match
  // the Product Owner's approved semantic tag names.
  culture: ["retro", "classic", "heritage"],
  styleFit: ["minimal"],
  simplicity: ["low_tech"],
  street: ["street"],
  volume: ["chunky"],
  comfort: ["running", "basketball"],
  durability: [],
} as const satisfies Record<
  keyof PreferenceProfile["vector"],
  readonly SupportedPreferenceTagId[]
>;

const sneakerVectorAxes = [
  "culture",
  "styleFit",
  "simplicity",
  "street",
  "volume",
  "comfort",
  "durability",
  "priceLevel",
] as const satisfies readonly (keyof SneakerVector)[];

const supportedSneakerTags = new Set<SneakerTag>([
  "classic",
  "low_tech",
  "canvas",
  "minimal",
  "street",
  "chunky",
  "basketball",
  "running",
  "comfortable",
  "durable",
  "retro",
  "collab",
  "trail",
  "outdoor",
  "premium",
  "heritage",
]);

export type ResolvedCatalogItemInput = {
  id?: unknown;
  displayName?: unknown;
  tags?: unknown;
  comparisonPriceYen?: unknown;
  featureValues?: unknown;
};

export type CoreInputAdapterInput = {
  candidateTagIds?: unknown;
  userId?: unknown;
  updatedAt?: unknown;
  userBudgetYen?: unknown;
  resolvedCatalogItem?: ResolvedCatalogItemInput | null;
};

export type CoreInputAdapterErrorCode =
  | "preference_tags_empty"
  | "preference_tag_unsupported"
  | "preference_tag_limit_exceeded"
  | "preference_tag_duplicate"
  | "user_id_invalid"
  | "updated_at_invalid"
  | "catalog_unresolved"
  | "catalog_id_invalid"
  | "catalog_display_name_invalid"
  | "catalog_tags_invalid"
  | "catalog_feature_values_invalid"
  | "catalog_feature_dimension_missing"
  | "catalog_feature_value_invalid"
  | "user_budget_invalid"
  | "comparison_price_invalid";

export type CoreInputAdapterError = {
  code: CoreInputAdapterErrorCode;
  field: string;
  message: string;
};

export type CoreInputAdapterResult =
  | {
      status: "ready";
      coreInput: RecommendSneakersInput;
      errors: [];
    }
  | {
      status: "blocked";
      coreInput: null;
      errors: CoreInputAdapterError[];
    };

export function buildCoreInput(
  input: CoreInputAdapterInput
): CoreInputAdapterResult {
  const errors: CoreInputAdapterError[] = [];

  const candidateTagIds = validatePreferenceTagIds(
    input.candidateTagIds,
    errors
  );
  const userId = validateNonEmptyString(
    input.userId,
    "userId",
    "user_id_invalid",
    errors
  );
  const updatedAt = validateUpdatedAt(input.updatedAt, errors);
  const catalogItem = validateCatalogItem(input.resolvedCatalogItem, errors);
  const userBudgetYen = validatePositiveInteger(
    input.userBudgetYen,
    "userBudgetYen",
    "user_budget_invalid",
    errors
  );

  if (
    errors.length > 0 ||
    candidateTagIds === null ||
    userId === null ||
    updatedAt === null ||
    catalogItem === null ||
    userBudgetYen === null
  ) {
    return {
      status: "blocked",
      coreInput: null,
      errors,
    };
  }

  const preferenceProfile = mapPreferenceProfile({
    candidateTagIds,
    userId,
    updatedAt,
  });
  const budgetFit = evaluateBudgetFit(
    userBudgetYen,
    catalogItem.comparisonPriceYen
  );
  const candidate: SneakerCandidate = {
    sneakerId: catalogItem.id,
    name: catalogItem.displayName,
    vector: catalogItem.featureValues,
    tags: catalogItem.tags,
    budgetFit,
  };

  return {
    status: "ready",
    coreInput: {
      preferenceProfile,
      candidates: [candidate],
    },
    errors: [],
  };
}

export function mapPreferenceProfile(input: {
  candidateTagIds: readonly SupportedPreferenceTagId[];
  userId: string;
  updatedAt: string;
}): PreferenceProfile {
  const selectedTags = new Set(input.candidateTagIds);
  const vector = mapPreferenceAxes(selectedTags);

  return {
    userId: input.userId,
    vector,
    policy: {
      priceSensitivity: 50,
      overlapSensitivity: 50,
      explorationTolerance: 50,
    },
    axisImportance: { ...vector },
    sourceConfidence: {
      diagnosis: 0,
      ownedSneakers: 0,
      wantedSneakers: 100,
      feedback: 0,
    },
    profileVersion: 1,
    updatedAt: input.updatedAt,
  };
}

export function evaluateBudgetFit(
  userBudgetYen: number,
  comparisonPriceYen: number
): number {
  if (comparisonPriceYen <= userBudgetYen) {
    return 100;
  }

  return clampScore(
    Math.round((userBudgetYen / comparisonPriceYen) * 100)
  );
}

function mapPreferenceAxes(
  selectedTags: ReadonlySet<SupportedPreferenceTagId>
): PreferenceProfile["vector"] {
  return {
    culture: hasAnySelectedTag(selectedTags, preferenceAxisTags.culture)
      ? 100
      : 0,
    styleFit: hasAnySelectedTag(selectedTags, preferenceAxisTags.styleFit)
      ? 100
      : 0,
    simplicity: hasAnySelectedTag(selectedTags, preferenceAxisTags.simplicity)
      ? 100
      : 0,
    street: hasAnySelectedTag(selectedTags, preferenceAxisTags.street)
      ? 100
      : 0,
    volume: hasAnySelectedTag(selectedTags, preferenceAxisTags.volume)
      ? 100
      : 0,
    comfort: hasAnySelectedTag(selectedTags, preferenceAxisTags.comfort)
      ? 100
      : 0,
    durability: 0,
  };
}

function hasAnySelectedTag(
  selectedTags: ReadonlySet<SupportedPreferenceTagId>,
  axisTags: readonly SupportedPreferenceTagId[]
): boolean {
  return axisTags.some((tagId) => selectedTags.has(tagId));
}

function validatePreferenceTagIds(
  value: unknown,
  errors: CoreInputAdapterError[]
): SupportedPreferenceTagId[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push({
      code: "preference_tags_empty",
      field: "candidateTagIds",
      message: "candidateTagIds must contain at least one validated tag ID",
    });
    return null;
  }

  if (value.length > MAX_PREFERENCE_TAGS) {
    errors.push({
      code: "preference_tag_limit_exceeded",
      field: "candidateTagIds",
      message: `candidateTagIds must contain at most ${MAX_PREFERENCE_TAGS} items`,
    });
  }

  const supportedTags = new Set<string>(supportedPreferenceTagIds);
  const normalizedTags: SupportedPreferenceTagId[] = [];
  const seenTags = new Set<string>();

  for (const [index, rawTagId] of value.entries()) {
    if (typeof rawTagId !== "string") {
      errors.push({
        code: "preference_tag_unsupported",
        field: `candidateTagIds[${index}]`,
        message: "candidate tag ID must be a supported string ID",
      });
      continue;
    }

    const tagId = rawTagId.trim();

    if (!supportedTags.has(tagId)) {
      errors.push({
        code: "preference_tag_unsupported",
        field: `candidateTagIds[${index}]`,
        message: `unsupported candidate tag ID: ${tagId}`,
      });
      continue;
    }

    if (seenTags.has(tagId)) {
      errors.push({
        code: "preference_tag_duplicate",
        field: `candidateTagIds[${index}]`,
        message: `duplicate candidate tag ID: ${tagId}`,
      });
      continue;
    }

    seenTags.add(tagId);
    normalizedTags.push(tagId as SupportedPreferenceTagId);
  }

  return errors.some((error) => error.field.startsWith("candidateTagIds"))
    ? null
    : normalizedTags;
}

function validateCatalogItem(
  value: ResolvedCatalogItemInput | null | undefined,
  errors: CoreInputAdapterError[]
): {
  id: string;
  displayName: string;
  tags: SneakerTag[];
  comparisonPriceYen: number;
  featureValues: SneakerVector;
} | null {
  if (value === null || value === undefined) {
    errors.push({
      code: "catalog_unresolved",
      field: "resolvedCatalogItem",
      message: "resolvedCatalogItem is required",
    });
    return null;
  }

  const id = validateNonEmptyString(
    value.id,
    "resolvedCatalogItem.id",
    "catalog_id_invalid",
    errors
  );
  const displayName = validateNonEmptyString(
    value.displayName,
    "resolvedCatalogItem.displayName",
    "catalog_display_name_invalid",
    errors
  );
  const tags = validateCatalogTags(value.tags, errors);
  const comparisonPriceYen = validatePositiveInteger(
    value.comparisonPriceYen,
    "resolvedCatalogItem.comparisonPriceYen",
    "comparison_price_invalid",
    errors
  );
  const featureValues = validateFeatureValues(value.featureValues, errors);

  if (
    id === null ||
    displayName === null ||
    tags === null ||
    comparisonPriceYen === null ||
    featureValues === null
  ) {
    return null;
  }

  return {
    id,
    displayName,
    tags,
    comparisonPriceYen,
    featureValues,
  };
}

function validateCatalogTags(
  value: unknown,
  errors: CoreInputAdapterError[]
): SneakerTag[] | null {
  if (!Array.isArray(value)) {
    errors.push({
      code: "catalog_tags_invalid",
      field: "resolvedCatalogItem.tags",
      message: "catalog tags must be a manually registered SneakerTag array",
    });
    return null;
  }

  const tags: SneakerTag[] = [];

  for (const [index, rawTag] of value.entries()) {
    if (typeof rawTag !== "string" || !supportedSneakerTags.has(rawTag as SneakerTag)) {
      errors.push({
        code: "catalog_tags_invalid",
        field: `resolvedCatalogItem.tags[${index}]`,
        message: `invalid catalog SneakerTag: ${String(rawTag)}`,
      });
      continue;
    }

    tags.push(rawTag as SneakerTag);
  }

  return errors.some((error) =>
    error.field.startsWith("resolvedCatalogItem.tags")
  )
    ? null
    : tags;
}

function validateFeatureValues(
  value: unknown,
  errors: CoreInputAdapterError[]
): SneakerVector | null {
  if (!isRecord(value)) {
    errors.push({
      code: "catalog_feature_values_invalid",
      field: "resolvedCatalogItem.featureValues",
      message: "featureValues must be an object with all eight Core axes",
    });
    return null;
  }

  const featureValues: Partial<SneakerVector> = {};

  for (const axis of sneakerVectorAxes) {
    if (!Object.prototype.hasOwnProperty.call(value, axis)) {
      errors.push({
        code: "catalog_feature_dimension_missing",
        field: `resolvedCatalogItem.featureValues.${axis}`,
        message: `catalog feature dimension is missing: ${axis}`,
      });
      continue;
    }

    const axisValue = value[axis];

    if (
      typeof axisValue !== "number" ||
      !Number.isFinite(axisValue) ||
      axisValue < 0 ||
      axisValue > 100
    ) {
      errors.push({
        code: "catalog_feature_value_invalid",
        field: `resolvedCatalogItem.featureValues.${axis}`,
        message: `catalog feature value must be a finite number from 0 to 100: ${axis}`,
      });
      continue;
    }

    featureValues[axis] = axisValue;
  }

  if (
    errors.some((error) =>
      error.field.startsWith("resolvedCatalogItem.featureValues")
    )
  ) {
    return null;
  }

  return featureValues as SneakerVector;
}

function validateNonEmptyString(
  value: unknown,
  field: string,
  code: "user_id_invalid" | "catalog_id_invalid" | "catalog_display_name_invalid",
  errors: CoreInputAdapterError[]
): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({
      code,
      field,
      message: `${field} must be a non-empty string`,
    });
    return null;
  }

  return value.trim();
}

function validateUpdatedAt(
  value: unknown,
  errors: CoreInputAdapterError[]
): string | null {
  const isoDateTimePattern =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

  if (typeof value !== "string") {
    errors.push({
      code: "updated_at_invalid",
      field: "updatedAt",
      message: "updatedAt must be a valid ISO 8601 date-time string",
    });
    return null;
  }

  const match = isoDateTimePattern.exec(value);

  if (match === null || !isValidIsoDateTimeMatch(match, value)) {
    errors.push({
      code: "updated_at_invalid",
      field: "updatedAt",
      message: "updatedAt must be a valid ISO 8601 date-time string",
    });
    return null;
  }

  return value;
}

function isValidIsoDateTimeMatch(
  match: RegExpExecArray,
  value: string
): boolean {
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const timezone = match[7];
  const daysInMonth =
    month >= 1 && month <= 12
      ? new Date(Date.UTC(year, month, 0)).getUTCDate()
      : 0;

  if (
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    !Number.isFinite(Date.parse(value))
  ) {
    return false;
  }

  if (timezone !== "Z") {
    const timezoneHour = Number(timezone?.slice(1, 3));
    const timezoneMinute = Number(timezone?.slice(4, 6));

    if (timezoneHour > 23 || timezoneMinute > 59) {
      return false;
    }
  }

  return true;
}

function validatePositiveInteger(
  value: unknown,
  field: string,
  code: "user_budget_invalid" | "comparison_price_invalid",
  errors: CoreInputAdapterError[]
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    errors.push({
      code,
      field,
      message: `${field} must be a positive JPY integer`,
    });
    return null;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}
