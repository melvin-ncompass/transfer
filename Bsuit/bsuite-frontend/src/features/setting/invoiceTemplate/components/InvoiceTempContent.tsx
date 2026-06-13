import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Card,
} from "@mui/material";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../store/store";
import { items } from "../utils/items";
import { useGetCompanyDetailsQuery } from "../../companyDetails/api/companyBranding.api";
import { useGetIdentityQuery } from "../../companyIdentity/components/identity.api";

export default function InvoiceTempContent() {
  const { data: companyData } = useGetCompanyDetailsQuery();
  const { data: identityData } = useGetIdentityQuery();
  const { CheckedTransaction, TransactionValue } = useSelector(
    (state: RootState) => state.invoice.transactionDetails,
  );
  const { pageValue, pageChecked } = useSelector(
    (state: RootState) => state.invoice.pageSetUp,
  );
  const { previewHtml: html } = useSelector(
    (state: RootState) => state.invoice.previewHtml,
  );
  const { checkedTotal } = useSelector(
    (state: RootState) => state.invoice.totalReducer,
  );
  const tableDetail = useSelector(
    (state: RootState) => state.invoice.tableDetail,
  );
  const { Margin } = useSelector((root: RootState) => root.invoice.sideGeneral);
  const { showBankDetails, showIdentity, bankDetails, identityFields } =
    useSelector((state: RootState) => state.invoice.otherDetails);

  const adjustedColumns = React.useMemo(() => {
    const cols = Object.entries(tableDetail).map(([key, value]: any) => ({
      key,
      ...value,
      width: Number(value.width) || 0,
    }));
    const visibleCols = cols.filter((col) => col.checked);
    const totalWidth =
      visibleCols.reduce((acc, col) => acc + col.width, 0) || 1;
    return cols.map((col) => ({
      ...col,
      relativeWidth: col.checked ? (col.width / totalWidth) * 100 : 0,
    }));
  }, [tableDetail]);

  return (
    <Card
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "white",
        width: "100%",
        gap: 2,
        pt: Margin.top ?? 4,
        pr: Margin.right ?? 4,
        pb: Margin.bottom ?? 4,
        pl: Margin.left ?? 4,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box dangerouslySetInnerHTML={{ __html: html }} />
      </Box>

      {/* Bill To / Invoice Detail */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        {/* LEFT SIDE (Top → Bottom Fixed) */}
        <Stack spacing={1} maxWidth="60%">
          <Typography fontWeight="bold">
            {companyData?.data?.company?.companyName}
          </Typography>

          <Typography>{identityData?.company?.addressLine1}</Typography>
          {/* 
          {showIdentity && (
            <Box>
              {Object.entries(identityFields).map(([sectionKey, fields]) => (
                <Box key={sectionKey} mt={1}>
                  {fields
                    .filter((f) => f.checked)
                    .map((f) => (
                      <Typography key={f.id}>{f.label}</Typography>
                    ))}
                </Box>
              ))}
            </Box>
          )} */}
          {showIdentity && (
            <Box>
              {identityFields
                .filter((f) => f.checked)
                .map((f) => (
                  <Typography key={f.id}>{f.label}</Typography>
                ))}
            </Box>
          )}
        </Stack>

        {/* RIGHT SIDE (Always Fixed Right) */}
        <Box textAlign="right" minWidth="250px">
          {CheckedTransaction.title && (
            <Typography variant="h4" fontWeight="bold">
              {TransactionValue?.title || ""}
            </Typography>
          )}

          <Box display="flex" justifyContent="flex-end" gap={1}>
            {CheckedTransaction.numberField && (
              <Typography>{TransactionValue.numberField}</Typography>
            )}
            <Typography>INV-17</Typography>
          </Box>

          {CheckedTransaction.balanceDue && (
            <>
              <Typography mt={2}>Balance Due</Typography>
              <Typography fontWeight="bold" fontSize={20}>
                ₹562.75
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Invoice Details */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        {/* LEFT SIDE: Bill To + Ship To */}
        <Stack spacing={2} flex={1}>
          {CheckedTransaction.billTo && (
            <Box>
              <Typography fontWeight="bold">Bill To</Typography>
              <Typography fontWeight="bold">Rob & Joe Traders</Typography>
              <Typography>34, Riche Street</Typography>
              <Typography>Chennai</Typography>
              <Typography>631603 Tamil Nadu</Typography>
              <Typography>India</Typography>
            </Box>
          )}
        </Stack>

        {/* RIGHT SIDE: Other Details (always right aligned) */}
        <Stack spacing={0.5} width="250px" ml={4}>
          {CheckedTransaction.dateField && (
            <Box display="flex" justifyContent="space-between">
              <Typography>{TransactionValue.dateField}</Typography>
              <Typography>12/11/2025</Typography>
            </Box>
          )}

          {CheckedTransaction.serviceStart && (
            <Box display="flex" justifyContent="space-between">
              <Typography>{TransactionValue.serviceStart}</Typography>
              <Typography>10/11/2025</Typography>
            </Box>
          )}

          {CheckedTransaction.dueDate && (
            <Box display="flex" justifyContent="space-between">
              <Typography>Due Date:</Typography>
              <Typography>12/11/2025</Typography>
            </Box>
          )}

          {CheckedTransaction.serviceEnd && (
            <Box display="flex" justifyContent="space-between">
              <Typography>{TransactionValue.serviceEnd}</Typography>
              <Typography>1/11/2025</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Items Table */}
      <TableContainer
        component={Paper}
        sx={{ width: "100%", overflowX: "hidden" }}
      >
        <Table
          size="small"
          sx={{
            tableLayout: "fixed",
            width: "100%",
            wordBreak: "break-word",
            whiteSpace: "normal",
          }}
        >
          <colgroup>
            {adjustedColumns.map(
              (col) =>
                col.checked && (
                  <col
                    key={col.key}
                    style={{ width: `${col.relativeWidth.toFixed(2)}%` }}
                  />
                ),
            )}
          </colgroup>
          <TableHead sx={{ bgcolor: "grey.200" }}>
            <TableRow>
              {adjustedColumns.map(
                (col) =>
                  col.checked && (
                    <TableCell key={col.key} sx={{ fontWeight: "bold" }}>
                      {col.label}
                    </TableCell>
                  ),
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                {adjustedColumns.map((col) => {
                  if (!col.checked) return null;
                  switch (col.key) {
                    case "lineItemNo":
                      return <TableCell key={col.key}>{row.id}</TableCell>;
                    case "item":
                      return <TableCell key={col.key}>{row.name}</TableCell>;
                    case "quantity":
                      return <TableCell key={col.key}>{row.qty}</TableCell>;
                    case "rate":
                      return (
                        <TableCell key={col.key}>
                          {row.rate.toFixed(2)}
                        </TableCell>
                      );
                    case "discount":
                      return (
                        <TableCell key={col.key}>
                          {row.discount.toFixed(2)}
                        </TableCell>
                      );
                    case "taxPercentage":
                      return (
                        <TableCell key={col.key}>
                          {row.taxPercent.toFixed(2)}
                        </TableCell>
                      );
                    case "taxAmount":
                      return (
                        <TableCell key={col.key}>
                          {row.tax.toFixed(2)}
                        </TableCell>
                      );
                    case "amount":
                      return (
                        <TableCell key={col.key}>
                          {row.amount.toFixed(2)}
                        </TableCell>
                      );
                    default:
                      return null;
                  }
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" mt={3} alignItems="flex-start">
        <Box ml="auto">
          <Stack spacing={0.5} width="250px">
            {checkedTotal.subTotal && (
              <Box display="flex" justifyContent="space-between">
                <Typography>Sub Total</Typography>
                <Typography>630.00</Typography>
              </Box>
            )}

            {checkedTotal.discount && (
              <Box display="flex" justifyContent="space-between">
                <Typography>Discount</Typography>
                <Typography>0.00</Typography>
              </Box>
            )}

            {checkedTotal.sampleTax && (
              <Box display="flex" justifyContent="space-between">
                <Typography>Sample Tax (4.70%)</Typography>
                <Typography>11.75</Typography>
              </Box>
            )}
            {checkedTotal.tds && (
              <Box display="flex" justifyContent="space-between">
                <Typography>Tds (4.70%)</Typography>
                <Typography>10.00</Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {checkedTotal.total && (
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Total</Typography>
                <Typography fontWeight="bold" color="primary">
                  ₹662.75
                </Typography>
              </Box>
            )}

            {checkedTotal.paymentMade && (
              <Box display="flex" justifyContent="space-between">
                <Typography>Payment Made</Typography>
                <Typography color="error">(-)100.00</Typography>
              </Box>
            )}

            {checkedTotal.balanceDue && (
              <Box
                mt={2}
                p={1}
                bgcolor="#f8f8f8"
                display="flex"
                justifyContent="space-between"
                fontWeight="bold"
              >
                <Typography>Balance Due</Typography>
                <Typography fontWeight="bold">₹562.75</Typography>
              </Box>
            )}

            {checkedTotal.amountInWords && (
              <>
                <Typography fontWeight={900}>Total In Words : </Typography>
                <Typography>
                  Indian Rupee Six Hundred Sixty-Two and Seventy-Five Paise Only
                </Typography>
              </>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Notes */}
      <Box display="flex" flexDirection="column" mt={3}>
        <Box>
          <Typography fontWeight="bold">Notes</Typography>
          <Typography>Thanks for your business.</Typography>
        </Box>
      </Box>

      {/* Bank Details*/}
      <Box display="flex" flexDirection="column" mt={2}>
        {showBankDetails && (
          <Box display="flex">
            <Box>
              {Object.keys(bankDetails).map((key) => {
                const field = bankDetails[key as keyof typeof bankDetails];
                return (
                  field.checked && (
                    <Typography key={key}>
                      {field.label}: {field.value}
                    </Typography>
                  )
                );
              })}
            </Box>
          </Box>
        )}

        {/*  Page info */}
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Typography fontSize={13}>{pageChecked ? pageValue : " "}</Typography>
        </Box>
      </Box>
    </Card>
  );
}
