import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../../components/tables/standard-table";
import { PrimaryIconButton } from "../../../../../../../components/atom/button";
import type { StandardTableColumn } from "../../../../../../../types/types";
import type { Exit } from "../../api/exit.api";
import { TextFieldElement } from "../../../../../../../components/atom/text-field";
import EditIcon from "@mui/icons-material/Edit";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  useGetEncashableLeavesQuery,
  useLazyGetEncashableAmountQuery,
  useSubmitFinanceConfigMutation,
} from "../../api/exit.api";
import { useSnackbar } from "../../../../../../../context/SnackbarContext";
import { useGetHeaderDataQuery } from "../../../../../../company/api/company.api";
import {
  formatCurrencyByCommaSeparation,
  formatNumberForTyping,
  parseNumberForTyping,
} from "../../../../../../../utils/numberFormatter";

interface FinancesTabProps {
  exitData: Exit;
}

type LeaveRow = {
  leaveTypeId: number;
  leaveType: string;
  leaveBalance: number;
  leaveName: string;
  encashLeaveFor: number | string;
  amount: number | string;
};

const formatEncashAmount = (value: number) =>
  Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

export const FinancesTab = ({ exitData }: FinancesTabProps) => {
  const { showSnackbar } = useSnackbar();
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const formatAmount = useCallback(
    (value: number | string) =>
      formatCurrencyByCommaSeparation(value, commaSeparation, "₹"),
    [commaSeparation]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [submitFinanceConfig, { isLoading }] = useSubmitFinanceConfigMutation();
  const employeeId = exitData.employee.id;
  const { data: encashableLeaves } = useGetEncashableLeavesQuery(employeeId, {
    skip: !employeeId,
  });
  const [fetchEncashableAmount] = useLazyGetEncashableAmountQuery();
  const encashAmountTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [fetchingAmountFor, setFetchingAmountFor] = useState<Record<number, boolean>>({});

  const finance = exitData.financeConfigs;
  const leaveConfig = exitData.exitLeaveConfig;

  const buildLeaveRows = useCallback((): LeaveRow[] => {
    return (
      encashableLeaves?.map((leave) => {
        const matchedConfig = leaveConfig?.find(
          (config) => config.leaveType.id === leave.leaveType.id
        );
        return {
          leaveTypeId: leave.leaveType.id,
          leaveType: leave.leaveType.leaveType,
          leaveBalance: leave.balance ?? 0,
          leaveName: leave.leaveType.leaveName ?? "-",
          encashLeaveFor: matchedConfig?.encashLeaveFor ?? 0,
          amount: matchedConfig?.amount ?? 0,
        };
      }) ?? []
    );
  }, [encashableLeaves, leaveConfig]);

  const [gratuity, setGratuity] = useState(String(finance[0]?.gratuity ?? 0));
  const [bonus, setBonus] = useState(String(finance[0]?.bonus ?? 0));
  const [leaves, setLeaves] = useState<LeaveRow[]>(buildLeaveRows);

  const resetForm = useCallback(() => {
    const nextLeaves = buildLeaveRows();
    const nextGratuity = String(finance[0]?.gratuity ?? 0);
    const nextBonus = String(finance[0]?.bonus ?? 0);
    setGratuity(nextGratuity);
    setBonus(nextBonus);
    setLeaves(nextLeaves);
  }, [buildLeaveRows, finance]);

  useEffect(() => {
    if (!isEditing) resetForm();
  }, [exitData, encashableLeaves, isEditing, resetForm]);

  useEffect(() => {
    return () => {
      Object.values(encashAmountTimers.current).forEach(clearTimeout);
    };
  }, []);

  const updateLeaveAmount = useCallback((leaveTypeId: number, amount: number | string) => {
    setLeaves((prev) => {
      const index = prev.findIndex((l) => l.leaveTypeId === leaveTypeId);
      if (index === -1) return prev;
      const updated = [...prev];
      updated[index] = { ...updated[index], amount };
      return updated;
    });
  }, []);

  const fetchAmountForDays = useCallback(
    (leaveTypeId: number, rawDays: string) => {
      if (!employeeId) return;

      if (encashAmountTimers.current[leaveTypeId]) {
        clearTimeout(encashAmountTimers.current[leaveTypeId]);
      }

      encashAmountTimers.current[leaveTypeId] = setTimeout(async () => {
        const days = Number(rawDays);
        if (!Number.isFinite(days) || days <= 0) {
          updateLeaveAmount(leaveTypeId, 0);
          setFetchingAmountFor((prev) => ({ ...prev, [leaveTypeId]: false }));
          return;
        }

        setFetchingAmountFor((prev) => ({ ...prev, [leaveTypeId]: true }));
        try {
          const result = await fetchEncashableAmount({
            employeeId,
            days,
          }).unwrap();
          updateLeaveAmount(leaveTypeId, formatEncashAmount(result.totalEncashAmount));
        } catch (error: unknown) {
          const err = error as { data?: { message?: string } };
          showSnackbar(err?.data?.message || "Failed to fetch encashable amount", "error");
        } finally {
          setFetchingAmountFor((prev) => ({ ...prev, [leaveTypeId]: false }));
        }
      }, 400);
    },
    [employeeId, fetchEncashableAmount, showSnackbar, updateLeaveAmount]
  );

  const handleEncashDaysChange = (index: number, value: string) => {
    const row = leaves[index];
    if (!row) return;

    setLeaves((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], encashLeaveFor: value };
      return updated;
    });

    fetchAmountForDays(row.leaveTypeId, value);
  };

  const handleAmountChange = (index: number, value: string) => {
    setLeaves((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], amount: value };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      await submitFinanceConfig({
        exitId: exitData.id,
        body: {
          gratuity: Number(parseNumberForTyping(gratuity)) || 0,
          bonus: Number(parseNumberForTyping(bonus)) || 0,
          leaves: leaves.map((l) => ({
            leaveTypeId: l.leaveTypeId,
            encashLeaveFor: Number(l.encashLeaveFor) || 0,
            amount: Number(parseNumberForTyping(String(l.amount))) || 0,
          })),
        },
      }).unwrap();
      showSnackbar("Finance configurations saved successfully", "success");
      setIsEditing(false);
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      showSnackbar(err?.data?.message || "Failed to save finance configurations", "error");
    }
  };

  const displayRows = isEditing ? leaves : buildLeaveRows();

  const columns: StandardTableColumn[] = useMemo(() => {
    return [
      {
        id: "leaveType",
        label: "Leave Type",
        render: (row: LeaveRow) => (
          <Typography variant="body2" fontWeight={500}>
            {row.leaveType}
          </Typography>
        ),
      },
      {
        id: "leaveName",
        label: "Leave Name",
        render: (row: LeaveRow) => <Typography variant="body2">{row.leaveName}</Typography>,
      },
      {
        id: "leaveBalance",
        label: "Leave Balance",
        render: (row: LeaveRow) => <Typography variant="body2">{row.leaveBalance}</Typography>,
      },
      {
        id: "encashLeaveFor",
        label: isEditing ? "Action" : "Encashment Days",
        render: (row: LeaveRow) => {
          if (!isEditing) {
            return (
              <Typography variant="body2">
                Encash Leave for {row.encashLeaveFor} day(s)
              </Typography>
            );
          }

          const index = leaves.findIndex((l) => l.leaveTypeId === row.leaveTypeId);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                Encash Leave for
              </Typography>
              <TextFieldElement
                type="number"
                label=""
                value={row.encashLeaveFor}
                onChange={(e) => handleEncashDaysChange(index, e.target.value)}
                inputProps={{ min: 0, max: row.leaveBalance }}
                sx={{ width: 90 }}
              />
              <Typography variant="body2">day(s)</Typography>
            </Box>
          );
        },
      },
      {
        id: "amount",
        label: "Amount",
        align: "right",
        render: (row: LeaveRow) => {
          if (!isEditing) {
            return (
              <Typography variant="body2" align="right">
                {formatAmount(row.amount)}
              </Typography>
            );
          }

          const index = leaves.findIndex((l) => l.leaveTypeId === row.leaveTypeId);
          const isFetching = fetchingAmountFor[row.leaveTypeId];
          return (
            <TextFieldElement
              type="text"
              label=""
              value={formatNumberForTyping(String(row.amount), commaSeparation)}
              disabled={isFetching}
              onChange={(e) =>
                handleAmountChange(index, parseNumberForTyping(e.target.value))
              }
              inputProps={{ inputMode: "decimal" }}
              sx={{ width: "100%" }}
            />
          );
        },
      },
    ];
  }, [commaSeparation, fetchingAmountFor, formatAmount, isEditing, leaves]);

  const displayGratuity = isEditing
    ? formatNumberForTyping(gratuity, commaSeparation)
    : formatAmount(finance[0]?.gratuity ?? 0);
  const displayBonus = isEditing
    ? formatNumberForTyping(bonus, commaSeparation)
    : formatAmount(finance[0]?.bonus ?? 0);

  return (
    <Box sx={{ p: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Finances</Typography>
        {!isEditing ? (
          <PrimaryIconButton
            title="Edit"
            icon={<EditIcon />}
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
          />
        ) : (
          <Box display="flex" gap={1}>
            <PrimaryIconButton
              title="Cancel"
              icon={<CancelOutlinedIcon />}
              variant="outlined"
              size="small"
              color="primary"
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
            />
            <PrimaryIconButton
              title="Save"
              icon={<CheckCircleIcon />}
              variant="outlined"
              size="small"
              color="success"
              loading={isLoading}
              disabled={isLoading}
              onClick={handleSave}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Leave Balances (Leave Balances can be encashed below)
          </Typography>
          <Box sx={{ overflow: "hidden" }}>
            <StandardTable
              columns={columns}
              rows={displayRows}
              emptyMessage="No Leave Balances available"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Bonus Due
          </Typography>
          <Box display="flex" gap={2}>
            <TextFieldElement
              fullWidth
              label="Gratuity Amount"
              type="text"
              value={displayGratuity}
              disabled={!isEditing}
              onChange={(e) => setGratuity(parseNumberForTyping(e.target.value))}
              inputProps={{ inputMode: isEditing ? "decimal" : undefined }}
            />
            <TextFieldElement
              fullWidth
              label="Bonus"
              type="text"
              value={displayBonus}
              disabled={!isEditing}
              onChange={(e) => setBonus(parseNumberForTyping(e.target.value))}
              inputProps={{ inputMode: isEditing ? "decimal" : undefined }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
