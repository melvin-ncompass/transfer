import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { type Dayjs } from "dayjs";
import { TabsAtom } from "../../../../../../../components/tabs/Tabs";
import { SingleSelectElement } from "../../../../../../../components/atom/select-field/SingleSelect";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import { ConfirmDialog } from "../../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import CustomCircularProgress from "../../../../../../../components/atom/circular-progress/CircularProgress";
import {
  useGetIncomeTaxQuery,
  useGetFinancialYearsByConfigQuery,
  useDeleteIncomeTaxMutation,
} from "../api/incometax.api";
import type { FinancialYearItem } from "../types/incometax.types";
import { useGetHeaderDataQuery } from "../../../../../../company/api/company.api";
import { formatNumberByCommaSeparation } from "../../../../../../../utils/numberFormatter";
import {
  isNewTaxRegimeConfig,
  isSystemTaxRegimeConfig,
  shouldHideVersionControlsForTaxConfig,
} from "../utils/incomeTaxConfigUtils";
import { IncomeTaxModal } from "./IncomeTaxModal";
import { ConfigDetailsOverview } from "./ConfigDetailsOverview";
import { ConfigDetailsExemptions } from "./ConfigDetailsExemptions";

function formatRate(value: number | null | undefined): string {
  if (value == null) return "-";
  return value + "%";
}

/** e.g. Aug 21, 2025 - Mar 31, 2026 (matches API YYYY-MM-DD or YYYY-MM). */
function formatFinancialYearVersionLabel(start: string, end: string): string {
  const formatOne = (raw: string) => {
    const t = raw?.trim() ?? "";
    if (!t) return "";
    const parsed = /^\d{4}-\d{2}-\d{2}/.test(t) ? dayjs(t) : dayjs(t, "YYYY-MM");
    return parsed.isValid() ? parsed.format("MMM D, YYYY") : t;
  };
  return `${formatOne(start)} - ${formatOne(end)}`;
}

const INCOME_TAX_LIST_PATH = "/people/home?tab=71&mainTab=2&subtab=1";

function getVersionIdAfterDelete(
  versions: FinancialYearItem[],
  deletedVersionId: number,
): number | null {
  const remaining = versions.filter((version) => version.id !== deletedVersionId);
  if (remaining.length === 0) return null;

  const currentIndex = versions.findIndex((version) => version.id === deletedVersionId);
  if (currentIndex === -1) return remaining[0].id;

  const nextVersion = versions[currentIndex + 1];
  if (nextVersion && nextVersion.id !== deletedVersionId) {
    return nextVersion.id;
  }

  const previousVersion = versions[currentIndex - 1];
  if (previousVersion && previousVersion.id !== deletedVersionId) {
    return previousVersion.id;
  }

  return remaining[0].id;
}

export default function ConfigDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const versionId = id != null && /^\d+$/.test(id) ? Number(id) : null;

  const { data: headerData } = useGetHeaderDataQuery();
  const currencySymbol = headerData?.data?.reportingCurrency?.split(" - ")[0]?.trim() ?? "₹";
  const commaSeparation = headerData?.data?.commaSeparation === "US" ? "US" : "IN";

  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return "-";
    const formatted = formatNumberByCommaSeparation(value, commaSeparation);
    return `${currencySymbol} ${formatted}`.trim();
  };

  const formatTableAmount = (value: number | null | undefined): string => {
    const formatted = formatCurrency(value);
    return formatted === "-" ? formatted : formatted.replace(/\.00$/, "");
  };

  const { data: incomeTax, isLoading: isLoadingTax } = useGetIncomeTaxQuery(versionId!, {
    skip: versionId == null,
  });
  const configId = incomeTax?.config?.id;
  const { data: financialYears = [] } = useGetFinancialYearsByConfigQuery(configId!, {
    skip: configId == null,
  });
  const [deleteIncomeTax] = useDeleteIncomeTaxMutation();

  const [openDelete, setOpenDelete] = useState(false);
  const [isRedirectingAfterDelete, setIsRedirectingAfterDelete] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addVersionModalOpen, setAddVersionModalOpen] = useState(false);
  const [versionSelectValue, setVersionSelectValue] = useState(id ?? "");
  const [detailsTab, setDetailsTab] = useState(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const configDetails = useMemo(() => {
    if (!incomeTax) return null;
    return {
      configName: incomeTax.config?.configName ?? "-",
      nonTaxableThreshold: incomeTax.nonTaxableAmount ?? 0,
      standardDeduction: incomeTax.standardDeduction ?? null,
      cessPercentage: incomeTax.cess ?? null,
      isHRAEnabled: incomeTax.isHraEnabled ? "Yes" : "No",
      section87ARebate: incomeTax.rebateAmount ?? 0,
    };
  }, [incomeTax]);

  const configName = configDetails?.configName;
  const isNewTaxRegime = isNewTaxRegimeConfig(configName);
  const showEditAction =
    Boolean(configDetails) &&
    (isNewTaxRegime || !isSystemTaxRegimeConfig(configName));
  const showDeleteAction =
    Boolean(configDetails) &&
    (isNewTaxRegime ? financialYears.length > 1 : !isSystemTaxRegimeConfig(configName));

  const taxSlabs = useMemo(() => {
    if (!incomeTax?.rangeData?.length) return [];
    return incomeTax.rangeData.map((r, i) => ({
      id: i + 1,
      from: formatTableAmount(r.from),
      to: formatTableAmount(r.to),
      rate: formatRate(r.tax ?? r.rate),
    }));
  }, [incomeTax?.rangeData, currencySymbol, commaSeparation]);

  const surchargeThreshold = useMemo(() => {
    if (!incomeTax?.surchargeSlab?.length) return [];
    return incomeTax.surchargeSlab.map((s, i) => ({
      id: i + 1,
      from: formatTableAmount(s.from),
      to: formatTableAmount(s.to),
      rate: formatRate(s.tax ?? (s as { surchargePercentage?: number }).surchargePercentage),
    }));
  }, [incomeTax?.surchargeSlab, currencySymbol, commaSeparation]);

  const versionOptions = useMemo(() => {
    const fromApi = financialYears.map((fy) => ({
      label: fy.financialYearStart && fy.financialYearEnd
        ? formatFinancialYearVersionLabel(fy.financialYearStart, fy.financialYearEnd)
        : fy.versionNo === 0
          ? "Base version"
          : `Version ${fy.versionNo}`,
      value: String(fy.id),
    }));
    const base = fromApi.length > 0 ? fromApi : (incomeTax && versionId != null ? [{ label: "Current", value: String(versionId) }] : []);
    return [...base, { label: "+ Add version", value: "__add_version__" }];
  }, [financialYears, incomeTax, versionId]);

  useEffect(() => {
    setVersionSelectValue(id ?? "");
  }, [id]);

  const handleVersionChange = (value: string) => {
    if (value === "__add_version__") {
      setAddVersionModalOpen(true);
      setVersionSelectValue(id ?? "");
      return;
    }
    if (value !== id) navigate(`/people/configs/${value}`, { replace: true });
  };

  const editModalInitialData = useMemo(() => {
    if (!incomeTax) return undefined;
    const v = incomeTax;
    const toStr = (n: number | null | undefined) =>
      n != null ? String(n) : "";
    return {
      configName: v.config?.configName ?? "",
      nonTaxableThreshold: toStr(v.nonTaxableAmount),
      enableStandardDeduction: (v.standardDeduction ?? 0) > 0,
      standardDeductionAmount: toStr(v.standardDeduction),
      enableVersions: v.config?.isVersionEnabled ?? Boolean(v.financialYearStart),
      versionStartDate: v.financialYearStart
        ? (dayjs(v.financialYearStart, "YYYY-MM") as Dayjs)
        : null,
      versionEndDate: v.financialYearEnd
        ? (dayjs(v.financialYearEnd, "YYYY-MM") as Dayjs)
        : null,
      enableCess: (v.cess ?? 0) > 0,
      cessPercentage: toStr(v.cess),
      enableHRA: v.isHraEnabled ?? false,
      rebateThresholdIncome: toStr(v.taxableIncomeThreshold),
      rebateMaxAmount: toStr(v.rebateAmount),
      taxSlabs: (v.rangeData ?? []).map((s) => ({
        fromAmount: toStr(s.from),
        toAmount: toStr(s.to),
        taxPercentage: toStr(s.tax ?? s.rate),
      })),
      surchargeSlabs: (v.surchargeSlab ?? []).map((s) => ({
        fromAmount: toStr(s.from),
        toAmount: toStr(s.to),
        surchargePercentage: toStr(s.surchargePercentage ?? s.tax),
      })),
    };
  }, [incomeTax]);

  const handleDeleteConfirm = async () => {
    if (versionId == null) return;
    const redirectVersionId = getVersionIdAfterDelete(financialYears, versionId);
    const redirectToList = redirectVersionId == null;
    try {
      setOpenDelete(false);
      if (redirectToList) {
        setIsRedirectingAfterDelete(true);
      }
      await deleteIncomeTax(versionId).unwrap();
      if (redirectVersionId != null) {
        setSnackbar({ open: true, message: "Configuration deleted successfully.", color: "success" });
        navigate(`/people/configs/${redirectVersionId}`, { replace: true });
        return;
      }
      navigate(INCOME_TAX_LIST_PATH, { replace: true });
    } catch (err: any) {
      setIsRedirectingAfterDelete(false);
      const msg = err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete.";
      setSnackbar({
        open: true,
        message: Array.isArray(msg) ? msg.join(" ") : String(msg),
        color: "error",
      });
    }
  };

  if (isRedirectingAfterDelete) {
    return (
      <Box
        sx={{
          height: "100%",
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CustomCircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Card
        variant="outlined"
        sx={{
          boxShadow: 2,
          flexGrow: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
            {/* Header Section inside Card */}
            <Box
              sx={{
                p: 2.5,
                pb: 1,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "grey.50",
                flexShrink: 0,
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <IconButton
                    onClick={() => navigate(-1)}
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid",
                      borderColor: "grey.300",
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {configDetails?.configName ?? (isLoadingTax ? "Loading..." : "–")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Configuration Details
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  {configDetails &&
                    incomeTax?.config?.isVersionEnabled &&
                    !shouldHideVersionControlsForTaxConfig(configDetails.configName) && (
                      <Box minWidth={230} width={250}>
                        <SingleSelectElement
                          label="Version"
                          value={versionSelectValue}
                          onChange={handleVersionChange}
                          options={versionOptions}
                        />
                      </Box>
                    )}
                  {showEditAction && (
                    <PrimaryIconButton
                      icon={<EditIcon fontSize="small" />}
                      title="Edit"
                      onClick={() => setEditModalOpen(true)}
                      variant="outlined"
                    />
                  )}
                  {showDeleteAction && (
                    <PrimaryIconButton
                      icon={<DeleteIcon fontSize="small" />}
                      title="Delete"
                      color="error"
                      variant="outlined"
                      onClick={() => setOpenDelete(true)}
                    />
                  )}
                </Stack>
              </Stack>
            </Box>

            <CardContent
              sx={{
                p: 0,
                overflow: "hidden",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              {versionId == null ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 320,
                    p: 3,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Invalid or missing configuration ID.
                  </Typography>
                </Box>
              ) : isLoadingTax || !incomeTax ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 320,
                    p: 3,
                  }}
                >
                  <CustomCircularProgress size={32} />
                </Box>
              ) : configDetails ? (
                <TabsAtom
                  value={detailsTab}
                  onChange={setDetailsTab}
                  sx={{ flex: 1, minHeight: 0, px: 3, pt: 2 }}
                  contentSx={{ p: 0, pb: 3, pt: 0, overflow: "auto" }}
                  tabs={[
                    {
                      label: "Overview",
                      content: (
                        <ConfigDetailsOverview
                          configDetails={configDetails}
                          formatCurrency={formatTableAmount}
                          taxSlabs={taxSlabs}
                          surchargeThreshold={surchargeThreshold}
                          currencySymbol={currencySymbol}
                        />
                      ),
                    },
                    {
                      label: "Exemptions",
                      content: (
                        <ConfigDetailsExemptions
                          key={versionId}
                          versionId={versionId}
                          configId={configId}
                          isEditMode
                          exemptionsData={
                            Array.isArray(incomeTax.taxExemption)
                              ? incomeTax.taxExemption
                              : []
                          }
                          formatCurrency={formatCurrency}
                        />
                      ),
                    },
                  ]}
                />
              ) : null}
            </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={openDelete}
          onClose={() => setOpenDelete(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Configuration"
          message={`Are you sure you want to delete "${configDetails?.configName ?? "this"}" configuration?`}
          confirmText="Delete"
          confirmColor="error"
        />

        {snackbar.open && (
          <Snackbar
            message={snackbar.message}
            color={snackbar.color}
            onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          />
        )}

        <IncomeTaxModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          mode="edit"
          editVersionId={versionId ?? undefined}
          editConfigId={configId ?? undefined}
          initialData={editModalInitialData}
          onSuccess={(msg) => {
            setSnackbar({ open: true, message: msg, color: "success" });
            setEditModalOpen(false);
          }}
          onError={(msg) => {
            setSnackbar({ open: true, message: msg, color: "error" });
          }}
        />

        <IncomeTaxModal
          open={addVersionModalOpen}
          onClose={() => setAddVersionModalOpen(false)}
          mode="addVersion"
          parentConfigId={configId ?? undefined}
          initialData={editModalInitialData}
          onSuccess={(msg, newVersionId) => {
            setSnackbar({ open: true, message: msg, color: "success" });
            setAddVersionModalOpen(false);
            if (newVersionId != null) {
              navigate(`/people/configs/${newVersionId}`, { replace: true });
            }
          }}
          onError={(msg) => {
            setSnackbar({ open: true, message: msg, color: "error" });
          }}
        />
    </Box>
  );
}
