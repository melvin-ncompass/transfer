import {
  Card,
  CardContent,
  IconButton,
  Typography,
  Box,
  Stack,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DatePickerElement } from "../../../../../components/atom/date-picker";
import {
  useLazyExportTDSQuery,
  useLazyGetTDSSummaryQuery,
} from "../../api/insights.api";
import { GroupedTable } from "../../../../../components/tables/standard-table";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import {
  ArrowBack,
  PictureAsPdf,
  Settings,
  TableChart,
  Upload,
  IosShare
} from "@mui/icons-material";
import MenuAtom from "../../../../../components/menuatom/MenuAtom";
import { ToggleSwitch } from "../../../../../components/atom/toggle-switch";
import dayjs, { Dayjs } from "dayjs";
import { useToggleMutation } from "../../../coa/account/api/accounts.api";
import { Snackbar } from "../../../../../components/atom/snackbar";
import type { GridColDef } from "@mui/x-data-grid";
import { DateRangePicker } from "../../../../../components/atom/custom-date-range-picker";
import { debounce } from "lodash-es";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";

interface PnLColumn {
  field: string;
  headerName: string;
  align?: "left" | "right";
  renderCell?: (row: any, index?: number) => any;
}

function TDSummary() {
  const theme = useTheme();
  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation =
    (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const [toggle] = useToggleMutation();

  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
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
  const [exportTax, { data: exportTaxData }] = useLazyExportTDSQuery();

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
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  const [zeroBalance, setZeroBalance] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const [getTDS, { data: bsData, isFetching: isLoading }] =
    useLazyGetTDSSummaryQuery();
  const getInitialData = async () => {
    try {
      await getTDS({}).unwrap();
    } catch (error: any) {
      console.log("here i am");
      console.log(error);
      showSnack(error.data?.message ?? "its an error", "error");
    }
  };
  // Fetch data on load or when date changes
  useEffect(() => {
    getInitialData();
  }, []);
  useEffect(() => {
    if (!bsData?.data) return;
    console.log("after call");
    console.log(bsData?.data?.dateList[0]);
    setFromDate(dayjs(bsData?.data?.dateList[0]));
    setToDate(dayjs(bsData?.data?.dateList[1]));
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
    if (!bsData?.data) return [];

    const {
      tdsReceivables = [],
      tdsPayables = [],
      totalReceivable = 0,
      totalPayable = 0,
      zeroBalance,
    } = bsData.data;

    const buildItems = (list: any[]) =>
      list
        .filter((row) => (zeroBalance ? true : row.tdsAmount !== 0))
        .map((row) => ({
          id: row.contactId,
          name: row.contactName,
          accountType: "Contact",
          amount: row.tdsAmount,
          _depth: 0,
        }));

    // If both groups are effectively empty after applying zero-balance filter, show no data (so GroupedTable renders "No Data Available")
    const receivableItems = buildItems(tdsReceivables);
    const payableItems = buildItems(tdsPayables);

    if (
      (receivableItems.length === 0 ||
        receivableItems.every((r: any) => r.amount === 0)) &&
      (payableItems.length === 0 ||
        payableItems.every((r: any) => r.amount === 0))
    ) {
      return [];
    }

    return [
      {
        groupName: "TDS Receivables",
        items: [
          ...receivableItems,
          {
            id: "total-receivable",
            name: "Total",
            amount: totalReceivable,
            _isTotal: true,
          },
        ],
      },
      {
        groupName: "TDS Payables",
        items: [
          ...payableItems,
          {
            id: "total-payable",
            name: "Total",
            amount: totalPayable,
            _isTotal: true,
          },
        ],
      },
    ];
  }, [bsData]);

  // Columns
  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Contact",
      renderCell: (row: any) => (
        <Box fontWeight={row._isTotal ? 600 : "normal"}>{row.name}</Box>
      ),
    },
    {
      field: "amount",
      headerName: "TDS Amount",
      align: "right",
      headerAlign: "right",
      renderCell: (row: any) => {
        const value = row.amount;

        return (
          <Box fontWeight={row._isTotal ? 600 : "normal"}>
            {formatValue(value)}
          </Box>
        );
      },
    },
  ];

  // Debounced function for TDS API call
  const handleTDSDateRangeChange = useCallback(
    debounce(async (start: Dayjs | null, end: Dayjs | null) => {
      // Only call the API if both dates are selected
      if (start && end) {
        try {
          await getTDS({
            fromDate: start.format("YYYY-MM-DD"),
            toDate: end.format("YYYY-MM-DD"),
          }).unwrap();
        } catch (error: any) {
          showSnack(error.data?.message ?? "An error occurred", "error");
        }
      }
    }, 300), // 300ms debounce delay
    [getTDS] // Dependency array ensures that the function is updated if getTDS changes
  );

  return (
    <Card>
      <CardContent sx={{ pt: 2.5, height: "calc(100vh - 150px)" }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          gap={2}
        >
          <Stack direction={"row"} alignItems={"center"}>
            <IconButton
              onClick={() => {
                window.history.back();
              }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h6">TDS Summary</Typography>
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
                handleTDSDateRangeChange(start, end); // Trigger the debounced function
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
              // onClick={handleSettingsOpen}
              onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
              icon={<Settings />}
            />
          </Stack>
        </Box>


        <Box mt={3}>
          <GroupedTable
            columns={columns}
            groupedRows={groupedRows}
            loading={isLoading}
            expandAll={false}
            tableHeight="65vh"
            dateFrom={fromDate ? dayjs(fromDate).format("YYYY-MM-DD") : undefined}
            dateTo={toDate ? dayjs(toDate).format("YYYY-MM-DD") : undefined}
            extraQueryParams={{ source: "tds" }}
            renderGroupHeader={(group) => (
              <Stack fontWeight={600}>{group.groupName}</Stack>
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
                    showSnack(
                      error?.data?.message ?? "Its an error",
                      "error",
                    );
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
                    showSnack(
                      error?.data?.message ?? "Its an error",
                      "error",
                    );
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
      {/* <IconButton onClick={(e) => setSettingsAnchorEl(e.currentTarget)}>
              <Settings color="secondary" />
            </IconButton> */}
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
                      showSnack(
                        error.data.message ?? "its an error",
                        "error",
                      );
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
                      showSnack(
                        error.data.message ?? "its an error",
                        "error",
                      );
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

export default TDSummary;
