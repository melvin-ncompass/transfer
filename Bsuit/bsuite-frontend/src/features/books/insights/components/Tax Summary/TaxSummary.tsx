import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Typography,
} from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type Dayjs } from "dayjs";
import { useGetReportStructureQuery } from "../../../../setting/reportStructure/api/report.api";
import dayjs from "dayjs";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import {
  useLazyExportTaxSummaryQuery,
  useLazyGetProfitAndLossQuery,
  useLazyGetTaxSummaryQuery,
} from "../../api/insights.api";
import { GroupedTable } from "../../../../../components/tables/standard-table";
import { useTheme } from "@mui/material/styles";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../components/atom/button";
import {
  ArrowBack,
  PictureAsPdf,
  Save,
  Settings,
  TableChart,
  Upload,
  IosShare,
} from "@mui/icons-material";
import SendIcon from "@mui/icons-material/Send";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import type { GridColDef } from "@mui/x-data-grid";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import { TaxSubRowAccordion } from "./TaxRowSubAccordion";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { debounce } from "lodash-es";
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

// const compareTypeOptions = [
//   { label: "Previous Year(s)", value: "PREVIOUS_YEARS" },
//   { label: "Previous Month(s)", value: "PREVIOUS_MONTHS" },
// ];

// const yearCountOptions = Array.from({ length: 10 }).map((_, i) => ({
//   label: `${i + 1}`,
//   value: String(i + 1),
// }));

function convertDateString(input: string): string {
  const date = new Date(input);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
}
const generateFiscalYears = (config: any): FiscalYearOption[] => {
  if (!config) return [];
  const {
    fiscalYearStartDate,
    fiscalYearStartMonth,
    fiscalYearEndDate,
    fiscalYearEndMonth,
  } = config;
  const startMonthIndex = monthMap[fiscalYearStartMonth];
  const endMonthIndex = monthMap[fiscalYearEndMonth];
  const currentYear = dayjs().year();

  return Array.from({ length: 10 }).map((_, i) => {
    const year = currentYear - i;
    const start = dayjs()
      .year(year)
      .month(startMonthIndex)
      .date(fiscalYearStartDate);
    const end = dayjs().year(year).month(endMonthIndex).date(fiscalYearEndDate);
    return {
      label: `FY ${year} (${start.format("MMM DD YYYY")} – ${end.format("MMM DD YYYY")})`,
      value: String(year),
      meta: { fromDate: start, toDate: end, year },
    };
  });
};

function TaxSummary() {
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

  const [filterOpen, setFilterOpen] = useState(false);
  const [priorPeriodOpen, setPriorPeriodOpen] = useState(false);

  const [filterOption, setFilterOption] = useState<String | null>("Date Range");
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string | null>(
    null,
  );

  const [comparePeriod, setComparePeriod] = useState(false);
  const [zeroBalance, setZeroBalance] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(false);
  const [FXCorrection, setFXCorrection] = useState(false);

  const [compareType, setCompareType] = useState<CompareType>("PREVIOUS_YEARS");
  const [compareYears, setCompareYears] = useState<string | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(
    null,
  );

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
  const [exportTax, { data: exportTaxData }] = useLazyExportTaxSummaryQuery();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const { data: reportConfig } = useGetReportStructureQuery();
  const [getProfitAndLoss, { data: plData, isFetching: isLoading }] =
    useLazyGetTaxSummaryQuery();
  const [toggle] = useToggleMutation();

  const isCompare = Array.isArray(plData?.data?.dateList?.[0]);
  const formatRange = (range: string[]) =>
    `${dayjs(range[0]).format(" MMM DD, YYYY")} – ${dayjs(range[1]).format("MMM DD, YYYY")}`;

  const theme = useTheme();
  const getBgForDepth = (depth: number | undefined) => {
    const d = typeof depth === "number" ? depth : Number(depth) || 0;
    if (d === 0) return theme.palette.grey?.[100] ?? "#f5f5f5";
    // All other depths use a single, different background so they are visually grouped
  };

  const fiscalYearOptions = useMemo(() => {
    return reportConfig?.data ? generateFiscalYears(reportConfig.data) : [];
  }, [reportConfig]);

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
      await getProfitAndLoss({}).unwrap();
    } catch (error: any) {
      showSnack(error.data.message ?? "its an error", "error");
    }
  };
  useEffect(() => {
    getInitialData();
  }, []);
  useEffect(() => {
    if (!plData?.data) return;

    setFromDate(dayjs(plData.data.dateFrom));
    setToDate(dayjs(plData.data.dateTo));
    setZeroBalance(plData.data.zeroBalance ?? false);
    setDecimalPlaces(plData.data.decimalPlace ?? false);
  }, [plData]);

  // Flatten nested accounts like in Accounts table
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

  // Build groupedRows from response
  const groupedRows = useMemo(() => {
    if (!plData?.data?.taxInfoData) return [];

    const rows = plData.data.taxInfoData.map((tax: any) => {
      const groupId = `tax-${tax.id}`;

      // Sub-rows (accordion) — pass percentName and taxPercent/percent value for detailed API
      const subRows = tax.taxSubRows.map((row: any, index: number) => ({
        id: `${groupId}-${index}`,
        taxId: tax.id,
        name: row.percentName,
        taxPercent: row.taxPercent ?? row.percentName,
        taxableAmount: [row.taxableAmount],
        accTotal: [row.taxAmount],
        amount: [row.taxAmount],
        _depth: 1,
      }));

      //  Group summary row (tax name here; no separate group header row so no duplicate)
      const groupSummary = {
        id: groupId,
        name: tax.taxName,
        accountType: "Tax",
        taxableAmount: [tax.totalTaxableAmount], // group total key
        accTotal: [tax.totalTaxAmount], // group total key
        amount: [tax.totalTaxAmount], // group total key
        _depth: 0,
        _isGroupSum: true,
      };

      //  Total row for this tax
      // const totalRow = {
      //   id: `${groupId}-total`,
      //   name: `Total ${tax.taxName}`,
      //   taxableAmount: [tax.totalTaxableAmount], // group total key
      //   accTotal: [tax.totalTaxAmount], // group total key
      //   amount: [tax.totalTaxAmount], // group total key
      //   _depth: 0,
      //   _isTotal: true,
      // };

      return {
        groupName: "", // no group header row; tax name shown on first data row for navigation
        items: [groupSummary, ...subRows],
      };
    });

    //  Final simple row

    rows.push({
      groupName: "", // no header
      items: [
        {
          id: "final-row",
          name: "Total Tax",
          accTotal: [plData.data.totalTax], // final total key
          amount: [plData.data.totalTax], // final total key
          _depth: 0,
          _isFinal: true,
        },
      ],
    });

    return rows;
  }, [plData]);
  const finalGroupedRows = useMemo(() => {
    if (!plData?.data) return [];

    const { taxInfoData = [] } = plData.data;

    const isCompletelyEmpty = taxInfoData.length === 0;

    //  This is the key
    if (isCompletelyEmpty) return [];

    return groupedRows;
  }, [groupedRows, plData]);
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Tax",
      renderCell: (row: any) => {
        if (row._isFinal) {
          return <Box sx={{ fontWeight: 700 }}>{row.name}</Box>;
        }

        if (row._isGroupSum) {
          return (
            <Box sx={{ pl: `${row._depth * 2}rem`, fontWeight: 600 }}>
              {row.name}
            </Box>
          );
        }

        return (
          <TaxSubRowAccordion
            row={row}
            taxId={row.taxId}
            fromDate={fromDate}
            toDate={toDate}
            commaSeparation={commaSeparation}
            currency={currency}
            decimalPlaces={decimalPlaces}
          />
        );
      },
    },

    {
      field: "taxable_amount",
      headerName: "Taxable Amount",
      align: "right",
      headerAlign: "right",

      renderCell: (row: any) => (
        <Box
          sx={{
            textAlign: "right",
            pr: 1,
            fontWeight: row._isGroupSum || row._isTotal ? 600 : 400,
            display: "flex",
            justifyContent: "start",
            height: "100%",
            flexDirection: "column",
          }}
        >
          {!row._isTotal ? formatValue(row.taxableAmount?.[0] ?? 0) : null}
        </Box>
      ),
    },
    {
      field: "account_total",
      headerName: "Tax Amount",
      align: "right",
      headerAlign: "right",
      renderCell: (row: any) => (
        <Box
          sx={{
            textAlign: "right",
            pr: 1,
            fontWeight: row._isGroupSum || row._isTotal ? 600 : 400,
          }}
        >
          {!row._isTotal ? formatValue(row.accTotal?.[0] ?? 0) : null}
        </Box>
      ),
    },
  ];

  // Debounced function to handle date changes
  // const handleDateRangeChange = useMemo(
  //   () =>
  //     debounce((start: Dayjs | null, end: Dayjs | null) => {
  //       setFromDate(start);
  //       setToDate(end);
  //     }, 300), // 300ms debounce delay
  //   []
  // );
  const handleDateRangeChange = useCallback(
    debounce(async (start: Dayjs | null, end: Dayjs | null) => {
      // Only call the API if both dates are selected
      if (start && end) {
        try {
          await getProfitAndLoss({
            fromDate: start.format("YYYY-MM-DD"), // Use start directly here
            toDate: end.format("YYYY-MM-DD"), // Use end directly here
          }).unwrap();
        } catch (error: any) {
          showSnack(error.data?.message ?? "An error occurred", "error");
        }
      }
    }, 300), // 300ms debounce delay
    [getProfitAndLoss], // Dependency array ensures that the function is updated if getProfitAndLoss changes
  );

  return (
    <Card>
      <CardContent sx={{ p: 2, height: "calc(100vh - 150px)" }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          gap={2}
        >
          {/* Left side: Back + Title */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => window.history.back()}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6">Tax Summary</Typography>
          </Stack>

          {/* Right side: DateRangePicker + Submit + Settings + Export */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <DateRangePicker
              label="Date Range"
              startValue={fromDate}
              endValue={toDate}
              months={2}
              width="260px"
              onChange={([start, end]) => {
                setFromDate(start);
                setToDate(end);
                handleDateRangeChange(start, end); // Trigger the debounced function
              }}
            />

            {/* Vertical separator */}
            <Box
              sx={{ width: "1px", height: 40, backgroundColor: "divider" }}
            />
            <PermissionGuard permission="export_insights">

              <PrimaryIconButton
                onClick={handleExportOpen}
                icon={<IosShare />}
                title="Export"
              />

            </PermissionGuard>
            <PrimaryIconButton
              onClick={handleSettingsOpen}
              icon={<Settings />}
            />
          </Stack>
        </Box>

        {/* P&L Table */}
        <Box mt={3}>
          <GroupedTable
            useDepth={true}
            columns={columns}
            groupedRows={finalGroupedRows}
            loading={isLoading}
            expandAll
            tableHeight="65vh"
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
          />
        </Box>
      </CardContent>
      <MenuAtom
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onCloseAll={handleExportClose}
        items={[
          {
            onClick: () => { },
            render: () => (
              <Stack
                direction={"row"}
                alignItems={"center"}
                justifyContent={"center"}
                width={"100%"}
                onClick={async () => {
                  console.log("here");
                  try {
                    await exportTax({
                      fromDate: fromDate?.format("YYYY-MM-DD"),
                      toDate: toDate?.format("YYYY-MM-DD"),
                      exportType: "excel",
                    }).unwrap();
                    showSnack(
                      "Exported successfully. Check your mail",
                      "success",
                    );
                  } catch (error: any) {
                    console.log("2");
                    showSnack(error?.data?.message ?? "Its an error", "error");
                  }
                }}
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
                onClick={async () => {
                  console.log("here");
                  try {
                    await exportTax({
                      fromDate: fromDate?.format("YYYY-MM-DD"),
                      toDate: toDate?.format("YYYY-MM-DD"),

                      exportType: "pdf",
                    }).unwrap();
                    showSnack(
                      "Exported successfully. Check your mail",
                      "success",
                    );
                  } catch (error: any) {
                    console.log("2");
                    showSnack(error?.data?.message ?? "Its an error", "error");
                  }
                }}
              >
                <PictureAsPdf color="secondary" />
                <Typography width={"100%"} align="center">
                  PDF
                </Typography>
              </Stack>
            ),
          },
          // {
          //   render: () => (
          //     <>
          //       <ToggleSwitch
          //         label="FX Correction"
          //         checked={FXCorrection}
          //         onChange={() => {
          //           setFXCorrection(!FXCorrection);
          //           handleSettingsClose();
          //         }}
          //       />
          //     </>
          //   ),
          // },
        ]}
      />
      <MenuAtom
        anchorEl={settingsAnchorEl}
        open={!!settingsAnchorEl}
        onCloseAll={() => setSettingsAnchorEl(null)}
        items={[
          {
            render: () => (
              <>
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
                      showSnack(error.data.message ?? "its an error", "error");
                    }
                  }}
                />
              </>
            ),
          },
          {
            render: () => (
              <>
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
                      showSnack(error.data.message ?? "its an error", "error");
                    }
                  }}
                />
              </>
            ),
          },
          // {
          //   render: () => (
          //     <ToggleSwitch
          //       label="FX Correction"
          //       checked={FXCorrection}
          //       onChange={() => setFXCorrection(!FXCorrection)}
          //     />
          //   ),
          // },
        ]}
      />

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

export default TaxSummary;
