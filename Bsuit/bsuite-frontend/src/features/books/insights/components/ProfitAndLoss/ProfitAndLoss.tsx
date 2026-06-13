import { Card, CardContent, IconButton, Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Dayjs } from "dayjs";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import { SingleSelectElement } from "../../../../../components/atom/select-field/SingleSelect";
import { useGetReportStructureQuery } from "../../../../setting/reportStructure/api/report.api";

import dayjs from "dayjs";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import {
  useLazyExportProfitAndLossQuery,
  useLazyGetProfitAndLossQuery,
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
import type { GridColDef } from "@mui/x-data-grid";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { useGetDateRangeQuery } from "../../../transact/transactHome/api/transact.api";
import { ToggleButtonAtom, type ToggleOption } from "../../../../../components/atom/toggle-button-atom/ToggleButtonAtom";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

type FiscalYearValue = {
  fromDate: Dayjs;
  toDate: Dayjs;
  year: number;
};

type FiscalYearOption = {
  label: string;
  value: string;
  meta: FiscalYearValue;
};

type CompareDateType = "DATE_RANGE" | "FISCAL_YEAR";

type CompareType = "PREVIOUS_YEARS" | "PREVIOUS_MONTHS";

const monthMap: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

const compareTypeOptions = [
  { label: "Previous Year(s)", value: "PREVIOUS_YEARS" },
  { label: "Previous Month(s)", value: "PREVIOUS_MONTHS" },
];

const generateFiscalYears = (
  config: any,
  minDate: dayjs.Dayjs
): FiscalYearOption[] => {
  if (!config) return [];

  const {
    fiscalYearStartDate,
    fiscalYearStartMonth,
    fiscalYearEndDate,
    fiscalYearEndMonth,
  } = config;

  const startMonthIndex = monthMap[fiscalYearStartMonth];
  const endMonthIndex = monthMap[fiscalYearEndMonth];

  const today = dayjs();
  const currentYear = today.year();

  // Decide current fiscal year
  const baseYear =
    today.month() < startMonthIndex ? currentYear - 1 : currentYear;

  const result: FiscalYearOption[] = [];

  for (let i = 0; ; i++) {
    const year = baseYear - i;

    const start = dayjs()
      .year(year)
      .month(startMonthIndex)
      .date(fiscalYearStartDate);

    const end = dayjs()
      .year(year + 1)
      .month(endMonthIndex)
      .date(fiscalYearEndDate);

    if (start.isBefore(minDate, "year")) break;

    result.push({
      label: `${start.format("MMM DD YYYY")} – ${end.format(
        "MMM DD YYYY"
      )}`,
      value: String(year),
      meta: { fromDate: start, toDate: end, year },
    });
  }

  return result;
};


interface PnLColumn {
  field: string;
  headerName: string;
  align?: "left" | "right";
  renderCell?: (row: any) => any;
}

function ProfitAndLoss() {
  const formatValue = (val: number) => {
    if (decimalPlaces)
      return formatCurrencyByCommaSeparation(
        val,
        commaSeparation,
        currency,
        true,
      ); // show decimals
    return formatCurrencyByCommaSeparation(
      val,
      commaSeparation,
      currency,
      true,
    ).split(".")[0]; // hide decimals
  };

  const [filterOption, setFilterOption] = useState<CompareDateType>("DATE_RANGE");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string | null>(
    null,
  );
  const { data } = useGetDateRangeQuery();
  const [comparePeriod, setComparePeriod] = useState(false);
  const [zeroBalance, setZeroBalance] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(false);

  const [compareType, setCompareType] = useState<CompareType>("PREVIOUS_YEARS");

  /* For first render check if it is initiated by user */
  const isUserTriggered = useRef(false);

  const compareDateToggleOptions: ToggleOption<CompareDateType>[] = [
    { value: "DATE_RANGE", label: "Date Range" },
    { value: "FISCAL_YEAR", label: "Fiscal Year", disabled: compareType == "PREVIOUS_MONTHS" }
  ]

  const durationOptions = Array.from({
    length: compareType === "PREVIOUS_YEARS" ? 12 : 35,
  }).map((_, i) => ({
    label: `${i + 1}`,
    value: String(i + 1),
  }));
  const [compareYears, setCompareYears] = useState<string | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const handleSettingsOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleExportOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const { data: reportConfig } = useGetReportStructureQuery();
  const [toggle] = useToggleMutation();
  const [getProfitAndLoss, { data: plData, isFetching: isLoading }] =
    useLazyGetProfitAndLossQuery();
  const [exportProfitAndLoss, { data: exportData }] =
    useLazyExportProfitAndLossQuery();
  const formatRange = (range: string[]) =>
    `${dayjs(range[0]).format("MMM DD, YYYY")}\n–\n${dayjs(range[1]).format("MMM DD, YYYY")}`;
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const fiscalYearOptions = useMemo(() => {
    return reportConfig?.data ? generateFiscalYears(reportConfig.data, data?.data.minDate) : [];
  }, [reportConfig]);


  useEffect(() => {
    if (!plData?.data) return;
    if (!fromDate && !toDate) {
      setFromDate(dayjs(plData.data.dateList[0]));
      setToDate(dayjs(plData.data.dateList[1]));
    }
    setZeroBalance(plData.data.zeroBalance ?? false);
    setDecimalPlaces(plData.data.decimalPlace ?? false);
  }, [plData]);


  useEffect(() => {
    setSelectedFiscalYear(
      fiscalYearOptions.length > 0 ? fiscalYearOptions[0].value : null,
    );
  }, [fiscalYearOptions]);


  useEffect(() => {
    setCompareYears(null);
    // setCompareMonthDate(null);
  }, [compareType]);

  const getInitialData = async () => {
    try {
      await getProfitAndLoss({
        isCustomize: comparePeriod === true,
        noOfMonthsOrYear: comparePeriod ? Number(compareYears) : undefined,
        compareWith: comparePeriod
          ? compareType === "PREVIOUS_YEARS"
            ? "year"
            : "month"
          : undefined,
      }).unwrap();
    } catch (error: any) {
      showSnack(error.data.message ?? "its an error", "error");
    }
  };

  // Debounced fetch when filters change
  useEffect(() => {
    if (!isUserTriggered.current) return;

    if (!fromDate || !toDate) return;
    if (comparePeriod && !compareYears) return;

    const handler = setTimeout(async () => {
      try {
        await getProfitAndLoss({
          fromDate: fromDate.format("YYYY-MM-DD"),
          toDate: toDate.format("YYYY-MM-DD"),
          isCustomize: comparePeriod === true,
          noOfMonthsOrYear: comparePeriod
            ? Number(compareYears)
            : undefined,
          compareWith: comparePeriod
            ? compareType === "PREVIOUS_YEARS"
              ? "year"
              : "month"
            : undefined,
        }).unwrap();
      } catch (error: any) {
        showSnack(error?.data?.message ?? "its an error", "error");
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [
    fromDate,
    toDate,
    comparePeriod,
    compareYears,
    compareType,
  ]);


  useEffect(() => {
    // Only call if fromDate and toDate are set
    getInitialData();
  }, []);

  // Flatten nested accounts like in Accounts table

  // Build groupedRows from response
  const groupedRows = useMemo(() => {
    if (!plData?.data?.resultData) return [];

    const resultData = plData.data.resultData;
    const totalData = plData.data.totalData;
    const periodCount = plData?.data?.dateList?.[0]?.length || 1;

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
        const groupId = `group-${group.groupName}`;
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

        const pushAccountAndChildren = (acc: any, parentId: string | null) => {
          const id = String(acc.accountId ?? acc.id);
          items.push({
            id,
            name: acc.accountName,
            accTotal: acc.accountTotal || Array(periodCount).fill(0),
            accSelfTotal: acc.accountSelfTotal || Array(periodCount).fill(0),
            amount: acc.accountTotal || Array(periodCount).fill(0),
            _parentId: parentId,
          });
          if (Array.isArray(acc.subAccounts) && acc.subAccounts.length) {
            acc.subAccounts.forEach((child: any) =>
              pushAccountAndChildren(child, id),
            );
          }
        };

        (group.accountsList || []).forEach((acc: any) =>
          pushAccountAndChildren(acc, groupId),
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
        const profitArray = Array.isArray(plData.data.profitCurrent)
          ? plData.data.profitCurrent
          : Array(periodCount).fill(plData.data.profitCurrent ?? 0);

        const retainedArray = Array.isArray(plData.data.profitRetained)
          ? plData.data.profitRetained
          : Array(periodCount).fill(plData.data.profitRetained ?? 0);

        const finalArray = Array.isArray(plData.data.finalProfit)
          ? plData.data.finalProfit
          : Array(periodCount).fill(plData.data.finalProfit ?? 0);

        itemsWithProfit.push({
          id: "final-profit",
          name: "Profit",
          accTotal: finalArray,
          _depth: 0,
          _isProfit: true,
        });
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
  }, [plData, zeroBalance, decimalPlaces]);

  const finalGroupedRows = useMemo(() => {
    if (!plData?.data?.resultData) return [];

    const { Income = [], Expense = [] } = plData.data.resultData;

    const isCompletelyEmpty = Income.length === 0 && Expense.length === 0;

    if (isCompletelyEmpty) return [];

    return groupedRows;
  }, [groupedRows, plData]);

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
        const profitCurrent = plData?.data?.profitCurrent ?? 0;
        const profitRetained = plData?.data?.profitRetained ?? 0;
        const totatProfit = plData?.data?.finalProfit[0];
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
          {
            id: "final-profit",
            name: "Final Profit/Loss",
            accTotal: [totatProfit],
            _depth: 0,
            _isProfit: true,
          },
        );
      }

      return { ...group, items: itemsWithProfit };
    });
  }, [groupedRows, zeroBalance, plData]);

  const dynamicAmountColumns: GridColDef[] = useMemo(() => {
    const dateList = plData?.data?.dateList;
    if (!dateList) return [];

    const isCompareMode = Array.isArray(dateList[0]);

    const columns: GridColDef[] = [];

    if (isCompareMode) {
      (dateList as string[][]).forEach((range, index) => {
        columns.push({
          field: `period_${index}`,
          headerName: formatRange(range),
          align: "right",
          headerAlign: "right",
          renderCell: (row: any) => {
            const isExpanded = !!expandedRows[row.id];
            const value =
              isExpanded && row.accSelfTotal
                ? row.accSelfTotal[index]
                : (row.accTotal?.[index] ?? row.amount?.[index] ?? 0);

            return (
              <Box
                sx={{
                  textAlign: "right",
                  pr: 1,
                  fontWeight:
                    row._isGroupSum || row._isTotal || row._isProfit
                      ? 600
                      : "normal",
                }}
              >
                {formatValue(value)}
              </Box>
            );
          },
        });
      });
    }

    const totalIndex = isCompareMode ? (dateList as string[][]).length : 0;

    columns.push({
      field: "account_total",
      headerName: "Account Total",
      headerAlign: "right",
      align: "right",
      renderCell: (row: any) => {
        const isExpanded = !!expandedRows[row.id];

        // Choose value based on expanded state
        const value =
          isExpanded && row.accSelfTotal
            ? row.accSelfTotal[totalIndex] // use correct index
            : (row.accTotal?.[totalIndex] ?? row.amount?.[totalIndex] ?? 0);

        return (
          <Box
            sx={{
              textAlign: "right",
              pr: 1,
              fontWeight:
                row._isGroupSum || row._isTotal || row._isProfit
                  ? 600
                  : "normal",
            }}
          >
            {formatValue(value)}
          </Box>
        );
      },
    });

    return columns;
  }, [plData, commaSeparation, expandedRows, decimalPlaces]);

  const baseColumns: GridColDef[] = [
    {
      field: "name",
      headerName: "Account",

      renderCell: (row: any) => (
        <Box
          sx={{
            fontWeight:
              row._isTotal || row._isProfit ? 600 : "normal",
          }}
        >
          {row.name}
        </Box>
      ),
    },
  ];

  const columns: GridColDef[] = useMemo(
    () => [...baseColumns, ...dynamicAmountColumns],
    [dynamicAmountColumns],
  );

  const handleExport = async (exportType: "excel" | "pdf") => {
    try {
      if (comparePeriod && !compareYears) {
        throw new Error(
          compareType === "PREVIOUS_YEARS"
            ? "Please select number of years to compare"
            : "Please select number of months to compare"
        );
      }

      const response = await exportProfitAndLoss({
        fromDate: fromDate?.format("YYYY-MM-DD"),
        toDate: toDate?.format("YYYY-MM-DD"),
        isCustomize: comparePeriod,
        noOfMonthsOrYear: comparePeriod
          ? Number(compareYears)
          : undefined,
        compareWith: comparePeriod
          ? compareType === "PREVIOUS_YEARS"
            ? "year"
            : "month"
          : undefined,
        exportType,
      }).unwrap();

      const message =
        response?.message ??
        response?.data?.message ??
        "Export completed successfully";

      showSnack(message, "success");
      handleExportClose();
    } catch (error: any) {
      let message = "Export failed";

      if (error instanceof Error && error.message) {
        message = error.message;
      } else if (error?.data?.message) {
        message = error.data.message;
      }

      showSnack(message, "error");
    }
  };
  return (
    <Card sx={{ mt: 1 }}>
      <CardContent sx={{ pt: 2.5, height: "calc(100vh - 150px)" }}>
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
            <Typography variant="h6">Profit and Loss</Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
         <PermissionGuard permission="export_insights"> 
             <PrimaryIconButton
              title={"Export"}
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
        <Box sx={{ display: "flex" }}>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              width: '100%',
              flexDirection: { xs: 'column', lg: 'row' }
            }}
          >
            {/* Filter Card */}
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx=
                  {{
                    display: 'flex',
                    // flexDirection: { sm: 'column', md: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    minHeight: 44,
                  }}>
                  <ToggleButtonAtom<CompareDateType>
                    value={filterOption}
                    options={compareDateToggleOptions}
                    onChange={(value) => {
                      setFilterOption(value);
                      if (value === "FISCAL_YEAR" && selectedFiscalYear) {
                        const selected = fiscalYearOptions.find(
                          (opt) => opt.value === selectedFiscalYear,
                        );
                        if (selected) {
                          isUserTriggered.current = true;
                          setFromDate(selected.meta.fromDate);
                          setToDate(selected.meta.toDate);
                        }
                      }
                    }}
                  />
                  <Stack>
                    {filterOption === "DATE_RANGE" && compareType !== "PREVIOUS_MONTHS" ? (
                      <DateRangePicker
                        label="Date Range"
                        startValue={fromDate}
                        endValue={toDate}
                        onChange={([start, end]) => {
                          isUserTriggered.current = true;
                          setFromDate(start);
                          setToDate(end);
                        }}
                        width={260}
                      />
                    ) : (
                      filterOption !== "FISCAL_YEAR" &&
                      <DatePickerElement
                        label="Select Month"
                        required
                        value={fromDate}
                        views={["year", "month"]}
                        openTo="month"
                        format="MMM YYYY"
                        onChange={(value) => {
                          if (!value) return;

                          isUserTriggered.current = true;

                          const start = value.startOf("month");
                          const end = value.endOf("month");

                          setFromDate(start);
                          setToDate(end);
                        }}
                        width={260}
                      />

                    )}

                    {filterOption === "FISCAL_YEAR" && (
                      <SingleSelectElement
                        label="Fiscal Year"
                        value={selectedFiscalYear!}
                        options={fiscalYearOptions}
                        onChange={(value) => {
                          isUserTriggered.current = true;
                          setSelectedFiscalYear(value);
                          const selected = fiscalYearOptions.find(
                            (opt) => opt.value === value,
                          );
                          if (selected) {
                            setFromDate(selected.meta.fromDate);
                            setToDate(selected.meta.toDate);
                          }
                        }}
                        sx={{ minWidth: 260 }}
                      />
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Prior Period Card */}
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 44, justifyContent: 'space-between' }}>
                  <ToggleSwitch
                    label="Compare to Prior Period"
                    checked={comparePeriod}
                    onChange={() => {
                      isUserTriggered.current = true;
                      setComparePeriod(!comparePeriod);
                      setCompareType("PREVIOUS_YEARS");
                    }}
                  />
                  {comparePeriod && (
                    <Stack direction="row" gap={1}>
                      <SingleSelectElement
                        sx={{ minWidth: 200 }}
                        menuWidth={200}
                        label="Compare with"
                        value={compareType}
                        options={compareTypeOptions}
                        onChange={(value) => {
                          isUserTriggered.current = true;
                          const newType = value as CompareType;
                          if (newType === "PREVIOUS_MONTHS" && filterOption === "FISCAL_YEAR") {
                            showSnack(
                              "Compare with months requires Date Range. Please switch from Fiscal Year to Date Range.",
                              "error",
                            );
                            return; 
                          }
                          setCompareType(newType);
                        }}
                      />

                      <SingleSelectElement
                        sx={{ minWidth: 120 }}
                        menuWidth={120}
                        placeholder="Search.."
                        label={
                          compareType === "PREVIOUS_YEARS"
                            ? "No of Years"
                            : "No of Months"
                        }
                        value={compareYears!}
                        options={durationOptions}
                        onChange={(value) => {
                          isUserTriggered.current = true;
                          setCompareYears(value);
                        }}
                      />
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
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
        {/* P&L Table */}
        <Box mt={2}>
          <GroupedTable
            useDepth={true}
            columns={columns}
            groupedRows={finalGroupedRows}
            loading={isLoading}
            expandAll={true}
            tableHeight="calc(80vh - 180px)"
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
            onToggleRow={(rowId, expanded) => {
              setExpandedRows((prev) => {
                const newState = { ...prev, [rowId]: expanded };
                return newState;
              });
            }}
            dateFrom={fromDate?.format("YYYY-MM-DD")}
            dateTo={toDate?.format("YYYY-MM-DD")}
          />
        </Box>
      </CardContent>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => {
            setSnackbar({ open: false, color: "error", message: "" });
          }}
        />
      )}
    </Card>
  );
}

export default ProfitAndLoss;
