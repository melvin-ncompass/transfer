import type { UpdatePOIStatusDto } from "./poiStatusUpdate";

/** GET/POST POI — full key is the `entityType` path segment (id suffix, no query params). */
export interface PoiScopedFetchParams {
  declarationId: number;
  entityType: string;
}

/**
 * `entityType` = `{family}_{line}_{recordId}` (underscores only).
 *
 * Examples:
 *   let_out_property_annual_rent_5
 *   let_out_property_municipal_taxes_6
 *   rented_house_5
 *   exemption_1_1a_18
 *
 * POST still sends the matching FK (letOutPropertyId, etc.) in FormData.
 */

const LET_OUT_CHILD_SUBKEY: Record<string, string> = {
  annualRent: "annual_rent",
  municipalTax: "municipal_taxes",
  interestPaid: "interest_paid",
};

const PREV_EMPLOYMENT_SUBKEY: Record<string, string> = {
  prevEarnings: "prev_earnings",
  previouslyPaid: "tax_previously_paid",
  pfPaid: "pf_paid",
  ptPaid: "pt_paid",
};

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** `{family}_{optionalLine}_{recordId}` */
export function buildPoiEntityType(
  family: string,
  recordId: number,
  lineKey?: string,
): string {
  const familySlug = normalizeSlug(family);
  const lineSlug = lineKey ? normalizeSlug(lineKey) : "";
  if (!familySlug || !Number.isFinite(recordId) || recordId <= 0) {
    return familySlug || "unknown";
  }
  return lineSlug
    ? `${familySlug}_${lineSlug}_${recordId}`
    : `${familySlug}_${recordId}`;
}

export function getRentedHouseEntityType(rentedHouseDetailId: number): string {
  return buildPoiEntityType("rented_house", rentedHouseDetailId);
}

export function getSelfOccupiedEntityType(selfOccupiedPropertyId: number): string {
  return buildPoiEntityType("self_occupied", selfOccupiedPropertyId);
}

export function getLetOutChildEntityType(
  childKey: string,
  letOutPropertyId: number,
): string | null {
  const lineKey = LET_OUT_CHILD_SUBKEY[childKey];
  if (!lineKey) return null;
  return buildPoiEntityType("let_out_property", letOutPropertyId, lineKey);
}

export function getExemptionEntityType(ex: {
  sectionCode?: string | null;
  subSectionCode?: string | null;
  id?: number | null;
}): string {
  const section = normalizeSlug(ex.sectionCode ?? "");
  const sub = normalizeSlug(ex.subSectionCode ?? "");
  const codeKey = section && sub ? `${section}_${sub}` : sub || "detail";
  const detailId = ex.id;
  if (detailId != null && detailId > 0) {
    return buildPoiEntityType("exemption", detailId, codeKey);
  }
  return codeKey ? `exemption_${codeKey}` : "exemption";
}

export function getPrevEmploymentEntityType(
  rowKey: string,
  prevEmploymentDataId: number,
): string {
  const lineKey = PREV_EMPLOYMENT_SUBKEY[rowKey] ?? "line";
  return buildPoiEntityType("prev_employment", prevEmploymentDataId, lineKey);
}

/** Ensure path segment includes record id (e.g. when row already has a base type). */
export function withRecordIdInEntityType(
  entityType: string,
  recordId: number,
): string {
  const slug = normalizeSlug(entityType);
  if (!slug || recordId <= 0) return entityType;
  if (slug.endsWith(`_${recordId}`)) return slug;
  return `${slug}_${recordId}`;
}

/** Line-only path without trailing numeric id (legacy GET fallback). */
export function stripRecordIdFromEntityType(entityType: string): string | null {
  const slug = normalizeSlug(entityType);
  const match = slug.match(/^(.+)_(\d+)$/);
  if (!match) return null;
  return match[1];
}

export function matchesPoiEntityFamily(
  entityType: string | null | undefined,
  family: string,
): boolean {
  if (!entityType) return false;
  const familySlug = normalizeSlug(family);
  return familySlug.length > 0 && normalizeSlug(entityType).startsWith(familySlug);
}

export function isRentedHouseEntityType(
  entityType: string | null | undefined,
): boolean {
  return matchesPoiEntityFamily(entityType, "rented_house");
}

export function getPoiEntityIdFormKey(
  entityType: string,
):
  | keyof Pick<
      UpdatePOIStatusDto,
      | "rentedHouseDetailId"
      | "selfOccupiedPropertyId"
      | "letOutPropertyId"
      | "taxExemptionDetailId"
      | "prevEmploymentDataId"
    >
  | undefined {
  const slug = normalizeSlug(entityType);
  if (slug.startsWith("rented_house")) return "rentedHouseDetailId";
  if (slug.startsWith("self_occupied")) return "selfOccupiedPropertyId";
  if (slug.startsWith("let_out_property")) return "letOutPropertyId";
  if (slug.startsWith("exemption")) return "taxExemptionDetailId";
  if (slug.startsWith("prev_employment")) return "prevEmploymentDataId";
  return undefined;
}

export function buildPoiScopedFetchParams(
  declarationId: number,
  entityType: string,
  originalId?: number | null,
): PoiScopedFetchParams {
  const resolved =
    originalId != null
      ? withRecordIdInEntityType(entityType, originalId)
      : entityType;
  return { declarationId, entityType: resolved };
}

export function getPoiScopedFetchCacheKey(params: PoiScopedFetchParams): string {
  return `${params.declarationId}-${params.entityType}`;
}

/** GET paths — id in segment; optional fallback to line-only legacy path. */
export function buildPoiFetchUrlCandidates(
  basePath: string,
  params: PoiScopedFetchParams,
): string[] {
  const { declarationId, entityType } = params;
  const primary = `${basePath}/${declarationId}/${encodeURIComponent(entityType)}`;
  const legacyLine = stripRecordIdFromEntityType(entityType);
  if (legacyLine && legacyLine !== entityType) {
    return [
      primary,
      `${basePath}/${declarationId}/${encodeURIComponent(legacyLine)}`,
    ];
  }
  return [primary];
}

export function appendPoiEntityFormIds(
  formData: FormData,
  entityType: string,
  originalId: number,
): boolean {
  const idKey = getPoiEntityIdFormKey(entityType);
  if (!idKey) return false;
  formData.append(idKey, String(originalId));
  return true;
}

export function buildPoiScopedFetchParamsFromFormData(
  formData: FormData,
): PoiScopedFetchParams | null {
  const declarationId = Number(formData.get("declarationId"));
  const entityType = String(formData.get("entityType") ?? "");
  if (!declarationId || !entityType) return null;
  return { declarationId, entityType: normalizeSlug(entityType) };
}
