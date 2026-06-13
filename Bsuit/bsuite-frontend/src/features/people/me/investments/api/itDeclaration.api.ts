import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import dayjs from "dayjs";
import { baseApi } from "../../../../../api/base.api";
import {
  buildPoiFetchUrlCandidates,
  buildPoiScopedFetchParamsFromFormData,
  getPoiScopedFetchCacheKey,
} from "../utils/poiEntityTypes";

export interface FinancialYearPeriod {
  financialYear: string;
  financialYearStart: string;
  financialYearEnd: string;
}

export interface FinancialYearsData {
  currentFinancialYear: FinancialYearPeriod;
  financialYears: string[];
}

interface GetFinancialYearApiResponse {
  data: FinancialYearsData;
  message: string;
}

function expandFinancialYearPart(baseYear: string, part: string): string {
  if (part.length === 4) return part;
  if (part.length === 2 && baseYear.length === 4) {
    return baseYear.slice(0, 2) + part;
  }
  return part;
}

/**
 * Display label for IT declaration FY dropdown / headings.
 * Calendar-year FY (Jan–Dec) is often stored as "2025-2025" — show "2025" instead.
 * API `value` stays the original string.
 */
export function formatFinancialYearLabel(
  financialYear: string,
  period?: Pick<FinancialYearPeriod, "financialYearStart" | "financialYearEnd"> | null,
): string {
  const fy = financialYear?.trim();
  if (!fy) return financialYear;

  if (period?.financialYearStart && period?.financialYearEnd) {
    const start = dayjs(period.financialYearStart);
    const end = dayjs(period.financialYearEnd);
    if (start.isValid() && end.isValid() && start.year() === end.year()) {
      return String(start.year());
    }
  }

  const parts = fy.split("-").map((p) => p.trim());
  if (parts.length === 2) {
    const y1 = parts[0];
    const y2 = expandFinancialYearPart(y1, parts[1]);
    if (y1 === y2) return y1;
  }

  return fy;
}

export function buildFinancialYearSelectOptions(
  data: FinancialYearsData,
): Array<{ label: string; value: string }> {
  const current = data.currentFinancialYear.financialYear;
  const currentPeriod = data.currentFinancialYear;
  const options: Array<{ label: string; value: string }> = [
    {
      label: formatFinancialYearLabel(current, currentPeriod),
      value: current,
    },
  ];

  for (const fy of data.financialYears) {
    if (fy && fy !== current) {
      options.push({
        label: formatFinancialYearLabel(fy),
        value: fy,
      });
    }
  }

  return options;
}

export function isHistoricalFinancialYear(
  data: FinancialYearsData,
  selectedYear: string,
): boolean {
  return data.financialYears.includes(selectedYear);
}

/** Option under a tax exemption section (e.g. "Medical Insurance Premium") */
export interface TaxExemptionOption {
  id: number;
  label: string;
}

/** Section from backend (e.g. 80D, 80C) */
export interface TaxExemptionSection {
  id: number;
  sectionCode: string;
  sectionTitle: string;
  maxLimit: number;
  options: TaxExemptionOption[];
}

/** Raw subsection from API (exemptionName = option label, code = value) */
export interface RawTaxExemptionSubsection {
  code: string;
  maxLimit: string;
  exemptionName: string;
  componentMapping?: string;
}

/** Raw section from API (sectionName = title, subsections = options) */
export interface RawTaxExemptionSection {
  code: string;
  maxLimit: string;
  sectionName: string;
  subsections: RawTaxExemptionSubsection[];
}

function normalizeExemptionLabel(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function isPrincipalRepaymentHomeLoanSubsection(
  sub: Pick<RawTaxExemptionSubsection, "exemptionName">,
): boolean {
  const n = normalizeExemptionLabel(sub.exemptionName);
  return n.includes("principal") && n.includes("home") && n.includes("loan");
}

export function isRawSectionContainingPrincipal80CSubsection(
  section: RawTaxExemptionSection,
): boolean {
  return (section.subsections ?? []).some((sub) =>
    isPrincipalRepaymentHomeLoanSubsection(sub),
  );
}

/** @deprecated Prefer isRawSectionContainingPrincipal80CSubsection */
export function isPrincipalBacked80CExemptionSection(
  section: RawTaxExemptionSection,
): boolean {
  return isRawSectionContainingPrincipal80CSubsection(section);
}

export interface DeclarationData {
  hasDeclared?: boolean;
  employee?: unknown;
  taxExemption?: RawTaxExemptionSection[];
  taxConfigName?: string;
  isHraEnabled?: boolean;
  versionId?: number;
  employeeName?: string;
}

interface GetDeclarationApiResponse {
  data: DeclarationData;
  message: string;
}

export interface GetDeclarationParams {
  employeeId: number | string;
  startYear: string;
  endYear: string;
}

export interface DeclaredRentedHouseDetail {
  id?: number;
  rentalPeriodFrom: string;
  rentalPeriodTo: string;
  rentAmount: number;
  metroNonMetro: string;
  landlordName: string;
  landlordPanNumber: string;
  approvedAmount?: number | null;
  status?: string;
  attachmentsCount?: number;
  commentsCount?: number;
}

export interface DeclaredSelfOccupiedProperty {
  id?: number;
  principalPaidOnLoan: number;
  interestPaidOnLoan: number;
  lenderName: string;
  lenderPan: string;
  approvedInterest?: number | null;
  interestAmountStatus?: string;
  attachmentsCount?: number;
  commentsCount?: number;
}

export interface DeclaredLetOutProperty {
  id?: number;
  annualRentReceived: number;
  municipalTaxPaid: number;
  netAnnualValue: number;
  standardDeduction: number;
  netIncomeLoss: number;
  isRepayingHomeLoan: boolean;
  interestPaidOnLetOut?: number;
  principalForLetOut?: number;
  lenderName?: string;
  lenderPan?: string;
  approvedAnnualRent?: number | null;
  annualRentStatus?: string;
  approvedMunicipalTax?: number | null;
  municipalTaxStatus?: string;
  approvedInterestPaidOnLetOut?: number | null;
  interestStatus?: string;
  attachmentsCount?: number;
  commentsCount?: number;
}

export interface PrevEmploymentPoiData {
  id?: number;
  prevEarnings?: number;
  approvedPrevEarnings?: number | null;
  prevEarningsStatus?: string;
  previouslyPaid?: number;
  approvedPreviouslyPaid?: number | null;
  previouslyPaidStatus?: string;
  pfPaid?: number;
  approvedPfPaid?: number | null;
  pfPaidStatus?: string;
  ptPaid?: number;
  approvedPtPaid?: number | null;
  ptPaidStatus?: string;
  attachmentsCount?: number;
  commentsCount?: number;
}

export interface DeclaredExemptionDetail {
  id?: number;
  sectionCode: string;
  sectionName: string;
  sectionMaxLimit: number;
  subSectionCode: string;
  subSectionName: string;
  subSectionMaxLimit: number;
  componentMapping: string | null;
  declaredAmount: number;
  approvedAmount?: number | null;
  status?: string;
  attachmentsCount?: number;
  commentsCount?: number;
}

export function shouldHideDeclared80CInvestmentExemption(
  ex: Pick<DeclaredExemptionDetail, "subSectionName">,
): boolean {
  return isPrincipalRepaymentHomeLoanSubsection({
    exemptionName: ex.subSectionName ?? "",
  });
}

export interface DeclaredDataForFY {
  id?: number;
  financialYear?: string;
  status?: string;
  poiSubmittedDate?: string;
  /** When true, declaration cannot be edited or have proofs/comments added. */
  isLocked?: boolean;
  employee?: ITDeclarationEmployee;
  rentedHouseDetails?: DeclaredRentedHouseDetail[];
  selfOccupiedProperty?: DeclaredSelfOccupiedProperty | null;
  letOutProperties?: DeclaredLetOutProperty[];
  exemptionDetails?: DeclaredExemptionDetail[];
}

/** POI approval review payload (`GET /it_declaration/get_poi_approvals`). */
export interface PoiApprovalsData extends DeclaredDataForFY {
  prevEmploymentData?: PrevEmploymentPoiData | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITDeclarationEmployeeContact {
  /** Contact PK — display/name only; do not use as API `employeeId`. */
  id?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface ITDeclarationEmployee {
  /** Primary key of `biz_people_employee` — use for API `employeeId` params. */
  id: number;
  /** Display / HR code (e.g. "PN-03") — not the API employeeId param. */
  employeeId?: string;
  contact?: ITDeclarationEmployeeContact;
}

/** POI approval list row (`GET /it_declaration/poi_approvals`). */
export interface ApprovalPendingITDeclaration extends DeclaredDataForFY {
  employee?: ITDeclarationEmployee;
  prevEmploymentData?: unknown;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Employee PK for POI approval APIs (`GET /it_declaration?employeeId=`).
 * Uses `employee.id` only — never `employee.contact.id` (contact PK) or `employee.employeeId` (code).
 */
export function getPoiApprovalEmployeePk(
  declaration: Pick<ApprovalPendingITDeclaration, "employee">,
): number | null {
  const pk = declaration.employee?.id;
  if (typeof pk !== "number" || !Number.isFinite(pk) || pk <= 0) return null;
  return pk;
}

export function getItDeclarationEmployeeDisplayName(
  declaration: Pick<ApprovalPendingITDeclaration, "employee">,
): string {
  const emp = declaration.employee;
  if (!emp) return "—";
  const c = emp.contact;
  if (c?.name?.trim()) return c.name.trim();
  const combined = `${c?.firstName ?? ""} ${c?.lastName ?? ""}`.trim();
  return combined || emp.employeeId || "—";
}

interface GetPoiApprovalsApiResponse {
  data: ApprovalPendingITDeclaration[];
  message: string;
}

/** `status=history` for history tab; omit for pending. */
export type PoiApprovalsListParams = { status?: "history" };

/** POI submitted for approval or finalized — hide submit checkbox and delete. */
export function isItDeclarationSubmitted(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "submitted" || normalized === "approved";
}

export function getItDeclarationStatusChipColor(
  status?: string | null,
): "warning" | "success" | "error" | "info" {
  const normalized = (status ?? "not_submitted").trim().toLowerCase();
  if (normalized === "approved") return "success";
  if (normalized === "submitted") return "warning";
  if (normalized === "rejected") return "error";
  return "warning";
}

/** Chip color for per-line POI item status on approval review. */
export function getPoiItemStatusChipColor(
  status?: string | null,
): "warning" | "success" | "error" | "info" | "primary" {
  const normalized = (status ?? "pending").trim().toLowerCase();
  if (normalized === "approved") return "success";
  if (normalized === "partially_approved") return "primary";
  if (normalized === "rejected") return "error";
  if (normalized === "submitted") return "info";
  return "warning";
}

/** Historical FY or locked — blocks add/edit navigation and POI uploads. */
export function isItDeclarationReadOnly(options: {
  isHistoricalFY: boolean;
  isLocked?: boolean | null;
}): boolean {
  return options.isHistoricalFY || options.isLocked === true;
}

export interface GetDeclaredDataForFYParams {
  employeeId: number | string;
  financialYear: string;
}

interface GetDeclaredDataForFYApiResponse {
  data: DeclaredDataForFY | null;
  message: string;
}

export interface RentedHouseDetailDto {
  rentalPeriodFrom: string;
  rentalPeriodTo: string;
  rentAmount: number;
  metroNonMetro: string;
  landlordName: string;
  landlordPanNumber: string;
}

export interface SelfOccupiedPropertyDto {
  principalPaidOnLoan: number;
  interestPaidOnLoan: number;
  lenderName: string;
  lenderPan: string;
}

export interface LetOutPropertyDto {
  annualRentReceived: number;
  municipalTaxPaid: number;
  netAnnualValue: number;
  standardDeduction: number;
  netIncomeLoss: number;
  isRepayingHomeLoan: boolean;
  interestPaidOnLetOut?: number;
  principalForLetOut?: number;
  lenderName?: string;
  lenderPan?: string;
}

export interface ExemptionDetailDto {
  sectionCode: string;
  sectionName: string;
  sectionMaxLimit: number;
  subSectionCode: string;
  subSectionName: string;
  subSectionMaxLimit: number;
  componentMapping: string | null;
  declaredAmount: number;
}

export interface CreateITDeclarationDto {
  employeeId: number;
  financialYear: string;
  rentedHouseDetails?: RentedHouseDetailDto[];
  selfOccupiedProperty?: SelfOccupiedPropertyDto;
  letOutProperties?: LetOutPropertyDto[];
  exemptionDetails?: ExemptionDetailDto[];
}

interface CreateDeclarationApiResponse {
  data: unknown;
  message: string;
}

export type UpdateItDeclarationDto = CreateITDeclarationDto;

interface UpdateDeclarationApiResponse {
  data: unknown;
  message: string;
}

interface UploadPOIProofResponse {
  success: boolean;
}

export interface POIApplicableResponse {
  POIMonthStatus: boolean;
}

interface GetPOIApplicableApiResponse {
  data: POIApplicableResponse;
  message: string;
}

export interface POIComment {
  date: string;
  user: string;
  message: string;
}

export interface GetPOICommentsParams {
  declarationId: number;
  entityType: string;
}

interface GetPOICommentsApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
}
/* ---------- Attachment types ---------- */
export interface POIAttachment {
  filename: string;
  path: string;
}

export interface GetPOIAttachmentsParams {
  declarationId: number;
  entityType: string;
}

interface GetPOIAttachmentsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: POIAttachment[];
}

export interface POICommentsResponse {
  comments: POIComment[];
  commentCount: number;
}

import type { UpdatePOIStatusDto } from "../utils/poiStatusUpdate";
import type { ApiResponse } from "../../../org/documents/org-documents/api/organization.api";

export type { UpdatePOIStatusDto, UpdatePOIStatusDecision } from "../utils/poiStatusUpdate";

const IT_DECLARATION_URL = "/it_declaration";

function isNotFoundFetchError(error: FetchBaseQueryError): boolean {
  if (typeof error.status === "number" && error.status === 404) return true;
  if (error.status === "PARSING_ERROR" && error.originalStatus === 404)
    return true;
  const data = error.data;
  if (data && typeof data === "object" && "statusCode" in data) {
    return (data as { statusCode?: number }).statusCode === 404;
  }
  return false;
}

function isNotFoundSuccessBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  if (o.statusCode !== 404) return false;
  const inner = o.data;
  if (inner != null && typeof inner === "object" && "id" in inner) return false;
  return true;
}

export const itDeclarationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinancialYear: builder.query<FinancialYearsData, string>({
      query: (employeeId) => ({
        url: `${IT_DECLARATION_URL}/financial_year/`,
        method: "GET",
        params: { employeeId },
      }),
      transformResponse: (response: GetFinancialYearApiResponse) =>
        response.data,
    }),

    getDeclaration: builder.query<DeclarationData, GetDeclarationParams>({
      query: ({ employeeId, startYear, endYear }) => ({
        url: `${IT_DECLARATION_URL}/${employeeId}`,
        method: "GET",
        params: { startYear, endYear },
      }),
      transformResponse: (response: GetDeclarationApiResponse) => response.data,
    }),

    getDeclaredDataForFY: builder.query<
      DeclaredDataForFY | null,
      GetDeclaredDataForFYParams
    >({
      queryFn: async (
        { employeeId, financialYear },
        _api,
        _extraOptions,
        fetchWithBQ,
      ) => {
        const result = await fetchWithBQ({
          url: IT_DECLARATION_URL,
          method: "GET",
          params: { employeeId, financialYear },
        });
        if (result.error) {
          if (isNotFoundFetchError(result.error)) return { data: null };
          return { error: result.error };
        }
        const raw = result.data;
        if (isNotFoundSuccessBody(raw)) return { data: null };
        const body = raw as GetDeclaredDataForFYApiResponse;
        return { data: body.data ?? null };
      },
      providesTags: (_result, _error, { employeeId, financialYear }) => [
        { type: "ITDeclaration", id: `${employeeId}-${financialYear}` },
      ],
    }),

    createDeclaration: builder.mutation<
      CreateDeclarationApiResponse["data"],
      CreateITDeclarationDto
    >({
      query: (body) => ({
        url: IT_DECLARATION_URL,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        {
          type: "ITDeclaration",
          id: `${body.employeeId}-${body.financialYear}`,
        },
      ],
    }),

    updateDeclaration: builder.mutation<
      UpdateDeclarationApiResponse["data"],
      { id: number; body: UpdateItDeclarationDto }
    >({
      query: ({ id, body }) => ({
        url: `${IT_DECLARATION_URL}/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: UpdateDeclarationApiResponse) =>
        response.data,
      invalidatesTags: (_result, _error, { body }) => [
        {
          type: "ITDeclaration",
          id: `${body.employeeId}-${body.financialYear}`,
        },
      ],
    }),

    deleteDeclaration: builder.mutation<{ declarationId: number }, number>({
      query: (id) => ({
        url: `${IT_DECLARATION_URL}/${id}`,
        method: "DELETE",
      }),
      transformResponse: (
        response: { data?: { declarationId?: number }; message?: string },
        _meta,
        id,
      ) => ({ declarationId: response.data?.declarationId ?? id }),
      invalidatesTags: () => [{ type: "ITDeclaration" }],
    }),

    getPOIApplicableStatus: builder.query<POIApplicableResponse, void>({
      query: () => ({
        url: `${IT_DECLARATION_URL}/is_poi_applicable`,
        method: "GET",
      }),
      transformResponse: (response: GetPOIApplicableApiResponse) =>
        response.data,
    }),

    /** GET /it_declaration/poi_approvals — pending (no status) or history (`status=history`) */
    getPoiApprovals: builder.query<
      ApprovalPendingITDeclaration[],
      PoiApprovalsListParams | void
    >({
      query: (params) => ({
        url: `${IT_DECLARATION_URL}/poi_approvals`,
        method: "GET",
        params:
          params?.status === "history" ? { status: "history" } : undefined,
      }),
      transformResponse: (response: GetPoiApprovalsApiResponse) =>
        response.data ?? [],
      providesTags: (_result, _error, params) => [
        {
          type: "ITDeclaration",
          id:
            params?.status === "history"
              ? "POI_APPROVALS_HISTORY"
              : "POI_APPROVALS_PENDING",
        },
      ],
    }),

    uploadPOIProof: builder.mutation<UploadPOIProofResponse, FormData>({
      query: (body) => ({
        url: `${IT_DECLARATION_URL}/poi_proof`,
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        data: UploadPOIProofResponse;
        message: string;
      }) => response.data,
      invalidatesTags: (_result, _error, formData) => {
        const params = buildPoiScopedFetchParamsFromFormData(formData);
        const cacheId = params ? getPoiScopedFetchCacheKey(params) : "unknown";
        return [
          { type: "POIAttachments", id: cacheId },
          { type: "POIComments", id: cacheId },
        ];
      },
    }),

    /** GET /it_declaration/get_attachment/:id/:entityType */
    getPOIAttachments: builder.query<POIAttachment[], GetPOIAttachmentsParams>({
      queryFn: async (params, _api, _extraOptions, fetchWithBQ) => {
        const urls = buildPoiFetchUrlCandidates(
          `${IT_DECLARATION_URL}/get_attachment`,
          params,
        );
        let lastError: FetchBaseQueryError | undefined;
        for (const url of urls) {
          const result = await fetchWithBQ({ url, method: "GET" });
          if (result.error) {
            if (isNotFoundFetchError(result.error)) continue;
            lastError = result.error as FetchBaseQueryError;
            continue;
          }
          const body = result.data;
          if (isNotFoundSuccessBody(body)) continue;
          const data = (body as GetPOIAttachmentsApiResponse).data ?? [];
          if (data.length > 0 || url === urls[urls.length - 1]) {
            return { data };
          }
        }
        if (lastError) return { error: lastError };
        return { data: [] };
      },
      providesTags: (_result, _error, params) => [
        { type: "POIAttachments", id: getPoiScopedFetchCacheKey(params) },
      ],
    }),
    /** GET /it_declaration/get_comments/:id/:entityType */
    getPOIComments: builder.query<
      POICommentsResponse,
      GetPOICommentsParams
    >({
      queryFn: async (params, _api, _extraOptions, fetchWithBQ) => {
        const urls = buildPoiFetchUrlCandidates(
          `${IT_DECLARATION_URL}/get_comments`,
          params,
        );

        let lastError: FetchBaseQueryError | undefined;

        for (const url of urls) {
          const result = await fetchWithBQ({ url, method: "GET" });

          if (result.error) {
            if (isNotFoundFetchError(result.error)) continue;
            lastError = result.error as FetchBaseQueryError;
            continue;
          }

          const body = result.data as ApiResponse<POICommentsResponse>;

          return {
            data: {
              comments: body.data?.comments ?? [],
              commentCount: body.data?.commentCount ?? 0,
            },
          };
        }

        if (lastError) {
          return { error: lastError };
        }

        return {
          data: {
            comments: [],
            commentCount: 0,
          },
        };
      },

      providesTags: (_result, _error, params) => [
        {
          type: "POIComments",
          id: getPoiScopedFetchCacheKey(params),
        },
      ],
    }),
    updatePOIStatus: builder.mutation<
      { data: unknown; message: string },
      UpdatePOIStatusDto
    >({
      query: (body) => ({
        url: `${IT_DECLARATION_URL}/poi_status`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: unknown; message: string }) =>
        response,
      invalidatesTags: () => [
        { type: "ITDeclaration", id: "LIST" },
        { type: "ITDeclaration", id: "POI_APPROVALS_PENDING" },
        { type: "ITDeclaration", id: "POI_APPROVALS_HISTORY" },
      ],
    }),

    submitPOI: builder.mutation<{ data: unknown; message: string }, number>({
      query: (declarationId) => ({
        url: `${IT_DECLARATION_URL}/submit/${declarationId}`,
        method: "POST",
      }),
      transformResponse: (response: { data: unknown; message: string }) =>
        response,
      // invalidate tags so any related data refetches (attachments, comments, or declaration)
      invalidatesTags: (_result, _error, declarationId) => [
        { type: "ITDeclaration" },
        { type: "ITDeclaration", id: "POI_APPROVALS_PENDING" },
        { type: "ITDeclaration", id: "POI_APPROVALS_HISTORY" },
        { type: "POIAttachments", id: `${declarationId}-all` },
        { type: "POIComments", id: `${declarationId}-all` },
      ],
    }),

    considerForIT: builder.mutation<{ data: unknown; message: string }, number>({
      query: (declarationId) => ({
        url: `${IT_DECLARATION_URL}/consider_for_it/${declarationId}`,
        method: "POST",
      }),
      transformResponse: (response: { data: unknown; message: string }) =>
        response,
      invalidatesTags: (_result, _error, declarationId) => [
        { type: "ITDeclaration" },
        { type: "ITDeclaration", id: "POI_APPROVALS_PENDING" },
        { type: "ITDeclaration", id: "POI_APPROVALS_HISTORY" },
        { type: "ITDeclaration", id: "LIST" },
        { type: "POIAttachments", id: `${declarationId}-all` },
        { type: "POIComments", id: `${declarationId}-all` },
      ],
    }),
  }),
});

export const {
  useGetFinancialYearQuery,
  useGetDeclarationQuery,
  useGetDeclaredDataForFYQuery,
  useCreateDeclarationMutation,
  useUpdateDeclarationMutation,
  useDeleteDeclarationMutation,
  useGetPOIApplicableStatusQuery,
  useGetPoiApprovalsQuery,
  useUploadPOIProofMutation,
  useGetPOIAttachmentsQuery,
  useGetPOICommentsQuery,
  useSubmitPOIMutation,
  useUpdatePOIStatusMutation,
  useConsiderForITMutation,
} = itDeclarationApi;
