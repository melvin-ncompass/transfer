import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import {
  useLazyExportTrialBalanceQuery,
  useLazyGetTrialBalanceQuery,
} from "../../api/insights.api";
import { GroupedTable } from "../../../../../components/tables/standard-table";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { PrimaryIconButton } from "../../../../../components/atom/button";
import {
  ArrowBack,
  IosShare,
  PictureAsPdf,
  Settings,
  TableChart,
} from "@mui/icons-material";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import dayjs, { Dayjs } from "dayjs";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import type { GridColDef } from "@mui/x-data-grid";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

interface PnLColumn {
  field: string;
  headerName: string;
  align?: "left" | "right";
  renderCell?: (row: any, index?: number) => any;
}

function TrialBalance() {
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const [toggle] = useToggleMutation();

  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [exportTax, { data: exportTaxData }] = useLazyExportTrialBalanceQuery();

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  const handleSettingsOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleExportOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  const [zeroBalance, setZeroBalance] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(false);
  const [FXCorrection, setFXCorrection] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  /* For first render check if it is initiated by user */
  const hasInitializedDate = useRef(false);
  const isUserTriggered = useRef(false);

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });
  const [getTrialBalance, { data: bsData, isFetching: isLoading }] =
    useLazyGetTrialBalanceQuery();

  const getInitialData = async () => {
    try {
      await getTrialBalance({}).unwrap();
    } catch (error: any) {
      showSnack(error.data.message ?? "its an error", "error");
    }
  };
  // Fetch data on load or when date changes
  useEffect(() => {
    getInitialData();
  }, []);
  useEffect(() => {
    if (!bsData?.data) return;

    if (!hasInitializedDate.current) {
      setToDate(dayjs(bsData.data.dateList[1]));
      hasInitializedDate.current = true;
    }

    setZeroBalance(bsData.data.zeroBalance ?? false);
    setDecimalPlaces(bsData.data.decimalPlace ?? false);
  }, [bsData]);

  // Flatten tree helper
  const buildTreeAndFlatten = (items: any[]) => {
    const map: Record<string, any> = {};
    const roots: any[] = [];

    const getId = (it: any) => String(it.id ?? it.accountId ?? it.name);
    const getParentId = (it: any) => it._parentId ?? null;

    items.forEach((it) => {
      const id = getId(it);
      if (!id) return;
      map[id] = { ...it, children: [] };
    });

    Object.values(map).forEach((node: any) => {
      const pid = getParentId(node);
      if (pid && map[pid]) {
        map[pid].children.push(node);
      } else {
        roots.push(node);
      }
    });

    const out: any[] = [];
    const walk = (nodes: any[], depth = 0) => {
      nodes.forEach((n) => {
        n._depth = depth;
        out.push(n);
        if (n.children.length) walk(n.children, depth + 1);
      });
    };

    walk(roots);
    return out;
  };

  // Build grouped rows
  const groupedRows = useMemo(() => {
    if (!bsData?.data?.resultData) return [];

    const resultData = bsData.data.resultData;
    const totalData = bsData.data.totalData;
    const periodCount = bsData?.data?.dateList?.[0]?.length || 1; // number of periods
    const buildTreeAndFlatten = (items: any[]) => {
      const map: Record<string, any> = {};
      const roots: any[] = [];

      const getId = (it: any) =>
        it.id !== undefined ? String(it.id) : undefined;
      const getParentId = (it: any) =>
        it._parentId ? String(it._parentId) : null;

      items.forEach((it) => {
        const id = getId(it);
        if (!id) return;
        map[id] = { ...it, children: [] };
      });

      Object.values(map).forEach((node: any) => {
        const pid = getParentId(node);
        if (pid && map[pid]) {
          node._parentId = pid;
          map[pid].children.push(node);
        } else {
          node._parentId = null;
          roots.push(node);
        }
      });

      const out: any[] = [];
      const walk = (nodes: any[], depth = 0) => {
        nodes.forEach((n) => {
          n._depth = depth;
          out.push(n);
          if (n.children.length) walk(n.children, depth + 1);
        });
      };

      walk(roots);
      return out;
    };

    return Object.keys(resultData).map((type, groupIndex) => {
      const groups = resultData[type];
      const items: any[] = [];

      groups.forEach((group: any) => {
        const groupId = `group-${type}-${group.groupName}`;

        const groupSum = group.groupSum || [];

        items.push({
          id: groupId,
          name: group.groupName,
          amount: [
            ...groupSum,
            groupSum.reduce((s: number, v: number) => s + (v ?? 0), 0),
          ],
          _depth: 0,
          _isGroupSum: true,
        });

        const pushAccountAndChildren = (
          acc: any,
          parentId: string | null,
          sectionType: string,
        ) => {
          const id = `${acc.accountType}-${acc.accountId}`;
          const expandKey = `${sectionType}-${id}`;

          items.push({
            id,
            name: acc.accountName,
            accountType: acc.accountType ?? null,
            _expandKey: expandKey,
            accTotal: acc.accountTotal || Array(periodCount).fill(0),
            accSelfTotal: acc.accountSelfTotal || Array(periodCount).fill(0),
            amount: acc.accountTotal || Array(periodCount).fill(0),
            _parentId: parentId,
          });

          if (Array.isArray(acc.subAccounts) && acc.subAccounts.length) {
            acc.subAccounts.forEach((child: any) =>
              pushAccountAndChildren(child, id, sectionType),
            );
          }
        };

        (group.accountsList || []).forEach((acc: any) =>
          pushAccountAndChildren(acc, groupId, type),
        );
      });

      const flattenedItems = buildTreeAndFlatten(items);

      // Normalize totals per type
      const totalsFromApi = totalData?.[type] || Array(periodCount).fill(0);

      const normalizedTotals = [
        ...totalsFromApi,
        totalsFromApi.reduce((sum: number, v: number) => sum + (v ?? 0), 0),
      ];
      const totalRow = {
        id: `total-${type}`,
        name: `Total ${type}`,
        amount: normalizedTotals,
        _depth: 0,
        _isTotal: true,
      };

      let itemsWithProfit = [...flattenedItems, totalRow];

      // Append Profit rows only at the last group
      if (groupIndex === Object.keys(resultData).length - 1) {

        // Ensure arrays match periodCount
        const profitArray = Array.isArray(bsData.data.profitCurrent)
          ? bsData.data.profitCurrent
          : Array(periodCount).fill(bsData.data.profitCurrent ?? 0);

        const retainedArray = Array.isArray(bsData.data.profitRetained)
          ? bsData.data.profitRetained
          : Array(periodCount).fill(bsData.data.profitRetained ?? 0);
      }

      // Apply zero balance filter
      const filteredItems = itemsWithProfit.filter((row) => {
        if (row._isGroupSum || row._isTotal || row._isProfit) {
          if (!zeroBalance && row._isGroupSum && Array.isArray(row.amount)) {
            const allZero = row.amount.every((v: number) => {
              const val = decimalPlaces ? v ?? 0 : Math.trunc(v ?? 0);
              return val === 0;
            });
            return !allZero;
          }

          return true;
        }

        const total =
          row.accTotal?.reduce((s: number, v: number) => {
            const value = decimalPlaces ? v ?? 0 : Math.trunc(v ?? 0);
            return s + value;
          }, 0) ?? 0;

        return zeroBalance ? true : total !== 0;
      });

      return {
        groupName: type,
        items: filteredItems,
      };
    });
  }, [bsData, zeroBalance]);

  const finalGroupedRows = useMemo(() => {
    if (!bsData?.data?.resultData) return [];

    const {
      Asset = [],
      Liability = [],
      Income = [],
      Expense = [],
    } = bsData.data.resultData;

    const isCompletelyEmpty =
      Asset.length === 0 &&
      Liability.length === 0 &&
      Income.length === 0 &&
      Expense.length === 0;


    if (isCompletelyEmpty) return [];

    const rows = [...groupedRows];


    if (Array.isArray(bsData.data.finalTotal)) {
      rows.push({
        groupName: "Final",
        items: [
          {
            id: "final-total",
            name: "Final",
            amount: bsData.data.finalTotal,
            _depth: 0,
            _isFinal: true,
            _isTotal: true,
          },
        ],
      });
    }

    return rows;
  }, [groupedRows, bsData]);
  const filteredGroupedRows = useMemo(() => {
    if (!groupedRows) return [];

    return groupedRows.map((group, groupIndex) => {
      const filteredItems = group.items.filter((row) => {
        // Always keep group or total rows
        if (row._isGroupSum || row._isTotal) return true;

        const total =
          row.accTotal?.reduce((s: number, v: number) => {
            const value = decimalPlaces
              ? v ?? 0
              : Math.trunc(v ?? 0);
            return s + value;
          }, 0) ?? 0;

        return zeroBalance ? true : total !== 0;
      });

      // Only append profit rows to the **last group**
      let itemsWithProfit = [...filteredItems];
      if (groupIndex === groupedRows.length - 1) {
        const profitCurrent = bsData?.data?.profitCurrent ?? 0;
        const profitRetained = bsData?.data?.profitRetained ?? 0;

        itemsWithProfit.push(
          {
            id: "profit-current",
            name: "Profit/ Loss - Current",
            accTotal: [profitCurrent],
            _depth: 0,
            _isProfit: true,
          },
          {
            id: "profit-retained",
            name: "Profit/ Loss - Retained",
            accTotal: [profitRetained],
            _depth: 0,
            _isProfit: true,
          },
        );
      }

      return { ...group, items: itemsWithProfit };
    });
  }, [groupedRows, zeroBalance, bsData]);

  // Expand parent rows on initial load (match ProfitAndLoss behaviour)
  useEffect(() => {
    if (!groupedRows || groupedRows.length === 0) return;

    const newState: Record<string, boolean> = {};
    groupedRows.forEach((group) => {
      (group.items || []).forEach((item: any) => {
        if (
          item.children &&
          item.children.length > 0 &&
          item.id !== undefined
        ) {
          const key = item._expandKey ?? String(item.id);
          newState[key] = true;
        }
      });
    });

    setExpandedRows((prev) => ({ ...newState, ...prev }));
  }, [groupedRows]);

  // Columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Account",
      renderCell: (row: any) => (
        <Box
          sx={{
            fontWeight: row._isProfit ? 700 : row._isTotal ? 600 : "normal",
            // bgcolor: row._isProfit ? "rgba(255, 235, 59, 0.2)" : "inherit",
            // pl: row._depth ? row._depth * 2 : 0,
          }}
        >
          {row.name}
        </Box>
      ),
    },
    {
      field: "net_debit",
      headerName: "Net Debit",
      align: "right",
      headerAlign: "right",

      renderCell: (row: any) => {
        let value: number;

        if (row._isGroupSum || row._isTotal) {
          value = row.amount?.[0] ?? 0; // debit from group totals
        } else {
          const expandKey = row._expandKey ?? row.id;
          const isExpanded = !!expandedRows[expandKey];
          value =
            isExpanded && row.accSelfTotal
              ? (row.accSelfTotal[0] ?? 0)
              : (row.accTotal?.[0] ?? 0);
        }

        const displayValue = decimalPlaces
          ? value
          : Number(value.toString().split(".")[0]);

        return (
          <Box
            sx={{
              textAlign: "right",
              pr: 1,
              fontWeight: row._isGroupSum || row._isTotal ? 600 : "normal",
            }}
          >
            {decimalPlaces
              ? formatCurrencyByCommaSeparation(
                displayValue,
                commaSeparation,
                currency,
              )
              : formatCurrencyByCommaSeparation(
                displayValue,
                commaSeparation,
                currency,
              ).split(".")[0]}
          </Box>
        );
      },
    },
    {
      field: "net_credit",
      headerName: "Net Credit",
      align: "right",
      headerAlign: "right",

      renderCell: (row: any) => {
        let value: number;

        if (row._isGroupSum || row._isTotal) {
          value = row.amount?.[1] ?? 0; // credit from group totals
        } else {
          const expandKey = row._expandKey ?? row.id;
          const isExpanded = !!expandedRows[expandKey];
          value =
            isExpanded && row.accSelfTotal
              ? (row.accSelfTotal[1] ?? 0)
              : (row.accTotal?.[1] ?? 0);
        }

        const displayValue = decimalPlaces
          ? value
          : Number(value.toString().split(".")[0]);

        return (
          <Box
            sx={{
              textAlign: "right",
              pr: 1,
              fontWeight: row._isGroupSum || row._isTotal ? 600 : "normal",
            }}
          >
            {decimalPlaces
              ? formatCurrencyByCommaSeparation(
                displayValue,
                commaSeparation,
                currency,
              )
              : formatCurrencyByCommaSeparation(
                displayValue,
                commaSeparation,
                currency,
              ).split(".")[0]}
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    if (!isUserTriggered.current) return;
    if (!toDate) return;

    const handler = setTimeout(async () => {
      try {
        await getTrialBalance({
          toDate: toDate?.format("YYYY-MM-DD"),
        }).unwrap();
      } catch (error: any) {
        showSnack(error.data.message ?? "it is an error", "error");
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [toDate]);

  const handleExport = async (exportType: "excel" | "pdf") => {
    try {
      const response = await exportTax({
        toDate: toDate?.format("YYYY-MM-DD"),
        exportType,
      }).unwrap();

      const message =
        response?.message ??
        response?.data?.message ??
        "Export completed successfully";

      showSnack(message, "success");

      handleExportClose();
    } catch (error: any) {
      const message =
        error?.data?.message ??
        error?.error ??
        "Export failed";

      showSnack(message, "error");
    }
  };

  return (
    <Card>
      <CardContent sx={{ height: "calc(100vh - 150px)" }}>
        <Stack direction="row" alignItems='center' justifyContent='space-between' pb={1}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton
              onClick={() => {
                window.history.back();
              }}
              sx={{ pl: 0 }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6">Trial Balance</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 300 }}>
            <DatePickerElement
              label="As of"
              value={toDate}
              onChange={(value) => {
                isUserTriggered.current = true;
                setToDate(value)
              }}
              width='100%'
            />

            <Box
              sx={{ width: "1px", height: 40, backgroundColor: "divider" }}
            />
         <PermissionGuard permission="export_insights"> 

            <PrimaryIconButton
              title="Export"
              icon={<IosShare />}
              onClick={handleExportOpen}
            />
            </PermissionGuard>
            <PrimaryIconButton
              title="Settings"
              icon={<Settings />}
              onClick={handleSettingsOpen}
            />
          </Box>
        </Stack>
        <Box display={"flex"} justifyContent={"end"} gap={1}>
          <MenuAtom
            anchorEl={settingsAnchorEl}
            open={Boolean(settingsAnchorEl)}
            onCloseAll={handleSettingsClose}
            items={[
              {
                render: () => (
                  <ToggleSwitch
                    label="Zero Balance"
                    checked={zeroBalance}
                    onChange={async () => {
                      try {
                        await toggle({
                          reportZeroBalance: !zeroBalance,
                        }).unwrap();
                        setZeroBalance(!zeroBalance);
                        handleSettingsClose();
                      } catch (error: any) {
                        showSnack(
                          error.data.message ?? "its an error",
                          "error",
                        );
                      }
                    }}
                  />
                ),
              },
              {
                render: () => (
                  <ToggleSwitch
                    label="Decimal Places"
                    checked={decimalPlaces}
                    onChange={async () => {
                      try {
                        await toggle({
                          reportDecimalPlace: !decimalPlaces,
                        }).unwrap();
                        setDecimalPlaces(!decimalPlaces);
                        handleSettingsClose();
                      } catch (error: any) {
                        showSnack(
                          error.data.message ?? "its an error",
                          "error",
                        );
                      }
                    }}
                  />
                ),
              },
            ]}
          />
        </Box>

        <Box display={"flex"} justifyContent={"end"} gap={1} mt={0}>
          <MenuAtom
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onCloseAll={handleExportClose}
            items={[
              {
                render: () => (
                  <Stack
                    direction={"row"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"100%"}
                    onClick={() => handleExport("excel")}
                  >
                    <TableChart color="secondary" />
                    <Typography width={"100%"} align="center">
                      Excel
                    </Typography>
                  </Stack>
                ),
              },
              {
                render: () => (
                  <Stack
                    direction={"row"}
                    alignItems={"center"}
                    justifyContent={"center"}
                    width={"100%"}
                    onClick={() => handleExport("pdf")}
                  >
                    <PictureAsPdf color="secondary" />
                    <Typography width={"100%"} align="center">
                      PDF
                    </Typography>
                  </Stack>
                ),
              },
            ]}
          />
        </Box>
        <Box mt={3}>
          <GroupedTable
            useDepth
            columns={columns}
            groupedRows={finalGroupedRows}
            loading={isLoading}
            expandAll={true}
            tableHeight="calc(80vh - 120px)"
            onToggleRow={(rowId, expanded) =>
              setExpandedRows((prev) => ({ ...prev, [rowId]: expanded }))
            }
            renderGroupHeader={(group) => (
              <Stack
                direction="row"
                justifyContent="space-between"
                width="100%"
                fontWeight={600}
              >
                <span>{group.groupName}</span>
              </Stack>
            )}
            singleDate={toDate?.format("YYYY-MM-DD")}
          />
        </Box>
      </CardContent>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() =>
            setSnackbar({ open: false, message: "", color: "success" })
          }
        />
      )}
    </Card>
  );
}

export default TrialBalance;
