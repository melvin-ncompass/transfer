import {
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { GroupedDataTableProps } from "../../../types/types";
import React, { useEffect } from "react";
import { Circle } from "@mui/icons-material";
import type { ReactNode } from "react";
import {
  getTableCellStyles,
  getTableGroupHeaderStyles,
  getTableHeaderStyles,
  getTypographyStyles,
  UI_CONSTANTS,
} from "../../../themes/uiConstants";
import { useNavigate } from "react-router-dom";
import { useGetUserPermissionsQuery } from "../../../api/permission.api";

interface GroupedItem {
  id?: string | number;
  _parentId?: string | number;
  _depth?: number;
  children?: unknown[];
  [key: string]: unknown;
  dateFrom?: string;
  dateTo?: string;
  singleDate?: string;
}

export function GroupedTable<T extends GroupedItem>({
  columns,
  groupedRows,
  loading = false,
  tableHeight = "65vh",
  headerBgColor,
  bodyBgColor,
  expandAll,
  useDepth = false,
  renderGroupHeader, // optional custom group header renderer
  onToggleRow,
  dateFrom,
  dateTo,
  singleDate,
  extraQueryParams,
  groupHeaderColumns,
}: GroupedDataTableProps<T>) {
  const theme = useTheme();
  const navigate = useNavigate();
const {data:userPermissionsData} = useGetUserPermissionsQuery();  
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const safeGroupedRows = Array.isArray(groupedRows) ? groupedRows : [];
  useEffect(() => {
    if (!expandAll) return;

    const newState: Record<string, boolean> = {};

    safeGroupedRows.forEach((group) => {
      group.items.forEach((item: T) => {
        if (item.children && item.children.length > 0) {
          newState[`${group.groupName}-${item.id}`] = true;
        }
      });
    });

    setExpanded(newState);
  }, [expandAll, safeGroupedRows]);

  // Unified color logic (matches DataTable)
  const resolvedHeaderBg =
    headerBgColor ||
    (theme.palette.mode === "light"
      ? theme.palette.grey[500]
      : theme.palette.grey[800]);

  const resolvedBodyBg =
    bodyBgColor ||
    (theme.palette.mode === "light"
      ? theme.palette.background.paper
      : theme.palette.background.default);

  const groupHeaderBg =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[300];

  const stickyFirstColumnSx = (variant: "header" | "groupHeader" | "body") => {
    const backgroundColor =
      variant === "header"
        ? resolvedHeaderBg
        : variant === "groupHeader"
          ? groupHeaderBg
          : theme.palette.background.paper;
    const zIndex = variant === "header" ? 5 : 1;
    const base = {
      position: "sticky" as const,
      left: 0,
      zIndex,
      backgroundColor:
        variant === "header"
          ? `${backgroundColor} !important`
          : backgroundColor,
      boxShadow: "2px 0 4px -2px rgba(0,0,0,0.1)",
      minWidth: variant === "header" ? 180 : undefined,
    };
    if (variant === "header") {
      return { ...base, top: 0 } as const;
    }
    return base;
  };

  return (
    <TableContainer
      component={Box}
      sx={{
        maxHeight: tableHeight,
        overflowX: "auto",
        borderRadius: 0,
        border: `none`,
        boxShadow: "none",
        width: "100%",
      }}
    >
      {loading ? (
        <Stack height="100%" alignItems="center" justifyContent="center" py={6}>
          <CircularProgress />
        </Stack>
      ) : (
        <Table stickyHeader size="small">
          {/* Consistent Header */}
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 600,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  whiteSpace: "nowrap",
                  backgroundColor:
                    theme.palette.mode === "light"
                      ? `${theme.palette.grey[300]} !important`
                      : `${theme.palette.grey[800]} !important`,
                  color:
                    theme.palette.mode === "light"
                      ? `${theme.palette.grey[700]} !important`
                      : `${theme.palette.grey[400]} !important`,
                },
              }}
            >
              {columns.map((col, colIndex) => (
                <TableCell
                  key={col.field}
                  align={col.headerAlign || "left"}
                  sx={{
                    ...getTableHeaderStyles(),
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    textAlign: col.headerAlign || "left",
                    color: theme.palette.text.primary,
                    ...(colIndex === 0 ? stickyFirstColumnSx("header") : {}),
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Show No Data only if there are no groups */}
            {safeGroupedRows.length === 0
              ? !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      sx={{
                        textAlign: "center",
                        py: UI_CONSTANTS.spacing.tableNoDataPadding,
                        fontSize: UI_CONSTANTS.fontSize.tableCell,
                        border: "none",
                        width: "100%",
                        ...stickyFirstColumnSx("body"),
                      }}
                    >
                      No Data Available
                    </TableCell>
                  </TableRow>
                )
              : safeGroupedRows.map((group) => (
                  <React.Fragment key={group.groupName}>
                    {/* Group Header Row */}
                    {/* Group Header Row */}
                    {group.groupName &&
                      !group.items?.some((it: any) => it._isFinal) && (
                        <TableRow
                          sx={{
                            backgroundColor: groupHeaderBg,
                            height: UI_CONSTANTS.rowHeight.groupHeader,
                          }}
                        >
                          {groupHeaderColumns ? (
                            groupHeaderColumns.map((col, colIndex) => (
                              <TableCell
                                key={col.field}
                                align={col.headerAlign || "left"}
                                sx={{
                                  ...getTableGroupHeaderStyles(),
                                  border: "none",
                                  ...(colIndex === 0
                                    ? stickyFirstColumnSx("groupHeader")
                                    : {}),
                                }}
                              >
                                {col.renderCell
                                  ? col.renderCell(group as any)
                                  : colIndex === 0
                                    ? group.groupName
                                    : null}
                              </TableCell>
                            ))
                          ) : (
                            <>
                            <TableCell
                              // colSpan={columns.length}
                              sx={{
                                ...getTableGroupHeaderStyles(),
                                whiteSpace: "normal",
                                overflow: "visible",
                                textOverflow: "clip",
                                border: "none",
                                verticalAlign: "middle",
                                color:
                                  theme.palette.mode === "light"
                                    ? `${theme.palette.grey[700]} !important`
                                    : `${theme.palette.grey[400]} !important`,
                                ...stickyFirstColumnSx("groupHeader"),
                              }}
                            >
                              <Typography
                                component="div"
                                sx={getTypographyStyles()}
                              >
                                {renderGroupHeader
                                  ? renderGroupHeader(group)
                                  : group.groupName}
                              </Typography>
                            </TableCell>
                            <TableCell colSpan={columns.length-1}></TableCell></>
                          )}
                        </TableRow>
                      )}
                    {/* Grouped Child Rows */}
                    {(() => {
                      const idMap: Record<string, T> = {};
                      group.items?.forEach((it: T) => {
                        if (it.id !== undefined) idMap[String(it.id)] = it;
                      });

                      const isVisible = (node: T) => {
                        let pid = node._parentId;
                        while (pid) {
                          if (!expanded[`${group.groupName}-${pid}`])
                            return false;
                          const parent = idMap[String(pid)];
                          if (!parent) break;
                          pid = parent._parentId;
                        }
                        return true;
                      };

                      const items = Array.isArray(group.items)
                        ? group.items
                        : [];

                      // If group has no accounts, still show header + message (except for Uncategorized)
                      if (
                        items.length === 0 &&
                        group.groupName !== "Uncategorized"
                      ) {
                        return (
                          <TableRow>
                            <TableCell
                              sx={{
                                textAlign: "center",
                                py: UI_CONSTANTS.spacing.tableNoGroupPadding,
                                fontSize: UI_CONSTANTS.fontSize.tableCell,
                                border: "none",
                                color: theme.palette.text.secondary,
                                // ...stickyFirstColumnSx("body"),
                              }}
                            >
                              No accounts in this group
                            </TableCell>
                            {/* <TableCell
                            colSpan={columns.length - 1}
                            sx={{
                              border: "none",
                              backgroundColor: theme.palette.background.paper,
                            }}
                          /> */}
                          </TableRow>
                        );
                      }

                      return items.map((item: T) => {
                        const isNavigable = /[1-9]/.test(String(item.id ?? ""));

                        const isFinal = (item as any)._isFinal;
                        const depth =
                          typeof item._depth === "number" ? item._depth : 0;
                        const isTotal = item._isTotal;
                        const isProfit = (item as any).name === "Profit";

                        if (!isVisible(item)) return null;

                        const children = Array.isArray(item.children)
                          ? item.children
                          : [];

                        const hasChildren = children.length > 0;
                        const isExpanded = item.id
                          ? !!expanded[`${group.groupName}-${item.id}`]
                          : false;
                        return (
                          <TableRow
                            key={`${group.groupName}-${String(item.id)}`}
                            sx={{
                              backgroundColor: theme.palette.background.paper,
                              "&:hover": {
                                backgroundColor: theme.palette.action.hover,
                                "& td": {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              },
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            {columns.map((col, colIndex) => (
                              <TableCell
                                key={col.field}
                                align={col.align || "left"}
                                sx={{
                                  ...getTableCellStyles(),
                                  whiteSpace: "normal",
                                  overflow: "visible",
                                  textOverflow: "unset",
                                  border: "none",
                                  ...(colIndex === 0
                                    ? stickyFirstColumnSx("body")
                                    : {}),
                                }}
                              >
                                {colIndex === 0 && !item._skipFirstColumnNav ? (
                                  isFinal || isProfit ? (
                                    <Typography fontWeight={600}>
                                      {isProfit ? "Profit" : "Total"}
                                    </Typography>
                                  ) : (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        pl: useDepth ? depth * 2 : 0,
                                        pt: 1,
                                      }}
                                    >
                                      {hasChildren ? (
                                        <IconButton
                                          size="small"
                                          sx={{ padding: 0, marginRight: 1 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!item.id) return;
                                            const key = `${group.groupName}-${item.id}`;
                                            const nextExpanded = !expanded[key];
                                            setExpanded((prev) => ({
                                              ...prev,
                                              [key]: nextExpanded,
                                            }));
                                            onToggleRow?.(key, nextExpanded);
                                          }}
                                        >
                                          {isExpanded ? (
                                            <ExpandMoreIcon fontSize="small" />
                                          ) : (
                                            <ChevronRightIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      ) : item.children !== undefined ? (
                                        <Circle
                                          sx={{ color: "transparent", pl: 5 }}
                                        />
                                      ) : !isTotal ? (
                                        <Circle sx={{ color: "transparent" }} />
                                      ) : isProfit ? (
                                        <Circle sx={{ color: "transparent" }} />
                                      ) : null}

                                      <Box
                                        sx={{
                                          cursor: isNavigable  && userPermissionsData?.data?.permissions?.includes("view_transactions") 
                                            ? "pointer"
                                            : "default",
                                        }}
                                        onClick={() => {
                                         if(userPermissionsData?.data?.permissions?.includes("view_transactions") ){ const accountTypeRaw =
                                            item.accountType != null
                                              ? String(item.accountType).trim()
                                              : "";
                                          const accountTypeLower =
                                            accountTypeRaw.toLowerCase();

                                          const accountIdVal = (item as any)
                                            .accountId;
                                          const numericString =
                                            accountIdVal != null &&
                                            accountIdVal !== ""
                                              ? String(accountIdVal).replace(
                                                  /\D/g,
                                                  "",
                                                )
                                              : typeof item.id === "string"
                                                ? item.id.replace(/\D/g, "")
                                                : String(item.id ?? "");

                                          if (!isNavigable) return;

                                          if (
                                            !numericString ||
                                            /^0+$/.test(numericString)
                                          )
                                            return;

                                          const queryParams =
                                            new URLSearchParams();

                                          if (accountTypeLower === "contact") {
                                            queryParams.set(
                                              "contactId",
                                              numericString,
                                            );
                                            queryParams.set(
                                              "accountType",
                                              "contact",
                                            );
                                          } else if (accountTypeLower === "tax") {
                                            queryParams.set(
                                              "taxId",
                                              numericString,
                                            );
                                            queryParams.set(
                                              "accountType",
                                              "tax",
                                            );
                                          } else {
                                            queryParams.set(
                                              "accountId",
                                              numericString,
                                            );
                                            if (accountTypeRaw)
                                              queryParams.set(
                                                "accountType",
                                                accountTypeRaw,
                                              );
                                          }

                                          if (dateFrom && dateTo) {
                                            queryParams.append(
                                              "fromDate",
                                              dateFrom,
                                            );
                                            queryParams.append(
                                              "toDate",
                                              dateTo,
                                            );
                                          }
                                          if (singleDate) {
                                            queryParams.append(
                                              "date",
                                              singleDate,
                                            );
                                          }
                                          if (extraQueryParams) {
                                            Object.entries(
                                              extraQueryParams,
                                            ).forEach(([key, value]) => {
                                              queryParams.set(key, value);
                                            });
                                          }

                                          navigate(
                                            `/books/transact/home?${queryParams.toString()}`,
                                          );}
                                        }}
                                      >
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color:
                                              isNavigable && !isTotal 
                                                ? "primary.main"
                                                : "text.primary",
                                            textDecoration:
                                              isNavigable && !isTotal
                                                ? "none"
                                                : "unset",
                                            "&:hover":
                                              isNavigable && !isTotal
                                                ? { color: "primary.dark" }
                                                : {},
                                          }}
                                        >
                                          {col.renderCell
                                            ? col.renderCell(
                                                item as unknown as Parameters<
                                                  typeof col.renderCell
                                                >[0],
                                              )
                                            : (item[col.field] as ReactNode)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )
                                ) : (
                                  <Box sx={{ pt: 2 }}>
                                    {col.renderCell
                                      ? col.renderCell(
                                          item as unknown as Parameters<
                                            typeof col.renderCell
                                          >[0],
                                        )
                                      : (item[col.field] as ReactNode)}
                                  </Box>
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      });
                    })()}
                  </React.Fragment>
                ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
}