import { Card, Typography, Grid, Stack, useTheme, useMediaQuery } from "@mui/material";
import { PrimaryIconButton } from "../../../../components/atom/button";
import { useState } from "react";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import ReportStructureDialog from "./ReportModal";
import { useGetReportStructureQuery } from "../api/report.api";
import { Snackbar } from "../../../../components/atom/snackbar";
import { Tooltip } from "../../../../components/atom/tooltip";
import { Edit } from "@mui/icons-material";
import { EditReportStructureButton } from "../../BusinessSettingsPermission";
export default function ReportStructureCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useGetReportStructureQuery();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Format fiscal period: e.g., "1 January - 31 December"
  const formatFiscalPeriod = () => {
    if (data) {
      const startDate = data?.data.fiscalYearStartDate;
      const startMonth = data?.data.fiscalYearStartMonth;
      const endDate = data?.data.fiscalYearEndDate;
      const endMonth = data?.data.fiscalYearEndMonth;

      return `${startDate} ${startMonth} - ${endDate} ${endMonth}`;
    }
    return "";
  };

  // Fetch and display data if available
  const reportingCurrency = data?.data.reportingCurrency ?? "N/A";
  const commaSeparation =
    data?.data.commaSeparation === "IN"
      ? "Indian Numbering System"
      : "US Numbering System";

  return (
    <Card
      sx={{
        padding: 2.5,
      }}
    >
      <ModalElement
        open={isModalOpen}
        onClose={handleClose}
        title="Edit Report Structure"
        maxWidth="lg"
      >
        <ReportStructureDialog
          handleClose={handleClose}
          setSnackbar={setSnackbar}
        />
      </ModalElement>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        width="100%"
        justifyContent="space-between"
        mb={isMobile ? 3 : 3}
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
      >
        <Typography variant="h6">Report Structure</Typography>

       <EditReportStructureButton onClick={(s)=>{setIsModalOpen(s)}}/>
      </Stack>

      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {/* Reporting Currency */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Reporting Currency
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {reportingCurrency}
            </Typography>
          </Stack>
        </Grid>

        {/* Company Size */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Fiscal Period
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatFiscalPeriod()}
            </Typography>
          </Stack>
        </Grid>

        {/* Contact Email */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Comma Seperation
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {commaSeparation}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Card>
  );
}
