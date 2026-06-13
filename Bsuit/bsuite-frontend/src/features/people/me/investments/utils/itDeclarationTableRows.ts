import type { SxProps, Theme } from "@mui/material";
import dayjs from "dayjs";
import {
  shouldHideDeclared80CInvestmentExemption,
  type DeclaredDataForFY,
  type PoiApprovalsData,
  type PrevEmploymentPoiData,
} from "../api/itDeclaration.api";
import type { PoiAmountFieldKey } from "./poiStatusUpdate";
import {
  getExemptionEntityType,
  getLetOutChildEntityType,
  getPrevEmploymentEntityType,
  getRentedHouseEntityType,
  getSelfOccupiedEntityType,
} from "./poiEntityTypes";

export function formatItDeclarationDate(date?: string): string {
  if (!date) return "";
  const d = dayjs(date);
  return d.isValid() ? d.format("MMM DD, YYYY") : date;
}

export type ItDeclarationTableRow = {
  id: string;
  particulars: string;
  amount?: number;
  isSection?: boolean;
  isSummary?: boolean;
  isLetOutParent?: boolean;
  isLetOutChild?: boolean;
  parentId?: string;
  /** Visual gap before this row when it is not the first item in its category. */
  isWithinCategorySeparator?: boolean;
  LandlordName?: string;
  PAN?: string;
  entityType?: string | null;
  originalId?: number | null;
  /** Server-side approved value when already reviewed */
  apiApprovedAmount?: number | null;
  itemStatus?: string | null;
  /** DTO amount field for POST /it_declaration/poi_status */
  poiAmountField?: PoiAmountFieldKey;
  attachmentsCount?: number;
  commentsCount?: number;
};

export function isPoiApprovalActionableRow(row: ItDeclarationTableRow): boolean {
  return (
    !!row.entityType &&
    row.originalId != null &&
    !!row.poiAmountField &&
    !row.isSection &&
    !row.isSummary &&
    !row.isLetOutParent
  );
}

export function getPoiApprovalRowKey(row: ItDeclarationTableRow): string {
  return row.id;
}

export function getInitialPoiRowDecision(
  status?: string | null,
): "approved" | "rejected" | null {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "partially_approved") {
    return "approved";
  }
  if (normalized === "rejected") return "rejected";
  return null;
}

/** Build read-only table rows matching Me/Org investment declaration view. */
export function buildItDeclarationTableRows(
  declaredData: DeclaredDataForFY | null | undefined,
): ItDeclarationTableRow[] {
  if (!declaredData) return [];
  const result: ItDeclarationTableRow[] = [];

  if (declaredData.rentedHouseDetails?.length) {
    result.push({
      id: "rent-header",
      particulars: "House Rent Details",
      isSection: true,
      isWithinCategorySeparator: result.length > 0,
    });
    declaredData.rentedHouseDetails.forEach((r, index) => {
      if (r.id == null) return;
      result.push({
        id: `rent-${r.id}`,
        isWithinCategorySeparator: index > 0,
        originalId: r.id,
        entityType: getRentedHouseEntityType(r.id),
        poiAmountField: "approvedAmount",
        particulars: `${formatItDeclarationDate(r.rentalPeriodFrom)} – ${formatItDeclarationDate(r.rentalPeriodTo)}`,
        LandlordName: r.landlordName || "-",
        PAN: `${r.landlordPanNumber || "-"} • ${r.metroNonMetro === "metro" ? "Metro" : "Non-Metro"}`,
        amount: r.rentAmount,
        apiApprovedAmount: r.approvedAmount,
        itemStatus: r.status,
        attachmentsCount: r.attachmentsCount ?? 0,
        commentsCount: r.commentsCount ?? 0,
      });
    });
  }

  if (declaredData.selfOccupiedProperty) {
    const s = declaredData.selfOccupiedProperty;
    const letOutTotal =
      declaredData.letOutProperties?.reduce(
        (sum, l) => sum + (l.netIncomeLoss ?? 0),
        0,
      ) ?? 0;
    const selfInterest = s.interestPaidOnLoan ?? 0;

    result.push({
      id: "self-header",
      particulars: "Net Income / Loss from House Property",
      isSection: true,
      isWithinCategorySeparator: result.length > 0,
    });
    result.push({
      id: "self-summary",
      particulars: "Total Income / Loss from House Property",
      amount: letOutTotal - selfInterest,
      isSummary: true,
    });
    result.push({
      id: "self-row",
      originalId: s.id ?? null,
      entityType: s.id != null ? getSelfOccupiedEntityType(s.id) : null,
      poiAmountField: "approvedInterest",
      particulars: "• Interest Paid on Home Loan",
      amount: s.interestPaidOnLoan,
      apiApprovedAmount: s.approvedInterest,
      itemStatus: s.interestAmountStatus,
      attachmentsCount: s.attachmentsCount ?? 0,
      commentsCount: s.commentsCount ?? 0,
    });
  }

  if (declaredData.letOutProperties?.length) {
    declaredData.letOutProperties.forEach((l, index) => {
      if (l.id == null) return;
      result.push({
        id: `letout-${l.id}`,
        originalId: l.id,
        entityType: "let_out_property",
        particulars: `Net Income / Loss from Let Out Property - ${index + 1}`,
        amount: l.netIncomeLoss,
        isLetOutParent: true,
        isWithinCategorySeparator: index > 0,
        apiApprovedAmount: l.approvedAnnualRent,
        itemStatus: l.annualRentStatus,
      });

      type LetOutChildRow = {
        key: string;
        label: string;
        value: number;
        entityType: string | null;
        poiAmountField?: PoiAmountFieldKey;
        apiApprovedAmount?: number | null;
        itemStatus?: string;
      };

      const letOutAttachmentsCount = l.attachmentsCount ?? 0;
      const letOutCommentsCount = l.commentsCount ?? 0;

      const children: LetOutChildRow[] = [
        {
          key: "annualRent",
          label: "Annual Rent Received:",
          value: l.annualRentReceived,
          entityType: getLetOutChildEntityType("annualRent", l.id),
          poiAmountField: "approvedAnnualRent" as const,
          apiApprovedAmount: l.approvedAnnualRent,
          itemStatus: l.annualRentStatus,
        },
        {
          key: "municipalTax",
          label: "Municipal Taxes Paid:",
          value: l.municipalTaxPaid,
          entityType: getLetOutChildEntityType("municipalTax", l.id),
          poiAmountField: "approvedMunicipalTax" as const,
          apiApprovedAmount: l.approvedMunicipalTax,
          itemStatus: l.municipalTaxStatus,
        },
        {
          key: "netAnnualValue",
          label: "Net Annual Value:",
          value: l.netAnnualValue,
          entityType: null,
        },
        {
          key: "stdDeduction",
          label: "Standard Deduction(@30% of Net Annual Value)",
          value: l.standardDeduction,
          entityType: null,
        },
      ];

      if (l.isRepayingHomeLoan && (l.interestPaidOnLetOut ?? 0) > 0) {
        children.push({
          key: "interestPaid",
          label: "Interest Paid on Home Loan:",
          value: l.interestPaidOnLetOut ?? 0,
          entityType: getLetOutChildEntityType("interestPaid", l.id),
          poiAmountField: "approvedInterestPaidOnLetOut" as const,
          apiApprovedAmount: l.approvedInterestPaidOnLetOut,
          itemStatus: l.interestStatus,
        });
      }

        children.forEach((c) => {
          result.push({
            id: `letout-${l.id}-${c.key}`,
            originalId: c.entityType ? l.id : null,
            entityType: c.entityType,
            particulars: c.label,
            amount: c.value,
            isLetOutChild: true,
            parentId: `letout-${l.id}`,
            apiApprovedAmount: "apiApprovedAmount" in c ? c.apiApprovedAmount : undefined,
            itemStatus: "itemStatus" in c ? c.itemStatus : undefined,
            poiAmountField: "poiAmountField" in c ? c.poiAmountField : undefined,
            attachmentsCount: c.entityType ? letOutAttachmentsCount : undefined,
            commentsCount: c.entityType ? letOutCommentsCount : undefined,
          });
        });
    });
  }

  const exemptions =
    declaredData.exemptionDetails?.filter(
      (e) => !shouldHideDeclared80CInvestmentExemption(e),
    ) ?? [];
  if (exemptions.length) {
    result.push({
      id: "ex-header",
      particulars: "Exemption Details",
      isSection: true,
      isWithinCategorySeparator: result.length > 0,
    });
      exemptions.forEach((ex, index) => {
        const exRowKey =
          ex.sectionCode && ex.subSectionCode
            ? `${ex.sectionCode}-${ex.subSectionCode}`
            : String(ex.id ?? "unknown");
        result.push({
          id: `ex-${exRowKey}`,
          isWithinCategorySeparator: index > 0,
          originalId: ex.id,
          entityType: getExemptionEntityType(ex),
          poiAmountField: "approvedAmount",
          particulars: `${ex.sectionName} - ${ex.subSectionName}`,
          amount: ex.declaredAmount,
          apiApprovedAmount: ex.approvedAmount,
          itemStatus: ex.status,
          attachmentsCount: ex.attachmentsCount ?? 0,
          commentsCount: ex.commentsCount ?? 0,
        });
      });
  }

  return result;
}

/** Shared row styling for IT declaration read-only tables (Me + Org views). */
export function getItDeclarationTableRowSx(
  row: ItDeclarationTableRow,
): SxProps<Theme> {
  if (row.isWithinCategorySeparator) {
    return {
      "& td": {
        borderTop: "1px solid",
        borderColor: "divider",
        ...(row.isSection && { fontWeight: 600 }),
      },
    };
  }

  if (row.isSection) {
    return { "& td": { fontWeight: 600 } };
  }

  return {};
}

const PREV_EMPLOYMENT_ROWS: Array<{
  key: string;
  label: string;
  amountKey: keyof PrevEmploymentPoiData;
  statusKey: keyof PrevEmploymentPoiData;
  approvedKey: keyof PrevEmploymentPoiData;
  poiAmountField: PoiAmountFieldKey;
}> = [
  {
    key: "prevEarnings",
    label: "Previous Earnings",
    amountKey: "prevEarnings",
    statusKey: "prevEarningsStatus",
    approvedKey: "approvedPrevEarnings",
    poiAmountField: "approvedPrevEarnings",
  },
  {
    key: "previouslyPaid",
    label: "Tax Previously Paid",
    amountKey: "previouslyPaid",
    statusKey: "previouslyPaidStatus",
    approvedKey: "approvedPreviouslyPaid",
    poiAmountField: "approvedPreviouslyPaid",
  },
  {
    key: "pfPaid",
    label: "PF Paid",
    amountKey: "pfPaid",
    statusKey: "pfPaidStatus",
    approvedKey: "approvedPfPaid",
    poiAmountField: "approvedPfPaid",
  },
  {
    key: "ptPaid",
    label: "PT Paid",
    amountKey: "ptPaid",
    statusKey: "ptPaidStatus",
    approvedKey: "approvedPtPaid",
    poiAmountField: "approvedPtPaid",
  },
];

/** Table rows for admin POI approval review (`get_poi_approvals`). */
export function buildPoiApprovalTableRows(
  data: PoiApprovalsData | null | undefined,
): ItDeclarationTableRow[] {
  const result = buildItDeclarationTableRows(data);
  const prev = data?.prevEmploymentData;
  if (!prev) return result;

  const hasAnyPrevValue = PREV_EMPLOYMENT_ROWS.some(
    (row) => (prev[row.amountKey] as number | undefined) != null,
  );
  if (!hasAnyPrevValue) return result;

  result.push({
    id: "prev-emp-header",
    particulars: "Previous Employment",
    isSection: true,
    isWithinCategorySeparator: result.length > 0,
  });

  for (const row of PREV_EMPLOYMENT_ROWS) {
    const amount = prev[row.amountKey] as number | undefined;
    if (amount == null) continue;
    result.push({
      id: `prev-emp-${row.key}`,
      originalId: prev.id ?? null,
      entityType:
        prev.id != null
          ? getPrevEmploymentEntityType(row.key, prev.id)
          : null,
      poiAmountField: row.poiAmountField,
      particulars: row.label,
      amount,
      itemStatus: prev[row.statusKey] as string | undefined,
      apiApprovedAmount: prev[row.approvedKey] as number | null | undefined,
      attachmentsCount: prev.attachmentsCount ?? 0,
      commentsCount: prev.commentsCount ?? 0,
    });
  }

  return result;
}
