import { useDispatch } from "react-redux";
import { Box, Typography } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useNavigate } from "react-router-dom";
import ActionsCell from "../../../coa/tax/components/ActionsCell";
import { StandardTable } from "../../../../../components/tables/standard-table";
import { useAppSelector } from "../../../../../store/store";
import {
  useDeleteTaxMutation,
  useGetTaxesQuery,
  useUpdateTaxMutation,
} from "../../../coa/tax/tax.api";
import { useMemo, useState } from "react";
import type { StandardTableColumn } from "../../../../../types/types";
import { Snackbar } from "../../../../../components/atom/snackbar";
import { useGetHeaderDataQuery } from "../../../../company/api/company.api";
import { formatCurrencyByCommaSeparation } from "../../../../../utils/numberFormatter";
import { PermissionGuard } from "../../../../../guards/ComponentGuard";
import { useGetUserPermissionsQuery } from "../../../../../api/permission.api";

import { ConfirmDialog } from "../../../../../components/dialogs/confirm-dialog";
import { closeDeleteModal } from "../taxSlice";

export default function TaxPage({ search, zeroBalance }: { search: string, zeroBalance: boolean }) {
  const navigate = useNavigate();
  const { data: usepermissionsData } = useGetUserPermissionsQuery();
  const dispatch = useDispatch();

  const { data: headerData } = useGetHeaderDataQuery();
  const commaSeparation = (headerData?.data?.commaSeparation as "US" | "IN") || "IN";
  const currency = headerData?.data?.reportingCurrency?.split(" - ")[0];
  const hasManageCoaPermission = usepermissionsData?.data?.permissions?.includes(
    "manage_coa",
  );

  const { data, isLoading, refetch } = useGetTaxesQuery();

  const [deleteTaxApi] = useDeleteTaxMutation();
  const { isDeleteModalOpen, selectedTax } = useAppSelector(
    (state) => state.tax
  );

  const [updateTax] = useUpdateTaxMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  const handleDelete = async (row: any) => {
    const res: any = await deleteTaxApi({ id: row.id });
    if (res.error) {
      showSnack(res.error?.data?.message || "Failed to delete tax", "error");
    } else {
      showSnack(res.data?.message, "success");
      await refetch();
    }
  };

  const handleEdit = async (row: any) => {
    try {
      await updateTax({
        id: row.id,
        body: {
          ...row,
          rate: "20%",
        },
      }).unwrap();
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const columns: StandardTableColumn[] = [
    { id: "taxName", label: "Name" },
    { id: "abbreviation", label: "Abbreviation" },
    { id: "taxRate", label: "Rate", align: "right" },
    {
      id: "balance",
      label: "Balance",
      align: "right",
      render(row) {
        return <span>{formatCurrencyByCommaSeparation(row.taxBalance, commaSeparation, currency)}</span>;
      },
    },
    {
      id: "transactions",
      label: "Transactions",
      align: "right",
      render(row) {
        const count = (row as any).transactionCount ?? 0;
        const hasTransactions = count > 0 && usepermissionsData?.data?.permissions?.includes("view_transactions");
        return (
          <Typography
            component="span"
            sx={{
              width: "100%",
              textAlign: "right",
              display: "block",
              cursor: hasTransactions ? "pointer" : "default",
              color: hasTransactions ? "primary.main" : "text.primary",
              fontWeight: hasTransactions ? 600 : 400,
              textDecoration: hasTransactions ? "underline" : "none",
              "&:hover": hasTransactions ? { color: "primary.dark" } : {},
            }}
            onClick={(e) => {
              if (hasTransactions) {
                e.stopPropagation();
                navigate(`/books/transact/home?taxId=${row.id}`);
              }
            }}
          >
            {count}
          </Typography>
        );
      },
    },
    ...(hasManageCoaPermission
      ? [
        {
          id: "actions",
          label: "Actions",
          align: "center" as const,
          render: (row: any) => {
            if (row.default) {
              return (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ opacity: 0.6 }}
                >
                  <LockIcon fontSize="small" />
                </Box>
              );
            }

            return (
              <PermissionGuard permission={"manage_coa"}>
                <ActionsCell
                  params={{ row }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </PermissionGuard>
            );
          },
        },
      ]
      : []),
  ];

  const filteredRows = useMemo(() => {
    if (!data?.data) return [];

    const q = search.toLowerCase();

    return data.data.filter((t: any) => {
      //  SEARCH
      const matchesSearch =
        !search.trim() ||
        t.taxName?.toLowerCase().includes(q) ||
        t.abbreviation?.toLowerCase().includes(q) ||
        String(t.taxRate)?.toLowerCase().includes(q) ||
        String(t.taxNumber)?.toLowerCase().includes(q);

      //  ZERO BALANCE FILTER
      const balance = Number(t.taxBalance ?? 0);

      const matchesZeroBalance = zeroBalance
        ? true
        : Math.abs(balance) > 0.000001;

      return matchesSearch && matchesZeroBalance;
    });
  }, [data, search, zeroBalance]);
  return (
    <>
      <Box
        sx={{
          maxHeight: "65vh",
          overflow: "auto",
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            borderRadius: 4,
          },
        }}
      >
        <StandardTable
          minWidth={150}
          columns={columns}
          rows={filteredRows}
          loading={isLoading}
          emptyMessage="No Data available"
        />
      </Box>

      <ConfirmDialog
        open={isDeleteModalOpen}
        title="Delete Tax"
        message="Are you sure you want to delete this tax?"
        onClose={() => {
          dispatch(closeDeleteModal());
        }}
        onConfirm={async () => {
          try {
            await handleDelete(selectedTax);
            dispatch(closeDeleteModal());
          } catch (error) {
            console.error(error);
          }
        }}
        confirmText="Delete"
        confirmColor="error"
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}
