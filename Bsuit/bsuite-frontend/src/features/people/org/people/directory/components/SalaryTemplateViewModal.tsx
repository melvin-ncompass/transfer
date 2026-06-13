import {
  Box,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import type { StandardTableColumn } from "../../../../../../types/types";
import { formatNumberByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetRevisedSalaryTemplateByIdQuery } from "../api/revision.api";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { Grid } from "@mui/system";

interface RevisionDetailModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  revisionId: string | null;
  allRevisionsData: any[];
}

function RevisionDetailSkeleton() {
  return (
    <Box>
      {/* Summary row */}
      <Grid container spacing={2} mb={2}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Grid size={{ xs: 12, sm: 4 }} key={i}>
            <Stack spacing={0.5}>
              <Skeleton variant="text" width="50%" height={16} />
              <Skeleton variant="text" width="70%" height={24} />
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Earnings table */}
      <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5, borderRadius: 1 }} />
      ))}

      {/* Deductions table */}
      <Skeleton variant="text" width={100} height={20} sx={{ mt: 2, mb: 1 }} />
      {[1, 2].map((i) => (
        <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 0.5, borderRadius: 1 }} />
      ))}

      {/* Gross summary bar */}
      <Skeleton variant="rectangular" height={48} sx={{ mt: 2, borderRadius: 1 }} />
    </Box>
  );
}

function RevisionDetailModal({
  open,
  onClose,
  employeeId,
  revisionId,
  allRevisionsData,
}: RevisionDetailModalProps) {
  const { data: header } = useGetHeaderDataQuery();
  const currentRecord = allRevisionsData.find((item: any) => String(item.id) === revisionId);
  const isBase = !!currentRecord?.initialTemplate;
  const commaseperation = header?.data.commaSeparation === "IN" ? "IN" : "US";

  const { data: viewRevisionData, isLoading } = useGetRevisedSalaryTemplateByIdQuery(
    { employeeId, templateId: revisionId! },
    { skip: !employeeId || !revisionId || isBase }
  );

  const viewTemplate = viewRevisionData?.data;

  const earningColumns: StandardTableColumn[] = [
    { id: "earningComponent", label: "Earning Component", width: "40%" },
    { id: "monthlyAmount", label: "Monthly Amount", align: "right" },
    { id: "annualAmount", label: "Annual Amount", align: "right" },
  ];

  const deductionColumns: StandardTableColumn[] = [
    { id: "deductionComponent", label: "Deduction Component", width: "40%" },
    { id: "monthlyAmount", label: "Monthly Amount", align: "right" },
    { id: "annualAmount", label: "Annual Amount", align: "right" },
  ];

  const fmt = (val: any) =>
    `₹${formatNumberByCommaSeparation(val, commaseperation).split(".")[0]}`;

  const revisedDeductionRows =
    viewTemplate?.components
      ?.filter((c: any) => c.compType === "deduction" && !!c.deduction)
      .map((c: any) => ({
        deductionComponent: c.deduction.deductionName,
        calculationType: c.deduction.calculationType,
        monthlyAmount: fmt(c.monthlyAmount),
        annualAmount: fmt((Number(c.monthlyAmount) * 12).toFixed(2)),
      })) ?? [];

  const baseDeductionRows =
    currentRecord?.employeeDeductions?.map((d: any) => ({
      deductionComponent: d.deduction.deductionName,
      calculationType: d.deduction.calculationType,
      monthlyAmount: fmt(d.monthlyAmount),
      annualAmount: fmt((Number(d.monthlyAmount) * 12).toFixed(2)),
    })) ?? [];

  const renderRevised = () => (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Previous Gross</Typography>
            <Typography variant="body1">
              {fmt(currentRecord?.previousAnnualGross ?? viewTemplate?.template?.annualGross)}
            </Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Revised Gross</Typography>
            <Typography variant="body1">{fmt(viewTemplate?.revisedAnnualGross)}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Revised Monthly</Typography>
            <Typography variant="body1">{fmt(viewTemplate?.revisedMonthlyGross)}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Effective Date</Typography>
            <Typography variant="body1">
              {viewTemplate?.effectiveDate
                ? dayjs(viewTemplate.effectiveDate).format("MMM D, YYYY")
                : "—"}
            </Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Payout Month</Typography>
            <Typography variant="body1">
              {viewTemplate?.payoutDate
                ? dayjs(viewTemplate.payoutDate).format("MMM D, YYYY")
                : "—"}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" mb={1}>Earnings</Typography>
      <StandardTable
        columns={earningColumns}
        rows={
          viewTemplate?.components
            ?.filter((c: any) => c.compType === "earning" && !!c.earning)
            .map((c: any) => ({
              earningComponent: c.earning.earningName,
              calculationType: c.earning.calculationType,
              monthlyAmount: fmt(c.monthlyAmount),
              annualAmount: fmt((Number(c.monthlyAmount) * 12).toFixed(2)),
            })) ?? []
        }
      />

      {revisedDeductionRows.length > 0 && (
        <>
          <Typography variant="subtitle2" mt={2} mb={1}>Deductions</Typography>
          <StandardTable columns={deductionColumns} rows={revisedDeductionRows} />
        </>
      )}

      <Box
        sx={{
          bgcolor: "action.hover",
          borderRadius: 1,
          px: 2,
          py: 1.5,
          mt: 2,
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1.7fr 2fr",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>Gross Summary</Typography>
        <Box />
        <Typography variant="subtitle2" fontWeight={600} textAlign="right">
          {fmt(viewTemplate?.revisedMonthlyGross)}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} textAlign="right">
          {fmt(viewTemplate?.revisedAnnualGross)}
        </Typography>
      </Box>
    </Box>
  );

  const renderBase = () => (
    <Box>
      <Grid container spacing={2} mb={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Annual Gross</Typography>
            <Typography variant="body1">{fmt(currentRecord?.annualGross)}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack>
            <Typography variant="subtitle2">Monthly Gross</Typography>
            <Typography variant="body1">{fmt(currentRecord?.monthlyGross)}</Typography>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" mb={1}>Earnings</Typography>
      <StandardTable
        columns={earningColumns}
        rows={
          currentRecord?.employeeEarnings?.map((e: any) => ({
            earningComponent: e.earning.earningName,
            calculationType: e.earning.calculationType,
            monthlyAmount: fmt(e.monthlyAmount),
            annualAmount: fmt((Number(e.monthlyAmount) * 12).toFixed(2)),
          })) ?? []
        }
      />

      {baseDeductionRows.length > 0 && (
        <>
          <Typography variant="subtitle2" mt={2} mb={1}>Deductions</Typography>
          <StandardTable columns={deductionColumns} rows={baseDeductionRows} />
        </>
      )}
    </Box>
  );

  const renderContent = () => {
    if (isLoading) return <RevisionDetailSkeleton />;
    if (isBase) return renderBase();
    if (viewTemplate) return renderRevised();
    return <Typography>No data available</Typography>;
  };

  return (
    <ModalElement
      open={open}
      title="Revision Details"
      onClose={onClose}
      maxWidth="md"
    >
      {renderContent()}
    </ModalElement>
  );
}

export default RevisionDetailModal;