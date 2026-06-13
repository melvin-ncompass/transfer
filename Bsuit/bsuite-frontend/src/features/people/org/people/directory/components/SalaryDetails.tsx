import { Box, Button, Card, Divider, Grid, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import {
  useDeleteRevisedSalaryTemplateMutation,
  useGetLatestRevisedSalaryTemplateQuery,
  useGetRevisedSalaryTemplatesQuery,
} from "../api/revision.api";
import { PrimaryButton } from "../../../../../../components/atom/button";
import { ArrowDownward, ArrowUpward, Delete, Edit, RateReviewOutlined } from "@mui/icons-material";
import { formatCurrencyByCommaSeparation, formatNumberByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Tooltip } from "../../../../../../components/atom/tooltip";
import dayjs from "dayjs";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import RevisionDetailModal from "./SalaryTemplateViewModal";

const getChangeMeta = (current?: number, previous?: number) => {
  if (!current || !previous) return null;

  const diff = current - previous;
  const percent = Math.abs((diff / previous) * 100);

  return {
    percent: percent.toFixed(1),
    isIncrease: diff > 0,
    isDecrease: diff < 0,
  };
};

function SalaryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: header } = useGetHeaderDataQuery();
  const commaseperation = header?.data.commaSeparation === "IN" ? "IN" : "US";

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewingRevisionId, setViewingRevisionId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    color: "success" | "error";
  }>({ open: false, message: "", color: "success" });

  const { data, isLoading } = useGetLatestRevisedSalaryTemplateQuery(id!, {
    skip: !id,
  });
  const { data: allRevisionsData } = useGetRevisedSalaryTemplatesQuery(id!, {
    skip: !id,
  });

  const noRevisions = allRevisionsData?.data?.length === 1;

  const [deleteRevision, { isLoading: deleting }] =
    useDeleteRevisedSalaryTemplateMutation();

  const template = data?.data;
  const isRevisedEnabled = template?.isRevisedEnabled ?? false;

  const isRevised = !!template?.components && template.components.length > 0;
  // -----------------------------------------
  // Earnings Rows
  // -----------------------------------------
  const earningsRows = useMemo(() => {
    const items = isRevised
      ? template?.components?.filter((c: any) => !!c.earning)
      : template?.employeeEarnings;

    return (
      items?.map((item: any) => ({
        earningComponent: item.earning?.earningName,
        calculationType: item.earning?.calculationType,
        monthlyAmount: `₹${formatNumberByCommaSeparation(item.monthlyAmount, commaseperation).split('.')[0]}`,
        annualAmount: `₹${formatNumberByCommaSeparation((Number(item.monthlyAmount) * 12).toFixed(2), commaseperation).split('.')[0]}`,
      })) ?? []
    );
  }, [template, isRevised]);

  // -----------------------------------------
  // Deduction Rows
  // -----------------------------------------
  const deductionRows = useMemo(() => {
    const items = isRevised
      ? template?.components?.filter((c: any) => !!c.deduction)
      : template?.employeeDeductions;

    return (
      items?.map((item: any) => ({
        deductionComponent: item.deduction?.deductionName,
        calculationType: item.deduction?.calculationType,
        monthlyAmount: `₹${formatNumberByCommaSeparation(item.monthlyAmount, commaseperation).split('.')[0]}`,
        annualAmount: `₹${formatNumberByCommaSeparation((Number(item.monthlyAmount) * 12).toFixed(2), commaseperation).split('.')[0]}`,
      })) ?? []
    );
  }, [template, isRevised]);

  // -----------------------------------------
  // History Rows
  // -----------------------------------------
  const historyRows = useMemo(() => {
    const list = allRevisionsData?.data ?? [];

    const revisions = list.filter((item: any) => !item.initialTemplate);

    const earliestRevision = revisions.reduce((earliest: any, item: any) => {
      if (!earliest) return item;
      return dayjs(item.payoutDate).isBefore(dayjs(earliest.payoutDate))
        ? item
        : earliest;
    }, null);

    return list.map((item: any, index: number) => {
      const isBase = !!item.initialTemplate;

      const basePayout = earliestRevision
        ? dayjs(earliestRevision.payoutDate).subtract(1, "month")
        : dayjs(item.employee?.dateOfJoining);

      // -----------------------------
      // CHANGE CALCULATION
      // -----------------------------
      const currentGross = isBase
        ? item.annualGross
        : item.revisedAnnualGross;

      const prevItem = list[index + 1];

      const previousGrossValue = prevItem
        ? prevItem.revisedAnnualGross ?? prevItem.annualGross
        : null;

      const change = getChangeMeta(currentGross, previousGrossValue);

      return {
        effectiveDate: isBase
          ? dayjs(item.employee?.dateOfJoining).format("MMM D, YYYY")
          : dayjs(item.effectiveDate).format("MMM D, YYYY"),

        payoutDate: isBase
          ? basePayout.format("MMM D, YYYY")
          : dayjs(item.payoutDate).format("MMM D, YYYY"),

        previousGross: isBase
          ? "-"
          : `₹${formatNumberByCommaSeparation(
            item.previousAnnualGross,
            commaseperation
          ).split(".")[0]}`,

        revisedGross: (
          <Stack
            direction="row"
            justifyContent="flex-end"
            alignItems="center"
            spacing={1}
          >
            {change && !isBase && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {change.isIncrease && (
                  <ArrowUpward sx={{ fontSize: 16, color: "success.main" }} />
                )}
                {change.isDecrease && (
                  <ArrowDownward sx={{ fontSize: 16, color: "error.main" }} />
                )}

                <Typography
                  variant="caption"
                  sx={{
                    color: change.isIncrease
                      ? "success.main"
                      : change.isDecrease
                        ? "error.main"
                        : "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  {change.isIncrease ? `${change.percent}` : change.percent}%
                </Typography>
              </Stack>
            )}

            <Typography>
              ₹
              {formatNumberByCommaSeparation(
                currentGross,
                commaseperation
              ).split(".")[0]}
            </Typography>

          </Stack>
        ),

        view: (
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setViewingRevisionId(String(item.id))}
          >
            View details
          </Typography>
        ),
        edit: (
          <Tooltip
            title={isBase ? "Base template cannot be edited" : ""}
            placement="top-start"
            disableHoverListener={!isBase}
          >
            <IconButton
              size="small"
              color="primary"
              onClick={() =>
                navigate(
                  `/people/salary-template/revise/edit/${id}/${item.id}`
                )
              }
              disabled={isBase}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        delete: (
          <Tooltip
            title={isBase ? "Base template cannot be deleted" : ""}
            placement="top-start"
            disableHoverListener={!isBase}
          >
            <IconButton
              size="small"
              color="error"
              onClick={() => setDeleteConfirm(String(item.id))}
              disabled={isBase}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      };
    });
  }, [allRevisionsData]);

  // -----------------------------------------
  // Table Columns
  // -----------------------------------------
  const columns: StandardTableColumn[] = [
    { id: "earningComponent", label: "Earning Component", width: '40%' },
    { id: "monthlyAmount", label: "Monthly Amount", align: "right" },
    { id: "annualAmount", label: "Annual Amount", align: "right" },
  ];

  const deductionColumns: StandardTableColumn[] = [
    { id: "deductionComponent", label: "Deduction Component", width: '40%' },
    { id: "monthlyAmount", label: "Monthly Amount", align: "right" },
    { id: "annualAmount", label: "Annual Amount", align: "right" },
  ];

  const historyColumns: StandardTableColumn[] = [
    { id: "effectiveDate", label: "Effective Date" },
    { id: "payoutDate", label: "Payout Date" },
    { id: "previousGross", label: "Previous Gross", align: "right" },
    { id: "revisedGross", label: "Revised Gross", align: "right" },
    { id: "view", label: "", align: "center" },
    { id: "edit", label: "", align: "center" },
    { id: "delete", label: "", align: "center" },
  ];

  const handleDelete = async () => {
    if (!id || !deleteConfirm) return;
    try {
      const res = await deleteRevision({
        employeeId: id,
        templateId: deleteConfirm,
      }).unwrap();
      setSnackbar({
        open: true,
        message: res?.message ?? "Revision deleted successfully!",
        color: "success",
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err?.data?.message ?? err?.error ?? err?.message ?? "Failed to delete revision.",
        color: "error",
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />
      )}

      {/* Delete confirmation dialog */}
      <ModalElement
        open={!!deleteConfirm}
        title="Delete Revision"
        onClose={() => setDeleteConfirm(null)}
        maxWidth="xs"
      >
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete this salary revision? This action cannot be undone.
        </Typography>
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <Button onClick={() => setDeleteConfirm(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </ModalElement>

      <RevisionDetailModal
        key={viewingRevisionId}
        open={!!viewingRevisionId}
        onClose={() => setViewingRevisionId(null)}
        employeeId={id!}
        revisionId={viewingRevisionId}
        allRevisionsData={allRevisionsData?.data ?? []}
      />

      <Card
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          height: "100%",
          width: "100%",
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "grey.50",
            p: 1.5,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ pl: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Salary Template
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip
                title={isRevisedEnabled ? "" : "At least one pay run must exist for an employee to revise salary details"}
                placement="top-start"
                disableHoverListener={isRevisedEnabled}
              >
                <PrimaryButton
                  onClick={() => navigate(`/people/salary-template/revise/${id}`)}
                  endIcon={<RateReviewOutlined />}
                  disabled={!isRevisedEnabled}
                >
                  Revise
                </PrimaryButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        <Box overflow="auto" p={2.5}>
          {/* TEMPLATE DATA */}
          {isRevised &&
            <Box width="100%" p={1}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack>
                    <Typography variant="subtitle2">Revised Gross</Typography>
                    <Typography variant="body1">
                      {isRevised
                        ? `₹${formatNumberByCommaSeparation(template?.revisedAnnualGross, commaseperation).split('.')[0]}`
                        : "No revision yet"}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack direction='column' alignItems='flex-end'>
                    <Typography variant="subtitle2">Previous Gross</Typography>
                    <Typography variant="body1">
                      ₹
                      {formatNumberByCommaSeparation(
                        isRevised
                          ? template?.previousAnnualGross
                          : template?.annualGross,
                        commaseperation,
                      ).split('.')[0]}
                    </Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Stack direction='column' alignItems='flex-end'>
                    <Typography variant="subtitle2">
                      {isRevised ? "Revised Monthly Salary" : "Monthly Salary"}
                    </Typography>
                    <Typography variant="body1">
                      ₹
                      {formatNumberByCommaSeparation(
                        isRevised
                          ? template?.revisedMonthlyGross
                          : template?.monthlyGross,
                        commaseperation,
                      ).split('.')[0]}
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>}

          {/* Earnings */}
          <Typography variant="subtitle2" p={1}>
            Earnings
          </Typography>
          <Box p={1} width="100%">
            <StandardTable columns={columns} rows={earningsRows} />
          </Box>

          {deductionRows.length > 0 && (
            <>
              <Typography variant="subtitle2" p={1}>
                Deductions
              </Typography>
              <Box p={1} width="100%">
                <StandardTable columns={deductionColumns} rows={deductionRows} />
              </Box>
            </>
          )}

          {/* Gross Summary */}
          <Box p={1} width="100%">
            <Box
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                px: 2,
                py: 1.5,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1.7fr 2fr",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                Gross Summary
              </Typography>
              <Box />
              <Typography variant="subtitle2" fontWeight={600} textAlign="right">
                {formatCurrencyByCommaSeparation(
                  Number(isRevised ? template?.revisedMonthlyGross : template?.monthlyGross),
                  commaseperation,
                  "₹"
                ).split('.')[0]}
              </Typography>
              <Typography variant="subtitle2" fontWeight={600} textAlign="right">
                {formatCurrencyByCommaSeparation(
                  Number(isRevised ? template?.revisedAnnualGross : template?.annualGross),
                  commaseperation,
                  "₹"
                ).split('.')[0]}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3, mt: 4 }} />

          {/* Revision History */}
          {!noRevisions &&
            <>
              <Typography variant="subtitle2" p={1}>
                Revision History
              </Typography>
              <Box p={1} width="100%">
                <StandardTable columns={historyColumns} rows={historyRows} />
              </Box>
            </>
          }
        </Box>
      </Card>
    </>
  );
}

export default SalaryDetails;
