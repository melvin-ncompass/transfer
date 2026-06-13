import type { ItDeclarationTableRow } from "./itDeclarationTableRows";

export type UpdatePOIStatusDecision = "approved" | "rejected";

/** Approved-value keys on POST /it_declaration/poi_status (matches UpdatePOIStatusDto). */
export type PoiAmountFieldKey =
  | "approvedAmount"
  | "approvedInterest"
  | "approvedAnnualRent"
  | "approvedMunicipalTax"
  | "approvedInterestPaidOnLetOut"
  | "approvedNetIncomeLoss"
  | "approvedPrevEarnings"
  | "approvedPreviouslyPaid"
  | "approvedPfPaid"
  | "approvedPtPaid";

/** Body for POST /it_declaration/poi_status */
export interface UpdatePOIStatusDto {
  declarationId: number;
  status: UpdatePOIStatusDecision;
  rentedHouseDetailId?: number;
  selfOccupiedPropertyId?: number;
  letOutPropertyId?: number;
  taxExemptionDetailId?: number;
  prevEmploymentDataId?: number;
  approvedAmount?: number;
  approvedInterest?: number;
  approvedAnnualRent?: number;
  approvedMunicipalTax?: number;
  approvedInterestPaidOnLetOut?: number;
  approvedNetIncomeLoss?: number;
  approvedPrevEarnings?: number;
  approvedPreviouslyPaid?: number;
  approvedPfPaid?: number;
  approvedPtPaid?: number;
}

import { getPoiEntityIdFormKey } from "./poiEntityTypes";

export function buildUpdatePOIStatusDto(
  row: ItDeclarationTableRow,
  declarationId: number,
  decision: UpdatePOIStatusDecision,
  approvedAmount: string,
): UpdatePOIStatusDto | null {
  if (!row.entityType || row.originalId == null || !row.poiAmountField) {
    return null;
  }

  const entityIdKey = getPoiEntityIdFormKey(row.entityType);
  if (!entityIdKey) return null;

  const amountField = row.poiAmountField;

  let amountValue = 0;
  if (decision === "approved") {
    const trimmed = approvedAmount.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    amountValue = parsed;
  }

  return {
    declarationId,
    status: decision,
    [entityIdKey]: row.originalId,
    [amountField]: amountValue,
  };
}
