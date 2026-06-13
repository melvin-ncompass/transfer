import { useState, useEffect } from "react";
import { Card, Box, Alert, Chip, Skeleton, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { TabsAtom, type TabItem } from "../../../../components/tabs";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import { RunPayrollTab } from "./runpayroll/RunPayrollTab";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import DescriptionIcon from "@mui/icons-material/Description";
import PaySchedule from "./settings/PaySchedule/components/PaySchedule";
import { PayScheduleModal } from "./settings/PaySchedule/components/PayScheduleModal";
import { useGetPayScheduleQuery } from "./settings/PaySchedule/api/payschedule.api";
import type { PaySchedulePayload } from "./settings/PaySchedule/types/payschedule.types";
import { useGetPayslipTemplatesQuery } from "./settings/PayslipCustomization/api/payslip.api";
import dayjs, { type Dayjs } from "dayjs";
import { IncomeTaxTab } from "./settings/IncomeTax/components/IncomeTax";
import { IncomeTaxModal } from "./settings/IncomeTax/components/IncomeTaxModal";
import { useGetIncomeTaxQuery } from "./settings/IncomeTax/api/incometax.api";
import { PrimaryIconButton } from "../../../../components/atom/button";
import { Snackbar } from "../../../../components/atom/snackbar";
import PayslipTemplateTable from "./settings/PayslipCustomization/components/PayslipTemplateTable";
import PayslipEditor from "./settings/PayslipCustomization/components/PayslipCustomizationModal";
import { useGetIdentityQuery } from "../../../setting/companyIdentity/components/identity.api";
import { useGetImagesQuery } from "../../../setting/companyDetails/api/companyBranding.api";
import { StandardTable } from "../../../../components/tables/standard-table";
import { useGetPayrunHistoryQuery } from "./runpayroll/api/payrun.api";
import { PrimaryButton } from "../../../../components/atom/button";

function PayrunHistoryTab() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetPayrunHistoryQuery();

  if (isLoading) {
    return (
      <Box>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load payrun history.</Alert>;
  }

  const rows = (data ?? [])
    .map((item: any) => {
      const payrunId = Number(item?.payrunId ?? item?.id);
      const status = String(item?.status ?? "draft").toLowerCase();
      const payableDate = item?.payableDate ?? item?.cycleEnd ?? item?.cycleStart;
      if (!Number.isFinite(payrunId) || payrunId <= 0) return null;
      return {
        id: payrunId,
        payrunId,
        payableDate: payableDate ? dayjs(payableDate).format("MMM DD, YYYY") : "—",
        status,
      };
    })
    .filter(Boolean) as {
    id: number;
    payrunId: number;
    payableDate: string;
    status: string;
  }[];

  if (rows.length === 0) {
    return (
      <Alert severity="info" icon={false}>
        No payrun history found.
      </Alert>
    );
  }

  const statusColor = (status: string): "default" | "success" | "error" | "warning" => {
    if (status === "paid" || status === "approved") return "success";
    if (status === "rejected") return "error";
    if (status === "partially_paid" || status === "skipped") return "warning";
    return "default";
  };

  return (
    <Box display="flex" flexDirection="column" height="100%" flex={1} minHeight={0}>
      <Typography variant="subtitle1" color="textPrimary" mb={1.5}>
        Payrun History
      </Typography>
      <Box
        sx={{

          overflowX: "auto",
          overflowY: "auto",
          flex: 1,          
          minHeight: 0,     
        }}
      >
      <StandardTable
        sticky
        columns={[
          {
            id: "payableDate",
            label: "Payable Date",
            width: 170,
            render: (row: any) => row.payableDate,
          },
          {
            id: "status",
            label: "Status",
            width: 140,
            render: (row: any) => (
              <Chip
                size="small"
                label={row.status.replaceAll("_", " ")}
                color={statusColor(row.status)}
                sx={{ textTransform: "capitalize" }}
              />
            ),
          },
          {
            id: "actions",
            label: "Actions",
            align: "center",
            width: 160,
            render: (row: any) => (
              <Box display="flex" justifyContent="center">
                <PrimaryButton
                  size="small"
                  variant="text"
                  onClick={() => navigate(`/people/salary/payrun/${row.payrunId}`)}
                >
                  View
                </PrimaryButton>
              </Box>
            ),
          },
        ]}
        rows={rows}
      />
    </Box>
    </Box>
  );
}

export function PayrunView() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Default to mainTab=0 if url tab=71, else we can control via search params
  const initialMainTab = parseInt(searchParams.get("mainTab") || "0", 10);
  const initialSettingsSubTab = parseInt(searchParams.get("subtab") || "0", 10);

  const [mainTab, setMainTab] = useState(initialMainTab);
  const [settingsSubTab, setSettingsSubTab] = useState(initialSettingsSubTab);

  useEffect(() => {
    const mainTabParam = searchParams.get("mainTab");
    if (mainTabParam) {
      setMainTab(parseInt(mainTabParam, 10));
    }
    const subtabParam = searchParams.get("subtab");
    if (subtabParam) {
      setSettingsSubTab(parseInt(subtabParam, 10));
    }
  }, [searchParams]);

  const handleMainTabChange = (val: number) => {
    setMainTab(val);
    // Reset settings sub-tab when switching main tabs
    setSettingsSubTab(0);
    setSearchParams((prev) => {
      prev.set("mainTab", String(val));
      prev.set("subtab", "0");
      return prev;
    });
  };

  const handleSettingsSubTabChange = (val: number) => {
    setSettingsSubTab(val);
    setSearchParams((prev) => {
      prev.set("subtab", String(val));
      return prev;
    });
  };

  const [payScheduleModalOpen, setPayScheduleModalOpen] = useState(false);
  const [incomeTaxModalOpen, setIncomeTaxModalOpen] = useState(false);
  const [incomeTaxEditId, setIncomeTaxEditId] = useState<number | null>(null);
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);

  const isSettingsTab = mainTab === 2;
  const isPayScheduleSubTab = settingsSubTab === 0;
  const isIncomeTaxSubTab = settingsSubTab === 1;
  const isPayslipSubTab = settingsSubTab === 2;

  // Pay Schedule data fetched only when Settings > Pay Schedule tab is active
  const {
    data: payScheduleData,
    isLoading: isPayScheduleLoading,
    refetch: refetchPaySchedule,
  } = useGetPayScheduleQuery(undefined, {
    skip: !isSettingsTab || !isPayScheduleSubTab,
  });
  useEffect(() => {
    if (isSettingsTab && isPayScheduleSubTab) {
      refetchPaySchedule();
    }
  }, [isSettingsTab, isPayScheduleSubTab, refetchPaySchedule]);
  const payScheduleItem = Array.isArray(payScheduleData?.data) ? payScheduleData.data[0] ?? null : payScheduleData?.data ?? null;

  /** GET `iseditable` / `isEditable`: edit icon and edit modal only when explicitly true. */
  const payScheduleIsEditable = (item: PaySchedulePayload | null | undefined) =>
    Boolean(item && (item.iseditable === true || item.isEditable === true));

  /** Open modal in edit mode only when GET says schedule is editable. */
  const isPayScheduleEditMode = Boolean(payScheduleItem) && payScheduleIsEditable(payScheduleItem);

  // Payslip templates data fetched only when Settings > Payslip Customization tab is active
  const { data: payslipTemplatesData, isLoading: isPayslipTemplatesLoading } = useGetPayslipTemplatesQuery(undefined, {
    skip: !isSettingsTab || !isPayslipSubTab,
  });
  const payslipTemplates = payslipTemplatesData ?? [];
  const { data: branding } = useGetImagesQuery(undefined, {
    skip: !isSettingsTab || !isPayslipSubTab || !payslipModalOpen,
  });
  const { data: identity } = useGetIdentityQuery(undefined, {
    skip: !isSettingsTab || !isPayslipSubTab || !payslipModalOpen,
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", color: "success" });

  /** Common handler for all settings modals: show backend message (success or error) in snackbar */
  const showSnackbar = (
    message: string | string[] | undefined,
    color: "success" | "error" | "info" | "warning" = "success"
  ) => {
    const msg =
      Array.isArray(message)
        ? message.join(" ")
        : typeof message === "string"
          ? message
          : "";
    setSnackbar({
      open: true,
      message: msg.trim() || (color === "error" ? "Something went wrong." : "Done."),
      color,
    });
  };

  const handleAddClick = () => {
    switch (settingsSubTab) {
      case 0:
        if (payScheduleItem && !payScheduleIsEditable(payScheduleItem)) return;
        setPayScheduleModalOpen(true);
        break;
      case 1:
        setIncomeTaxEditId(null);
        setIncomeTaxModalOpen(true);
        break;
      case 2:
        setPayslipModalOpen(true);
        break;
    }
  };

  const { data: incomeTaxEditData } = useGetIncomeTaxQuery(incomeTaxEditId!, {
    skip: !incomeTaxEditId,
  });

  const incomeTaxInitialData = (() => {
    if (!incomeTaxEditId || !incomeTaxEditData) return undefined;
    const v = incomeTaxEditData;
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
        surchargePercentage: toStr(s.tax ?? (s as { surchargePercentage?: number }).surchargePercentage),
      })),
    };
  })();

  const settingsSubTabs: TabItem[] = [
    {
      label: "Pay Schedule",
      icon: <ScheduleIcon />,
      content: (
        <PaySchedule
          scheduleData={payScheduleItem}
          isLoading={isPayScheduleLoading}
          onOpenModal={() => setPayScheduleModalOpen(true)}
        />
      ),
    },
    {
      label: "Income Tax",
      icon: <AccountBalanceIcon />,
      content: (
        <IncomeTaxTab
          skipQuery={!isSettingsTab || !isIncomeTaxSubTab}
          onEditClick={(id) => {
            setIncomeTaxEditId(id);
            setIncomeTaxModalOpen(true);
          }}
          onDeleteSuccess={(msg) => showSnackbar(msg, "success")}
          onDeleteError={(msg) => showSnackbar(msg, "error")}
        />
      ),
    },
    {
      label: "Payslip Customization",
      icon: <DescriptionIcon />,
      content: (
        <PayslipTemplateTable
          data={payslipTemplates}
          isLoading={isPayslipTemplatesLoading}
        />
      ),
    },
  ];

  const getCurrentActionIcon = () => {
    if (settingsSubTab === 0) {
      if (!payScheduleItem) return <AddIcon />;
      if (payScheduleIsEditable(payScheduleItem)) return <EditIcon />;
      return <AddIcon />;
    }
    const tabConfig: Record<number, { supportsEdit: boolean; isEditMode: boolean }> = {
      1: { supportsEdit: false, isEditMode: false },
      2: { supportsEdit: false, isEditMode: false },
    };

    const current = tabConfig[settingsSubTab] || { supportsEdit: false, isEditMode: false };

    if (current.supportsEdit && current.isEditMode) {
      return <EditIcon />;
    }
    return <AddIcon />;
  };

  const settingsActionButton =
    settingsSubTab === 0 && payScheduleItem && !payScheduleIsEditable(payScheduleItem) ? undefined : (
      <PrimaryIconButton
        icon={getCurrentActionIcon()}
        onClick={handleAddClick}
        sx={{ flexShrink: 0 }}
        variant="outlined"
      />
    );

  /** ---------- MAIN TABS ---------- */
  const mainTabs: TabItem[] = [
    {
      label: "Run Payroll",
      icon: <PlayCircleOutlineIcon />,
      content: (
        <Box sx={{ minHeight: 0, flex: 1, overflow: "auto" }}>
          <RunPayrollTab isActive={mainTab === 0} />
        </Box>
      ),
    },
    {
      label: "Payrun History",
      icon: <HistoryIcon />,
      content: (
        <Box sx={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
          <PayrunHistoryTab />
        </Box>
      ),
    },
    {
      label: "Settings",
      icon: <SettingsIcon />,
      content: (
        <Box sx={{ minHeight: 0, flex: 1, display: "flex", flexDirection: "column" }}>
          <TabsAtom
            tabs={settingsSubTabs}
            value={settingsSubTab}
            onChange={handleSettingsSubTabChange}
            scrollable
            tabSx={{ mb: 0 }}
            contentSx={{
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              p: 0,
              pt: 1,
            }}
            action={settingsActionButton}
          />
        </Box>
      ),
    },
  ];


  return (
    <>
      <Card
        elevation={2}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <TabsAtom
          tabs={mainTabs}
          value={mainTab}
          onChange={handleMainTabChange}
          scrollable
          contentSx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            p: 0,
            pt: 1,
          }}
        />
      </Card>

      {/* Modals */}
      <PayScheduleModal
        open={payScheduleModalOpen}
        onClose={() => setPayScheduleModalOpen(false)}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
        mode={isPayScheduleEditMode ? "edit" : "add"}
        initialData={payScheduleItem}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}

      <IncomeTaxModal
        open={incomeTaxModalOpen}
        onClose={() => {
          setIncomeTaxModalOpen(false);
          setIncomeTaxEditId(null);
        }}
        mode={incomeTaxEditId != null ? "edit" : "add"}
        initialData={incomeTaxInitialData}
        editVersionId={incomeTaxEditId}
        editConfigId={incomeTaxEditData?.config?.id ?? undefined}
        onSuccess={(message) => showSnackbar(message, "success")}
        onError={(message) => showSnackbar(message, "error")}
      />

      {/* Payslip Modal - when created, use same pattern: onSuccess={(msg) => showSnackbar(msg, "success")} onError={(msg) => showSnackbar(msg, "error")} */}
      <PayslipEditor
        title="Add Template"
        open={payslipModalOpen}
        onClose={() => setPayslipModalOpen(false)}
        onSuccess={(message) => showSnackbar(message!, "success")}
        onError={(message) => showSnackbar(message!, "error")}
        branding={branding}
        identity={identity}
      />
    </>
  );
}